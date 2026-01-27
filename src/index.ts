#!/usr/bin/env node

/**
 * ClaudeCandle - MCP Server for Bags.fm
 *
 * An MCP server that enables Claude to create and trade tokens on Bags.fm
 * through natural language conversations.
 *
 * Tools:
 * - create-token: Launch new tokens on Bags.fm
 * - buy-token: Buy tokens via Bags.fm trading
 * - sell-token: Sell tokens via Bags.fm trading
 * - get-balance: Check wallet balances
 * - get-token-info: Get token metadata
 * - get-bonding-curve: Check curve status
 * - server-status: Health check
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

import {
  createToken,
  createTokenSchema,
  createTokenDescription,
} from "./tools/createToken.js";

import {
  buyToken,
  buyTokenSchema,
  buyTokenDescription,
  sellToken,
  sellTokenSchema,
  sellTokenDescription,
} from "./tools/tradeToken.js";

// Import services
import {
  getConnection,
  getNetwork,
  isMainnet,
  getExplorerUrl,
  getSolBalance,
} from "./services/solana.js";
import { getBagsFmUrl, isSDKConfigured } from "./services/bags.js";
import { loadKeypair, getPublicKeyString } from "./utils/keypair.js";

// =============================================================================
// Server Setup
// =============================================================================

const server = new McpServer({
  name: "claudecandle",
  version: "1.0.0",
});

// =============================================================================
// Tool: create-token
// =============================================================================

server.tool(
  "create-token",
  createTokenDescription,
  createTokenSchema,
  async (params) => {
    const result = await createToken(params);

    if (!result.success) {
      return {
        content: [{
          type: "text" as const,
          text: `**Token Creation Failed**\n\nError: ${result.error}`,
        }],
      };
    }

    const data = result.data!;
    let text = `**Token Created Successfully!**\n\n`;
    text += `**Name:** ${params.name}\n`;
    text += `**Symbol:** ${params.symbol}\n`;
    text += `**Mint Address:** \`${data.mintAddress}\`\n\n`;
    text += `**Links:**\n`;
    text += `- [View on Bags.fm](${data.bagsfmUrl})\n`;
    text += `- [View Transaction](${data.explorerUrl})\n`;

    if (params.initialBuySol && params.initialBuySol > 0) {
      text += `\n**Initial Buy:** ${params.initialBuySol} SOL`;
      if (data.tokensReceived) {
        text += ` -> ${data.tokensReceived} tokens`;
      }
    }

    text += `\n\nShare this link to let others trade your token!`;
    text += `\nCreators earn 1% of all trading volume forever.`;

    return {
      content: [{
        type: "text" as const,
        text,
      }],
    };
  }
);

// =============================================================================
// Tool: buy-token
// =============================================================================

server.tool(
  "buy-token",
  buyTokenDescription,
  buyTokenSchema,
  async (params) => {
    const result = await buyToken(params);

    if (!result.success) {
      return {
        content: [{
          type: "text" as const,
          text: `**Buy Failed**\n\nError: ${result.error}`,
        }],
      };
    }

    const data = result.data!;
    const explorerUrl = getExplorerUrl(data.signature, "tx");
    const bagsfmUrl = getBagsFmUrl(params.mintAddress);

    let text = `**Buy Successful!**\n\n`;
    text += `**Spent:** ${params.solAmount} SOL\n`;
    text += `**Received:** ${data.tokensReceived} tokens\n\n`;
    text += `**Links:**\n`;
    text += `- [View Transaction](${explorerUrl})\n`;
    text += `- [View Token](${bagsfmUrl})\n`;

    return {
      content: [{
        type: "text" as const,
        text,
      }],
    };
  }
);

// =============================================================================
// Tool: sell-token
// =============================================================================

server.tool(
  "sell-token",
  sellTokenDescription,
  sellTokenSchema,
  async (params) => {
    const result = await sellToken(params);

    if (!result.success) {
      return {
        content: [{
          type: "text" as const,
          text: `**Sell Failed**\n\nError: ${result.error}`,
        }],
      };
    }

    const data = result.data!;
    const explorerUrl = getExplorerUrl(data.signature, "tx");

    let text = `**Sell Successful!**\n\n`;
    text += `**Sold:** ${data.tokensSold} tokens\n`;
    text += `**Received:** ${data.solReceived}\n\n`;
    text += `**Links:**\n`;
    text += `- [View Transaction](${explorerUrl})\n`;

    return {
      content: [{
        type: "text" as const,
        text,
      }],
    };
  }
);

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
          text: `**Error:** ${result.error}`,
        }],
      };
    }

    const data = result.data!;
    let text = `**Wallet Balance**\n\n`;
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
          text: `**Error:** ${result.error}`,
        }],
      };
    }

    const data = result.data!;
    const bagsfmUrl = getBagsFmUrl(data.mint);
    const explorerUrl = getExplorerUrl(data.mint, "address");

    let text = `**Token Info**\n\n`;
    text += `**Name:** ${data.name}\n`;
    text += `**Symbol:** ${data.symbol}\n`;
    text += `**Mint:** \`${data.mint}\`\n`;
    text += `**Creator:** \`${data.creator}\`\n`;
    text += `**Total Supply:** ${data.totalSupply}\n`;
    text += `**Decimals:** ${data.decimals}\n\n`;

    text += `**Market:**\n`;
    text += `- Progress: ${data.bondingCurveProgress.toFixed(2)}%\n`;
    text += `- Price: ${data.priceInSol} SOL\n`;
    text += `- Market Cap: ${data.marketCap} SOL\n`;
    text += `- Graduated: ${data.isGraduated ? "Yes" : "No"}\n\n`;

    text += `**Links:**\n`;
    text += `- [Bags.fm](${bagsfmUrl})\n`;
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
          text: `**Error:** ${result.error}`,
        }],
      };
    }

    const data = result.data!;

    let text = `**Bonding Curve Status**\n\n`;
    text += `**Token:** \`${data.mint}\`\n`;
    text += `**Curve Address:** \`${data.curveAddress}\`\n`;
    if (data.creator) {
      text += `**Creator:** \`${data.creator}\`\n`;
    }
    text += `\n`;

    text += `**Progress:** ${data.progress.toFixed(2)}% ${data.isComplete ? "(GRADUATED)" : ""}\n`;
    text += `**Current Price:** ${data.currentPrice} SOL per token\n`;
    text += `**Market Cap:** ${data.marketCap} SOL\n`;

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
  "Check ClaudeCandle server status, Bags.fm API configuration, and available tools",
  {},
  async () => {
    const network = getNetwork();
    const isMain = isMainnet();
    const apiConfigured = isSDKConfigured();

    let walletStatus = "Not configured";
    let walletAddress = "N/A";
    let solBalance = "N/A";

    try {
      const wallet = loadKeypair();
      walletAddress = getPublicKeyString(wallet);
      walletStatus = "Configured";

      try {
        const balance = await getSolBalance(wallet.publicKey);
        solBalance = `${balance.toFixed(4)} SOL`;
      } catch {
        solBalance = "Error fetching";
      }
    } catch (error) {
      walletStatus = `Error: ${error instanceof Error ? error.message : "Unknown"}`;
    }

    let rpcStatus = "Unknown";
    try {
      const conn = getConnection();
      const slot = await conn.getSlot();
      rpcStatus = `Connected (slot: ${slot})`;
    } catch (error) {
      rpcStatus = `Error: ${error instanceof Error ? error.message : "Unknown"}`;
    }

    let text = `**ClaudeCandle Server Status**\n\n`;
    text += `**Version:** 1.0.0\n`;
    text += `**Platform:** Bags.fm\n`;
    text += `**Network:** ${network} ${isMain ? "(MAINNET)" : "(devnet)"}\n`;
    text += `**Bags API:** ${apiConfigured ? "Configured" : "NOT CONFIGURED - Set BAGS_API_KEY"}\n`;
    text += `**RPC:** ${rpcStatus}\n`;
    text += `**Wallet:** ${walletStatus}\n`;

    if (walletAddress !== "N/A") {
      text += `**Address:** \`${walletAddress}\`\n`;
      text += `**Balance:** ${solBalance}\n`;
    }

    text += `\n**Available Tools:**\n`;
    text += `- \`create-token\` - Create new tokens on Bags.fm\n`;
    text += `- \`buy-token\` - Buy tokens via Bags.fm\n`;
    text += `- \`sell-token\` - Sell tokens via Bags.fm\n`;
    text += `- \`get-balance\` - Check wallet balances\n`;
    text += `- \`get-token-info\` - Get token information\n`;
    text += `- \`get-bonding-curve\` - Check curve status\n`;
    text += `- \`server-status\` - This status check\n`;

    if (!apiConfigured) {
      text += `\n**Setup Required:** Get your API key from https://dev.bags.fm`;
    }

    if (isMain) {
      text += `\n**Warning:** You are connected to MAINNET. Real funds will be used!`;
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
// Start Server
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();

  console.error("ClaudeCandle MCP Server starting...");
  console.error(`   Platform: Bags.fm`);
  console.error(`   Network: ${getNetwork()}`);
  console.error(`   Bags API: ${isSDKConfigured() ? "Configured" : "NOT CONFIGURED"}`);

  try {
    const wallet = loadKeypair();
    const balance = await getSolBalance(wallet.publicKey);
    console.error(`   Wallet: ${getPublicKeyString(wallet)}`);
    console.error(`   Balance: ${balance.toFixed(4)} SOL`);
  } catch {
    console.error("   Wallet: Not configured (set WALLET_PRIVATE_KEY)");
  }

  await server.connect(transport);
  console.error("ClaudeCandle MCP Server running!");
  console.error("   Tools: create-token, buy-token, sell-token, get-balance, get-token-info, get-bonding-curve, server-status");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
