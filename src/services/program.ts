/**
 * Anchor Program Service
 * Sets up the auto.fun Anchor program client and provides PDA helpers.
 * Seeds verified from IDL byte arrays (all lowercase).
 */

import { Program, AnchorProvider, Wallet, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { AUTOFUN_PROGRAM_ID } from "../config/constants.js";

// Resolve IDL path relative to this file (works in both src/ and dist/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const idlPath = join(__dirname, "..", "..", "idl", "autofun.json");
const idl = JSON.parse(readFileSync(idlPath, "utf-8"));

/**
 * Create an Anchor Program client for auto.fun
 */
export function getProgram(connection: Connection, wallet: Keypair): Program {
  const provider = new AnchorProvider(
    connection,
    new Wallet(wallet),
    { skipPreflight: false, commitment: "confirmed" }
  );
  return new Program(idl as Idl, provider);
}

// =============================================================================
// PDA Helpers — seeds verified from IDL byte arrays
// =============================================================================

/**
 * Derive the global Config PDA
 * Seeds: ["config"] → [99,111,110,102,105,103]
 */
export function getConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    AUTOFUN_PROGRAM_ID
  );
  return pda;
}

/**
 * Derive the global vault PDA (holds SOL reserves)
 * Seeds: ["global"] → [103,108,111,98,97,108]
 */
export function getGlobalVaultPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("global")],
    AUTOFUN_PROGRAM_ID
  );
  return pda;
}

/**
 * Derive a token's bonding curve PDA
 * Seeds: ["bonding_curve", tokenMint.toBytes()]
 */
export function getBondingCurvePda(tokenMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding_curve"), tokenMint.toBuffer()],
    AUTOFUN_PROGRAM_ID
  );
  return pda;
}
