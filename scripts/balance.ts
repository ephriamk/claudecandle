#!/usr/bin/env npx tsx
/**
 * CLI: Check wallet SOL and token balances
 * Usage: npx tsx scripts/balance.ts                          (own wallet)
 *        npx tsx scripts/balance.ts '{"address":"..."}'     (any address)
 */
import "dotenv/config";
import { getBalance } from "../src/core/balance.js";

const args = JSON.parse(process.argv[2] || "{}");

async function main() {
  const result = await getBalance(args.address);
  console.log(JSON.stringify(result.success ? { success: true, ...result.data } : result));
  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.log(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
