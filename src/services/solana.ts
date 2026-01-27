/**
 * Solana Service
 * Generic Solana helpers for connection, balances, and transactions
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  ComputeBudgetProgram,
  Commitment,
} from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from "@solana/spl-token";
import {
  RPC_ENDPOINTS,
  LAMPORTS_PER_SOL,
  TOKEN_2022_PROGRAM_ID,
  ERROR_MESSAGES,
} from "../config/constants.js";
import type { NetworkName, PriorityLevel, PriorityFeeEstimate } from "../types/index.js";

// =============================================================================
// Connection Management
// =============================================================================

let connection: Connection | null = null;

/**
 * Get or create a Solana connection
 */
export function getConnection(): Connection {
  if (connection) {
    return connection;
  }

  const rpcUrl = process.env.HELIUS_RPC_URL ||
                 process.env.RPC_URL ||
                 RPC_ENDPOINTS[getNetwork()];

  connection = new Connection(rpcUrl, {
    commitment: "processed",
    confirmTransactionInitialTimeout: 60000,
  });

  return connection;
}

/**
 * Get the current network from environment
 */
export function getNetwork(): NetworkName {
  const network = process.env.SOLANA_NETWORK || "mainnet-beta";
  if (network in RPC_ENDPOINTS) {
    return network as NetworkName;
  }
  return "mainnet-beta";
}

/**
 * Check if we're on mainnet
 */
export function isMainnet(): boolean {
  return getNetwork() === "mainnet-beta";
}

// =============================================================================
// Balance Queries
// =============================================================================

/**
 * Get SOL balance for an address
 */
export async function getSolBalance(address: PublicKey): Promise<number> {
  const conn = getConnection();
  const balance = await conn.getBalance(address);
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Get token balance for a specific token
 */
export async function getTokenBalance(
  owner: PublicKey,
  mint: PublicKey,
  useToken2022: boolean = true
): Promise<{ balance: number; balanceRaw: bigint; decimals: number } | null> {
  const conn = getConnection();

  try {
    const tokenProgram = useToken2022 ? TOKEN_2022_PROGRAM_ID : undefined;
    const ata = await getAssociatedTokenAddress(mint, owner, false, tokenProgram);
    const account = await getAccount(conn, ata, "confirmed", tokenProgram);

    // Get mint info for decimals
    const mintInfo = await conn.getParsedAccountInfo(mint);
    const decimals = (mintInfo.value?.data as any)?.parsed?.info?.decimals || 6;

    const balanceRaw = account.amount;
    const balance = Number(balanceRaw) / Math.pow(10, decimals);

    return { balance, balanceRaw, decimals };
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError) {
      return null;
    }
    throw error;
  }
}

// =============================================================================
// Priority Fees
// =============================================================================

/**
 * Get priority fee estimate from Helius API
 */
export async function getPriorityFeeEstimate(
  accountKeys: string[],
  level: PriorityLevel = "high"
): Promise<number> {
  const rpcUrl = process.env.HELIUS_RPC_URL;

  if (!rpcUrl || !rpcUrl.includes("helius")) {
    // Return default priority fee if not using Helius
    const defaults: Record<PriorityLevel, number> = {
      min: 1000,
      low: 10000,
      medium: 100000,
      high: 500000,
      veryHigh: 1000000,
      unsafeMax: 5000000,
    };
    return defaults[level];
  }

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getPriorityFeeEstimate",
        params: [{
          accountKeys,
          options: { priorityLevel: level }
        }]
      })
    });

    const data = await response.json() as { result?: PriorityFeeEstimate; error?: any };

    if (data.error) {
      console.error("Priority fee API error:", data.error);
      return 500000; // Default fallback
    }

    return data.result?.priorityFeeEstimate || 500000;
  } catch (error) {
    console.error("Failed to get priority fee estimate:", error);
    return 500000; // Default fallback
  }
}

// =============================================================================
// Transaction Helpers
// =============================================================================

/**
 * Add compute budget instructions to a transaction
 */
export function addComputeBudget(
  transaction: Transaction,
  computeUnits: number,
  priorityFee: number
): void {
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee })
  );
}

/**
 * Simulate a transaction and return estimated compute units
 */
export async function simulateTransaction(
  transaction: Transaction,
  payer: PublicKey
): Promise<{ success: boolean; unitsConsumed: number; error?: string }> {
  const conn = getConnection();

  // Set recent blockhash if not set
  if (!transaction.recentBlockhash) {
    const { blockhash } = await conn.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer;
  }

  const simulation = await conn.simulateTransaction(transaction);

  if (simulation.value.err) {
    return {
      success: false,
      unitsConsumed: 0,
      error: parseTransactionError(simulation.value.err),
    };
  }

  return {
    success: true,
    unitsConsumed: simulation.value.unitsConsumed || 200000,
  };
}

/**
 * Send and confirm a transaction with retry logic
 */
export async function sendAndConfirmTransaction(
  transaction: Transaction,
  signers: Keypair[],
  options?: {
    maxRetries?: number;
    skipPreflight?: boolean;
    commitment?: Commitment;
  }
): Promise<string> {
  const conn = getConnection();
  const maxRetries = options?.maxRetries ?? 3;
  const commitment = options?.commitment ?? "confirmed";

  // Get fresh blockhash
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash(commitment);
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = signers[0].publicKey;

  // Sign transaction
  transaction.sign(...signers);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const signature = await conn.sendRawTransaction(transaction.serialize(), {
        skipPreflight: options?.skipPreflight ?? false,
        preflightCommitment: commitment,
      });

      // Wait for confirmation
      const confirmation = await conn.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        commitment
      );

      if (confirmation.value.err) {
        throw new Error(parseTransactionError(confirmation.value.err));
      }

      return signature;
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's a program error (will fail again)
      if (isProgramError(error)) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Transaction failed after retries");
}

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Parse transaction error into user-friendly message
 */
export function parseTransactionError(error: any): string {
  const errorStr = typeof error === "string" ? error : JSON.stringify(error);

  // Check for common Solana errors
  if (errorStr.includes("insufficient funds") || errorStr.includes("InsufficientFunds")) {
    return ERROR_MESSAGES.INSUFFICIENT_SOL;
  }
  if (errorStr.includes("blockhash not found") || errorStr.includes("BlockhashNotFound")) {
    return "Transaction expired. Please try again.";
  }
  if (errorStr.includes("AccountNotFound")) {
    return "Account not found. The token may not exist or you don't have a token account.";
  }
  if (errorStr.includes("rate limit") || errorStr.includes("429")) {
    return "Rate limited. Please wait a moment and try again.";
  }
  if (errorStr.includes("simulation failed")) {
    return "Transaction simulation failed. Check parameters and try again.";
  }
  if (errorStr.includes("slippage")) {
    return ERROR_MESSAGES.SLIPPAGE_EXCEEDED;
  }

  return errorStr;
}

/**
 * Check if error is a program error (shouldn't retry)
 */
function isProgramError(error: any): boolean {
  const errorStr = String(error);
  return errorStr.includes("custom program error") ||
         errorStr.includes("Program failed");
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format SOL amount for display
 */
export function formatSol(lamports: number | bigint): string {
  const sol = Number(lamports) / LAMPORTS_PER_SOL;
  return sol.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 9,
  });
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): bigint {
  return BigInt(Math.floor(sol * LAMPORTS_PER_SOL));
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: bigint | number): number {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

/**
 * Format token amount based on decimals
 */
export function formatTokenAmount(amount: bigint | number, decimals: number): string {
  const value = Number(amount) / Math.pow(10, decimals);
  return value.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
  });
}

/**
 * Get explorer URL for a transaction or address
 */
export function getExplorerUrl(
  signatureOrAddress: string,
  type: "tx" | "address" = "tx"
): string {
  const network = getNetwork();
  const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;

  if (type === "tx") {
    return `https://solscan.io/tx/${signatureOrAddress}${cluster}`;
  }
  return `https://solscan.io/account/${signatureOrAddress}${cluster}`;
}
