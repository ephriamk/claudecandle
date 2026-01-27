import { PublicKey } from "@solana/web3.js";

/**
 * Bags.fm / Meteora DBC Program IDs and Constants
 * Reference: https://docs.bags.fm/principles/program-ids
 */

// =============================================================================
// Program IDs
// =============================================================================

/** Meteora Dynamic Bonding Curve program (used by Bags.fm) */
export const METEORA_DBC_PROGRAM_ID = new PublicKey(
  "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN"
);

/** Bags.fm AMM program (for graduated tokens) */
export const BAGS_AMM_PROGRAM_ID = new PublicKey(
  "cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG"
);

/** Bags.fm Address Lookup Table (for transaction optimization) */
export const BAGS_LUT_ADDRESS = new PublicKey(
  "Eq1EVs15EAWww1YtPTtWPzJRLPJoS6VYP9oW9SbNr3yp"
);

/** Token2022 program */
export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

/** Legacy SPL Token program */
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

/** Wrapped SOL mint address */
export const WSOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

// =============================================================================
// Token Constants
// =============================================================================

/** Default token decimals on Bags.fm */
export const TOKEN_DECIMALS = 6;

/** Lamports per SOL */
export const LAMPORTS_PER_SOL = 1_000_000_000;

// =============================================================================
// Fee Constants
// =============================================================================

/** Creator fee in basis points (1% of trading volume forever) */
export const CREATOR_FEE_BPS = 100;

/** Full fee share (100% = 10000 bps) */
export const FULL_FEE_SHARE_BPS = 10000;

// =============================================================================
// Transaction Defaults
// =============================================================================

/** Default slippage in basis points (5%) */
export const DEFAULT_SLIPPAGE_BPS = 500;

/** Maximum slippage allowed (50%) */
export const MAX_SLIPPAGE_BPS = 5000;

/** Default compute unit limit for token creation */
export const DEFAULT_CREATE_COMPUTE_UNITS = 250_000;

/** Default compute unit limit for buy/sell */
export const DEFAULT_TRADE_COMPUTE_UNITS = 150_000;

// =============================================================================
// Validation Constants
// =============================================================================

/** Maximum token name length */
export const MAX_NAME_LENGTH = 32;

/** Maximum token symbol length */
export const MAX_SYMBOL_LENGTH = 10;

/** Maximum description length */
export const MAX_DESCRIPTION_LENGTH = 500;

/** Solana address length */
export const SOLANA_ADDRESS_LENGTH = 44;

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
  BAGS_FM: "https://bags.fm",
  BAGS_FM_TOKEN: "https://bags.fm/token",
  BAGS_FM_LAUNCH: "https://bags.fm/launch",
  BAGS_DEV_PORTAL: "https://dev.bags.fm",
  SOLSCAN_TOKEN: "https://solscan.io/token",
  SOLSCAN_TX: "https://solscan.io/tx",
  EXPLORER_TOKEN: "https://explorer.solana.com/address",
  EXPLORER_TX: "https://explorer.solana.com/tx",
} as const;

// =============================================================================
// Error Messages
// =============================================================================

export const ERROR_MESSAGES = {
  NO_API_KEY: "BAGS_API_KEY is required. Get your key from https://dev.bags.fm",
  NO_WALLET: "Wallet not configured. Set WALLET_PRIVATE_KEY in .env",
  INSUFFICIENT_SOL: "Insufficient SOL balance for this transaction",
  INSUFFICIENT_TOKENS: "Insufficient token balance",
  INVALID_MINT: "Invalid token mint address",
  INVALID_AMOUNT: "Amount must be greater than zero",
  SLIPPAGE_EXCEEDED: "Price changed too much. Try increasing slippage tolerance.",
  TOKEN_NOT_FOUND: "Token not found on Bags.fm",
  QUOTE_FAILED: "Failed to get trade quote. Check token liquidity.",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
} as const;
