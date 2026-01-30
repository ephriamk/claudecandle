# ClaudeCandle

MCP server and CLI tools for launching and trading Solana meme coins.

Launch tokens across 5 platforms — Raydium, Pump.fun, Meteora, LaunchLab, and auto.fun — from Claude Desktop, Claude Code, or the command line.

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
           "SOLANA_NETWORK": "mainnet-beta",
           "PINATA_JWT": "<optional_pinata_jwt_for_metadata>"
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
   # Launch on Raydium CPMM (immediately tradeable on Jupiter)
   npx tsx scripts/raydium-launch.ts '{"name":"Moon Dog","symbol":"MOON","liquiditySol":5}'

   # Launch on Pump.fun (biggest market, 73%)
   npx tsx scripts/pumpfun-launch.ts '{"name":"Moon Dog","symbol":"MOON"}'

   # Launch on Meteora DBC (powers Believe, Bags)
   npx tsx scripts/meteora-launch.ts '{"name":"Moon Dog","symbol":"MOON"}'

   # Launch on Raydium LaunchLab (bonding curve → CPMM)
   npx tsx scripts/launchlab-launch.ts '{"name":"Moon Dog","symbol":"MOON"}'

   # Launch on auto.fun (bonding curve)
   npx tsx scripts/launch.ts '{"name":"Moon Dog","symbol":"MOON"}'

   # Trade and check
   npx tsx scripts/buy.ts '{"mintAddress":"...","solAmount":0.5}'
   npx tsx scripts/sell.ts '{"mintAddress":"...","percentage":100}'
   npx tsx scripts/balance.ts
   npx tsx scripts/info.ts '{"mintAddress":"..."}'
   ```

   All scripts output JSON to stdout and logs to stderr.

## Metadata (Images & Descriptions)

To include token descriptions and images, set `PINATA_JWT` in your `.env` or MCP config:

```
PINATA_JWT=your_pinata_jwt_here
```

Get a free JWT at [pinata.cloud](https://app.pinata.cloud/developers/api-keys). Then just pass `description` and `imageUrl` — metadata is auto-uploaded to IPFS.

## Mainnet Only

All programs are deployed on **Solana mainnet only**. There is no devnet deployment.

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
| `launch-token-raydium` | Launch with Raydium CPMM pool (tradeable on Jupiter immediately) |
| `launch-token-pumpfun` | Launch on Pump.fun bonding curve (#1 launchpad, 73% market) |
| `launch-token-meteora` | Launch on Meteora DBC (powers Believe, Bags, daos.fun) |
| `launch-token-launchlab` | Launch on Raydium LaunchLab (bonding curve → Raydium CPMM) |
| `create-token` | Launch on auto.fun bonding curve |
| `buy-token` | Buy tokens from a bonding curve with SOL |
| `sell-token` | Sell tokens back to a bonding curve for SOL |
| `get-balance` | Check wallet SOL and SPL token balances |
| `get-token-info` | Get bonding curve price, reserves, and graduation progress |
| `server-status` | Health check: RPC connection, wallet, and balance |

## Full Reference

See [CLAUDE.md](./CLAUDE.md) for complete script documentation, parameters, output formats, bonding curve math, and error handling.

## License

[MIT](./LICENSE)
