/**
 * Pump.fun Launch — Core Logic
 * Creates a new token on Pump.fun's bonding curve (73%+ of Solana meme coin market).
 * Tokens graduate to PumpSwap AMM when ~85 SOL is raised, then appear on Jupiter.
 *
 * Flow:
 * 1. Upload metadata to Pump.fun IPFS (or use Pinata/provided URI)
 * 2. Create token on Pump.fun bonding curve
 * 3. Optional: atomic initial buy
 */

import { Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PumpFunSDK } from "pumpdotfun-sdk";

import { getConnection, getSolBalance, getExplorerUrl } from "../services/solana.js";
import { loadKeypair } from "../utils/keypair.js";
import type { ToolResponse, PumpfunLaunchParams, PumpfunLaunchResult } from "../types/index.js";

const PUMP_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const BONDING_CURVE_SEED = "bonding-curve";

export async function launchOnPumpfun(
  params: PumpfunLaunchParams
): Promise<ToolResponse<PumpfunLaunchResult>> {
  try {
    const wallet = loadKeypair();
    const conn = getConnection();

    if (!params.name || !params.symbol) {
      return { success: false, error: "name and symbol are required" };
    }

    // Validate balance
    const balance = await getSolBalance(wallet.publicKey);
    const minRequired = (params.initialBuySol || 0) + 0.05;
    if (balance < minRequired) {
      return {
        success: false,
        error: `Insufficient SOL. Have ${balance.toFixed(4)}, need ~${minRequired.toFixed(4)}`,
      };
    }

    const name = params.name;
    const symbol = params.symbol.toUpperCase();
    const slippageBps = BigInt(params.slippageBps || 500);

    console.error(`Launching ${name} (${symbol}) on Pump.fun...`);

    // Initialize PumpFunSDK with AnchorProvider
    const anchorWallet = new Wallet(wallet);
    const provider = new AnchorProvider(conn, anchorWallet, {
      commitment: "confirmed",
    });
    const sdk = new PumpFunSDK(provider);

    // Generate new mint keypair
    const mint = Keypair.generate();
    console.error(`  Mint: ${mint.publicKey.toBase58()}`);

    // Prepare metadata
    let metadataUri = params.uri || "";

    // If no URI provided, try to build one
    if (!metadataUri) {
      if (params.imageUrl) {
        // Fetch image and use Pump.fun IPFS via SDK
        console.error("  Fetching image for metadata upload...");
        const imageResponse = await fetch(params.imageUrl);
        if (!imageResponse.ok) {
          return { success: false, error: `Failed to fetch image: ${imageResponse.status}` };
        }
        const imageBlob = await imageResponse.blob();

        const metadata = await sdk.createTokenMetadata({
          name,
          symbol,
          description: params.description || "",
          file: imageBlob,
        });
        metadataUri = metadata.metadataUri;
        console.error(`  Metadata URI: ${metadataUri}`);
      } else if (params.description) {
        // No image — use Pinata IPFS if available
        const { generateMetaplexJson, uploadMetadataToIPFS } = await import(
          "../services/metadata.js"
        );
        const metadata = generateMetaplexJson(name, symbol, params.description);
        metadataUri = await uploadMetadataToIPFS(metadata);
        console.error(`  Metadata URI (Pinata): ${metadataUri}`);
      }
    }

    // Build and send create (+ optional buy) transaction
    const buyAmountSol = params.initialBuySol
      ? BigInt(Math.floor(params.initialBuySol * 1_000_000_000))
      : BigInt(0);

    console.error(
      buyAmountSol > 0
        ? `  Creating token + buying with ${params.initialBuySol} SOL...`
        : "  Creating token..."
    );

    const result = await sdk.createAndBuy(
      wallet,
      mint,
      {
        name,
        symbol,
        description: params.description || "",
        file: new Blob([""]), // Placeholder — SDK uses this only if no metadataUri from createTokenMetadata
      },
      buyAmountSol,
      slippageBps,
      { unitLimit: 250_000, unitPrice: 1_000 },
      "confirmed",
      "confirmed"
    );

    if (!result.success || !result.signature) {
      return {
        success: false,
        error: result.error ? String(result.error) : "Transaction failed",
      };
    }

    // Derive bonding curve PDA
    const [bondingCurvePda] = PublicKey.findProgramAddressSync(
      [Buffer.from(BONDING_CURVE_SEED), mint.publicKey.toBuffer()],
      PUMP_PROGRAM_ID
    );

    const mintAddress = mint.publicKey.toBase58();
    console.error(`  Token created on Pump.fun!`);
    console.error(`  Signature: ${result.signature}`);
    console.error(`  View: https://pump.fun/${mintAddress}`);

    return {
      success: true,
      data: {
        mintAddress,
        signature: result.signature,
        bondingCurve: bondingCurvePda.toBase58(),
        pumpfunUrl: `https://pump.fun/${mintAddress}`,
        explorerUrl: getExplorerUrl(result.signature, "tx"),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Pump.fun launch failed:", message);
    return { success: false, error: message };
  }
}
