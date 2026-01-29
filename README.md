# ClaudeCandle

MCP server and CLI tools for launching and trading Solana meme coins on [auto.fun](https://auto.fun).

Create tokens with bonding curves, buy, sell, and check prices — from Claude Desktop, Claude Code, or the command line.

## Quick Start

### Option A: MCP Server (Claude Desktop)

1. **Install and build**

   ```bash
   git clone https://github.com/anthropics/claudecandle.git
   cd claudecandle
   npm install
   npm run build
   ```

2. **Generate a wallet**

   ```bash
   npx tsx scripts/setup.ts
   ```

   Save the `publicKey` and `privateKey` from the output.

3. **Add to Claude Desktop config**

   Open your Claude Desktop configuration file and add:

   ```json
   {
     "mcpServers": {
       "claudecandle": {
         "command": "node",
         "args": ["/absolute/path/to/claudecandle/dist/index.js"],
         "env": {
           "HELIUS_RPC_URL": "https://api.mainnet-beta.solana.com",
           "WALLET_PRIVATE_KEY": "<your_base58_private_key>",
           "SOLANA_NETWORK": "mainnet-beta"
         }
       }
     }
   }
   ```

   > **Important:** Environment variables must be passed in the `env` block above.
   > The `.env` file is not read when Claude Desktop launches the server,
   > because the working directory will differ from the project root.

4. **Restart Claude Desktop** and ask Claude to create a token.

### Option B: CLI Scripts (Claude Code / Terminal)

1. **Clone and install**

   ```bash
   git clone https://github.com/anthropics/claudecandle.git
   cd claudecandle
   npm install
   ```

2. **Generate a wallet and create `.env`**

   ```bash
   npx tsx scripts/setup.ts
   ```

   Create a `.env` file in the project root:

   ```
   HELIUS_RPC_URL=https://api.mainnet-beta.solana.com
   WALLET_PRIVATE_KEY=<your_base58_private_key>
   SOLANA_NETWORK=mainnet-beta
   ```

3. **Run scripts**

   ```bash
   npx tsx scripts/launch.ts '{"name":"Moon Dog","symbol":"MOON"}'
   npx tsx scripts/buy.ts '{"mintAddress":"...","solAmount":0.5}'
   npx tsx scripts/sell.ts '{"mintAddress":"...","percentage":100}'
   npx tsx scripts/balance.ts
   npx tsx scripts/info.ts '{"mintAddress":"..."}'
   ```

   All scripts output JSON to stdout and logs to stderr.

## Mainnet Only

auto.fun's bonding curve program is deployed on **Solana mainnet only**. There is no devnet deployment.

- **Read-only operations** (balance, token info) are free and need no funded wallet.
- **Transactions** (launch, buy, sell) require a funded wallet with real SOL.

## RPC Configuration

The default RPC is Solana's public endpoint (`https://api.mainnet-beta.solana.com`), which requires no API key. For production use or higher rate limits, use a [Helius](https://helius.dev) endpoint:

```
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `create-token` | Launch a new token with bonding curve on auto.fun |
| `buy-token` | Buy tokens from a bonding curve with SOL |
| `sell-token` | Sell tokens back to a bonding curve for SOL |
| `get-balance` | Check wallet SOL and SPL token balances |
| `get-token-info` | Get bonding curve price, reserves, and graduation progress |
| `server-status` | Health check: RPC connection, wallet, and balance |

## Full Reference

See [CLAUDE.md](./CLAUDE.md) for complete script documentation, parameters, output formats, bonding curve math, and error handling.

## License

[MIT](./LICENSE)
