import {
  PublicKey,
  Keypair,
  Transaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import { z } from "zod";
import {
  getConnection,
  getBondingCurveAddress,
  solToLamports,
  lamportsToSol,
  formatTokenAmount,
} from "../services/solana.js";
import { loadKeypair, isValidSolanaAddress } from "../utils/keypair.js";
import {
  DEFAULT_SLIPPAGE_BPS,
  TOKEN_DECIMALS,
} from "../config/constants.js";
import type {
  BuyTokenResult,
  SellTokenResult,
  ToolResponse,
} from "../types/index.js";

// =============================================================================
// Schemas
// =============================================================================

export const buyTokenSchema = {
  mintAddress: z.string()
    .min(32)
    .max(44)
    .describe("Token mint address to buy"),

  solAmount: z.number()
    .positive("Amount must be positive")
    .max(100, "Max 100 SOL per transaction for safety")
    .describe("Amount of SOL to spend"),

  slippageBps: z.number()
    .min(0)
    .max(5000)
    .default(DEFAULT_SLIPPAGE_BPS)
    .describe("Slippage tolerance in basis points (500 = 5%)"),
};

export const sellTokenSchema = {
  mintAddress: z.string()
    .min(32)
    .max(44)
    .describe("Token mint address to sell"),

  tokenAmount: z.number()
    .positive()
    .optional()
    .describe("Amount of tokens to sell (use this OR percentage, not both)"),

  percentage: z.number()
    .min(1)
    .max(100)
    .optional()
    .describe("Percentage of holdings to sell (1-100)"),

  slippageBps: z.number()
    .min(0)
    .max(5000)
    .default(DEFAULT_SLIPPAGE_BPS)
    .describe("Slippage tolerance in basis points"),
};

export type BuyTokenSchemaType = z.infer<z.ZodObject<typeof buyTokenSchema>>;
export type SellTokenSchemaType = z.infer<z.ZodObject<typeof sellTokenSchema>>;

// =============================================================================
// PumpPortal Trade API
// =============================================================================

interface TradeResult {
  signature: string;
  tokenAmount?: string;
  solAmount?: string;
}

/**
 * Execute trade via PumpPortal API
 */
async function executeTradeViaPumpPortal(
  action: "buy" | "sell",
  mintAddress: string,
  amount: number,
  slippageBps: number,
  wallet: Keypair,
  denominatedInSol: boolean = true
): Promise<ToolResponse<TradeResult>> {
  try {
    const response = await fetch("https://pumpportal.fun/api/trade-local", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicKey: wallet.publicKey.toBase58(),
        action,
        mint: mintAddress,
        denominatedInSol: denominatedInSol ? "true" : "false",
        amount,
        slippage: slippageBps / 100,
        priorityFee: 0.0005,
        pool: "pump",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Check if token has graduated
      if (errorText.includes("graduated") || errorText.includes("complete")) {
        return {
          success: false,
          error: "This token has graduated! Trade on PumpSwap or Raydium instead.",
        };
      }

      return {
        success: false,
        error: `Trade API error: ${errorText}`,
      };
    }

    // Get the serialized transaction
    const txData = await response.arrayBuffer();
    const tx = Transaction.from(Buffer.from(txData));

    // Sign and send
    const conn = getConnection();
    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet.publicKey;
    tx.sign(wallet);

    const signature = await conn.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    await conn.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, "confirmed");

    return {
      success: true,
      data: {
        signature,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to ${action} token`,
    };
  }
}

// =============================================================================
// Buy Token
// =============================================================================

export async function buyToken(
  params: BuyTokenSchemaType
): Promise<ToolResponse<BuyTokenResult>> {
  try {
    // Validate mint address
    if (!isValidSolanaAddress(params.mintAddress)) {
      return {
        success: false,
        error: "Invalid mint address format",
      };
    }

    const wallet = loadKeypair();
    const conn = getConnection();

    // Check SOL balance
    const balance = await conn.getBalance(wallet.publicKey);
    const requiredLamports = solToLamports(params.solAmount + 0.01); // Add buffer for fees

    if (BigInt(balance) < requiredLamports) {
      return {
        success: false,
        error: `Insufficient SOL balance. Have ${lamportsToSol(balance).toFixed(4)} SOL, need ~${params.solAmount + 0.01} SOL`,
      };
    }

    // Check if token exists and get bonding curve status
    const mint = new PublicKey(params.mintAddress);
    const bondingCurve = getBondingCurveAddress(mint);
    const bondingCurveInfo = await conn.getAccountInfo(bondingCurve);

    if (!bondingCurveInfo) {
      return {
        success: false,
        error: "Token not found on pump.fun. Check the mint address.",
      };
    }

    console.error(`Buying ${params.solAmount} SOL of token ${params.mintAddress}`);

    // Execute buy via PumpPortal
    const result = await executeTradeViaPumpPortal(
      "buy",
      params.mintAddress,
      params.solAmount,
      params.slippageBps,
      wallet,
      true // denominatedInSol
    );

    if (!result.success) {
      return result as ToolResponse<BuyTokenResult>;
    }

    // Get token balance after purchase
    let tokensReceived = "Unknown";
    try {
      const ata = getAssociatedTokenAddressSync(
        mint,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const account = await getAccount(conn, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
      tokensReceived = formatTokenAmount(account.amount, TOKEN_DECIMALS);
    } catch {
      // Token account might not exist yet or other error
    }

    return {
      success: true,
      data: {
        signature: result.data!.signature,
        tokensReceived,
        pricePerToken: "See transaction",
        totalCost: `${params.solAmount} SOL`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to buy token",
    };
  }
}

// =============================================================================
// Sell Token
// =============================================================================

export async function sellToken(
  params: SellTokenSchemaType
): Promise<ToolResponse<SellTokenResult>> {
  try {
    // Validate mint address
    if (!isValidSolanaAddress(params.mintAddress)) {
      return {
        success: false,
        error: "Invalid mint address format",
      };
    }

    // Must specify either tokenAmount or percentage
    if (!params.tokenAmount && !params.percentage) {
      return {
        success: false,
        error: "Must specify either tokenAmount or percentage to sell",
      };
    }

    if (params.tokenAmount && params.percentage) {
      return {
        success: false,
        error: "Specify either tokenAmount OR percentage, not both",
      };
    }

    const wallet = loadKeypair();
    const conn = getConnection();
    const mint = new PublicKey(params.mintAddress);

    // Get current token balance
    let currentBalance: bigint;
    try {
      const ata = getAssociatedTokenAddressSync(
        mint,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const account = await getAccount(conn, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
      currentBalance = account.amount;
    } catch {
      return {
        success: false,
        error: "You don't have any of this token to sell",
      };
    }

    if (currentBalance === BigInt(0)) {
      return {
        success: false,
        error: "Token balance is zero",
      };
    }

    // Calculate amount to sell
    let sellAmount: number;

    if (params.percentage) {
      // Calculate based on percentage
      const percentageAmount = (currentBalance * BigInt(params.percentage)) / BigInt(100);
      sellAmount = Number(percentageAmount) / Math.pow(10, TOKEN_DECIMALS);
    } else {
      sellAmount = params.tokenAmount!;

      // Validate we have enough tokens
      const sellAmountRaw = BigInt(Math.floor(sellAmount * Math.pow(10, TOKEN_DECIMALS)));
      if (sellAmountRaw > currentBalance) {
        return {
          success: false,
          error: `Insufficient balance. Have ${formatTokenAmount(currentBalance, TOKEN_DECIMALS)} tokens, trying to sell ${sellAmount}`,
        };
      }
    }

    console.error(`Selling ${sellAmount} tokens of ${params.mintAddress}`);

    // Execute sell via PumpPortal
    const result = await executeTradeViaPumpPortal(
      "sell",
      params.mintAddress,
      sellAmount,
      params.slippageBps,
      wallet,
      false // denominatedInSol = false, amount is in tokens
    );

    if (!result.success) {
      return result as ToolResponse<SellTokenResult>;
    }

    return {
      success: true,
      data: {
        signature: result.data!.signature,
        solReceived: "See transaction",
        tokensSold: sellAmount.toString(),
        pricePerToken: "See transaction",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sell token",
    };
  }
}

// =============================================================================
// Tool Descriptions
// =============================================================================

export const buyTokenDescription = `Buy tokens from a pump.fun bonding curve.

Spends SOL to buy tokens at the current bonding curve price.
Price increases as more tokens are bought (bonding curve mechanics).

**Parameters:**
- mintAddress: The token's mint address
- solAmount: How much SOL to spend
- slippageBps: Slippage tolerance (default 5%)

**Requirements:**
- Token must still be on bonding curve (not graduated)
- Sufficient SOL balance for purchase + fees`;

export const sellTokenDescription = `Sell tokens back to a pump.fun bonding curve.

Sells tokens to receive SOL at the current bonding curve price.
Price decreases as more tokens are sold.

**Parameters:**
- mintAddress: The token's mint address
- tokenAmount: Exact amount to sell (OR use percentage)
- percentage: Sell a percentage of holdings (1-100)
- slippageBps: Slippage tolerance (default 5%)

**Requirements:**
- Token must still be on bonding curve (not graduated)
- Must have tokens in wallet to sell`;
