/**
 * Trade Token Tools
 * Buy and sell tokens on Bags.fm using the Bags SDK
 */

import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { getBagsSDK } from "../services/bags.js";
import {
  getConnection,
  getSolBalance,
  getTokenBalance,
  solToLamports,
  lamportsToSol,
} from "../services/solana.js";
import { loadKeypair, isValidSolanaAddress } from "../utils/keypair.js";
import {
  DEFAULT_SLIPPAGE_BPS,
  WSOL_MINT,
  ERROR_MESSAGES,
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
        error: ERROR_MESSAGES.INVALID_MINT,
      };
    }

    const wallet = loadKeypair();
    const conn = getConnection();

    // Check SOL balance
    const balance = await getSolBalance(wallet.publicKey);
    const minRequired = params.solAmount + 0.01; // Buffer for fees

    if (balance < minRequired) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INSUFFICIENT_SOL}. Have ${balance.toFixed(4)} SOL, need ~${minRequired.toFixed(4)} SOL`,
      };
    }

    console.error(`Buying ${params.solAmount} SOL of token ${params.mintAddress}`);

    // Initialize Bags SDK
    const sdk = getBagsSDK();

    // Get trade quote (SOL -> Token)
    // SDK expects amount as number (lamports)
    const amountLamports = Number(solToLamports(params.solAmount));
    const quote = await sdk.trade.getQuote({
      inputMint: WSOL_MINT,
      outputMint: new PublicKey(params.mintAddress),
      amount: amountLamports,
      slippageMode: "manual",
      slippageBps: params.slippageBps,
    });

    if (!quote) {
      return {
        success: false,
        error: ERROR_MESSAGES.QUOTE_FAILED,
      };
    }

    // Create swap transaction with quote response and user public key
    const swapResult = await sdk.trade.createSwapTransaction({
      quoteResponse: quote,
      userPublicKey: wallet.publicKey,
    });

    // Sign the VersionedTransaction and send
    swapResult.transaction.sign([wallet]);
    const signature = await conn.sendRawTransaction(swapResult.transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    // Wait for confirmation using lastValidBlockHeight from swap result
    const { blockhash } = await conn.getLatestBlockhash();
    await conn.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: swapResult.lastValidBlockHeight,
    }, "confirmed");

    // Get expected output from quote
    console.error(`Buy successful: ${signature}`);

    return {
      success: true,
      data: {
        signature,
        tokensReceived: quote.outAmount,
        pricePerToken: quote.priceImpactPct ? `${quote.priceImpactPct}% impact` : "See transaction",
        totalCost: `${params.solAmount} SOL`,
      },
    };
  } catch (error) {
    console.error("Buy token error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("slippage") || errorMessage.includes("Slippage")) {
      return {
        success: false,
        error: ERROR_MESSAGES.SLIPPAGE_EXCEEDED,
      };
    }

    return {
      success: false,
      error: `Buy failed: ${errorMessage}`,
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
        error: ERROR_MESSAGES.INVALID_MINT,
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
    const balanceInfo = await getTokenBalance(wallet.publicKey, mint);

    if (!balanceInfo || balanceInfo.balanceRaw === BigInt(0)) {
      return {
        success: false,
        error: ERROR_MESSAGES.INSUFFICIENT_TOKENS,
      };
    }

    // Calculate amount to sell
    let sellAmountRaw: bigint;

    if (params.percentage) {
      // Calculate based on percentage
      sellAmountRaw = (balanceInfo.balanceRaw * BigInt(params.percentage)) / BigInt(100);
    } else {
      sellAmountRaw = BigInt(Math.floor(params.tokenAmount! * Math.pow(10, balanceInfo.decimals)));

      // Validate we have enough tokens
      if (sellAmountRaw > balanceInfo.balanceRaw) {
        return {
          success: false,
          error: `${ERROR_MESSAGES.INSUFFICIENT_TOKENS}. Have ${balanceInfo.balance.toFixed(4)}, trying to sell ${params.tokenAmount}`,
        };
      }
    }

    const sellAmount = Number(sellAmountRaw) / Math.pow(10, balanceInfo.decimals);
    console.error(`Selling ${sellAmount} tokens of ${params.mintAddress}`);

    // Initialize Bags SDK
    const sdk = getBagsSDK();

    // Get trade quote (Token -> SOL)
    // SDK expects amount as number
    const sellAmountNum = Number(sellAmountRaw);
    const quote = await sdk.trade.getQuote({
      inputMint: mint,
      outputMint: WSOL_MINT,
      amount: sellAmountNum,
      slippageMode: "manual",
      slippageBps: params.slippageBps,
    });

    if (!quote) {
      return {
        success: false,
        error: ERROR_MESSAGES.QUOTE_FAILED,
      };
    }

    // Create swap transaction with quote response and user public key
    const swapResult = await sdk.trade.createSwapTransaction({
      quoteResponse: quote,
      userPublicKey: wallet.publicKey,
    });

    // Sign the VersionedTransaction and send
    swapResult.transaction.sign([wallet]);
    const signature = await conn.sendRawTransaction(swapResult.transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    // Wait for confirmation using lastValidBlockHeight from swap result
    const { blockhash } = await conn.getLatestBlockhash();
    await conn.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: swapResult.lastValidBlockHeight,
    }, "confirmed");

    // Get expected output from quote (outAmount is in lamports as string)
    const solReceivedFormatted = quote.outAmount
      ? lamportsToSol(BigInt(quote.outAmount)).toFixed(6)
      : "See transaction";

    console.error(`Sell successful: ${signature}`);

    return {
      success: true,
      data: {
        signature,
        solReceived: `${solReceivedFormatted} SOL`,
        tokensSold: sellAmount.toString(),
        pricePerToken: quote.priceImpactPct ? `${quote.priceImpactPct}% impact` : "See transaction",
      },
    };
  } catch (error) {
    console.error("Sell token error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("slippage") || errorMessage.includes("Slippage")) {
      return {
        success: false,
        error: ERROR_MESSAGES.SLIPPAGE_EXCEEDED,
      };
    }

    return {
      success: false,
      error: `Sell failed: ${errorMessage}`,
    };
  }
}

// =============================================================================
// Tool Descriptions
// =============================================================================

export const buyTokenDescription = `Buy tokens on Bags.fm.

Spends SOL to buy tokens at the current market price via Bags.fm's trading infrastructure.

**Parameters:**
- mintAddress: The token's mint address
- solAmount: How much SOL to spend (max 100 SOL)
- slippageBps: Slippage tolerance (default 5%)

**Features:**
- Routes through best available liquidity
- Automatic slippage protection
- Creator earns fees on every trade

**Requirements:**
- Sufficient SOL balance for purchase + fees (~0.01 SOL)`;

export const sellTokenDescription = `Sell tokens on Bags.fm.

Sells tokens to receive SOL at the current market price.

**Parameters:**
- mintAddress: The token's mint address
- tokenAmount: Exact amount to sell (OR use percentage)
- percentage: Sell a percentage of holdings (1-100)
- slippageBps: Slippage tolerance (default 5%)

**Features:**
- Routes through best available liquidity
- Automatic slippage protection
- Percentage selling for easy position management

**Requirements:**
- Must have tokens in wallet to sell`;
