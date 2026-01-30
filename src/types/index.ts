/**
 * ClaudeCandle Type Definitions
 * Types for multi-platform Solana meme coin launches + trading
 */

// =============================================================================
// Tool Response
// =============================================================================

export interface ToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// auto.fun Launch Types
// =============================================================================

export interface LaunchParams {
  name: string;
  symbol: string;
  uri?: string;
  description?: string;
  imageUrl?: string;
  decimals?: number;
  tokenSupply?: number;
  virtualReserves?: number;
  initialBuySol?: number;
  slippageBps?: number;
}

export interface LaunchResult {
  mintAddress: string;
  signature: string;
  bondingCurve: string;
  explorerUrl: string;
  autofunUrl: string;
}

// =============================================================================
// Raydium CPMM Launch Types
// =============================================================================

export interface RaydiumLaunchParams {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  uri?: string;
  decimals?: number;
  totalSupply?: number;
  liquiditySol: number;
  liquidityPercent?: number;
}

export interface RaydiumLaunchResult {
  mintAddress: string;
  poolId: string;
  lpMint: string;
  signature: string;
  jupiterUrl: string;
  explorerUrl: string;
}

// =============================================================================
// Pump.fun Launch Types
// =============================================================================

export interface PumpfunLaunchParams {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  uri?: string;
  initialBuySol?: number;
  slippageBps?: number;
}

export interface PumpfunLaunchResult {
  mintAddress: string;
  signature: string;
  bondingCurve: string;
  pumpfunUrl: string;
  explorerUrl: string;
}

// =============================================================================
// Meteora DBC Launch Types
// =============================================================================

export interface MeteoraLaunchParams {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  uri?: string;
  totalSupply?: number;
  decimals?: number;
  initialBuySol?: number;
  migrationQuoteSol?: number;
}

export interface MeteoraLaunchResult {
  mintAddress: string;
  poolAddress: string;
  signature: string;
  explorerUrl: string;
}

// =============================================================================
// Raydium LaunchLab Types
// =============================================================================

export interface LaunchLabParams {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  uri?: string;
  initialBuySol?: number;
  slippageBps?: number;
  migrateType?: "amm" | "cpmm";
}

export interface LaunchLabResult {
  mintAddress: string;
  poolId: string;
  signature: string;
  explorerUrl: string;
}

// =============================================================================
// Trade Types
// =============================================================================

export interface BuyParams {
  mintAddress: string;
  solAmount: number;
  slippageBps?: number;
}

export interface BuyResult {
  signature: string;
  estimatedTokens: string;
  minTokens: string;
  explorerUrl: string;
}

export interface SellParams {
  mintAddress: string;
  tokenAmount?: number;
  percentage?: number;
  slippageBps?: number;
}

export interface SellResult {
  signature: string;
  estimatedSolReceived: string;
  explorerUrl: string;
}

// =============================================================================
// Query Types
// =============================================================================

export interface CurveInfo {
  mintAddress: string;
  creator: string;
  bondingCurve: string;
  reserveSol: string;
  reserveTokens: string;
  priceInSol: string;
  curveLimitSol: string;
  progress: string;
  isCompleted: boolean;
  autofunUrl: string;
  explorerUrl: string;
}

export interface BalanceResult {
  address: string;
  solBalance: string;
  tokens: Array<{
    mint: string;
    balance: string;
    decimals: number;
  }>;
}
