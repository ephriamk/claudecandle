#!/usr/bin/env npx tsx
/**
 * CLI: Generate a new Solana wallet keypair for ClaudeCandle
 * Usage: npx tsx scripts/setup.ts
 * Outputs JSON with publicKey and privateKey to stdout.
 */
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const keypair = Keypair.generate();
const privateKey = bs58.encode(keypair.secretKey);
const publicKey = keypair.publicKey.toBase58();

console.log(JSON.stringify({
  success: true,
  publicKey,
  privateKey,
}));

console.error("");
console.error("Wallet generated!");
console.error(`  Public Key: ${publicKey}`);
console.error("");
console.error("Add to your .env file:");
console.error(`  HELIUS_RPC_URL=https://api.mainnet-beta.solana.com`);
console.error(`  WALLET_PRIVATE_KEY=${privateKey}`);
console.error(`  SOLANA_NETWORK=mainnet-beta`);
console.error("");
console.error("WARNING: auto.fun is mainnet-only. Fund this wallet with real SOL before launching or trading tokens.");
