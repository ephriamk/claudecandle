# ClaudeCandle - MCP Meme Coin Launchpad

## Project Vision

ClaudeCandle is the world's first MCP (Model Context Protocol) skill-based meme coin launchpad on the Solana blockchain. Users can interact with Claude to create, configure, and launch meme coins through natural language conversations.

---

## Research Findings (January 2026)

### Existing Implementations Discovered

We researched the landscape and found several relevant projects:

1. **[PUMP-MCP](https://github.com/8bitsats/PUMP-MCP)** - MCP server for pump.fun integration with Claude Desktop
2. **[PUMPFUN-MCP](https://github.com/eskayML/PUMPFUN-MCP)** - Alternative pump.fun MCP implementation
3. **[Solana Agent Kit](https://github.com/sendaifun/solana-agent-kit)** - 60+ Solana operations for AI agents
4. **[pumpdotfun-sdk](https://github.com/rckprtr/pumpdotfun-sdk)** - JavaScript SDK for pump.fun
5. **[Raydium LaunchLab SDK](https://docs.raydium.io/raydium/pool-creation/launchlab/launchlab-typescript-sdk)** - Token launch with bonding curves

### Two Main Approaches

#### Approach 1: Pump.fun Integration (Recommended for Meme Coins)
- Uses pump.fun's bonding curve mechanism
- No need for initial liquidity - bonding curve handles pricing
- Auto-migrates to PumpSwap/Raydium when bonding curve completes (100%)
- Only costs ~0.01 SOL to launch
- Fair launch (no presale, no team allocation)

#### Approach 2: Direct SPL Token Creation
- Full control over tokenomics
- Manual liquidity pool creation on Raydium/Orca
- More complex but more flexible
- Better for serious projects needing custom features

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Claude Code   │────▶│   MCP Server    │────▶│    Pump.fun     │
│   (User Chat)   │     │  (ClaudeCandle) │     │   or Solana     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               │                        ▼
                               │                ┌─────────────────┐
                               │                │  PumpSwap /     │
                               │                │  Raydium DEX    │
                               └───────────────▶└─────────────────┘
                                        │
                                        ▼
                                 ┌─────────────────┐
                                 │  IPFS/Arweave   │
                                 │ (Token Metadata)│
                                 └─────────────────┘
```

---

## Tech Stack

### Core Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.25.2",
    "@solana/web3.js": "^1.95.0",
    "@solana/spl-token": "^0.4.14",
    "@coral-xyz/anchor": "^0.30.0",
    "pumpdotfun-sdk": "^1.3.2",
    "zod": "^3.25.0",
    "bs58": "^5.0.0",
    "dotenv": "^16.0.0"
  }
}
```

### Optional Dependencies (for advanced features)

```json
{
  "@raydium-io/raydium-sdk-v2": "latest",
  "@metaplex-foundation/mpl-token-metadata": "^3.0.0",
  "@metaplex-foundation/umi": "^1.0.0",
  "solana-agent-kit": "latest"
}
```

---

## MCP Server Implementation Pattern

### Basic Server Setup

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "claudecandle",
  version: "1.0.0",
});

// Tool registration pattern
server.tool(
  "tool_name",
  "Tool description for Claude",
  {
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional(),
  },
  async ({ param1, param2 }) => {
    // Implementation
    return {
      content: [{ type: "text", text: "Result" }],
    };
  }
);

// Start server
const transport = new StdioServerTransport();
server.connect(transport);
```

### Provider Setup (Solana + Anchor)

```typescript
import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PumpFunSDK } from "pumpdotfun-sdk";

function getProvider() {
  const rpcUrl = process.env.HELIUS_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  // Load wallet from environment or file
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  const wallet = Keypair.fromSecretKey(bs58.decode(privateKey));

  return new AnchorProvider(
    connection,
    { publicKey: wallet.publicKey, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs },
    { commitment: "confirmed" }
  );
}

const provider = getProvider();
const sdk = new PumpFunSDK(provider);
```

---

## MCP Tools to Implement

### Phase 1: Core Pump.fun Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `create-token` | Launch token on pump.fun | name, symbol, description, imageUrl, initialBuySol |
| `buy-token` | Buy tokens from bonding curve | mintAddress, solAmount, slippageBps |
| `sell-token` | Sell tokens back to curve | mintAddress, tokenAmount, slippageBps |
| `get-token-info` | Get token details | mintAddress |
| `get-bonding-curve` | Get bonding curve status | mintAddress |
| `list-accounts` | List managed wallets | - |
| `get-balance` | Get SOL/token balances | accountName |

### Phase 2: Advanced Token Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `deploy-spl-token` | Create standard SPL token | name, symbol, decimals, supply |
| `mint-tokens` | Mint additional tokens | mintAddress, amount, recipient |
| `revoke-authority` | Revoke mint/freeze authority | mintAddress, authorityType |
| `set-metadata` | Update token metadata | mintAddress, name, symbol, uri |

### Phase 3: Liquidity Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `create-raydium-pool` | Create Raydium CPMM pool | tokenMint, solAmount, tokenAmount |
| `add-liquidity` | Add liquidity to pool | poolId, amount |
| `get-pool-info` | Get pool statistics | poolId |

---

## Pump.fun SDK Usage Patterns

### Creating a Token with Initial Buy

```typescript
import { PumpFunSDK } from "pumpdotfun-sdk";

async function createToken(
  sdk: PumpFunSDK,
  creator: Keypair,
  metadata: { name: string; symbol: string; description: string; imageUrl: string },
  initialBuySol: bigint
) {
  const mint = Keypair.generate();

  const result = await sdk.createAndBuy(
    creator,
    mint,
    {
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      file: await fetchImageAsBlob(metadata.imageUrl),
    },
    initialBuySol,
    500n, // slippage: 5%
    { unitLimit: 250000, unitPrice: 250000 } // priority fees
  );

  return {
    mintAddress: mint.publicKey.toBase58(),
    signature: result.signature,
  };
}
```

### Buying Tokens

```typescript
async function buyToken(
  sdk: PumpFunSDK,
  buyer: Keypair,
  mintAddress: string,
  solAmount: bigint,
  slippageBps: bigint = 500n
) {
  const mint = new PublicKey(mintAddress);

  const result = await sdk.buy(
    buyer,
    mint,
    solAmount,
    slippageBps
  );

  return result;
}
```

### Checking Bonding Curve Status

```typescript
import { PublicKey } from "@solana/web3.js";

// Derive bonding curve PDA
const PUMP_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

function getBondingCurveAddress(mint: PublicKey): PublicKey {
  const [bondingCurve] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), mint.toBuffer()],
    PUMP_PROGRAM_ID
  );
  return bondingCurve;
}

// When bonding curve is complete (800M tokens sold), token migrates to DEX
```

---

## Solana Agent Kit Integration (Alternative)

For more comprehensive Solana operations, consider using Solana Agent Kit:

```typescript
import { SolanaAgentKit, createSolanaTools } from "solana-agent-kit";

const agent = new SolanaAgentKit(
  process.env.WALLET_PRIVATE_KEY,
  process.env.RPC_URL,
  { OPENAI_API_KEY: process.env.OPENAI_API_KEY }
);

// Available operations:
// - agent.deployToken() - Standard SPL token
// - agent.launchPumpFunToken() - Pump.fun launch
// - agent.createRaydiumPool() - Raydium CPMM/CLMM/AMMv4
// - agent.swap() - Jupiter swaps
// - 60+ more operations
```

---

## Project Structure

```
claudecandle/
├── CLAUDE.MD                 # This file
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── config/
│   │   └── constants.ts      # Program IDs, defaults
│   ├── tools/
│   │   ├── pumpfun/
│   │   │   ├── createToken.ts
│   │   │   ├── buyToken.ts
│   │   │   ├── sellToken.ts
│   │   │   └── getTokenInfo.ts
│   │   ├── spl/
│   │   │   ├── deployToken.ts
│   │   │   ├── mintTokens.ts
│   │   │   └── revokeAuthority.ts
│   │   ├── liquidity/
│   │   │   ├── createPool.ts
│   │   │   └── addLiquidity.ts
│   │   └── account/
│   │       ├── listAccounts.ts
│   │       └── getBalance.ts
│   ├── services/
│   │   ├── solana.ts         # Connection management
│   │   ├── pumpfun.ts        # Pump.fun SDK wrapper
│   │   ├── metadata.ts       # IPFS upload
│   │   └── keypair.ts        # Wallet management
│   └── utils/
│       ├── validation.ts
│       └── formatting.ts
├── .keys/                    # Keypair storage (gitignored)
└── tests/
    └── *.test.ts
```

---

## Environment Variables

```env
# Required
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Optional (for devnet testing)
SOLANA_NETWORK=devnet

# Wallet (provide one of these)
WALLET_PRIVATE_KEY=base58_encoded_private_key

# For IPFS uploads (optional - pump.fun handles this)
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
```

---

## MCP Configuration for Claude Desktop

Add to `~/.config/claude/claude_desktop_config.json` (macOS/Linux):

```json
{
  "mcpServers": {
    "claudecandle": {
      "command": "node",
      "args": ["/path/to/claudecandle/dist/index.js"],
      "env": {
        "HELIUS_RPC_URL": "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
      }
    }
  }
}
```

---

## Key Concepts

### Pump.fun Bonding Curve

- **Fixed supply**: 1 billion tokens
- **Bonding curve allocation**: ~800M tokens available for purchase
- **Graduation**: When curve reaches 100% (all tokens sold), migrates to PumpSwap/Raydium
- **Pricing**: Constant product curve (x * y = k)
- **Fees**: 1% on trades, 0.015 SOL on graduation

### Token Metadata Standards

**Metaplex Token Metadata** is the standard for Solana tokens:
- PDA derived from: `["metadata", TOKEN_METADATA_PROGRAM_ID, MINT_ADDRESS]`
- On-chain: name, symbol, URI
- Off-chain (via URI): image, description, attributes

**Token-2022 Extensions** (newer):
- Transfer fees (basis points on every transfer)
- Mint close authority (reclaim rent when done)
- Metadata pointer (built-in metadata)

### Liquidity Pools

**Raydium Pool Types**:
- **CPMM**: Constant Product Market Maker (simple, like Uniswap v2)
- **CLMM**: Concentrated Liquidity (like Uniswap v3)
- **AMMv4**: Legacy AMM

**PumpSwap**: Pump.fun's native DEX where graduated tokens trade

---

## Security Considerations

1. **Private Keys**: Store in `.keys/` folder (gitignored), never log
2. **RPC Provider**: Use Helius/QuickNode for reliability, not public RPC
3. **Slippage**: Default 5% (500 bps), adjust for volatile conditions
4. **Devnet First**: Always test on devnet before mainnet
5. **Authority Revocation**: Revoke mint authority for community trust
6. **Transaction Confirmation**: Wait for "finalized" commitment for important ops

---

## Example User Interactions

### Creating a Meme Coin

```
User: Create a meme coin called "DOGWIFHAT" with symbol "WIF" and
      description "The original dog wif hat". Use this image: [url]

Claude: I'll create your DOGWIFHAT token on pump.fun!

        Creating token with:
        - Name: DOGWIFHAT
        - Symbol: WIF
        - Initial buy: 0.1 SOL

        Token created successfully!
        - Mint: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
        - View on pump.fun: https://pump.fun/7xKXtg...
        - Bonding curve: 0.01% complete

        Would you like to buy more tokens or share the link?
```

### Checking Token Status

```
User: What's the status of my WIF token?

Claude: Here's your DOGWIFHAT token status:

        - Bonding Curve: 45% complete
        - Price: 0.00001234 SOL
        - Market Cap: $12,345
        - Holders: 234

        At 100%, it will graduate to PumpSwap for open trading!
```

---

## Roadmap

### Phase 1: MVP (Current)
- [x] Research and documentation
- [ ] Basic MCP server setup
- [ ] Pump.fun token creation tool
- [ ] Buy/sell tools
- [ ] Token info queries

### Phase 2: Enhanced Features
- [ ] Multi-account management
- [ ] Balance tracking
- [ ] Transaction history
- [ ] Bonding curve monitoring

### Phase 3: Advanced Launch Options
- [ ] Direct SPL token creation
- [ ] Raydium pool creation
- [ ] Token-2022 support
- [ ] Metadata management

### Phase 4: Production
- [ ] Mainnet deployment
- [ ] Security audit
- [ ] Rate limiting
- [ ] Analytics dashboard

---

## Resources

### Official Documentation
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Solana Token Docs](https://solana.com/docs/tokens)
- [SPL Token Program](https://spl.solana.com/token)
- [Metaplex Token Metadata](https://developers.metaplex.com/token-metadata)

### SDKs & Tools
- [pumpdotfun-sdk](https://github.com/rckprtr/pumpdotfun-sdk)
- [Solana Agent Kit](https://github.com/sendaifun/solana-agent-kit)
- [Raydium SDK V2](https://github.com/raydium-io/raydium-sdk-v2)
- [Bitquery Pump.fun API](https://docs.bitquery.io/docs/blockchain/Solana/Pumpfun/Pump-Fun-API/)

### Reference Implementations
- [PUMPFUN-MCP](https://github.com/eskayML/PUMPFUN-MCP) - Pump.fun MCP server
- [awesome-solana-mcp-servers](https://github.com/sendaifun/awesome-solana-mcp-servers)

### RPC Providers
- [Helius](https://helius.dev/) - Recommended, has free tier
- [QuickNode](https://quicknode.com/)

---

## License

MIT License - Use at your own risk. This is experimental software.

---

*ClaudeCandle: Light up the Solana blockchain with AI-powered meme coins*
