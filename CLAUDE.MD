# ClaudeCandle - MCP Meme Coin Launchpad

> **The world's first AI-powered meme coin launchpad using Model Context Protocol (MCP)**

## Executive Summary

| Aspect | Details |
|--------|---------|
| **What** | MCP server enabling Claude to create & trade meme coins on Solana |
| **Platform** | Bags.fm integration (Meteora Dynamic Bonding Curves) |
| **Tech** | TypeScript, @bagsfm/bags-sdk, Token2022, Helius RPC |
| **Unique Value** | Conversational UX, AI-guided decisions, automated workflows |
| **Status** | Production ready |

### Quick Start

```
User: "Create a meme coin called MOONDOG with a rocket dog logo"

Claude: Creating MOONDOG token on Bags.fm...
        Token created!
        Mint: 7xKXtg...
        https://bags.fm/token/7xKXtg...
```

---

## Project Vision

ClaudeCandle is the world's first MCP (Model Context Protocol) skill-based meme coin launchpad on the Solana blockchain. Users can interact with Claude to create, configure, and launch meme coins through natural language conversations.

---

## Bags.fm Platform Overview

### What is Bags.fm?

Bags.fm is a modern token launchpad built on **Meteora Dynamic Bonding Curves** (DBC). It provides:

- Fair launch mechanics with bonding curves
- **1% creator fees** on all trading volume forever
- Professional liquidity management
- Automatic LP migration after graduation
- Simple, comprehensive API and SDK

### Program IDs

```typescript
// Meteora Dynamic Bonding Curve Program
const METEORA_DBC_PROGRAM_ID = "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN";

// Bags AMM Program
const BAGS_AMM_PROGRAM_ID = "cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG";

// Bags Lookup Table
const BAGS_LUT_ADDRESS = "Eq1EVs15EAWww1YtPTtWPzJRLPJoS6VYP9oW9SbNr3yp";
```

### Token Launch Flow

1. **Create Token Info & Metadata** - Upload metadata to IPFS via Bags API
2. **Initialize Bonding Curve** - Create the Meteora DBC for the token
3. **Trading Active** - Users can buy/sell on the bonding curve
4. **Graduation** - When target is reached, LP migrates to AMM
5. **Post-Graduation** - Trading continues on Meteora/Bags AMM

### Creator Benefits

| Benefit | Details |
|---------|---------|
| **Trading Fees** | 1% of all trading volume, forever |
| **Fee Share Config** | Distribute fees to multiple wallets |
| **No Upfront Cost** | Token creation is nearly free (~0.02 SOL) |
| **Automatic LP** | Liquidity handled by the protocol |

---

## Technical Specification

### Bags SDK Services

The `@bagsfm/bags-sdk` provides these services:

| Service | Purpose |
|---------|---------|
| `tokenLaunch` | Create tokens and metadata |
| `trade` | Get quotes and execute swaps |
| `state` | Query token/curve information |
| `config` | Manage fee share configurations |
| `fee` | Fee claiming operations |

### Token Creation API

```typescript
import { BagsSDK } from "@bagsfm/bags-sdk";

const sdk = new BagsSDK(apiKey, connection, "processed");

// Create token metadata
const result = await sdk.tokenLaunch.createTokenInfoAndMetadata({
  name: "My Token",
  symbol: "TOKEN",
  description: "A cool meme coin",
  imageUrl: "https://example.com/logo.png",
  twitter: "mytoken",
  telegram: "mytoken_group",
  website: "https://mytoken.com",
});

// Result contains:
// - tokenMint: string (the mint address)
// - tokenMetadata: string (metadata URI)
// - tokenLaunch: BagsLaunchPadTokenLaunch (launch details)
```

### Trading API

```typescript
// Get a quote
const quote = await sdk.trade.getQuote({
  inputMint: WSOL_MINT,           // What you're paying with
  outputMint: tokenMint,          // What you're buying
  amount: 100000000,              // Amount in smallest units (lamports)
  slippageMode: "manual",
  slippageBps: 500,               // 5% slippage
});

// Create swap transaction
const swapResult = await sdk.trade.createSwapTransaction({
  quoteResponse: quote,
  userPublicKey: wallet.publicKey,
});

// Sign and send
swapResult.transaction.sign([wallet]);
const signature = await connection.sendRawTransaction(
  swapResult.transaction.serialize()
);
```

### Quote Response Structure

```typescript
interface TradeQuoteResponse {
  contextSlot: number;
  inAmount: string;           // Input amount
  inputMint: string;
  outAmount: string;          // Expected output
  outputMint: string;
  minOutAmount: string;       // Minimum after slippage
  priceImpactPct: string;     // Price impact percentage
  slippageBps: number;
  routePlan: Array<{
    venue: string;
    inAmount: string;
    outAmount: string;
    // ... more fields
  }>;
}
```

---

## Architecture

```
                           USER (Claude Chat)
                                   |
                                   v
               +-------------------------------------------+
               |         MCP SERVER (ClaudeCandle)         |
               |  +-------------+  +-------------+         |
               |  |create-token |  |  buy-token  |         |
               |  +-------------+  +-------------+         |
               |  +-------------+  +-------------+         |
               |  | sell-token  |  |  get-info   |         |
               |  +-------------+  +-------------+         |
               +-------------------------------------------+
                                   |
                   +---------------+---------------+
                   v               v               v
           +-------------+  +-------------+  +-------------+
           | @bagsfm/    |  |   Helius    |  |   Solana    |
           |  bags-sdk   |  |   RPC API   |  |  Web3.js    |
           +-------------+  +-------------+  +-------------+
                   |               |               |
                   +---------------+---------------+
                                   v
               +-------------------------------------------+
               |            SOLANA BLOCKCHAIN              |
               |  +-------------+  +-------------+         |
               |  |   Meteora   |  |  Bags AMM   |         |
               |  |     DBC     |  |   Program   |         |
               |  +-------------+  +-------------+         |
               |  +-------------+  +-------------+         |
               |  |  Token2022  |  |    WSOL     |         |
               |  |   Program   |  |    Mint     |         |
               |  +-------------+  +-------------+         |
               +-------------------------------------------+
```

---

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `create-token` | Create token on Bags.fm | name, symbol, description, imageUrl |
| `buy-token` | Buy tokens with SOL | mintAddress, solAmount, slippageBps |
| `sell-token` | Sell tokens for SOL | mintAddress, tokenAmount/percentage |
| `get-token-info` | Get token metadata | mintAddress |
| `get-bonding-curve` | Get curve status | mintAddress |
| `get-balance` | Get wallet balances | address (optional) |

### create-token

```typescript
const createTokenSchema = {
  name: z.string()
    .min(1).max(32)
    .describe("Token name (e.g., 'My Awesome Token')"),

  symbol: z.string()
    .min(1).max(10)
    .describe("Token symbol/ticker (auto-uppercased)"),

  description: z.string()
    .max(500).default("")
    .describe("Token description"),

  imageUrl: z.string().url().optional()
    .describe("URL to token logo image"),

  twitter: z.string().optional()
    .describe("Twitter/X handle (without @)"),

  telegram: z.string().optional()
    .describe("Telegram group link or handle"),

  website: z.string().url().optional()
    .describe("Project website URL"),

  initialBuySol: z.number()
    .min(0).max(100).default(0)
    .describe("SOL to buy at launch"),

  slippageBps: z.number()
    .min(0).max(5000).default(500)
    .describe("Slippage tolerance (500 = 5%)"),
};
```

### buy-token

```typescript
const buyTokenSchema = {
  mintAddress: z.string()
    .min(32).max(44)
    .describe("Token mint address to buy"),

  solAmount: z.number()
    .positive().max(100)
    .describe("Amount of SOL to spend"),

  slippageBps: z.number()
    .min(0).max(5000).default(500)
    .describe("Slippage tolerance"),
};
```

### sell-token

```typescript
const sellTokenSchema = {
  mintAddress: z.string()
    .min(32).max(44)
    .describe("Token mint address to sell"),

  tokenAmount: z.number()
    .positive().optional()
    .describe("Exact amount to sell"),

  percentage: z.number()
    .min(1).max(100).optional()
    .describe("Percentage of holdings to sell"),

  slippageBps: z.number()
    .min(0).max(5000).default(500)
    .describe("Slippage tolerance"),
};
```

---

## Environment Configuration

### Required Variables

```env
# Bags.fm API Key (Required - get from dev.bags.fm)
BAGS_API_KEY=your_bags_api_key

# RPC (Required - use Helius for production)
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY

# Wallet (Required)
WALLET_PRIVATE_KEY=your_base58_encoded_private_key

# Network (Optional - defaults to mainnet)
SOLANA_NETWORK=mainnet-beta
```

### Getting a Bags API Key

1. Visit [dev.bags.fm](https://dev.bags.fm)
2. Create a developer account
3. Generate an API key
4. Add to your environment

### MCP Configuration (Claude Desktop)

**macOS/Linux**: `~/.config/claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "claudecandle": {
      "command": "node",
      "args": ["/absolute/path/to/claudecandle/dist/index.js"],
      "env": {
        "BAGS_API_KEY": "your_bags_api_key",
        "HELIUS_RPC_URL": "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY",
        "WALLET_PRIVATE_KEY": "your_base58_private_key"
      }
    }
  }
}
```

---

## Project Structure

```
claudecandle/
├── CLAUDE.MD                    # This documentation
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── config/
│   │   └── constants.ts         # Program IDs, constants
│   ├── tools/
│   │   ├── createToken.ts       # Token creation
│   │   ├── tradeToken.ts        # Buy/sell operations
│   │   ├── getTokenInfo.ts      # Token queries
│   │   └── getBalance.ts        # Balance queries
│   ├── services/
│   │   ├── bags.ts              # Bags SDK wrapper
│   │   └── solana.ts            # Solana connection
│   ├── utils/
│   │   └── keypair.ts           # Secure key loading
│   └── types/
│       └── index.ts             # TypeScript interfaces
└── dist/                        # Compiled JavaScript
```

---

## Security Best Practices

### Wallet & Key Management

**CRITICAL Rules:**
1. Never store private keys in code
2. Never log private keys
3. Never commit `.env` files
4. Use hardware wallets for mainnet funds

```typescript
// GOOD: Load from environment
const privateKey = process.env.WALLET_PRIVATE_KEY;
const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

// BAD: Hardcoded key
const keypair = Keypair.fromSecretKey(bs58.decode("abc123...")); // NEVER!
```

### Transaction Safety

1. Always simulate before sending
2. Use appropriate slippage (5% default)
3. Check balances before operations
4. Verify addresses before sending

### Token Security on Bags.fm

- Mint authority: Managed by bonding curve
- Freeze authority: Revoked by default
- Update authority: Immutable metadata
- LP tokens: Locked by protocol

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_API_KEY` | Missing BAGS_API_KEY | Set in environment |
| `INSUFFICIENT_SOL` | Low balance | Add SOL to wallet |
| `INVALID_MINT` | Bad address | Verify mint address |
| `SLIPPAGE_EXCEEDED` | Price moved | Increase slippageBps |
| `QUOTE_FAILED` | No liquidity | Check token exists |
| `INSUFFICIENT_TOKENS` | Low token balance | Check holdings |

### Error Response Format

```typescript
interface ToolResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## Development

### Building

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode
npm run dev
```

### Testing

```bash
# Run tests (when available)
npm test
```

### Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.25.2",
    "@bagsfm/bags-sdk": "^1.2.7",
    "@solana/web3.js": "^1.95.0",
    "@solana/spl-token": "^0.4.14",
    "zod": "^3.25.0",
    "bs58": "^6.0.0",
    "dotenv": "^16.4.0"
  }
}
```

---

## Resources

### Bags.fm Documentation

- [Bags.fm API Reference](https://docs.bags.fm/api-reference/introduction)
- [Bags SDK on npm](https://www.npmjs.com/package/@bagsfm/bags-sdk)
- [Developer Portal](https://dev.bags.fm)

### Solana Resources

- [Solana Docs](https://solana.com/docs)
- [Token-2022 Guide](https://spl.solana.com/token-2022)
- [Helius Documentation](https://www.helius.dev/docs)

### MCP Resources

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://modelcontextprotocol.io)

---

## License

MIT License - Use at your own risk. This is experimental software.

**DISCLAIMER**: Cryptocurrency trading involves significant risk. Always do your own research. This software is not financial advice.

---

*ClaudeCandle: Light up the Solana blockchain with AI-powered meme coins*

**Platform**: Bags.fm (Meteora Dynamic Bonding Curves)
**Last Updated**: January 27, 2026
