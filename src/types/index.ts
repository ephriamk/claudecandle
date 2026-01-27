/**
 * ClaudeCandle Type Definitions
 * Types for Bags.fm integration via MCP server
 */

// =============================================================================
// Tool Response Types
// =============================================================================

export interface ToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Fee Share Types (Bags.fm Creator Royalties)
// =============================================================================

export interface FeeShare {
  wallet: string;
  percentage: number; // Percentage (0-100), not basis points
}

export interface FeeClaimer {
  provider: string; // e.g., "twitter", "telegram"
  username: string;
  bps: number; // Basis points (10000 = 100%)
}

// =============================================================================
// Token Types
// =============================================================================

export interface CreateTokenParams {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  initialBuySol?: number;
  slippageBps?: number;
  feeShares?: FeeShare[];
}

export interface CreateTokenResult {
  mintAddress: string;
  signature: string;
  explorerUrl: string;
  bagsfmUrl: string;
  tokensReceived?: string;
}

export interface BuyTokenParams {
  mintAddress: string;
  solAmount: number;
  slippageBps?: number;
}

export interface BuyTokenResult {
  signature: string;
  tokensReceived: string;
  pricePerToken: string;
  totalCost: string;
}

export interface SellTokenParams {
  mintAddress: string;
  tokenAmount?: number;
  percentage?: number;
  slippageBps?: number;
}

export interface SellTokenResult {
  signature: string;
  solReceived: string;
  tokensSold: string;
  pricePerToken: string;
}

// =============================================================================
// Query Types
// =============================================================================

export interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  creator: string;
  createdAt?: string;
  totalSupply: string;
  decimals: number;
  bondingCurveProgress: number;
  marketCap: string;
  priceInSol: string;
  priceInUsd?: string;
  holders?: number;
  isGraduated: boolean;
  poolAddress?: string;
}

export interface BondingCurveInfo {
  mint: string;
  curveAddress: string;
  progress: number;
  currentPrice: string;
  marketCap: string;
  isComplete: boolean;
  creator?: string;
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: string;
  balanceRaw: string;
  decimals: number;
  valueInSol?: string;
  valueInUsd?: string;
}

export interface WalletBalance {
  address: string;
  solBalance: string;
  solBalanceRaw: string;
  solBalanceUsd?: string;
  tokens: TokenBalance[];
  totalValueUsd?: string;
}

// =============================================================================
// Trade Quote Types
// =============================================================================

export interface TradeQuote {
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  expectedOutput: string;
  minOutput: string;
  priceImpact: number;
  route?: string[];
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface AppConfig {
  bagsApiKey: string;
  rpcUrl: string;
  network: "mainnet-beta" | "devnet";
  defaultSlippageBps: number;
  logLevel: "debug" | "info" | "warn" | "error";
}

// =============================================================================
// Priority Fee Types
// =============================================================================

export type PriorityLevel = "min" | "low" | "medium" | "high" | "veryHigh" | "unsafeMax";

export type NetworkName = "mainnet-beta" | "devnet" | "testnet";

export interface PriorityFeeEstimate {
  priorityFeeEstimate: number;
  priorityFeeLevels?: {
    min: number;
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
    unsafeMax: number;
  };
}
