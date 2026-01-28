/**
 * Token Trading — Core Logic
 * Buy/sell tokens via auto.fun's bonding curve swap instruction.
 * Constant product formula: xy = k
 */

import { PublicKey } from "@solana/web3.js";
import anchor from "@coral-xyz/anchor";
const { BN } = anchor;
type BN = InstanceType<typeof BN>;
import { getProgram, getConfigPda, getBondingCurvePda } from "../services/program.js";
import { getConnection, getSolBalance, getTokenBalance, solToLamports, lamportsToSol, getExplorerUrl } from "../services/solana.js";
import { loadKeypair } from "../utils/keypair.js";
import { DEFAULT_SLIPPAGE_BPS, DEADLINE_SECONDS, ERROR_MESSAGES } from "../config/constants.js";
import type { ToolResponse, BuyParams, BuyResult, SellParams, SellResult } from "../types/index.js";

// =============================================================================
// Buy
// =============================================================================

export async function buyToken(params: BuyParams): Promise<ToolResponse<BuyResult>> {
  try {
    const wallet = loadKeypair();
    const conn = getConnection();
    const program = getProgram(conn, wallet);
    const mint = new PublicKey(params.mintAddress);

    // Check SOL balance
    const balance = await getSolBalance(wallet.publicKey);
    if (balance < params.solAmount + 0.01) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INSUFFICIENT_SOL}. Have ${balance.toFixed(4)}, need ${(params.solAmount + 0.01).toFixed(4)}`,
      };
    }

    // Fetch bonding curve state
    const curvePda = getBondingCurvePda(mint);
    const curve = await (program.account as Record<string, { fetch: (pda: PublicKey) => Promise<{
      reserveToken: BN; reserveLamport: BN; isCompleted: boolean;
    }> }>)["bondingCurve"].fetch(curvePda);

    if (curve.isCompleted) {
      return { success: false, error: ERROR_MESSAGES.CURVE_COMPLETED };
    }

    const inputLamports = new BN(solToLamports(params.solAmount));

    // Estimate output: output = (reserveToken * input) / (reserveLamport + input)
    const estimatedOutput = curve.reserveToken
      .mul(inputLamports)
      .div(curve.reserveLamport.add(inputLamports));

    // Apply slippage
    const slippageBps = params.slippageBps || DEFAULT_SLIPPAGE_BPS;
    const minOutput = estimatedOutput.mul(new BN(10000 - slippageBps)).div(new BN(10000));

    const deadline = new BN(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS);

    // Fetch config for team wallet
    const configPda = getConfigPda();
    const config = await (program.account as Record<string, { fetch: (pda: PublicKey) => Promise<{ teamWallet: PublicKey }> }>)["config"].fetch(configPda);

    console.error(`Buying ${params.solAmount} SOL of ${params.mintAddress}...`);

    const signature = await program.methods
      .swap(
        inputLamports,
        0, // direction: 0 = buy
        minOutput,
        deadline
      )
      .accounts({
        user: wallet.publicKey,
        tokenMint: mint,
        teamWallet: config.teamWallet,
      })
      .signers([wallet])
      .rpc();

    return {
      success: true,
      data: {
        signature,
        estimatedTokens: estimatedOutput.toString(),
        minTokens: minOutput.toString(),
        explorerUrl: getExplorerUrl(signature, "tx"),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Buy failed:", message);
    return { success: false, error: message };
  }
}

// =============================================================================
// Sell
// =============================================================================

export async function sellToken(params: SellParams): Promise<ToolResponse<SellResult>> {
  try {
    const wallet = loadKeypair();
    const conn = getConnection();
    const program = getProgram(conn, wallet);
    const mint = new PublicKey(params.mintAddress);

    // Get token balance
    const balanceInfo = await getTokenBalance(wallet.publicKey, mint);
    if (!balanceInfo || balanceInfo.balanceRaw === BigInt(0)) {
      return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_TOKENS };
    }

    // Determine sell amount
    let sellAmount: BN;
    if (params.percentage) {
      const rawAmount = (balanceInfo.balanceRaw * BigInt(params.percentage)) / BigInt(100);
      sellAmount = new BN(rawAmount.toString());
    } else if (params.tokenAmount) {
      sellAmount = new BN(
        Math.floor(params.tokenAmount * Math.pow(10, balanceInfo.decimals))
      );
    } else {
      return { success: false, error: "Specify tokenAmount or percentage" };
    }

    // Fetch bonding curve for output estimate
    const curvePda = getBondingCurvePda(mint);
    const curve = await (program.account as Record<string, { fetch: (pda: PublicKey) => Promise<{
      reserveToken: BN; reserveLamport: BN; isCompleted: boolean;
    }> }>)["bondingCurve"].fetch(curvePda);

    if (curve.isCompleted) {
      return { success: false, error: ERROR_MESSAGES.CURVE_COMPLETED };
    }

    // Estimate output: output = (reserveLamport * input) / (reserveToken + input)
    const estimatedOutput = curve.reserveLamport
      .mul(sellAmount)
      .div(curve.reserveToken.add(sellAmount));

    const slippageBps = params.slippageBps || DEFAULT_SLIPPAGE_BPS;
    const minOutput = estimatedOutput.mul(new BN(10000 - slippageBps)).div(new BN(10000));
    const deadline = new BN(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS);

    // Fetch config for team wallet
    const configPda = getConfigPda();
    const config = await (program.account as Record<string, { fetch: (pda: PublicKey) => Promise<{ teamWallet: PublicKey }> }>)["config"].fetch(configPda);

    console.error(`Selling tokens from ${params.mintAddress}...`);

    const signature = await program.methods
      .swap(
        sellAmount,
        1, // direction: 1 = sell
        minOutput,
        deadline
      )
      .accounts({
        user: wallet.publicKey,
        tokenMint: mint,
        teamWallet: config.teamWallet,
      })
      .signers([wallet])
      .rpc();

    const solReceived = lamportsToSol(estimatedOutput.toNumber());

    return {
      success: true,
      data: {
        signature,
        estimatedSolReceived: `${solReceived.toFixed(6)} SOL`,
        explorerUrl: getExplorerUrl(signature, "tx"),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Sell failed:", message);
    return { success: false, error: message };
  }
}
