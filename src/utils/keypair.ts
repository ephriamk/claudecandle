import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import * as fs from "fs";
import * as path from "path";

/**
 * Securely load a keypair from various sources
 */

/**
 * Load keypair from environment variable (base58 encoded)
 */
export function loadKeypairFromEnv(envVar: string = "WALLET_PRIVATE_KEY"): Keypair {
  const privateKey = process.env[envVar];

  if (!privateKey) {
    throw new Error(
      `Environment variable ${envVar} is not set. ` +
      `Please set it to your base58-encoded private key.`
    );
  }

  try {
    const decoded = bs58.decode(privateKey);
    return Keypair.fromSecretKey(decoded);
  } catch (error) {
    throw new Error(
      `Failed to decode private key from ${envVar}. ` +
      `Ensure it's a valid base58-encoded Solana private key.`
    );
  }
}

/**
 * Load keypair from a JSON file (Solana CLI format)
 */
export function loadKeypairFromFile(filePath: string): Keypair {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Keypair file not found: ${absolutePath}`);
  }

  try {
    const fileContent = fs.readFileSync(absolutePath, "utf-8");
    const secretKey = JSON.parse(fileContent);

    if (!Array.isArray(secretKey)) {
      throw new Error("Invalid keypair file format");
    }

    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in keypair file: ${absolutePath}`);
    }
    throw error;
  }
}

/**
 * Load keypair with fallback strategy:
 * 1. Try environment variable
 * 2. Try default key file path
 */
export function loadKeypair(): Keypair {
  // First, try environment variable
  const envKey = process.env.WALLET_PRIVATE_KEY;
  if (envKey) {
    return loadKeypairFromEnv();
  }

  // Try default key file locations
  const defaultPaths = [
    "./.keys/wallet.json",
    "./wallet.json",
    path.join(process.env.HOME || "", ".config/solana/id.json"),
  ];

  for (const keyPath of defaultPaths) {
    try {
      if (fs.existsSync(keyPath)) {
        return loadKeypairFromFile(keyPath);
      }
    } catch {
      // Continue to next path
    }
  }

  throw new Error(
    "No wallet configured. Set WALLET_PRIVATE_KEY environment variable " +
    "or place a wallet.json file in .keys/ directory."
  );
}

/**
 * Generate a new keypair (for testing)
 */
export function generateKeypair(): Keypair {
  return Keypair.generate();
}

/**
 * Get the base58-encoded public key
 */
export function getPublicKeyString(keypair: Keypair): string {
  return keypair.publicKey.toBase58();
}

/**
 * Get the base58-encoded private key (use with caution!)
 */
export function getPrivateKeyString(keypair: Keypair): string {
  return bs58.encode(keypair.secretKey);
}

/**
 * Validate a base58 Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Solana addresses are 32-44 characters
    if (address.length < 32 || address.length > 44) {
      return false;
    }
    // Try to decode as base58
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
}
