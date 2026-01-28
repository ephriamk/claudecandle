#!/usr/bin/env npx tsx
/**
 * CLI: Buy tokens from an auto.fun bonding curve
 * Usage: npx tsx scripts/buy.ts '{"mintAddress":"...","solAmount":0.5}'
 */
import "dotenv/config";
import { buyToken } from "../src/core/trade.js";

const args = JSON.parse(process.argv[2] || "{}");

async function main() {
  if (!args.mintAddress || !args.solAmount) {
    console.log(JSON.stringify({
      success: false,
      error: "Required: mintAddress, solAmount. Optional: slippageBps",
    }));
    process.exit(1);
  }

  const result = await buyToken(args);
  console.log(JSON.stringify(result.success ? { success: true, ...result.data } : result));
  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.log(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
