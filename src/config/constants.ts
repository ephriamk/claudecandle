import { PublicKey } from "@solana/web3.js";

/**
 * auto.fun Program Constants
 * Program: autoUmixaMaYKFjexMpQuBpNYntgbkzCo2b1ZqUaAZ5
 * Bonding curve launchpad on Solana
 */

// =============================================================================
// Program IDs
// =============================================================================

/** auto.fun bonding curve program */
export const AUTOFUN_PROGRAM_ID = new PublicKey(
  "autoUmixaMaYKFjexMpQuBpNYntgbkzCo2b1ZqUaAZ5"
);

/** Standard SPL Token program (auto.fun uses this, NOT Token2022) */
export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

/** Associated Token Account program */
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

/** Metaplex Token Metadata program */
export const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

/** Wrapped SOL mint */
export const WSOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

// =============================================================================
// Token Defaults (from auto.fun's configuration)
// =============================================================================

/** Default token decimals */
export const TOKEN_DECIMALS = 6;

/** Default token supply: 1 billion with 6 decimals */
export const DEFAULT_TOKEN_SUPPLY = 1_000_000_000_000_000;

/** Default virtual SOL reserves: 0.1 SOL in lamports */
export const DEFAULT_VIRTUAL_RESERVES = 100_000_000;

/** Lamports per SOL */
export const LAMPORTS_PER_SOL = 1_000_000_000;

// =============================================================================
// Transaction Defaults
// =============================================================================

/** Default slippage in basis points (5%) */
export const DEFAULT_SLIPPAGE_BPS = 500;

/** Maximum slippage allowed (50%) */
export const MAX_SLIPPAGE_BPS = 5000;

/** Transaction deadline buffer in seconds */
export const DEADLINE_SECONDS = 60;

// =============================================================================
// Network Endpoints
// =============================================================================

export const RPC_ENDPOINTS = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
} as const;

export type NetworkName = keyof typeof RPC_ENDPOINTS;

// =============================================================================
// URLs
// =============================================================================

export const URLS = {
  AUTOFUN: "https://auto.fun",
  AUTOFUN_TOKEN: "https://auto.fun/token",
  SOLSCAN_TX: "https://solscan.io/tx",
  SOLSCAN_ACCOUNT: "https://solscan.io/account",
} as const;

// =============================================================================
// Error Messages
// =============================================================================

export const ERROR_MESSAGES = {
  NO_WALLET: "Wallet not configured. Set WALLET_PRIVATE_KEY in .env",
  INSUFFICIENT_SOL: "Insufficient SOL balance for this transaction",
  INSUFFICIENT_TOKENS: "Insufficient token balance",
  INVALID_MINT: "Invalid token mint address",
  INVALID_AMOUNT: "Amount must be greater than zero",
  SLIPPAGE_EXCEEDED: "Return amount too small. Try increasing slippage.",
  CURVE_COMPLETED: "Bonding curve completed. Trade on Raydium instead.",
  CURVE_NOT_FOUND: "Bonding curve not found for this token.",
  TRANSACTION_EXPIRED: "Transaction expired. Please try again.",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
} as const;
