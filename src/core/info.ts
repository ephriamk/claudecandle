/**
 * Token Info — Core Logic
 * Fetches bonding curve state from on-chain, calculates price/progress.
 */

import { PublicKey } from "@solana/web3.js";
import anchor from "@coral-xyz/anchor";
const { BN } = anchor;
type BN = InstanceType<typeof BN>;
import { getProgram, getBondingCurvePda } from "../services/program.js";
import { getConnection, lamportsToSol, getExplorerUrl, getAutofunUrl } from "../services/solana.js";
import { loadKeypair } from "../utils/keypair.js";
import { TOKEN_DECIMALS, ERROR_MESSAGES } from "../config/constants.js";
import type { ToolResponse, CurveInfo } from "../types/index.js";

export async function getCurveInfo(mintAddress: string): Promise<ToolResponse<CurveInfo>> {
  try {
    const wallet = loadKeypair();
    const conn = getConnection();
    const program = getProgram(conn, wallet);
    const mint = new PublicKey(mintAddress);

    const curvePda = getBondingCurvePda(mint);

    let curve: {
      tokenMint: PublicKey;
      creator: PublicKey;
      initLamport: BN;
      reserveLamport: BN;
      reserveToken: BN;
      curveLimit: BN;
      isCompleted: boolean;
    };

    try {
      curve = await (program.account as Record<string, { fetch: (pda: PublicKey) => Promise<typeof curve> }>)["bondingCurve"].fetch(curvePda);
    } catch {
      return { success: false, error: ERROR_MESSAGES.CURVE_NOT_FOUND };
    }

    const decimals = TOKEN_DECIMALS;
    const reserveSol = lamportsToSol(curve.reserveLamport.toNumber());
    const reserveTokens = curve.reserveToken.toNumber() / Math.pow(10, decimals);
    const priceInSol = reserveTokens > 0 ? reserveSol / reserveTokens : 0;
    const curveLimitSol = lamportsToSol(curve.curveLimit.toNumber());
    const initSol = lamportsToSol(curve.initLamport.toNumber());

    // Progress: how close reserves are to graduation
    const denominator = curveLimitSol - initSol;
    const progress = denominator > 0
      ? Math.min(((reserveSol - initSol) / denominator) * 100, 100)
      : 0;

    return {
      success: true,
      data: {
        mintAddress,
        creator: curve.creator.toBase58(),
        bondingCurve: curvePda.toBase58(),
        reserveSol: reserveSol.toFixed(4),
        reserveTokens: reserveTokens.toFixed(0),
        priceInSol: priceInSol.toFixed(12),
        curveLimitSol: curveLimitSol.toFixed(2),
        progress: `${progress.toFixed(2)}%`,
        isCompleted: curve.isCompleted,
        autofunUrl: getAutofunUrl(mintAddress),
        explorerUrl: getExplorerUrl(mintAddress, "address"),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
