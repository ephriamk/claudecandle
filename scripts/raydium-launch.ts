#!/usr/bin/env npx tsx
/**
 * CLI: Launch a token with Raydium CPMM pool (immediately tradeable on Jupiter)
 * Usage: npx tsx scripts/raydium-launch.ts '{"name":"Moon Dog","symbol":"MOON","liquiditySol":5}'
 *
 * Required: name, symbol, liquiditySol
 * Optional: description, imageUrl, uri, decimals, totalSupply, liquidityPercent
 */
import "dotenv/config";
import { launchOnRaydium } from "../src/core/raydium-launch.js";

const args = JSON.parse(process.argv[2] || "{}");
const result = await launchOnRaydium(args);
console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);
