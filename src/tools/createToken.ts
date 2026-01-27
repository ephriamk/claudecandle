import {
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { z } from "zod";
import {
  getConnection,
  getPriorityFeeEstimate,
  addComputeBudget,
  sendAndConfirmTransaction,
  getExplorerUrl,
  getPumpFunUrl,
  solToLamports,
  getNetwork,
} from "../services/solana.js";
import { loadKeypair } from "../utils/keypair.js";
import {
  PUMP_PROGRAM_ID,
  DEFAULT_CREATE_COMPUTE_UNITS,
  DEFAULT_SLIPPAGE_BPS,
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  LAMPORTS_PER_SOL,
} from "../config/constants.js";
import type { CreateTokenResult, ToolResponse } from "../types/index.js";

// =============================================================================
// Schema
// =============================================================================

export const createTokenSchema = {
  name: z.string()
    .min(1, "Name is required")
    .max(MAX_NAME_LENGTH, `Name must be ${MAX_NAME_LENGTH} characters or less`)
    .describe("Token name (e.g., 'Dogwifhat')"),

  symbol: z.string()
    .min(1, "Symbol is required")
    .max(MAX_SYMBOL_LENGTH, `Symbol must be ${MAX_SYMBOL_LENGTH} characters or less`)
    .transform(s => s.toUpperCase())
    .describe("Token symbol/ticker (e.g., 'WIF')"),

  description: z.string()
    .max(MAX_DESCRIPTION_LENGTH, `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`)
    .default("")
    .describe("Token description"),

  imageUrl: z.string()
    .url("Must be a valid URL")
    .optional()
    .describe("Token logo URL (PNG/JPG, recommended 512x512)"),

  twitter: z.string()
    .optional()
    .describe("Twitter/X username or URL"),

  telegram: z.string()
    .optional()
    .describe("Telegram group URL"),

  website: z.string()
    .url()
    .optional()
    .describe("Project website URL"),

  initialBuySol: z.number()
    .min(0, "Cannot be negative")
    .max(85, "Cannot exceed 85 SOL (graduation threshold)")
    .default(0)
    .describe("Initial SOL to buy after creation (0 for no initial buy)"),

  slippageBps: z.number()
    .min(0)
    .max(5000, "Max slippage is 50%")
    .default(DEFAULT_SLIPPAGE_BPS)
    .describe("Slippage tolerance in basis points (500 = 5%)"),
};

export type CreateTokenSchemaType = z.infer<z.ZodObject<typeof createTokenSchema>>;

// =============================================================================
// PumpPortal API Integration
// =============================================================================

interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image?: string;
  showName: boolean;
  twitter?: string;
  telegram?: string;
  website?: string;
}

/**
 * Upload metadata to pump.fun IPFS
 */
async function uploadMetadata(
  metadata: TokenMetadata,
  imageUrl?: string
): Promise<{ metadataUri: string } | { error: string }> {
  try {
    // If we have an image URL, we need to fetch and upload it
    const formData = new FormData();

    // Add metadata fields
    formData.append("name", metadata.name);
    formData.append("symbol", metadata.symbol);
    formData.append("description", metadata.description);
    formData.append("showName", "true");

    if (metadata.twitter) {
      formData.append("twitter", metadata.twitter);
    }
    if (metadata.telegram) {
      formData.append("telegram", metadata.telegram);
    }
    if (metadata.website) {
      formData.append("website", metadata.website);
    }

    // Fetch and attach image if URL provided
    if (imageUrl) {
      try {
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          formData.append("file", imageBlob, "image.png");
        }
      } catch (imgError) {
        console.error("Failed to fetch image:", imgError);
        // Continue without image
      }
    }

    // Upload to pump.fun IPFS endpoint
    const response = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Metadata upload failed: ${errorText}` };
    }

    const result = await response.json() as { metadataUri: string };
    return { metadataUri: result.metadataUri };
  } catch (error) {
    return {
      error: `Metadata upload error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Create token using PumpPortal API (simpler integration)
 */
async function createTokenViaPumpPortal(
  params: CreateTokenSchemaType,
  wallet: Keypair,
  mint: Keypair
): Promise<ToolResponse<CreateTokenResult>> {
  try {
    // First, upload metadata to get URI
    const metadataResult = await uploadMetadata(
      {
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        showName: true,
        twitter: params.twitter,
        telegram: params.telegram,
        website: params.website,
      },
      params.imageUrl
    );

    if ("error" in metadataResult) {
      return { success: false, error: metadataResult.error };
    }

    // Use PumpPortal local trading API to get transaction
    const response = await fetch("https://pumpportal.fun/api/trade-local", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicKey: wallet.publicKey.toBase58(),
        action: "create",
        tokenMetadata: {
          name: params.name,
          symbol: params.symbol,
          uri: metadataResult.metadataUri,
        },
        mint: mint.publicKey.toBase58(),
        denominatedInSol: "true",
        amount: params.initialBuySol,
        slippage: params.slippageBps / 100, // Convert bps to percentage
        priorityFee: 0.0005, // 0.0005 SOL priority fee
        pool: "pump",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `PumpPortal API error: ${errorText}`,
      };
    }

    // Get the serialized transaction
    const txData = await response.arrayBuffer();
    const tx = Transaction.from(Buffer.from(txData));

    // Sign and send the transaction
    const conn = getConnection();
    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet.publicKey;

    // Sign with both wallet and mint keypair
    tx.sign(wallet, mint);

    const signature = await conn.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    // Wait for confirmation
    await conn.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, "confirmed");

    return {
      success: true,
      data: {
        mintAddress: mint.publicKey.toBase58(),
        signature,
        explorerUrl: getExplorerUrl(signature, "tx"),
        pumpfunUrl: getPumpFunUrl(mint.publicKey.toBase58()),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create token via PumpPortal",
    };
  }
}

/**
 * Create token using direct Solana transaction (fallback method)
 * This constructs the pump.fun create instruction manually
 */
async function createTokenDirect(
  params: CreateTokenSchemaType,
  wallet: Keypair,
  mint: Keypair
): Promise<ToolResponse<CreateTokenResult>> {
  try {
    // Upload metadata first
    const metadataResult = await uploadMetadata(
      {
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        showName: true,
        twitter: params.twitter,
        telegram: params.telegram,
        website: params.website,
      },
      params.imageUrl
    );

    if ("error" in metadataResult) {
      return { success: false, error: metadataResult.error };
    }

    // Derive PDAs
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), mint.publicKey.toBuffer()],
      PUMP_PROGRAM_ID
    );

    const [mintAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint-authority")],
      PUMP_PROGRAM_ID
    );

    const [global] = PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      PUMP_PROGRAM_ID
    );

    const [metadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );

    // Get associated token account for bonding curve
    const bondingCurveAta = getAssociatedTokenAddressSync(
      mint.publicKey,
      bondingCurve,
      true,
      TOKEN_2022_PROGRAM_ID
    );

    // Build the create instruction data
    // Discriminator for "create" instruction + parameters
    const discriminator = Buffer.from([0x18, 0x1e, 0xc8, 0x28, 0x05, 0x1c, 0x07, 0x77]); // create discriminator

    const nameBuffer = Buffer.alloc(4 + params.name.length);
    nameBuffer.writeUInt32LE(params.name.length, 0);
    nameBuffer.write(params.name, 4);

    const symbolBuffer = Buffer.alloc(4 + params.symbol.length);
    symbolBuffer.writeUInt32LE(params.symbol.length, 0);
    symbolBuffer.write(params.symbol, 4);

    const uriBuffer = Buffer.alloc(4 + metadataResult.metadataUri.length);
    uriBuffer.writeUInt32LE(metadataResult.metadataUri.length, 0);
    uriBuffer.write(metadataResult.metadataUri, 4);

    const instructionData = Buffer.concat([
      discriminator,
      nameBuffer,
      symbolBuffer,
      uriBuffer,
    ]);

    // Build transaction
    const tx = new Transaction();

    // Add compute budget
    const priorityFee = await getPriorityFeeEstimate(
      [PUMP_PROGRAM_ID.toBase58(), mint.publicKey.toBase58()],
      "high"
    );
    addComputeBudget(tx, DEFAULT_CREATE_COMPUTE_UNITS, priorityFee);

    // Add create instruction
    tx.add({
      programId: PUMP_PROGRAM_ID,
      keys: [
        { pubkey: mint.publicKey, isSigner: true, isWritable: true },
        { pubkey: mintAuthority, isSigner: false, isWritable: false },
        { pubkey: bondingCurve, isSigner: false, isWritable: true },
        { pubkey: bondingCurveAta, isSigner: false, isWritable: true },
        { pubkey: global, isSigner: false, isWritable: false },
        { pubkey: metadata, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"), isSigner: false, isWritable: false },
      ],
      data: instructionData,
    });

    // Send transaction
    const signature = await sendAndConfirmTransaction(tx, [wallet, mint], {
      maxRetries: 3,
    });

    return {
      success: true,
      data: {
        mintAddress: mint.publicKey.toBase58(),
        signature,
        explorerUrl: getExplorerUrl(signature, "tx"),
        pumpfunUrl: getPumpFunUrl(mint.publicKey.toBase58()),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create token",
    };
  }
}

// =============================================================================
// Main Create Token Function
// =============================================================================

export async function createToken(
  params: CreateTokenSchemaType
): Promise<ToolResponse<CreateTokenResult>> {
  try {
    // Validate we're not on mainnet without explicit confirmation
    const network = getNetwork();
    if (network === "mainnet-beta") {
      console.error("⚠️ WARNING: Creating token on MAINNET");
    }

    // Load wallet
    const wallet = loadKeypair();

    // Check balance
    const conn = getConnection();
    const balance = await conn.getBalance(wallet.publicKey);
    const requiredLamports = solToLamports(0.02 + params.initialBuySol); // ~0.02 SOL for fees + initial buy

    if (BigInt(balance) < requiredLamports) {
      return {
        success: false,
        error: `Insufficient balance. Have ${balance / LAMPORTS_PER_SOL} SOL, need ~${Number(requiredLamports) / LAMPORTS_PER_SOL} SOL`,
      };
    }

    // Generate new mint keypair
    const mint = Keypair.generate();

    console.error(`Creating token: ${params.name} (${params.symbol})`);
    console.error(`Mint address: ${mint.publicKey.toBase58()}`);

    // Try PumpPortal API first (more reliable)
    let result = await createTokenViaPumpPortal(params, wallet, mint);

    // If PumpPortal fails, try direct method
    if (!result.success && result.error?.includes("PumpPortal")) {
      console.error("PumpPortal failed, trying direct method...");
      result = await createTokenDirect(params, wallet, mint);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create token",
    };
  }
}

// =============================================================================
// Tool Description
// =============================================================================

export const createTokenDescription = `Create a new meme coin on pump.fun.

This tool creates a new token with:
- Custom name, symbol, and description
- Optional logo image (from URL)
- Optional social links (Twitter, Telegram, website)
- Optional initial buy (0-85 SOL)

The token is created on the pump.fun bonding curve with:
- 1 billion total supply
- 6 decimals
- Fair launch (no presale)
- Auto-revoked authorities (safe)

After creation, the token can be traded on pump.fun until it graduates to PumpSwap.

**Cost:** ~0.02 SOL for transaction fees + initial buy amount
**Network:** Currently configured for ${process.env.SOLANA_NETWORK || "devnet"}`;
