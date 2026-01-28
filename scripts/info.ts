#!/usr/bin/env npx tsx
/**
 * CLI: Get bonding curve info for an auto.fun token
 * Usage: npx tsx scripts/info.ts '{"mintAddress":"..."}'
 */
import "dotenv/config";
import { getCurveInfo } from "../src/core/info.js";

const args = JSON.parse(process.argv[2] || "{}");

async function main() {
  if (!args.mintAddress) {
    console.log(JSON.stringify({
      success: false,
      error: "Required: mintAddress",
    }));
    process.exit(1);
  }

  const result = await getCurveInfo(args.mintAddress);
  console.log(JSON.stringify(result.success ? { success: true, ...result.data } : result));
  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.log(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
