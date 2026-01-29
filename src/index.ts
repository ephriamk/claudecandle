#!/usr/bin/env node

/**
 * ClaudeCandle - MCP Server for auto.fun
 *
 * An MCP server that enables Claude to create and trade tokens on auto.fun's
 * bonding curve contracts through natural language conversations.
 *
 * Tools:
 * - launch-token-raydium: Launch token with Raydium CPMM pool (Jupiter-tradeable)
 * - create-token: Launch new tokens on auto.fun
 * - buy-token: Buy tokens with SOL
 * - sell-token: Sell tokens for SOL
 * - get-balance: Check wallet balances
 * - get-token-info: Get bonding curve status and price
 * - server-status: Health check
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import core logic
import { launchToken } from "./core/launch.js";
import { launchOnRaydium } from "./core/raydium-launch.js";
import { buyToken, sellToken } from "./core/trade.js";
import { getCurveInfo } from "./core/info.js";
import { getBalance } from "./core/balance.js";

// Import services
import { getConnection, getNetwork, isMainnet, getSolBalance } from "./services/solana.js";
import { loadKeypair, getPublicKeyString } from "./utils/keypair.js";

// =============================================================================
// Server Setup
// =============================================================================

const server = new McpServer({
  name: "claudecandle",
  version: "2.0.0",
});

// =============================================================================
// Tool: launch-token-raydium
// =============================================================================

server.tool(
  "launch-token-raydium",
  "Launch a new token with a Raydium CPMM pool. Immediately tradeable on Jupiter. Recommended over auto.fun for visibility.",
  {
    name: z.string().describe("Token name (e.g. 'Moon Dog')"),
    symbol: z.string().describe("Token ticker symbol (e.g. 'MOON')"),
    liquiditySol: z.number().positive().describe("SOL to put in the liquidity pool"),
    description: z.string().optional().describe("Token description (uploaded to IPFS if PINATA_JWT set)"),
    imageUrl: z.string().optional().describe("Token image URL (included in metadata)"),
    uri: z.string().optional().describe("Metaplex metadata JSON URL (auto-generated if description/imageUrl provided)"),
    totalSupply: z.number().optional().describe("Total token supply (default: 1,000,000,000)"),
    liquidityPercent: z.number().min(1).max(100).optional().describe("% of supply to put in pool (default: 50%)"),
    decimals: z.number().optional().describe("Token decimals (default: 6)"),
  },
  async (params) => {
    const result = await launchOnRaydium(params);

    if (!result.success) {
      return {
        content: [{
          type: "text" as const,
          text: `**Raydium Launch Failed**\n\nError: ${result.error}`,
        }],
      };
    }

    const data = result.data!;
    let text = `**Token Launched on Raydium!**\n\n`;
    text += `**Name:** ${params.name}\n`;
    text += `**Symbol:** ${params.symbol.toUpperCase()}\n`;
    text += `**Mint Address:** \`${data.mintAddress}\`\n`;
    text += `**Pool ID:** \`${data.poolId}\`\n`;
    text += `**Liquidity:** ${params.liquiditySol} SOL\n\n`;
    text += `**Links:**\n`;
    text += `- [Trade on Jupiter](${data.jupiterUrl})\n`;
    text += `- [View Transaction](${data.explorerUrl})\n`;
    text += `\nThe token is now live and tradeable on Jupiter!`;

    return {
      content: [{
        type: "text" as const,
        text,
      }],
    };
  }
);

// =============================================================================
// Tool: create-token
// =============================================================================

server.tool(
  "create-token",
  "Create a new meme coin on auto.fun with a bonding curve. Tokens appear on https://auto.fun after launch.",
  {
    name: z.string().describe("Token name (e.g. 'Moon Dog')"),
    symbol: z.string().describe("Token ticker symbol (e.g. 'MOON')"),
    uri: z.string().optional().describe("Metaplex metadata JSON URL (name, symbol, description, image)"),
    description: z.string().optional().describe("Token description"),
    imageUrl: z.string().optional().describe("Token image URL"),
    decimals: z.number().optional().describe("Token decimals (default: 6)"),
    tokenSupply: z.number().optional().describe("Total token supply in raw units (default: 1B with 6 decimals)"),
    virtualReserves: z.number().optional().describe("Virtual SOL reserves in lamports (default: 0.1 SOL)"),
    initialBuySol: z.number().optional().describe("SOL to spend on initial buy (atomic with launch)"),
    slippageBps: z.number().optional().describe("Slippage tolerance in basis points (default: 500 = 5%)"),
  },
  async (params) => {
    const result = await launchToken(params);

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
    text += `**Symbol:** ${params.symbol.toUpperCase()}\n`;
    text += `**Mint Address:** \`${data.mintAddress}\`\n`;
    text += `**Bonding Curve:** \`${data.bondingCurve}\`\n\n`;
    text += `**Links:**\n`;
    text += `- [View on auto.fun](${data.autofunUrl})\n`;
    text += `- [View Transaction](${data.explorerUrl})\n`;

    if (params.initialBuySol && params.initialBuySol > 0) {
      text += `\n**Initial Buy:** ${params.initialBuySol} SOL`;
    }

    text += `\n\nShare the auto.fun link to let others trade your token!`;

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
  "Buy tokens from an auto.fun bonding curve using SOL. Fails if curve has graduated to Raydium.",
  {
    mintAddress: z.string().describe("Token mint address"),
    solAmount: z.number().positive().describe("Amount of SOL to spend"),
    slippageBps: z.number().optional().describe("Slippage tolerance in basis points (default: 500 = 5%)"),
  },
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
    let text = `**Buy Successful!**\n\n`;
    text += `**Spent:** ${params.solAmount} SOL\n`;
    text += `**Estimated Tokens:** ${data.estimatedTokens}\n`;
    text += `**Min Tokens (with slippage):** ${data.minTokens}\n\n`;
    text += `**Links:**\n`;
    text += `- [View Transaction](${data.explorerUrl})\n`;

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
  "Sell tokens back to an auto.fun bonding curve for SOL. Use percentage (1-100) or exact tokenAmount.",
  {
    mintAddress: z.string().describe("Token mint address"),
    tokenAmount: z.number().optional().describe("Exact number of tokens to sell"),
    percentage: z.number().min(1).max(100).optional().describe("Percentage of holdings to sell (1-100)"),
    slippageBps: z.number().optional().describe("Slippage tolerance in basis points (default: 500 = 5%)"),
  },
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
    let text = `**Sell Successful!**\n\n`;
    text += `**Estimated SOL Received:** ${data.estimatedSolReceived}\n\n`;
    text += `**Links:**\n`;
    text += `- [View Transaction](${data.explorerUrl})\n`;

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
  "Check wallet SOL balance and all SPL token holdings. Optionally check any address.",
  {
    address: z.string().optional().describe("Solana address to check (defaults to configured wallet)"),
  },
  async (params) => {
    const result = await getBalance(params.address);

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
  "Get bonding curve status for an auto.fun token: price, reserves, progress to graduation, and more.",
  {
    mintAddress: z.string().describe("Token mint address"),
  },
  async (params) => {
    const result = await getCurveInfo(params.mintAddress);

    if (!result.success) {
      return {
        content: [{
          type: "text" as const,
          text: `**Error:** ${result.error}`,
        }],
      };
    }

    const data = result.data!;
    let text = `**Token Info**\n\n`;
    text += `**Mint:** \`${data.mintAddress}\`\n`;
    text += `**Creator:** \`${data.creator}\`\n`;
    text += `**Bonding Curve:** \`${data.bondingCurve}\`\n\n`;

    text += `**Market:**\n`;
    text += `- Price: ${data.priceInSol} SOL per token\n`;
    text += `- SOL Reserves: ${data.reserveSol} SOL\n`;
    text += `- Token Reserves: ${data.reserveTokens}\n`;
    text += `- Curve Limit: ${data.curveLimitSol} SOL\n`;
    text += `- Progress: ${data.progress}\n`;
    text += `- Graduated: ${data.isCompleted ? "Yes (trade on Raydium)" : "No (bonding curve active)"}\n\n`;

    text += `**Links:**\n`;
    text += `- [auto.fun](${data.autofunUrl})\n`;
    text += `- [Explorer](${data.explorerUrl})\n`;

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
  "Check ClaudeCandle server status, RPC connection, wallet, and available tools",
  {},
  async () => {
    const network = getNetwork();
    const isMain = isMainnet();

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
    text += `**Version:** 2.0.0\n`;
    text += `**Platform:** auto.fun (on-chain)\n`;
    text += `**Network:** ${network} ${isMain ? "(MAINNET)" : "(devnet)"}\n`;
    text += `**RPC:** ${rpcStatus}\n`;
    text += `**Wallet:** ${walletStatus}\n`;

    if (walletAddress !== "N/A") {
      text += `**Address:** \`${walletAddress}\`\n`;
      text += `**Balance:** ${solBalance}\n`;
    }

    text += `\n**Available Tools:**\n`;
    text += `- \`create-token\` - Launch new tokens on auto.fun\n`;
    text += `- \`buy-token\` - Buy tokens from bonding curve\n`;
    text += `- \`sell-token\` - Sell tokens back to bonding curve\n`;
    text += `- \`get-balance\` - Check wallet balances\n`;
    text += `- \`get-token-info\` - Get bonding curve status\n`;
    text += `- \`server-status\` - This status check\n`;

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
  console.error(`   Platform: Raydium + auto.fun (on-chain)`);
  console.error(`   Network: ${getNetwork()}`);

  try {
    const wallet = loadKeypair();
    console.error(`   Wallet: ${getPublicKeyString(wallet)}`);
    try {
      const balance = await getSolBalance(wallet.publicKey);
      console.error(`   Balance: ${balance.toFixed(4)} SOL`);
    } catch {
      console.error("   Balance: Unable to fetch (RPC unavailable)");
    }
  } catch {
    console.error("   Wallet: Not configured (set WALLET_PRIVATE_KEY)");
  }

  await server.connect(transport);
  console.error("ClaudeCandle MCP Server running!");
  console.error("   Tools: launch-token-raydium, create-token, buy-token, sell-token, get-balance, get-token-info, server-status");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
