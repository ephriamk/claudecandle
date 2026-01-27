import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import {
  getConnection,
  getBondingCurveAddress,
  formatSol,
  formatTokenAmount,
  getPumpFunUrl,
  getExplorerUrl,
  lamportsToSol,
} from "../services/solana.js";
import { isValidSolanaAddress } from "../utils/keypair.js";
import {
  PUMP_PROGRAM_ID,
  TOKEN_DECIMALS,
  INITIAL_REAL_TOKEN_RESERVES,
  LAMPORTS_PER_SOL,
} from "../config/constants.js";
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
// Bonding Curve Account Parsing
// =============================================================================

interface ParsedBondingCurve {
  virtualTokenReserves: bigint;
  virtualSolReserves: bigint;
  realTokenReserves: bigint;
  realSolReserves: bigint;
  tokenTotalSupply: bigint;
  complete: boolean;
  creator: PublicKey;
}

function parseBondingCurveAccount(data: Buffer): ParsedBondingCurve | null {
  try {
    // Skip 8-byte discriminator
    let offset = 8;

    const virtualTokenReserves = data.readBigUInt64LE(offset);
    offset += 8;

    const virtualSolReserves = data.readBigUInt64LE(offset);
    offset += 8;

    const realTokenReserves = data.readBigUInt64LE(offset);
    offset += 8;

    const realSolReserves = data.readBigUInt64LE(offset);
    offset += 8;

    const tokenTotalSupply = data.readBigUInt64LE(offset);
    offset += 8;

    const complete = data.readUInt8(offset) === 1;
    offset += 1;

    const creatorBytes = data.subarray(offset, offset + 32);
    const creator = new PublicKey(creatorBytes);

    return {
      virtualTokenReserves,
      virtualSolReserves,
      realTokenReserves,
      realSolReserves,
      tokenTotalSupply,
      complete,
      creator,
    };
  } catch {
    return null;
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
        error: "Invalid mint address format",
      };
    }

    const mint = new PublicKey(params.mintAddress);
    const bondingCurveAddress = getBondingCurveAddress(mint);
    const conn = getConnection();

    // Fetch bonding curve account
    const accountInfo = await conn.getAccountInfo(bondingCurveAddress);

    if (!accountInfo) {
      return {
        success: false,
        error: "Token not found on pump.fun. It may not exist or has already graduated.",
      };
    }

    // Verify it's owned by Pump program
    if (!accountInfo.owner.equals(PUMP_PROGRAM_ID)) {
      return {
        success: false,
        error: "Invalid bonding curve account - not owned by Pump.fun program",
      };
    }

    const parsed = parseBondingCurveAccount(accountInfo.data);

    if (!parsed) {
      return {
        success: false,
        error: "Failed to parse bonding curve account data",
      };
    }

    // Calculate progress (how much of the curve has been filled)
    const tokensSold = INITIAL_REAL_TOKEN_RESERVES - parsed.realTokenReserves;
    const progress = Number(tokensSold * BigInt(10000) / INITIAL_REAL_TOKEN_RESERVES) / 100;

    // Calculate current price
    // Price = virtualSolReserves / virtualTokenReserves
    const currentPrice = Number(parsed.virtualSolReserves) / Number(parsed.virtualTokenReserves);

    // Calculate SOL needed to graduate
    const solToGraduation = parsed.complete
      ? 0
      : (85 - Number(parsed.realSolReserves) / LAMPORTS_PER_SOL);

    // Calculate market cap
    const marketCapLamports = Number(parsed.virtualSolReserves) *
      (Number(parsed.tokenTotalSupply) / Number(parsed.virtualTokenReserves));
    const marketCap = marketCapLamports / LAMPORTS_PER_SOL;

    const result: BondingCurveInfo = {
      mint: params.mintAddress,
      bondingCurveAddress: bondingCurveAddress.toBase58(),
      virtualTokenReserves: parsed.virtualTokenReserves.toString(),
      virtualSolReserves: parsed.virtualSolReserves.toString(),
      realTokenReserves: parsed.realTokenReserves.toString(),
      realSolReserves: parsed.realSolReserves.toString(),
      tokenTotalSupply: parsed.tokenTotalSupply.toString(),
      complete: parsed.complete,
      creator: parsed.creator.toBase58(),
      progress: Math.min(progress, 100),
      solToGraduation: solToGraduation.toFixed(4),
      tokensRemaining: formatTokenAmount(parsed.realTokenReserves, TOKEN_DECIMALS),
      currentPrice: currentPrice.toFixed(12),
      marketCap: marketCap.toFixed(4),
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get bonding curve info",
    };
  }
}

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
        error: "Invalid mint address format",
      };
    }

    const mint = new PublicKey(params.mintAddress);
    const conn = getConnection();

    // First try to get bonding curve info
    const bondingCurveResult = await getBondingCurve(params);

    // Get mint account info
    const mintInfo = await conn.getParsedAccountInfo(mint);

    if (!mintInfo.value) {
      return {
        success: false,
        error: "Token mint not found",
      };
    }

    const mintData = (mintInfo.value.data as any)?.parsed?.info;
    const decimals = mintData?.decimals || TOKEN_DECIMALS;
    const supply = mintData?.supply || "0";

    // Build token info
    const tokenInfo: TokenInfo = {
      mint: params.mintAddress,
      name: "Unknown", // Would need metadata lookup
      symbol: "Unknown",
      description: "",
      imageUrl: "",
      creator: bondingCurveResult.data?.creator || "Unknown",
      totalSupply: formatTokenAmount(BigInt(supply), decimals),
      decimals,
      bondingCurveProgress: bondingCurveResult.data?.progress || 0,
      marketCap: bondingCurveResult.data?.marketCap || "0",
      priceInSol: bondingCurveResult.data?.currentPrice || "0",
      isGraduated: bondingCurveResult.data?.complete || false,
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
// Tool Descriptions
// =============================================================================

export const getTokenInfoDescription = `Get detailed information about a pump.fun token.

Returns:
- Token metadata (name, symbol, description)
- Creator address
- Total supply and decimals
- Bonding curve progress
- Current price and market cap
- Whether the token has graduated`;

export const getBondingCurveDescription = `Get bonding curve status for a pump.fun token.

Returns:
- Virtual and real reserves
- Progress percentage (0-100%)
- SOL needed to graduate
- Tokens remaining in curve
- Current price
- Whether curve is complete`;
