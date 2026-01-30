#!/usr/bin/env npx tsx
/**
 * CLI: Launch token on Meteora Dynamic Bonding Curve
 *
 * Usage:
 *   npx tsx scripts/meteora-launch.ts '{"name":"Moon Dog","symbol":"MOON"}'
 *   npx tsx scripts/meteora-launch.ts '{"name":"Moon Dog","symbol":"MOON","initialBuySol":0.5}'
 */

import "dotenv/config";
import { launchOnMeteora } from "../src/core/meteora-launch.js";

const args = JSON.parse(process.argv[2] || "{}");
const result = await launchOnMeteora(args);
console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);
