/**
 * Raydium LaunchLab — Core Logic
 * Creates a token with a Raydium LaunchLab bonding curve.
 * Tokens graduate to Raydium CPMM (or AMM) when 85 SOL is raised,
 * then appear on Jupiter.
 *
 * Flow:
 * 1. Load Raydium SDK
 * 2. Get LaunchLab config for the curve type
 * 3. Create token + bonding curve (+ optional initial buy) atomically
 */

import { Keypair } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  Raydium,
  TxVersion,
  LAUNCHPAD_PROGRAM,
} from "@raydium-io/raydium-sdk-v2";
import BN from "bn.js";

import { getConnection, getSolBalance, getExplorerUrl } from "../services/solana.js";
import { loadKeypair } from "../utils/keypair.js";
import type { ToolResponse, LaunchLabParams, LaunchLabResult } from "../types/index.js";

export async function launchOnLaunchLab(
  params: LaunchLabParams
): Promise<ToolResponse<LaunchLabResult>> {
  try {
    const wallet = loadKeypair();
    const conn = getConnection();

    if (!params.name || !params.symbol) {
      return { success: false, error: "name and symbol are required" };
    }

    const balance = await getSolBalance(wallet.publicKey);
    const minRequired = (params.initialBuySol || 0) + 0.1;
    if (balance < minRequired) {
      return {
        success: false,
        error: `Insufficient SOL. Have ${balance.toFixed(4)}, need ~${minRequired.toFixed(4)}`,
      };
    }

    const name = params.name;
    const symbol = params.symbol.toUpperCase();
    const migrateType = params.migrateType || "cpmm";

    console.error(`Launching ${name} (${symbol}) on Raydium LaunchLab...`);

    // Prepare metadata URI
    let uri = params.uri || "";
    if (!uri && (params.description || params.imageUrl)) {
      const { generateMetaplexJson, uploadMetadataToIPFS } = await import(
        "../services/metadata.js"
      );
      const metadata = generateMetaplexJson(name, symbol, params.description, params.imageUrl);
      uri = await uploadMetadataToIPFS(metadata);
      console.error(`  Metadata URI: ${uri}`);
    }

    if (!uri) {
      uri = `https://claudecandle.dev/${symbol}`;
    }

    // Load Raydium SDK
    console.error("  Step 1/3: Loading Raydium SDK...");
    const raydium = await Raydium.load({
      owner: wallet,
      connection: conn,
      cluster: "mainnet",
      disableFeatureCheck: true,
      disableLoadToken: false,
      blockhashCommitment: "finalized",
    });

    // Generate new mint keypair
    const mintKeypair = Keypair.generate();
    console.error(`  Mint: ${mintKeypair.publicKey.toBase58()}`);

    // Get config for ConstantProduct curve (type 0), index 0, paired with SOL
    console.error("  Step 2/3: Fetching LaunchLab config...");

    // Import PDA helper
    const { getPdaLaunchpadConfigId } = await import("@raydium-io/raydium-sdk-v2");

    const configPda = getPdaLaunchpadConfigId(
      LAUNCHPAD_PROGRAM,
      NATIVE_MINT,
      0, // ConstantProduct curve
      0  // index
    );
    const configId = configPda.publicKey;

    // Fetch config info from chain
    const configAccountInfo = await conn.getAccountInfo(configId);
    let configInfo: any;
    if (configAccountInfo) {
      const { LaunchpadConfig } = await import("@raydium-io/raydium-sdk-v2");
      configInfo = (LaunchpadConfig as any).decode(configAccountInfo.data);
    }

    // Calculate initial buy amount
    const buyAmount = params.initialBuySol
      ? new BN(Math.floor(params.initialBuySol * 1_000_000_000))
      : new BN(1000); // Minimal buy to activate

    const slippage = new BN(params.slippageBps || 500);

    // Create launch
    console.error("  Step 3/3: Creating LaunchLab token...");

    const createParams: any = {
      programId: LAUNCHPAD_PROGRAM,
      mintA: mintKeypair.publicKey,
      decimals: 6,
      name,
      symbol,
      migrateType,
      uri,
      configId,
      txVersion: TxVersion.V0,
      slippage,
      buyAmount,
      createOnly: false, // create + buy atomically
      extraSigners: [mintKeypair],
    };

    if (configInfo) {
      createParams.configInfo = configInfo;
    }

    const { execute, extInfo } = await raydium.launchpad.createLaunchpad(createParams);

    const sentInfo = await execute({ sequentially: true });

    // Get signature from result
    let signature = "";
    if (Array.isArray(sentInfo)) {
      // Multiple transactions
      for (const info of sentInfo) {
        if (info?.txId) {
          signature = info.txId;
        }
      }
    } else if ((sentInfo as any)?.txId) {
      signature = (sentInfo as any).txId;
    }

    const mintAddress = mintKeypair.publicKey.toBase58();
    const poolId = extInfo?.address?.poolId?.toBase58() || "pending";

    console.error(`  Token launched on Raydium LaunchLab!`);
    console.error(`  Mint: ${mintAddress}`);
    console.error(`  Pool: ${poolId}`);
    console.error(`  Migration: ${migrateType} (at ~85 SOL)`);

    return {
      success: true,
      data: {
        mintAddress,
        poolId,
        signature,
        explorerUrl: signature ? getExplorerUrl(signature, "tx") : "",
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Raydium LaunchLab launch failed:", message);
    return { success: false, error: message };
  }
}
