# ClaudeCandle - MCP Meme Coin Launchpad

## Project Vision

ClaudeCandle is the world's first MCP (Model Context Protocol) skill-based meme coin launchpad on the Solana blockchain. Users can interact with Claude to create, configure, and launch meme coins through natural language conversations.

---

## Deep Research Findings (January 2026)

### Existing Implementations & SDKs

| Resource | Type | Notes |
|----------|------|-------|
| [@pump-fun/pump-sdk](https://www.npmjs.com/package/@pump-fun/pump-sdk) | **Official SDK** | v1.26.0 - Use this for production |
| [@pump-fun/pump-swap-sdk](https://www.npmjs.com/package/@pump-fun/pump-swap-sdk) | **Official SDK** | For PumpSwap DEX integration |
| [pump-public-docs](https://github.com/pump-fun/pump-public-docs) | **Official Docs** | IDL, account structures, breaking changes |
| [PumpPortal](https://pumpportal.fun/) | Third-party API | REST/WebSocket API, 0.5% fee |
| [pumpdotfun-sdk](https://github.com/rckprtr/pumpdotfun-sdk) | Community SDK | Anchor-based, well documented |
| [Solana Agent Kit](https://github.com/sendaifun/solana-agent-kit) | AI Toolkit | 60+ Solana operations |
| [PUMPFUN-MCP](https://github.com/eskayML/PUMPFUN-MCP) | Reference MCP | Working MCP server implementation |

---

## Pump.fun Technical Specification

### Program IDs

```typescript
// Main Pump.fun Program
const PUMP_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

// PumpSwap AMM (for graduated tokens)
const PUMP_SWAP_PROGRAM_ID = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";

// Mayhem Mode Program
const MAYHEM_PROGRAM_ID = "MAyhSmzXzV1pTf7LsNkrNwkWKTo4ougAJ1PPg47MD4e";

// Fee Program
const FEE_PROGRAM_ID = "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ";
```

### PDA Seeds

```typescript
const GLOBAL_ACCOUNT_SEED = "global";
const MINT_AUTHORITY_SEED = "mint-authority";
const BONDING_CURVE_SEED = "bonding-curve";
const METADATA_SEED = "metadata";

// Derive bonding curve PDA
function getBondingCurveAddress(mint: PublicKey): PublicKey {
  const [bondingCurve] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), mint.toBuffer()],
    new PublicKey(PUMP_PROGRAM_ID)
  );
  return bondingCurve;
}
```

### Bonding Curve Mathematics

The pump.fun bonding curve uses **Uniswap V2 constant product formula** with **dual reserve accounting**:

```
virtual_token_reserves × virtual_sol_reserves = k (constant)
```

#### Initial State (on token creation)

| Reserve | Value | Notes |
|---------|-------|-------|
| `virtual_token_reserves` | 1,073,000,000,000,000 | Synthetic supply for pricing |
| `virtual_sol_reserves` | 30,000,000,000 | Synthetic SOL for pricing |
| `real_token_reserves` | 793,100,000,000,000 | Actual tokens available |
| `real_sol_reserves` | 0 | Actual SOL collected |
| `token_total_supply` | 1,000,000,000,000,000 | 1B tokens (6 decimals) |

#### Buy Calculation

```typescript
function calculateBuyAmount(
  virtualTokenReserves: bigint,
  virtualSolReserves: bigint,
  solAmount: bigint
): bigint {
  const k = virtualTokenReserves * virtualSolReserves;
  const newVirtualSolReserves = virtualSolReserves + solAmount;
  const newVirtualTokenReserves = k / newVirtualSolReserves;
  return virtualTokenReserves - newVirtualTokenReserves;
}
```

#### Graduation Conditions

- **Trigger**: `real_token_reserves` reaches 0 (all 793.1M tokens sold)
- **SOL Required**: ~85 SOL raised through bonding curve
- **Migration**: Auto-migrates to PumpSwap with 79 SOL liquidity
- **Fee**: 6 SOL listing fee taken on graduation

### BondingCurve Account Structure

```typescript
interface BondingCurveAccount {
  discriminator: bigint;           // 8 bytes
  virtualTokenReserves: bigint;    // 8 bytes
  virtualSolReserves: bigint;      // 8 bytes
  realTokenReserves: bigint;       // 8 bytes
  realSolReserves: bigint;         // 8 bytes
  tokenTotalSupply: bigint;        // 8 bytes
  complete: boolean;               // 1 byte
  creator: PublicKey;              // 32 bytes
  isMayhemMode?: boolean;          // 1 byte (v2 only)
}
// Total: 82 bytes (v2) or 81 bytes (legacy)
```

### Token2022 Migration (create_v2)

**IMPORTANT**: As of November 2024, pump.fun uses `create_v2` with Token2022:

```typescript
// OLD: Legacy SPL Token (deprecated)
const legacyTokenProgram = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

// NEW: Token2022 Program
const token2022Program = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
```

Key differences for `create_v2`:
1. Pass `token2022Program` instead of legacy token program
2. Derive ATAs with Token2022 program
3. Metadata stored on-chain (no Metaplex needed)
4. `is_mayhem_mode` boolean parameter

---

## Security Deep Dive

### Token Authority Security

#### Mint Authority
- Controls token issuance
- **Best Practice**: Revoke after initial mint for fixed supply
- Setting to `null` is **permanent and irreversible**

#### Freeze Authority
- Can freeze/thaw individual token accounts
- **Risk**: Malicious actors create "honeypots" - users can buy but not sell
- **Best Practice**: Revoke for meme coins, keep for compliance tokens (USDC, RWAs)

#### Update Authority (Metaplex)
- Can change token metadata (name, symbol, image, URI)
- **Risk**: Phishing attacks via malicious URIs, misleading metadata changes
- **Best Practice**: Pump.fun revokes by default - follow this pattern

### Rug Pull Prevention

According to research, **~98.7% of pump.fun tokens** exhibit rug pull characteristics. Key protections:

| Check | Risk Level | Mitigation |
|-------|------------|------------|
| Mint Authority Active | HIGH | Must be revoked |
| Freeze Authority Active | HIGH | Must be revoked for meme coins |
| Update Authority Active | MEDIUM | Should be revoked |
| LP Not Locked/Burned | HIGH | Lock or burn LP tokens |
| High Token Concentration | HIGH | Check holder distribution |
| Unverified Contract | MEDIUM | Use RugCheck.xyz verification |

### Security Verification Services

- [RugCheck.xyz](https://rugcheck.xyz/) - Comprehensive token scanner
- [Am I Rug?](https://amirug.xyz/) - Pump.fun specific scanner
- [Birdeye](https://birdeye.so/) - Market data and security indicators

### Wallet & Key Management

#### CRITICAL Security Rules

1. **Never store private keys in code**
2. **Never log private keys**
3. **Never store seed phrases digitally**
4. **Use hardware wallets for mainnet**

#### Recommended Patterns

```typescript
// GOOD: Load from environment
const privateKey = process.env.WALLET_PRIVATE_KEY;
const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

// GOOD: Load from secure file (gitignored)
const keypairPath = path.join(__dirname, '../.keys/wallet.json');
const keypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')))
);

// BAD: Hardcoded key
const keypair = Keypair.fromSecretKey(bs58.decode("abc123...")); // NEVER DO THIS
```

#### Multi-Signature for Production

For high-value operations, use Squads multisig:
- Token creation authority
- Fee collection wallets
- Protocol upgrades

---

## Transaction Best Practices

### Priority Fees & Compute Units

```typescript
import {
  ComputeBudgetProgram,
  Transaction,
} from "@solana/web3.js";

// 1. Simulate to get actual CU usage
const simulation = await connection.simulateTransaction(transaction);
const unitsUsed = simulation.value.unitsConsumed || 200000;

// 2. Set compute limit (add 10% buffer)
const computeLimit = Math.ceil(unitsUsed * 1.1);

// 3. Set priority fee based on network conditions
const priorityFee = await getPriorityFee(); // Use Helius Priority Fee API

// 4. Add instructions
transaction.add(
  ComputeBudgetProgram.setComputeUnitLimit({ units: computeLimit }),
  ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee })
);
```

### Priority Fee Formula

```
Total Priority Fee = Compute Unit Limit × Compute Unit Price (microLamports)
```

**Tip**: Request only needed CUs - paying for 1.4M default CUs wastes money and lowers effective priority.

### Transaction Simulation

**ALWAYS simulate before sending:**

```typescript
async function safeTransaction(
  connection: Connection,
  transaction: Transaction,
  signers: Keypair[]
): Promise<string> {
  // 1. Simulate first
  const simulation = await connection.simulateTransaction(transaction);

  if (simulation.value.err) {
    throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
  }

  // 2. Send with preflight checks enabled (default)
  const signature = await connection.sendTransaction(transaction, signers, {
    skipPreflight: false, // Keep this false!
    preflightCommitment: "confirmed",
  });

  // 3. Confirm with appropriate commitment
  await connection.confirmTransaction(signature, "confirmed");

  return signature;
}
```

### When to Skip Preflight

Only skip preflight (`skipPreflight: true`) when:
- You need absolute lowest latency (sniping)
- You've already simulated externally
- You accept the risk of failed transactions

---

## RPC Provider Selection

### Comparison (2026)

| Provider | Solana Focus | Latency | Free Tier | Best For |
|----------|--------------|---------|-----------|----------|
| **[Helius](https://helius.dev/)** | Solana-only | 10-80ms | 1M credits | Production Solana apps |
| **[QuickNode](https://quicknode.com/)** | Multi-chain | ~50ms | Trial only | Cross-chain projects |
| **[Chainstack](https://chainstack.com/)** | Multi-chain | ~60ms | Limited | Enterprise |
| **[Alchemy](https://alchemy.com/)** | Multi-chain | ~70ms | Generous | General purpose |

### Helius Recommended Settings

```typescript
import { Connection } from "@solana/web3.js";

// Use staked connection for better transaction landing
const connection = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
  {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000,
  }
);
```

### Priority Fee API (Helius)

```typescript
async function getPriorityFee(
  accountKeys: string[],
  level: "min" | "low" | "medium" | "high" | "veryHigh" | "unsafeMax" = "high"
): Promise<number> {
  const response = await fetch(
    `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getPriorityFeeEstimate",
        params: [{
          accountKeys,
          options: { priorityLevel: level }
        }]
      })
    }
  );
  const data = await response.json();
  return data.result.priorityFeeEstimate;
}
```

---

## Token-2022 vs Classic SPL Token

### Feature Comparison

| Feature | Classic SPL | Token-2022 |
|---------|-------------|------------|
| Transfer Fees | No | Yes (built-in) |
| Metadata | External (Metaplex) | Native extension |
| Freeze Authority | Yes | Yes |
| Mint Close | No | Yes (extension) |
| Non-Transferable | No | Yes (soulbound) |
| Confidential Transfers | No | Yes |
| Interest Bearing | No | Yes |
| Permanent Delegate | No | Yes |
| Transfer Hooks | No | Yes |

### When to Use Each

**Use Classic SPL Token when:**
- Maximum wallet compatibility needed
- Simple fungible token
- No special features required

**Use Token-2022 when:**
- Need transfer fees (protocol revenue)
- Need on-chain metadata
- Building RWA tokens
- Need compliance features
- pump.fun (required for `create_v2`)

### Wallet Compatibility (2026)

| Wallet | Classic SPL | Token-2022 |
|--------|-------------|------------|
| Phantom | Full | Partial |
| Solflare | Full | Full |
| Backpack | Full | Full |
| Jupiter | Full | Most extensions |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           USER (Claude Chat)                          │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         MCP SERVER (ClaudeCandle)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ create-token│  │  buy-token  │  │ sell-token  │  │  get-info   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
           ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
           │ @pump-fun/  │  │   Helius    │  │   Solana    │
           │  pump-sdk   │  │   RPC API   │  │  Web3.js    │
           └─────────────┘  └─────────────┘  └─────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         SOLANA BLOCKCHAIN                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Pump.fun   │  │  PumpSwap   │  │  Token2022  │  │   Raydium   │  │
│  │   Program   │  │    AMM      │  │   Program   │  │    (grad)   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Core Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.25.2",
    "@pump-fun/pump-sdk": "^1.26.0",
    "@pump-fun/pump-swap-sdk": "^1.0.0",
    "@solana/web3.js": "^1.95.0",
    "@solana/spl-token": "^0.4.14",
    "zod": "^3.25.0",
    "bs58": "^6.0.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
```

---

## MCP Server Implementation

### Server Setup

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

// Initialize server
const server = new McpServer({
  name: "claudecandle",
  version: "1.0.0",
});

// Initialize Solana connection
const connection = new Connection(
  process.env.HELIUS_RPC_URL || "https://api.devnet.solana.com",
  { commitment: "confirmed" }
);

// Load wallet securely
function loadWallet(): Keypair {
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("WALLET_PRIVATE_KEY not set");
  }
  return Keypair.fromSecretKey(bs58.decode(privateKey));
}
```

### Tool Registration Pattern

```typescript
// Create Token Tool
server.tool(
  "create-token",
  "Create a new meme coin on pump.fun with Token2022",
  {
    name: z.string().min(1).max(32).describe("Token name"),
    symbol: z.string().min(1).max(10).describe("Token symbol/ticker"),
    description: z.string().max(500).describe("Token description"),
    imageUrl: z.string().url().optional().describe("Token logo URL"),
    initialBuySol: z.number().min(0).max(85).default(0.1)
      .describe("Initial SOL to buy (0-85)"),
    slippageBps: z.number().min(0).max(5000).default(500)
      .describe("Slippage tolerance in basis points (500 = 5%)"),
  },
  async ({ name, symbol, description, imageUrl, initialBuySol, slippageBps }) => {
    try {
      const wallet = loadWallet();

      // 1. Validate inputs
      if (name.length > 32) throw new Error("Name too long (max 32 chars)");
      if (symbol.length > 10) throw new Error("Symbol too long (max 10 chars)");

      // 2. Create token using official SDK
      // ... implementation using @pump-fun/pump-sdk

      // 3. Return result
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            mintAddress: "...",
            signature: "...",
            explorerUrl: "https://solscan.io/token/...",
            pumpfunUrl: "https://pump.fun/...",
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error.message,
          }, null, 2)
        }]
      };
    }
  }
);
```

### All MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `create-token` | Create pump.fun token | name, symbol, description, imageUrl, initialBuySol |
| `buy-token` | Buy from bonding curve | mintAddress, solAmount, slippageBps |
| `sell-token` | Sell to bonding curve | mintAddress, tokenAmount, slippageBps |
| `get-token-info` | Get token details | mintAddress |
| `get-bonding-curve` | Get curve status | mintAddress |
| `get-balance` | Get wallet balances | address (optional) |
| `simulate-buy` | Simulate buy without executing | mintAddress, solAmount |
| `simulate-sell` | Simulate sell without executing | mintAddress, tokenAmount |

---

## Environment Configuration

### Required Variables

```env
# RPC (Required - use Helius for production)
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY

# Wallet (Required)
WALLET_PRIVATE_KEY=your_base58_encoded_private_key

# Network (Optional - defaults to mainnet)
SOLANA_NETWORK=mainnet-beta  # or devnet
```

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
├── .gitignore                   # MUST include .keys/, .env
├── src/
│   ├── index.ts                 # Entry point, server setup
│   ├── config/
│   │   ├── constants.ts         # Program IDs, seeds
│   │   └── networks.ts          # RPC endpoints
│   ├── tools/
│   │   ├── createToken.ts
│   │   ├── buyToken.ts
│   │   ├── sellToken.ts
│   │   ├── getTokenInfo.ts
│   │   ├── getBondingCurve.ts
│   │   └── getBalance.ts
│   ├── services/
│   │   ├── pump.ts              # Pump.fun SDK wrapper
│   │   ├── solana.ts            # Connection management
│   │   └── priorityFee.ts       # Helius priority fee API
│   ├── utils/
│   │   ├── keypair.ts           # Secure key loading
│   │   ├── validation.ts        # Input validation
│   │   └── formatting.ts        # Output formatting
│   └── types/
│       └── index.ts             # TypeScript types
├── .keys/                       # Keypair storage (gitignored!)
│   └── .gitkeep
└── tests/
    └── *.test.ts
```

---

## Security Checklist

### Before Launch

- [ ] Private keys loaded from environment/secure file only
- [ ] `.keys/` and `.env` in `.gitignore`
- [ ] All transactions simulated before sending
- [ ] Priority fees calculated dynamically
- [ ] Slippage set appropriately (5% default)
- [ ] Error handling for all operations
- [ ] Rate limiting implemented
- [ ] Tested thoroughly on devnet

### Token Creation

- [ ] Mint authority will be revoked by pump.fun
- [ ] Freeze authority will be revoked by pump.fun
- [ ] Update authority revoked (pump.fun default)
- [ ] Metadata immutable after creation

### Production Deployment

- [ ] Use Helius or QuickNode (not public RPC)
- [ ] Consider multisig for treasury
- [ ] Monitor for failed transactions
- [ ] Set up alerts for large operations
- [ ] Regular security audits

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Blockhash not found` | Stale blockhash | Fetch fresh blockhash before sending |
| `Insufficient funds` | Not enough SOL | Check balance, account for fees |
| `Transaction simulation failed` | Invalid transaction | Check accounts, parameters |
| `Account does not exist` | Token account not created | Create ATA first |
| `Custom program error` | Pump.fun specific error | Check error code in IDL |
| `Rate limited` | Too many requests | Implement backoff, use paid RPC |

### Retry Pattern

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("Max retries exceeded");
}
```

---

## Resources

### Official Documentation

- [Pump.fun Public Docs](https://github.com/pump-fun/pump-public-docs)
- [Solana Token Docs](https://solana.com/docs/tokens)
- [Token-2022 Extensions](https://spl.solana.com/token-2022/extensions)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Helius Documentation](https://www.helius.dev/docs)

### Security Resources

- [RugCheck.xyz](https://rugcheck.xyz/)
- [Helius Security Guide](https://www.helius.dev/blog/a-hitchhikers-guide-to-solana-program-security)
- [Solana Security Best Practices](https://docs.solanalabs.com/operations/best-practices/security)

### Community

- [Pump Developer Telegram](https://t.me/pump_tech_updates)
- [Solana Stack Exchange](https://solana.stackexchange.com/)

---

## Roadmap

### Phase 1: MVP
- [x] Deep research and documentation
- [ ] Project scaffolding (package.json, tsconfig)
- [ ] MCP server setup with stdio transport
- [ ] Create token tool (pump.fun)
- [ ] Buy/sell tools
- [ ] Get token info tool

### Phase 2: Production Ready
- [ ] Priority fee optimization (Helius API)
- [ ] Transaction simulation
- [ ] Comprehensive error handling
- [ ] Rate limiting
- [ ] Balance checking

### Phase 3: Advanced Features
- [ ] Bonding curve monitoring
- [ ] Graduation detection
- [ ] Multi-wallet support
- [ ] Transaction history

### Phase 4: Deployment
- [ ] Mainnet testing
- [ ] Security review
- [ ] Documentation site
- [ ] npm package publish

---

## License

MIT License - Use at your own risk. This is experimental software for educational purposes.

**DISCLAIMER**: Cryptocurrency trading involves significant risk. Always do your own research. This software is not financial advice.

---

*ClaudeCandle: Light up the Solana blockchain with AI-powered meme coins*

**Last Updated**: January 27, 2026
**Research Sources**: Solana Docs, Pump.fun Public Docs, Helius, RugCheck, Metaplex, MCP SDK
