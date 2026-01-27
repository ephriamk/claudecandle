#!/usr/bin/env node

/**
 * ClaudeCandle - MCP Meme Coin Launchpad
 *
 * An MCP server that enables Claude to create and trade meme coins on Solana
 * through natural language conversations.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import tools
import {
  getBalance,
  getBalanceSchema,
  getBalanceDescription,
} from "./tools/getBalance.js";

import {
  getTokenInfo,
  getTokenInfoSchema,
  getTokenInfoDescription,
  getBondingCurve,
  getBondingCurveSchema,
  getBondingCurveDescription,
} from "./tools/getTokenInfo.js";

// Import services
import { getConnection, getNetwork, isMainnet, getExplorerUrl, getPumpFunUrl } from "./services/solana.js";
import { loadKeypair, getPublicKeyString } from "./utils/keypair.js";

// =============================================================================
// Server Setup
// =============================================================================

const server = new McpServer({
  name: "claudecandle",
  version: "1.0.0",
});

// =============================================================================
// Tool: get-balance
// =============================================================================

server.tool(
  "get-balance",
  getBalanceDescription,
  getBalanceSchema,
  async (params) => {
    const result = await getBalance(params);

    if (!result.success) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, error: result.error }, null, 2),
        }],
      };
    }

    const data = result.data!;
    let text = `💰 **Wallet Balance**\n\n`;
    text += `**Address:** \`${data.address}\`\n`;
    text += `**SOL Balance:** ${data.solBalance} SOL\n\n`;

    if (data.tokens.length > 0) {
      text += `**Token Holdings:**\n`;
      for (const token of data.tokens) {
        text += `- ${token.balance} (mint: \`${token.mint.slice(0, 8)}...\`)\n`;
      }
    } else {
      text += `No token holdings found.\n`;
    }

    return {
      content: [{
        type: "text" as const,
        text,
      }],
    };
  }
);

// =============================================================================
// Tool: get-token-info
// =============================================================================

server.tool(
  "get-token-info",
  getTokenInfoDescription,
  getTokenInfoSchema,
  async (params) => {
    const result = await getTokenInfo(params);

    if (!result.success) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, error: result.error }, null, 2),
        }],
      };
    }

    const data = result.data!;
    const pumpUrl = getPumpFunUrl(data.mint);
    const explorerUrl = getExplorerUrl(data.mint, "address");

    let text = `🪙 **Token Info**\n\n`;
    text += `**Mint:** \`${data.mint}\`\n`;
    text += `**Creator:** \`${data.creator}\`\n`;
    text += `**Total Supply:** ${data.totalSupply}\n`;
    text += `**Decimals:** ${data.decimals}\n\n`;

    text += `**Bonding Curve:**\n`;
    text += `- Progress: ${data.bondingCurveProgress.toFixed(2)}%\n`;
    text += `- Price: ${data.priceInSol} SOL\n`;
    text += `- Market Cap: ${data.marketCap} SOL\n`;
    text += `- Graduated: ${data.isGraduated ? "Yes ✅" : "No"}\n\n`;

    text += `**Links:**\n`;
    text += `- [Pump.fun](${pumpUrl})\n`;
    text += `- [Explorer](${explorerUrl})\n`;

    return {
      content: [{
        type: "text" as const,
        text,
      }],
    };
  }
);

// =============================================================================
// Tool: get-bonding-curve
// =============================================================================

server.tool(
  "get-bonding-curve",
  getBondingCurveDescription,
  getBondingCurveSchema,
  async (params) => {
    const result = await getBondingCurve(params);

    if (!result.success) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, error: result.error }, null, 2),
        }],
      };
    }

    const data = result.data!;

    let text = `📈 **Bonding Curve Status**\n\n`;
    text += `**Token:** \`${data.mint}\`\n`;
    text += `**Curve Address:** \`${data.bondingCurveAddress}\`\n`;
    text += `**Creator:** \`${data.creator}\`\n\n`;

    text += `**Progress:** ${data.progress.toFixed(2)}% ${data.complete ? "✅ GRADUATED" : ""}\n`;
    text += `**Current Price:** ${data.currentPrice} SOL per token\n`;
    text += `**Market Cap:** ${data.marketCap} SOL\n\n`;

    if (!data.complete) {
      text += `**To Graduate:**\n`;
      text += `- SOL Needed: ~${data.solToGraduation} SOL\n`;
      text += `- Tokens Remaining: ${data.tokensRemaining}\n`;
    }

    text += `\n**Reserves:**\n`;
    text += `- Virtual Token: ${data.virtualTokenReserves}\n`;
    text += `- Virtual SOL: ${data.virtualSolReserves}\n`;
    text += `- Real Token: ${data.realTokenReserves}\n`;
    text += `- Real SOL: ${data.realSolReserves}\n`;

    return {
      content: [{
        type: "text" as const,
        text,
      }],
    };
  }
);

// =============================================================================
// Tool: server-status (health check)
// =============================================================================

server.tool(
  "server-status",
  "Check ClaudeCandle server status and configuration",
  {},
  async () => {
    const network = getNetwork();
    const isMain = isMainnet();

    let walletStatus = "Not configured";
    let walletAddress = "N/A";

    try {
      const wallet = loadKeypair();
      walletAddress = getPublicKeyString(wallet);
      walletStatus = "Configured ✅";
    } catch (error) {
      walletStatus = `Error: ${error instanceof Error ? error.message : "Unknown"}`;
    }

    let rpcStatus = "Unknown";
    try {
      const conn = getConnection();
      const slot = await conn.getSlot();
      rpcStatus = `Connected (slot: ${slot}) ✅`;
    } catch (error) {
      rpcStatus = `Error: ${error instanceof Error ? error.message : "Unknown"}`;
    }

    let text = `🕯️ **ClaudeCandle Server Status**\n\n`;
    text += `**Version:** 1.0.0\n`;
    text += `**Network:** ${network} ${isMain ? "⚠️ MAINNET" : "(devnet)"}\n`;
    text += `**RPC:** ${rpcStatus}\n`;
    text += `**Wallet:** ${walletStatus}\n`;

    if (walletAddress !== "N/A") {
      text += `**Address:** \`${walletAddress}\`\n`;
    }

    text += `\n**Available Tools:**\n`;
    text += `- \`get-balance\` - Check wallet balances\n`;
    text += `- \`get-token-info\` - Get token information\n`;
    text += `- \`get-bonding-curve\` - Check bonding curve status\n`;
    text += `- \`server-status\` - This status check\n`;

    text += `\n**Coming Soon:**\n`;
    text += `- \`create-token\` - Create new tokens on pump.fun\n`;
    text += `- \`buy-token\` - Buy tokens from bonding curve\n`;
    text += `- \`sell-token\` - Sell tokens to bonding curve\n`;

    return {
      content: [{
        type: "text" as const,
        text,
      }],
    };
  }
);

// =============================================================================
// Start Server
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();

  console.error("🕯️ ClaudeCandle MCP Server starting...");
  console.error(`   Network: ${getNetwork()}`);

  try {
    const wallet = loadKeypair();
    console.error(`   Wallet: ${getPublicKeyString(wallet)}`);
  } catch {
    console.error("   Wallet: Not configured (set WALLET_PRIVATE_KEY)");
  }

  await server.connect(transport);
  console.error("🕯️ ClaudeCandle MCP Server running!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
