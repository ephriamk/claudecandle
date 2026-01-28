#!/usr/bin/env npx tsx
/**
 * CLI: Launch a new token on auto.fun
 * Usage: npx tsx scripts/launch.ts '{"name":"Moon Dog","symbol":"MOON","uri":"https://..."}'
 */
import "dotenv/config";
import { launchToken } from "../src/core/launch.js";

const args = JSON.parse(process.argv[2] || "{}");

async function main() {
  if (!args.name || !args.symbol) {
    console.log(JSON.stringify({
      success: false,
      error: "Required: name, symbol. Optional: uri, initialBuySol, decimals, tokenSupply, virtualReserves",
    }));
    process.exit(1);
  }

  const result = await launchToken(args);
  console.log(JSON.stringify(result.success ? { success: true, ...result.data } : result));
  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.log(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
