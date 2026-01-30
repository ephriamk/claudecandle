#!/usr/bin/env npx tsx
/**
 * CLI: Launch token on Raydium LaunchLab bonding curve
 *
 * Usage:
 *   npx tsx scripts/launchlab-launch.ts '{"name":"Moon Dog","symbol":"MOON"}'
 *   npx tsx scripts/launchlab-launch.ts '{"name":"Moon Dog","symbol":"MOON","initialBuySol":0.5,"migrateType":"cpmm"}'
 */

import "dotenv/config";
import { launchOnLaunchLab } from "../src/core/launchlab-launch.js";

const args = JSON.parse(process.argv[2] || "{}");
const result = await launchOnLaunchLab(args);
console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);
