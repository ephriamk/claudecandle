# ClaudeCandle — Solana Meme Coin Launchpad Skill

You can create and trade meme coins on Solana. Two launch paths:

1. **Raydium CPMM** (recommended) — Token is immediately tradeable on Jupiter. ~0.3 SOL infra + your liquidity.
2. **auto.fun bonding curve** — Token appears on auto.fun. Graduates to Raydium when curve fills.

## Mainnet Only

All programs are deployed on **Solana mainnet only**. There is no devnet deployment.

- **Read-only operations** (balance, token info) cost zero SOL and need no funded wallet
- **Transactions** (launch, buy, sell) require a funded wallet with real SOL

## Setup

### 1. Generate a wallet

```bash
npx tsx scripts/setup.ts
```

Outputs a new keypair (publicKey + privateKey). Copy the values into `.env`.

### 2. Create `.env`

```
HELIUS_RPC_URL=https://api.mainnet-beta.solana.com
WALLET_PRIVATE_KEY=<your_base58_private_key>
SOLANA_NETWORK=mainnet-beta
```

No API key needed. Transactions go directly on-chain.
Fund the wallet with SOL before launching or trading tokens.

### 3. Optional: Pinata IPFS (for metadata with images)

Add to `.env`:
```
PINATA_JWT=your_pinata_jwt_here
```

Get a free JWT at https://app.pinata.cloud/developers/api-keys. Without this, you can still launch tokens but must provide your own metadata URI.

## Available Scripts

All scripts: `npx tsx scripts/<name>.ts '<json_args>'`
Output: JSON to stdout. Logs to stderr.

### Setup (Generate Wallet)

```bash
npx tsx scripts/setup.ts
```

Output: `{ success, publicKey, privateKey }`
No arguments needed. Generates a fresh Solana keypair.

### Launch on Raydium (Recommended)

```bash
npx tsx scripts/raydium-launch.ts '{"name":"Moon Dog","symbol":"MOON","liquiditySol":5}'
```

Required: `name`, `symbol`, `liquiditySol`
Optional: `description`, `imageUrl`, `uri`, `totalSupply` (default 1B), `liquidityPercent` (default 50%), `decimals` (default 6)

Output: `{ success, mintAddress, poolId, lpMint, signature, jupiterUrl, explorerUrl }`

Creates an SPL token with Metaplex metadata, then opens a Raydium CPMM pool paired with SOL. The token is immediately tradeable on Jupiter. Cost: ~0.3 SOL infrastructure + your liquidity SOL.

If `description` or `imageUrl` is provided and `PINATA_JWT` is set, metadata is auto-uploaded to IPFS.

### Launch on auto.fun

```bash
npx tsx scripts/launch.ts '{"name":"Moon Dog","symbol":"MOON","uri":"https://..."}'
```

Required: `name`, `symbol`
Optional: `uri` (metadata JSON URL), `description`, `imageUrl`, `initialBuySol`, `decimals` (default 6), `tokenSupply` (default 1B), `virtualReserves` (default 0.1 SOL), `slippageBps`

Output: `{ success, mintAddress, signature, bondingCurve, explorerUrl, autofunUrl }`

If `initialBuySol > 0`, uses `launchAndSwap` for atomic creation + buy.
If `description` or `imageUrl` is provided and `PINATA_JWT` is set, metadata is auto-uploaded to IPFS.

### Buy Tokens

```bash
npx tsx scripts/buy.ts '{"mintAddress":"...","solAmount":0.5}'
```

Required: `mintAddress`, `solAmount`
Optional: `slippageBps` (default 500 = 5%)

Output: `{ success, signature, estimatedTokens, minTokens, explorerUrl }`
Fails if bonding curve is completed (graduated to Raydium).

### Sell Tokens

```bash
npx tsx scripts/sell.ts '{"mintAddress":"...","percentage":100}'
```

Required: `mintAddress`
Provide `tokenAmount` for exact amount OR `percentage` (1-100) to sell a fraction.
Optional: `slippageBps`

Output: `{ success, signature, estimatedSolReceived, explorerUrl }`

### Check Balance

```bash
npx tsx scripts/balance.ts
npx tsx scripts/balance.ts '{"address":"..."}'
```

Output: `{ success, address, solBalance, tokens: [{ mint, balance, decimals }] }`

### Token Info

```bash
npx tsx scripts/info.ts '{"mintAddress":"..."}'
```

Output: `{ success, mintAddress, creator, bondingCurve, reserveSol, reserveTokens, priceInSol, curveLimitSol, progress, isCompleted, autofunUrl, explorerUrl }`

## MCP Server

This project also runs as an MCP server for Claude Desktop or other MCP clients:

```bash
npm run build && node dist/index.js
```

MCP tools: `launch-token-raydium`, `create-token`, `buy-token`, `sell-token`, `get-balance`, `get-token-info`, `server-status`

## Bonding Curve Math

Price follows constant product formula: xy = k

- **Buy:** `output_tokens = (reserveToken * inputSOL) / (reserveSOL + inputSOL)`
- **Sell:** `output_SOL = (reserveSOL * inputTokens) / (reserveToken + inputTokens)`
- Fees deducted: buy_fee from input SOL, sell_fee from output SOL
- **Graduation:** when `reserveSOL >= curveLimit`, curve completes and migrates to Raydium

## Error Handling

Scripts exit 0 with `{ success: true, ... }` or exit 1 with `{ success: false, error: "..." }`.

## Notes

- Tokens use standard SPL Token (not Token2022)
- **Raydium launch** creates a CPMM pool — token is immediately on Jupiter
- **auto.fun launch** uses bonding curve program `autoUmixaMaYKFjexMpQuBpNYntgbkzCo2b1ZqUaAZ5`; tokens appear on https://auto.fun and graduate to Raydium when curve fills
- Default 5% slippage, configurable via `slippageBps`
- All amounts in raw units unless noted (SOL in lamports, tokens with decimals applied)
- Metadata (name, symbol, description, image) is uploaded to IPFS via Pinata when `PINATA_JWT` is set
