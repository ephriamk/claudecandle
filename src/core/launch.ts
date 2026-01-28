/**
 * Token Launch — Core Logic
 * Creates a new token with bonding curve on auto.fun via a single Anchor transaction.
 */

import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram, getConfigPda, getBondingCurvePda } from "../services/program.js";
import { getConnection, getSolBalance, solToLamports, getExplorerUrl, getAutofunUrl } from "../services/solana.js";
import { loadKeypair } from "../utils/keypair.js";
import {
  TOKEN_DECIMALS,
  DEFAULT_TOKEN_SUPPLY,
  DEFAULT_VIRTUAL_RESERVES,
  DEADLINE_SECONDS,
} from "../config/constants.js";
import type { ToolResponse, LaunchParams, LaunchResult } from "../types/index.js";

export async function launchToken(params: LaunchParams): Promise<ToolResponse<LaunchResult>> {
  try {
    const wallet = loadKeypair();
    const conn = getConnection();
    const program = getProgram(conn, wallet);

    // Validate balance
    const balance = await getSolBalance(wallet.publicKey);
    const minRequired = (params.initialBuySol || 0) + 0.02;
    if (balance < minRequired) {
      return {
        success: false,
        error: `Insufficient SOL. Have ${balance.toFixed(4)}, need ~${minRequired.toFixed(4)}`,
      };
    }

    // Validate required fields
    if (!params.name || !params.symbol) {
      return { success: false, error: "name and symbol are required" };
    }

    // Generate new mint keypair
    const mint = Keypair.generate();
    const decimals = params.decimals || TOKEN_DECIMALS;
    const tokenSupply = new BN(params.tokenSupply || DEFAULT_TOKEN_SUPPLY);
    const virtualReserves = new BN(params.virtualReserves || DEFAULT_VIRTUAL_RESERVES);

    // Fetch on-chain config to get team wallet
    const configPda = getConfigPda();
    const config = await (program.account as Record<string, { fetch: (pda: PublicKey) => Promise<{ teamWallet: PublicKey }> }>)["config"].fetch(configPda);

    const name = params.name;
    const symbol = params.symbol.toUpperCase();
    const uri = params.uri || "";

    console.error(`Launching ${name} (${symbol})...`);
    console.error(`  Mint: ${mint.publicKey.toBase58()}`);

    let signature: string;

    if (params.initialBuySol && params.initialBuySol > 0) {
      // Atomic launch + buy
      const swapAmount = new BN(solToLamports(params.initialBuySol));
      const minReceive = new BN(0); // Accept any amount for initial buy
      const deadline = new BN(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS);

      signature = await program.methods
        .launchAndSwap(
          decimals,
          tokenSupply,
          virtualReserves,
          name,
          symbol,
          uri,
          swapAmount,
          minReceive,
          deadline
        )
        .accounts({
          creator: wallet.publicKey,
          token: mint.publicKey,
          teamWallet: config.teamWallet,
        })
        .signers([wallet, mint])
        .rpc();
    } else {
      // Launch only
      signature = await program.methods
        .launch(
          decimals,
          tokenSupply,
          virtualReserves,
          name,
          symbol,
          uri
        )
        .accounts({
          creator: wallet.publicKey,
          token: mint.publicKey,
          teamWallet: config.teamWallet,
        })
        .signers([wallet, mint])
        .rpc();
    }

    console.error(`  Signature: ${signature}`);

    const mintAddress = mint.publicKey.toBase58();
    return {
      success: true,
      data: {
        mintAddress,
        signature,
        bondingCurve: getBondingCurvePda(mint.publicKey).toBase58(),
        explorerUrl: getExplorerUrl(signature, "tx"),
        autofunUrl: getAutofunUrl(mintAddress),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Launch failed:", message);
    return { success: false, error: message };
  }
}
