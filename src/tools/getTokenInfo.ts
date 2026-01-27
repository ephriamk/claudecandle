/**
 * Token Info Tools
 * Query token and curve information via Bags SDK
 */

import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { getBagsSDK } from "../services/bags.js";
import { getConnection, formatTokenAmount } from "../services/solana.js";
import { isValidSolanaAddress } from "../utils/keypair.js";
import { TOKEN_DECIMALS, ERROR_MESSAGES } from "../config/constants.js";
import type { TokenInfo, BondingCurveInfo, ToolResponse } from "../types/index.js";

// =============================================================================
// Schemas
// =============================================================================

export const getTokenInfoSchema = {
  mintAddress: z.string()
    .min(32)
    .max(44)
    .describe("Token mint address"),
};

export const getBondingCurveSchema = {
  mintAddress: z.string()
    .min(32)
    .max(44)
    .describe("Token mint address"),
};

export type GetTokenInfoParams = z.infer<z.ZodObject<typeof getTokenInfoSchema>>;
export type GetBondingCurveParams = z.infer<z.ZodObject<typeof getBondingCurveSchema>>;

// =============================================================================
// Get Token Info
// =============================================================================

export async function getTokenInfo(
  params: GetTokenInfoParams
): Promise<ToolResponse<TokenInfo>> {
  try {
    if (!isValidSolanaAddress(params.mintAddress)) {
      return {
        success: false,
        error: ERROR_MESSAGES.INVALID_MINT,
      };
    }

    const mint = new PublicKey(params.mintAddress);
    const conn = getConnection();

    // Get mint account info for basic token data
    const mintInfo = await conn.getParsedAccountInfo(mint);

    if (!mintInfo.value) {
      return {
        success: false,
        error: ERROR_MESSAGES.TOKEN_NOT_FOUND,
      };
    }

    const mintData = (mintInfo.value.data as any)?.parsed?.info;
    const decimals = mintData?.decimals || TOKEN_DECIMALS;
    const supply = mintData?.supply || "0";

    // Try to get additional info from Bags SDK
    let bagsInfo: any = null;
    try {
      const sdk = getBagsSDK();
      // Use SDK state service if available
      if (sdk.state && typeof sdk.state.getTokenCreators === 'function') {
        bagsInfo = await sdk.state.getTokenCreators(mint);
      }
    } catch {
      // SDK info not available, continue with on-chain data
    }

    // Build token info response
    const tokenInfo: TokenInfo = {
      mint: params.mintAddress,
      name: bagsInfo?.name || "Unknown",
      symbol: bagsInfo?.symbol || "Unknown",
      description: bagsInfo?.description || "",
      imageUrl: bagsInfo?.image || "",
      creator: bagsInfo?.creator || "Unknown",
      totalSupply: formatTokenAmount(BigInt(supply), decimals),
      decimals,
      bondingCurveProgress: bagsInfo?.progress || 0,
      marketCap: bagsInfo?.marketCap || "0",
      priceInSol: bagsInfo?.price || "0",
      isGraduated: bagsInfo?.isComplete || false,
    };

    return {
      success: true,
      data: tokenInfo,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get token info",
    };
  }
}

// =============================================================================
// Get Bonding Curve Info
// =============================================================================

export async function getBondingCurve(
  params: GetBondingCurveParams
): Promise<ToolResponse<BondingCurveInfo>> {
  try {
    if (!isValidSolanaAddress(params.mintAddress)) {
      return {
        success: false,
        error: ERROR_MESSAGES.INVALID_MINT,
      };
    }

    // Try to get curve info from Bags SDK
    try {
      const sdk = getBagsSDK();

      // Use SDK state service if available
      if (sdk.state) {
        const curveState = await (sdk.state as any).getCurveState?.(params.mintAddress);

        if (curveState) {
          return {
            success: true,
            data: {
              mint: params.mintAddress,
              curveAddress: curveState.curveAddress || "Unknown",
              progress: curveState.progress || 0,
              currentPrice: curveState.price || "0",
              marketCap: curveState.marketCap || "0",
              isComplete: curveState.isComplete || false,
              creator: curveState.creator,
            },
          };
        }
      }
    } catch {
      // SDK call failed, return basic info
    }

    // Return basic info if SDK doesn't have curve data
    return {
      success: true,
      data: {
        mint: params.mintAddress,
        curveAddress: "Query via Bags.fm",
        progress: 0,
        currentPrice: "Query via Bags.fm",
        marketCap: "Query via Bags.fm",
        isComplete: false,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get bonding curve info",
    };
  }
}

// =============================================================================
// Tool Descriptions
// =============================================================================

export const getTokenInfoDescription = `Get information about a token on Bags.fm.

Returns:
- Token metadata (name, symbol, description, image)
- Creator address
- Total supply and decimals
- Current price and market cap
- Whether the token has graduated

**Parameters:**
- mintAddress: The token's mint address`;

export const getBondingCurveDescription = `Get bonding curve status for a Bags.fm token.

Returns:
- Curve address
- Progress percentage
- Current price
- Market cap
- Whether curve is complete (graduated)

**Parameters:**
- mintAddress: The token's mint address`;
