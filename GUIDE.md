# ClaudeCandle Quick Guide

Launch meme coins on Solana in 3 steps.

## 1. Setup

```bash
npm install
npx tsx scripts/setup.ts
```

Copy the output into a `.env` file:

```
HELIUS_RPC_URL=https://api.mainnet-beta.solana.com
WALLET_PRIVATE_KEY=<paste_private_key_here>
SOLANA_NETWORK=mainnet-beta
```

Fund the wallet address with SOL before launching anything.

## 2. Choose a Platform

| Platform | Best for | Cost |
|----------|----------|------|
| **Raydium CPMM** | Instant Jupiter trading | ~0.3 SOL + liquidity |
| **Pump.fun** | Maximum visibility (73% market share) | Free to create |
| **Meteora DBC** | Believe/Bags ecosystem | Free to create |
| **Raydium LaunchLab** | Raydium ecosystem | Free to create |
| **auto.fun** | auto.fun ecosystem | Free to create |

## 3. Launch

**Raydium CPMM** (token is live on Jupiter immediately):
```bash
npx tsx scripts/raydium-launch.ts '{"name":"Moon Dog","symbol":"MOON","liquiditySol":5}'
```

**Pump.fun** (bonding curve, graduates at ~85 SOL):
```bash
npx tsx scripts/pumpfun-launch.ts '{"name":"Moon Dog","symbol":"MOON"}'
```

**Meteora DBC** (bonding curve, graduates to DAMM v2):
```bash
npx tsx scripts/meteora-launch.ts '{"name":"Moon Dog","symbol":"MOON"}'
```

**Raydium LaunchLab** (bonding curve, graduates to CPMM):
```bash
npx tsx scripts/launchlab-launch.ts '{"name":"Moon Dog","symbol":"MOON"}'
```

**auto.fun** (bonding curve, graduates to Raydium):
```bash
npx tsx scripts/launch.ts '{"name":"Moon Dog","symbol":"MOON"}'
```

## Adding Images and Descriptions

Get a free API key from [pinata.cloud](https://app.pinata.cloud/developers/api-keys) and add to `.env`:

```
PINATA_JWT=your_jwt_here
```

Then pass `description` and `imageUrl` with any launch command:

```bash
npx tsx scripts/pumpfun-launch.ts '{"name":"Moon Dog","symbol":"MOON","description":"The moonest dog on Solana","imageUrl":"https://example.com/moon-dog.png"}'
```

Metadata is uploaded to IPFS automatically.

## Other Commands

```bash
# Check your wallet balance
npx tsx scripts/balance.ts

# Buy auto.fun tokens
npx tsx scripts/buy.ts '{"mintAddress":"...","solAmount":0.5}'

# Sell auto.fun tokens (100% of holdings)
npx tsx scripts/sell.ts '{"mintAddress":"...","percentage":100}'

# Check auto.fun token info
npx tsx scripts/info.ts '{"mintAddress":"..."}'
```

## Using with Claude Desktop

Build once, then add to your Claude Desktop config:

```bash
npm run build
```

```json
{
  "mcpServers": {
    "claudecandle": {
      "command": "node",
      "args": ["/path/to/claudecandle/dist/index.js"],
      "env": {
        "HELIUS_RPC_URL": "https://api.mainnet-beta.solana.com",
        "WALLET_PRIVATE_KEY": "<your_key>",
        "SOLANA_NETWORK": "mainnet-beta"
      }
    }
  }
}
```

Restart Claude Desktop and ask Claude to launch a token. It handles everything.

## Tips

- All scripts output JSON. Logs go to stderr.
- Default slippage is 5%. Override with `"slippageBps":300` (3%).
- Raydium CPMM is the only platform where tokens trade on Jupiter immediately. All others use bonding curves that graduate first.
- Buy/sell/info commands only work with auto.fun tokens. For other platforms, use their native UI or Jupiter after graduation.
- This is **mainnet only**. Real SOL is used for every transaction.
