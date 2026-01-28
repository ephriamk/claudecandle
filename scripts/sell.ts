#!/usr/bin/env npx tsx
/**
 * CLI: Sell tokens back to an auto.fun bonding curve
 * Usage: npx tsx scripts/sell.ts '{"mintAddress":"...","percentage":100}'
 */
import "dotenv/config";
import { sellToken } from "../src/core/trade.js";

const args = JSON.parse(process.argv[2] || "{}");

async function main() {
  if (!args.mintAddress) {
    console.log(JSON.stringify({
      success: false,
      error: "Required: mintAddress. Provide tokenAmount OR percentage (1-100). Optional: slippageBps",
    }));
    process.exit(1);
  }

  if (!args.tokenAmount && !args.percentage) {
    console.log(JSON.stringify({
      success: false,
      error: "Provide either tokenAmount or percentage (1-100)",
    }));
    process.exit(1);
  }

  const result = await sellToken(args);
  console.log(JSON.stringify(result.success ? { success: true, ...result.data } : result));
  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.log(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
