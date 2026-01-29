/**
 * Raydium CPMM Launch — Core Logic
 * Creates a new SPL token with metadata and a Raydium CPMM pool.
 * Token is immediately tradeable on Jupiter after pool creation.
 *
 * Flow:
 * 1. Create SPL token mint
 * 2. Mint total supply to creator
 * 3. Create Metaplex metadata (with optional IPFS upload)
 * 4. Create Raydium CPMM pool with initial liquidity
 */

import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  Raydium,
  TxVersion,
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC,
} from "@raydium-io/raydium-sdk-v2";
// @ts-ignore — bn.js has no bundled types, but works fine at runtime
import BN from "bn.js";

import { getConnection, getSolBalance, getExplorerUrl } from "../services/solana.js";
import { loadKeypair } from "../utils/keypair.js";
import type { ToolResponse, RaydiumLaunchParams, RaydiumLaunchResult } from "../types/index.js";

const DEFAULT_TOTAL_SUPPLY = 1_000_000_000; // 1 billion tokens
const DEFAULT_DECIMALS = 6;
const DEFAULT_LIQUIDITY_PERCENT = 50;
const WSOL_MINT = "So11111111111111111111111111111111111111112";

export async function launchOnRaydium(
  params: RaydiumLaunchParams
): Promise<ToolResponse<RaydiumLaunchResult>> {
  try {
    const wallet = loadKeypair();
    const conn = getConnection();

    // Validate required fields
    if (!params.name || !params.symbol) {
      return { success: false, error: "name and symbol are required" };
    }
    if (!params.liquiditySol || params.liquiditySol <= 0) {
      return { success: false, error: "liquiditySol must be greater than 0" };
    }

    // Validate balance (liquidity + ~0.5 SOL for fees/rent)
    const balance = await getSolBalance(wallet.publicKey);
    const minRequired = params.liquiditySol + 0.5;
    if (balance < minRequired) {
      return {
        success: false,
        error: `Insufficient SOL. Have ${balance.toFixed(4)}, need ~${minRequired.toFixed(4)} (${params.liquiditySol} liquidity + ~0.5 fees)`,
      };
    }

    const decimals = params.decimals || DEFAULT_DECIMALS;
    const totalSupply = params.totalSupply || DEFAULT_TOTAL_SUPPLY;
    const totalSupplyRaw = BigInt(totalSupply) * BigInt(10 ** decimals);
    const liquidityPercent = params.liquidityPercent || DEFAULT_LIQUIDITY_PERCENT;
    const name = params.name;
    const symbol = params.symbol.toUpperCase();

    console.error(`Launching ${name} (${symbol}) on Raydium...`);

    // =========================================================================
    // Step 1: Create SPL Token Mint (freeze authority = null for Raydium)
    // =========================================================================
    console.error("  Step 1/4: Creating token mint...");
    const mint = await createMint(
      conn,
      wallet,
      wallet.publicKey, // mint authority
      null, // freeze authority (null = Raydium compatible)
      decimals
    );
    console.error(`  Mint: ${mint.toBase58()}`);

    // =========================================================================
    // Step 2: Mint total supply to creator
    // =========================================================================
    console.error("  Step 2/4: Minting supply...");
    const ata = await getOrCreateAssociatedTokenAccount(
      conn,
      wallet,
      mint,
      wallet.publicKey
    );
    await mintTo(conn, wallet, mint, ata.address, wallet.publicKey, totalSupplyRaw);
    console.error(`  Minted ${totalSupply.toLocaleString()} tokens`);

    // =========================================================================
    // Step 3: Create Metaplex metadata
    // =========================================================================
    console.error("  Step 3/4: Creating metadata...");

    // Generate metadata URI if description/image provided
    let uri = params.uri || "";
    if (!uri && (params.description || params.imageUrl)) {
      const { generateMetaplexJson, uploadMetadataToIPFS } = await import(
        "../services/metadata.js"
      );
      const metadata = generateMetaplexJson(name, symbol, params.description, params.imageUrl);
      uri = await uploadMetadataToIPFS(metadata);
      console.error(`  Metadata URI: ${uri}`);
    }

    // Derive metadata PDA
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    const createMetadataIx = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPda,
        mint,
        mintAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name,
            symbol,
            uri,
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        },
      }
    );

    const metaTx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
      createMetadataIx
    );
    await sendAndConfirmTransaction(conn, metaTx, [wallet]);
    console.error("  Metadata created");

    // =========================================================================
    // Step 4: Create Raydium CPMM Pool
    // =========================================================================
    console.error("  Step 4/4: Creating Raydium CPMM pool...");

    const raydium = await Raydium.load({
      owner: wallet,
      connection: conn,
      cluster: "mainnet",
      disableFeatureCheck: true,
      disableLoadToken: false,
      blockhashCommitment: "finalized",
    });

    // Get token info for both mints
    const mintAInfo = await raydium.token.getTokenInfo(mint.toBase58());
    const mintBInfo = await raydium.token.getTokenInfo(WSOL_MINT);

    // Fetch CPMM fee configs from Raydium API
    const feeConfigs = await raydium.api.getCpmmConfigs();
    if (!feeConfigs.length) {
      return { success: false, error: "Failed to fetch Raydium CPMM fee configs" };
    }

    // Calculate pool amounts
    const tokensForPool = (totalSupplyRaw * BigInt(liquidityPercent)) / BigInt(100);
    const solForPoolLamports = Math.floor(params.liquiditySol * 1_000_000_000);

    console.error(`  Pool: ${Number(tokensForPool) / 10 ** decimals} tokens + ${params.liquiditySol} SOL`);

    const { execute, extInfo } = await raydium.cpmm.createPool({
      programId: CREATE_CPMM_POOL_PROGRAM,
      poolFeeAccount: CREATE_CPMM_POOL_FEE_ACC,
      mintA: mintAInfo,
      mintB: mintBInfo,
      mintAAmount: new BN(tokensForPool.toString()),
      mintBAmount: new BN(solForPoolLamports),
      startTime: new BN(0),
      feeConfig: feeConfigs[0],
      associatedOnly: false,
      ownerInfo: {
        useSOLBalance: true,
      },
      txVersion: TxVersion.V0,
    });

    const { txId } = await execute({ sendAndConfirm: true });
    const signature = txId;
    const mintAddress = mint.toBase58();
    const poolId = extInfo.address.poolId.toBase58();

    console.error(`  Pool created!`);
    console.error(`  Pool ID: ${poolId}`);
    console.error(`  Signature: ${signature}`);
    console.error(`  Jupiter: https://jup.ag/swap/SOL-${mintAddress}`);

    return {
      success: true,
      data: {
        mintAddress,
        poolId,
        lpMint: extInfo.address.lpMint.toBase58(),
        signature,
        jupiterUrl: `https://jup.ag/swap/SOL-${mintAddress}`,
        explorerUrl: getExplorerUrl(signature, "tx"),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Raydium launch failed:", message);
    return { success: false, error: message };
  }
}
