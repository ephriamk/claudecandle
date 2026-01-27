import { PublicKey } from "@solana/web3.js";

/**
 * Pump.fun Program IDs and Constants
 * Reference: https://github.com/pump-fun/pump-public-docs
 */

// =============================================================================
// Program IDs
// =============================================================================

/** Main Pump.fun bonding curve program */
export const PUMP_PROGRAM_ID = new PublicKey(
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
);

/** PumpSwap AMM program (for graduated tokens) */
export const PUMP_SWAP_PROGRAM_ID = new PublicKey(
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
);

/** Mayhem Mode program */
export const MAYHEM_PROGRAM_ID = new PublicKey(
  "MAyhSmzXzV1pTf7LsNkrNwkWKTo4ougAJ1PPg47MD4e"
);

/** Fee program */
export const FEE_PROGRAM_ID = new PublicKey(
  "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ"
);

/** Token2022 program (used by pump.fun create_v2) */
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

// =============================================================================
// PDA Seeds
// =============================================================================

export const PDA_SEEDS = {
  GLOBAL: "global",
  MINT_AUTHORITY: "mint-authority",
  BONDING_CURVE: "bonding-curve",
  METADATA: "metadata",
} as const;

// =============================================================================
// Bonding Curve Constants
// =============================================================================

/** Initial virtual token reserves (for pricing) */
export const INITIAL_VIRTUAL_TOKEN_RESERVES = BigInt("1073000000000000");

/** Initial virtual SOL reserves (for pricing) */
export const INITIAL_VIRTUAL_SOL_RESERVES = BigInt("30000000000");

/** Initial real token reserves (actual tokens available) */
export const INITIAL_REAL_TOKEN_RESERVES = BigInt("793100000000000");

/** Total token supply (1 billion with 6 decimals) */
export const TOKEN_TOTAL_SUPPLY = BigInt("1000000000000000");

/** Token decimals */
export const TOKEN_DECIMALS = 6;

/** SOL needed for graduation (approximately) */
export const GRADUATION_SOL_THRESHOLD = 85;

/** Lamports per SOL */
export const LAMPORTS_PER_SOL = 1_000_000_000;

// =============================================================================
// Fee Constants
// =============================================================================

/** Trading fee in basis points (1% = 100 bps) */
export const TRADING_FEE_BPS = 100;

/** Migration fee in SOL */
export const MIGRATION_FEE_SOL = 1.5;

/** Creator reward on graduation */
export const CREATOR_REWARD_SOL = 0.5;

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
  PUMP_FUN: "https://pump.fun",
  PUMP_FUN_API: "https://pump.fun/api",
  SOLSCAN_TOKEN: "https://solscan.io/token",
  SOLSCAN_TX: "https://solscan.io/tx",
  EXPLORER_TOKEN: "https://explorer.solana.com/address",
  EXPLORER_TX: "https://explorer.solana.com/tx",
} as const;

// =============================================================================
// Error Codes (Pump.fun Program)
// =============================================================================

export const PUMP_ERROR_CODES = {
  6000: "NotAuthorized",
  6001: "AlreadyInitialized",
  6002: "TooMuchSolRequired",
  6003: "TooLittleSolReceived",
  6004: "MintDoesNotMatchBondingCurve",
  6005: "BondingCurveComplete",
  6006: "BondingCurveNotComplete",
  6007: "NotEnoughTokens",
  6008: "InvalidAmount",
} as const;

export const PUMP_ERROR_MESSAGES: Record<number, string> = {
  6000: "You don't have permission for this action",
  6001: "This token already exists",
  6002: "Not enough SOL for this purchase. Check your balance.",
  6003: "Price changed too much. Try increasing slippage tolerance.",
  6004: "Invalid token address. Please verify the mint address.",
  6005: "This token has graduated! Trade on PumpSwap instead.",
  6006: "Token hasn't graduated yet. Still on bonding curve.",
  6007: "Insufficient token balance. You can't sell more than you own.",
  6008: "Invalid amount. Must be greater than zero.",
};
