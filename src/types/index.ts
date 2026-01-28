/**
 * ClaudeCandle Type Definitions
 * Types for auto.fun integration (MCP server + CLI scripts)
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
// Launch Types
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
