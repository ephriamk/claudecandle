import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import {
  getConnection,
  getSolBalance,
  formatSol,
  getExplorerUrl,
} from "../services/solana.js";
import { loadKeypair, isValidSolanaAddress } from "../utils/keypair.js";
import { LAMPORTS_PER_SOL } from "../config/constants.js";
import type { WalletBalance, ToolResponse } from "../types/index.js";

// =============================================================================
// Schema
// =============================================================================

export const getBalanceSchema = {
  address: z.string()
    .optional()
    .describe("Wallet address to check (defaults to configured wallet)"),
};

export type GetBalanceParams = z.infer<z.ZodObject<typeof getBalanceSchema>>;

// =============================================================================
// Tool Implementation
// =============================================================================

export async function getBalance(
  params: GetBalanceParams
): Promise<ToolResponse<WalletBalance>> {
  try {
    let address: PublicKey;

    // Use provided address or default to configured wallet
    if (params.address) {
      if (!isValidSolanaAddress(params.address)) {
        return {
          success: false,
          error: `Invalid Solana address: ${params.address}`,
        };
      }
      address = new PublicKey(params.address);
    } else {
      const wallet = loadKeypair();
      address = wallet.publicKey;
    }

    const conn = getConnection();

    // Get SOL balance
    const solBalanceRaw = await conn.getBalance(address);
    const solBalance = solBalanceRaw / LAMPORTS_PER_SOL;

    // Get token accounts
    const tokenAccounts = await conn.getParsedTokenAccountsByOwner(address, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    });

    // Also check Token2022 accounts
    const token2022Accounts = await conn.getParsedTokenAccountsByOwner(address, {
      programId: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
    });

    // Combine and format token balances
    const allTokenAccounts = [...tokenAccounts.value, ...token2022Accounts.value];

    const tokens = allTokenAccounts
      .map((account) => {
        const parsed = account.account.data.parsed?.info;
        if (!parsed) return null;

        const balance = parsed.tokenAmount?.uiAmount || 0;
        const balanceRaw = parsed.tokenAmount?.amount || "0";
        const decimals = parsed.tokenAmount?.decimals || 0;
        const mint = parsed.mint;

        // Skip zero balances
        if (balance === 0) return null;

        return {
          mint,
          symbol: "Unknown", // Would need metadata lookup for real symbol
          name: "Unknown Token",
          balance: balance.toString(),
          balanceRaw,
          decimals,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    const result: WalletBalance = {
      address: address.toBase58(),
      solBalance: solBalance.toFixed(9),
      solBalanceRaw: solBalanceRaw.toString(),
      tokens,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get balance",
    };
  }
}

// =============================================================================
// Tool Description
// =============================================================================

export const getBalanceDescription = `Get SOL and token balances for a wallet.

Returns:
- SOL balance
- List of token holdings with balances
- Token mint addresses

If no address is provided, uses the configured wallet.`;
