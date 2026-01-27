import { PublicKey } from "@solana/web3.js";

// =============================================================================
// Tool Response Types
// =============================================================================

export interface ToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
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
}

export interface CreateTokenResult {
  mintAddress: string;
  signature: string;
  explorerUrl: string;
  pumpfunUrl: string;
  tokensReceived?: string;
}

export interface BuyTokenParams {
  mintAddress: string;
  solAmount: number;
  slippageBps?: number;
  priorityLevel?: "low" | "medium" | "high" | "veryHigh";
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
  bondingCurveAddress: string;
  virtualTokenReserves: string;
  virtualSolReserves: string;
  realTokenReserves: string;
  realSolReserves: string;
  tokenTotalSupply: string;
  complete: boolean;
  creator: string;
  progress: number;
  solToGraduation: string;
  tokensRemaining: string;
  currentPrice: string;
  marketCap: string;
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
// Bonding Curve Account Structure
// =============================================================================

export interface BondingCurveAccount {
  discriminator: bigint;
  virtualTokenReserves: bigint;
  virtualSolReserves: bigint;
  realTokenReserves: bigint;
  realSolReserves: bigint;
  tokenTotalSupply: bigint;
  complete: boolean;
  creator: PublicKey;
  isMayhemMode?: boolean;
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface AppConfig {
  rpcUrl: string;
  network: "mainnet-beta" | "devnet" | "testnet";
  defaultSlippageBps: number;
  defaultPriorityLevel: "low" | "medium" | "high" | "veryHigh";
  logLevel: "debug" | "info" | "warn" | "error";
}

// =============================================================================
// Priority Fee Types
// =============================================================================

export type PriorityLevel = "min" | "low" | "medium" | "high" | "veryHigh" | "unsafeMax";

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
