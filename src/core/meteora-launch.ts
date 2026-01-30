/**
 * Meteora Dynamic Bonding Curve (DBC) Launch — Core Logic
 * Creates a token with a Meteora DBC bonding curve.
 * Powers platforms like Believe, Bags, and daos.fun under the hood.
 * Tokens graduate to Meteora DAMM v2 pool when quote threshold is met.
 *
 * Flow:
 * 1. Build curve configuration (market cap based)
 * 2. Create config + pool + optional first buy in one flow
 * 3. Token trades on bonding curve until graduation
 */

import {
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
// @ts-ignore — bn.js has no bundled types
import BN from "bn.js";

import { getConnection, getSolBalance, getExplorerUrl } from "../services/solana.js";
import { loadKeypair } from "../utils/keypair.js";
import type { ToolResponse, MeteoraLaunchParams, MeteoraLaunchResult } from "../types/index.js";

// Default curve parameters
const DEFAULT_TOTAL_SUPPLY = 1_000_000_000;
const DEFAULT_INITIAL_MARKET_CAP = 30; // In SOL terms
const DEFAULT_MIGRATION_MARKET_CAP = 300; // Graduation threshold in SOL terms

export async function launchOnMeteora(
  params: MeteoraLaunchParams
): Promise<ToolResponse<MeteoraLaunchResult>> {
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
    const totalSupply = params.totalSupply || DEFAULT_TOTAL_SUPPLY;

    console.error(`Launching ${name} (${symbol}) on Meteora DBC...`);

    // Dynamically import the Meteora SDK (ESM/CJS compat)
    const meteoraSdk = await import("@meteora-ag/dynamic-bonding-curve-sdk");
    const {
      DynamicBondingCurveClient,
      buildCurveWithMarketCap,
    } = meteoraSdk;

    // Access enums — handle both ESM default export and named exports
    const ActivationType = (meteoraSdk as any).ActivationType ?? { Timestamp: 1 };
    const CollectFeeMode = (meteoraSdk as any).CollectFeeMode ?? { QuoteToken: 0 };
    const MigrationOption = (meteoraSdk as any).MigrationOption ?? { MET_DAMM_V2: 1 };
    const MigrationFeeOption = (meteoraSdk as any).MigrationFeeOption ?? { FixedBps100: 2 };
    const TokenDecimal = (meteoraSdk as any).TokenDecimal ?? { SIX: 6, NINE: 9 };
    const TokenType = (meteoraSdk as any).TokenType ?? { SPL: 0 };
    const BaseFeeMode = (meteoraSdk as any).BaseFeeMode ?? { FeeSchedulerLinear: 0 };
    const TokenUpdateAuthorityOption = (meteoraSdk as any).TokenUpdateAuthorityOption ?? { CreatorUpdateAuthority: 0 };

    const client = DynamicBondingCurveClient.create(conn, "confirmed");

    // Build curve configuration
    console.error("  Step 1/3: Building curve configuration...");
    const curveConfig = buildCurveWithMarketCap({
      totalTokenSupply: totalSupply,
      initialMarketCap: DEFAULT_INITIAL_MARKET_CAP,
      migrationMarketCap: DEFAULT_MIGRATION_MARKET_CAP,
      migrationOption: MigrationOption.MET_DAMM_V2,
      tokenBaseDecimal: TokenDecimal.SIX,
      tokenQuoteDecimal: TokenDecimal.NINE,
      tokenType: TokenType.SPL,
      tokenUpdateAuthority: TokenUpdateAuthorityOption.CreatorUpdateAuthority,
      lockedVestingParams: {
        totalLockedVestingAmount: 0,
        numberOfVestingPeriod: 0,
        cliffUnlockAmount: 0,
        totalVestingDuration: 0,
        cliffDurationFromMigrationTime: 0,
      },
      leftover: 0,
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
        feeSchedulerParam: {
          startingFeeBps: 100,
          endingFeeBps: 100,
          numberOfPeriod: 0,
          totalDuration: 0,
        },
      },
      dynamicFeeEnabled: true,
      activationType: ActivationType.Timestamp,
      collectFeeMode: CollectFeeMode.QuoteToken,
      creatorTradingFeePercentage: 0,
      poolCreationFee: 0,
      migrationFeeOption: MigrationFeeOption.FixedBps100,
      migrationFee: {
        feePercentage: 0,
        creatorFeePercentage: 0,
      },
      partnerPermanentLockedLiquidityPercentage: 50,
      partnerLiquidityPercentage: 0,
      creatorPermanentLockedLiquidityPercentage: 50,
      creatorLiquidityPercentage: 0,
    });

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

    // Generate keypairs for config and baseMint
    const configKeypair = Keypair.generate();
    const baseMintKeypair = Keypair.generate();

    console.error(`  Mint: ${baseMintKeypair.publicKey.toBase58()}`);

    // Create config + pool (+ optional first buy)
    console.error("  Step 2/3: Creating config and pool...");

    const firstBuyParam = params.initialBuySol && params.initialBuySol > 0
      ? {
          buyer: wallet.publicKey,
          buyAmount: new BN(Math.floor(params.initialBuySol * 1_000_000_000)),
          minimumAmountOut: new BN(0),
          referralTokenAccount: null,
        }
      : undefined;

    const txResult = await client.pool.createConfigAndPoolWithFirstBuy({
      config: configKeypair.publicKey,
      feeClaimer: wallet.publicKey,
      leftoverReceiver: wallet.publicKey,
      quoteMint: NATIVE_MINT,
      payer: wallet.publicKey,
      ...curveConfig,
      preCreatePoolParam: {
        name,
        symbol,
        uri: uri || `https://claudecandle.dev/${symbol}`,
        poolCreator: wallet.publicKey,
        baseMint: baseMintKeypair.publicKey,
      },
      firstBuyParam,
    });

    // Send transactions sequentially
    console.error("  Step 3/3: Sending transactions...");

    let signature = "";

    // Send config creation tx
    const configSig = await sendAndConfirmTransaction(
      conn,
      txResult.createConfigTx,
      [wallet, configKeypair],
      { commitment: "confirmed" }
    );
    console.error(`  Config created: ${configSig}`);

    // Send pool creation tx
    const poolSig = await sendAndConfirmTransaction(
      conn,
      txResult.createPoolTx,
      [wallet, baseMintKeypair],
      { commitment: "confirmed" }
    );
    console.error(`  Pool created: ${poolSig}`);
    signature = poolSig;

    // Send first buy tx if present
    if (txResult.swapBuyTx) {
      const buySig = await sendAndConfirmTransaction(
        conn,
        txResult.swapBuyTx,
        [wallet],
        { commitment: "confirmed" }
      );
      console.error(`  First buy: ${buySig}`);
      signature = buySig;
    }

    // Derive pool address from PDA seeds
    const { deriveDbcPoolAddress } = meteoraSdk as any;
    let poolAddress: string;
    try {
      const poolPda = deriveDbcPoolAddress(
        NATIVE_MINT,
        baseMintKeypair.publicKey,
        configKeypair.publicKey
      );
      poolAddress = poolPda.toBase58();
    } catch {
      // PDA derivation not available — use config as identifier
      poolAddress = configKeypair.publicKey.toBase58();
    }

    const mintAddress = baseMintKeypair.publicKey.toBase58();
    console.error(`  Token launched on Meteora DBC!`);
    console.error(`  Mint: ${mintAddress}`);

    return {
      success: true,
      data: {
        mintAddress,
        poolAddress,
        signature,
        explorerUrl: getExplorerUrl(signature, "tx"),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Meteora DBC launch failed:", message);
    return { success: false, error: message };
  }
}
