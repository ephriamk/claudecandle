#!/usr/bin/env npx tsx
/**
 * CLI: Launch token on Pump.fun bonding curve
 *
 * Usage:
 *   npx tsx scripts/pumpfun-launch.ts '{"name":"Moon Dog","symbol":"MOON"}'
 *   npx tsx scripts/pumpfun-launch.ts '{"name":"Moon Dog","symbol":"MOON","initialBuySol":0.5,"description":"The moonest dog"}'
 */

import "dotenv/config";
import { launchOnPumpfun } from "../src/core/pumpfun-launch.js";

const args = JSON.parse(process.argv[2] || "{}");
const result = await launchOnPumpfun(args);
console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);
