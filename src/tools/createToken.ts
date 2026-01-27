/**
 * Create Token Tool
 * Launch new tokens on Bags.fm using the Bags SDK
 */

import { z } from "zod";
import { getBagsSDK, getBagsFmUrl } from "../services/bags.js";
import { getExplorerUrl, getSolBalance } from "../services/solana.js";
import { loadKeypair } from "../utils/keypair.js";
import {
  DEFAULT_SLIPPAGE_BPS,
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  ERROR_MESSAGES,
} from "../config/constants.js";
import type { CreateTokenResult, ToolResponse } from "../types/index.js";

// =============================================================================
// Schema
// =============================================================================

export const createTokenSchema = {
  name: z.string()
    .min(1, "Name is required")
    .max(MAX_NAME_LENGTH, `Name must be ${MAX_NAME_LENGTH} characters or less`)
    .describe("Token name (e.g., 'My Awesome Token')"),

  symbol: z.string()
    .min(1, "Symbol is required")
    .max(MAX_SYMBOL_LENGTH, `Symbol must be ${MAX_SYMBOL_LENGTH} characters or less`)
    .transform(s => s.toUpperCase())
    .describe("Token symbol/ticker (e.g., 'AWESOME')"),

  description: z.string()
    .max(MAX_DESCRIPTION_LENGTH, `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`)
    .default("")
    .describe("Token description"),

  imageUrl: z.string()
    .url("Must be a valid URL")
    .optional()
    .describe("URL to token logo image"),

  twitter: z.string()
    .optional()
    .describe("Twitter/X handle (without @)"),

  telegram: z.string()
    .optional()
    .describe("Telegram group link or handle"),

  website: z.string()
    .url("Must be a valid URL")
    .optional()
    .describe("Project website URL"),

  initialBuySol: z.number()
    .min(0, "Initial buy must be non-negative")
    .max(100, "Maximum initial buy is 100 SOL")
    .default(0)
    .describe("Optional SOL amount to buy at launch (0 = no initial buy)"),

  slippageBps: z.number()
    .min(0)
    .max(5000, "Maximum slippage is 50%")
    .default(DEFAULT_SLIPPAGE_BPS)
    .describe("Slippage tolerance in basis points (500 = 5%)"),
};

export type CreateTokenSchemaType = z.infer<z.ZodObject<typeof createTokenSchema>>;

// =============================================================================
// Create Token Function
// =============================================================================

export async function createToken(
  params: CreateTokenSchemaType
): Promise<ToolResponse<CreateTokenResult>> {
  try {
    // Load wallet
    const wallet = loadKeypair();

    // Check SOL balance
    const balance = await getSolBalance(wallet.publicKey);
    const minRequired = params.initialBuySol + 0.05; // Token creation + fees

    if (balance < minRequired) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INSUFFICIENT_SOL}. Have ${balance.toFixed(4)} SOL, need ~${minRequired.toFixed(4)} SOL`,
      };
    }

    // Initialize Bags SDK
    const sdk = getBagsSDK();

    console.error(`Creating token: ${params.name} (${params.symbol})`);
    console.error(`Initial buy: ${params.initialBuySol} SOL`);

    // Create token info and metadata via Bags SDK
    // Note: The SDK's createTokenInfoAndMetadata handles metadata upload
    const result = await sdk.tokenLaunch.createTokenInfoAndMetadata({
      name: params.name,
      symbol: params.symbol,
      description: params.description || "",
      imageUrl: params.imageUrl || "https://bags.fm/default-token.png",
      twitter: params.twitter,
      telegram: params.telegram,
      website: params.website,
    });

    // The SDK returns CreateTokenInfoResponse with tokenMint, tokenMetadata, and tokenLaunch
    const mintAddress = result.tokenMint;

    if (!mintAddress) {
      return {
        success: false,
        error: "Token creation failed: No mint address returned",
      };
    }

    console.error(`Token created: ${mintAddress}`);

    // Token info created - launch signature comes from the tokenLaunch response
    const launchSig = result.tokenLaunch?.launchSignature;

    return {
      success: true,
      data: {
        mintAddress,
        signature: launchSig || "metadata-created",
        explorerUrl: getExplorerUrl(launchSig || mintAddress, launchSig ? "tx" : "address"),
        bagsfmUrl: getBagsFmUrl(mintAddress),
        tokensReceived: params.initialBuySol > 0 ? "See transaction" : undefined,
      },
    };
  } catch (error) {
    console.error("Token creation error:", error);

    // Handle specific SDK errors
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("API key")) {
      return {
        success: false,
        error: ERROR_MESSAGES.NO_API_KEY,
      };
    }

    if (errorMessage.includes("insufficient") || errorMessage.includes("balance")) {
      return {
        success: false,
        error: ERROR_MESSAGES.INSUFFICIENT_SOL,
      };
    }

    return {
      success: false,
      error: `Token creation failed: ${errorMessage}`,
    };
  }
}

// =============================================================================
// Tool Description
// =============================================================================

export const createTokenDescription = `Create a new token on Bags.fm.

Launch a new meme coin on the Bags.fm platform powered by Meteora Dynamic Bonding Curves.

**Features:**
- Fair launch with bonding curve mechanics
- Creator earns 1% of all trading volume forever
- Professional liquidity curves
- Automatic fee distribution

**Parameters:**
- name: Token name (max 32 chars)
- symbol: Token ticker (max 10 chars, auto-uppercased)
- description: Token description (optional, max 500 chars)
- imageUrl: URL to token logo (optional)
- twitter: Twitter handle without @ (optional)
- telegram: Telegram link/handle (optional)
- website: Project website URL (optional)
- initialBuySol: SOL to buy at launch, 0-100 (optional, default 0)
- slippageBps: Slippage tolerance in basis points (optional, default 500 = 5%)

**Cost:** ~0.02 SOL for transaction fees + initial buy amount

**Returns:**
- Mint address of the new token
- Transaction signature
- Links to Solscan and Bags.fm`;
