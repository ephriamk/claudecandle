/**
 * Bags.fm SDK Service
 * Centralizes SDK initialization and provides typed wrappers for Bags.fm operations
 */

import { BagsSDK } from "@bagsfm/bags-sdk";
import { getConnection } from "./solana.js";

// Singleton SDK instance
let sdkInstance: BagsSDK | null = null;

/**
 * Initialize and get BagsSDK singleton
 * @throws Error if BAGS_API_KEY is not set
 */
export function getBagsSDK(): BagsSDK {
  if (sdkInstance) {
    return sdkInstance;
  }

  const apiKey = process.env.BAGS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "BAGS_API_KEY environment variable is required. " +
      "Get your API key from https://dev.bags.fm"
    );
  }

  const connection = getConnection();

  sdkInstance = new BagsSDK(apiKey, connection, "processed");

  return sdkInstance;
}

/**
 * Get token launch service for creating new tokens
 */
export function getTokenLaunchService() {
  return getBagsSDK().tokenLaunch;
}

/**
 * Get trade service for buying/selling tokens
 */
export function getTradeService() {
  return getBagsSDK().trade;
}

/**
 * Get state query service for token/curve information
 */
export function getStateService() {
  return getBagsSDK().state;
}

/**
 * Get fee service for claiming creator royalties
 */
export function getFeeService() {
  return getBagsSDK().fee;
}

/**
 * Get config service
 */
export function getConfigService() {
  return getBagsSDK().config;
}

/**
 * Check if SDK is initialized and API key is valid
 */
export function isSDKConfigured(): boolean {
  return !!process.env.BAGS_API_KEY;
}

/**
 * Reset SDK instance (useful for testing or reinitializing with new config)
 */
export function resetSDK(): void {
  sdkInstance = null;
}

/**
 * Get Bags.fm URL for a token
 */
export function getBagsFmUrl(mintAddress: string): string {
  return `https://bags.fm/token/${mintAddress}`;
}

/**
 * Get Bags.fm launch URL
 */
export function getBagsFmLaunchUrl(): string {
  return "https://bags.fm/launch";
}
