# ClaudeCandle - MCP Meme Coin Launchpad

## Project Vision

ClaudeCandle is the world's first MCP (Model Context Protocol) skill-based meme coin launchpad on the Solana blockchain. Users can interact with Claude to create, configure, and launch meme coins through natural language conversations.

## What This Project Does

This project provides an MCP server that exposes tools for:
- Creating SPL tokens on Solana
- Configuring tokenomics (supply, decimals, metadata)
- Uploading token images/metadata to decentralized storage
- Deploying liquidity pools
- Managing token authority (mint/freeze)

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Claude Code   │────▶│   MCP Server    │────▶│ Solana Blockchain│
│   (User Chat)   │     │  (ClaudeCandle) │     │   (Devnet/Main)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  IPFS/Arweave   │
                        │ (Token Metadata)│
                        └─────────────────┘
```

## Tech Stack

- **Runtime**: Node.js / TypeScript
- **MCP Framework**: @modelcontextprotocol/sdk
- **Solana Libraries**:
  - @solana/web3.js (blockchain interaction)
  - @solana/spl-token (token creation)
  - @metaplex-foundation/js (NFT metadata standards)
- **Storage**: IPFS (via Pinata/NFT.Storage) or Arweave
- **Testing**: Solana Devnet

## MCP Tools to Implement

### Core Token Tools
1. `create_token` - Create a new SPL token with metadata
2. `mint_tokens` - Mint tokens to a wallet
3. `set_token_metadata` - Upload and set token metadata (name, symbol, image)
4. `transfer_tokens` - Transfer tokens between wallets
5. `burn_tokens` - Burn tokens from supply

### Liquidity Tools
6. `create_liquidity_pool` - Create a Raydium/Orca liquidity pool
7. `add_liquidity` - Add liquidity to an existing pool
8. `get_pool_info` - Get information about a liquidity pool

### Authority Management
9. `revoke_mint_authority` - Permanently disable minting (rug-proof)
10. `revoke_freeze_authority` - Permanently disable freezing

### Query Tools
11. `get_token_info` - Get token details and supply info
12. `get_wallet_balance` - Check SOL and token balances
13. `get_transaction_status` - Check transaction confirmation

## Project Structure

```
claudecandle/
├── CLAUDE.MD              # This file - project documentation
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── server.ts          # MCP server setup
│   ├── tools/             # MCP tool implementations
│   │   ├── createToken.ts
│   │   ├── mintTokens.ts
│   │   ├── setMetadata.ts
│   │   ├── liquidity.ts
│   │   └── authority.ts
│   ├── services/          # Core business logic
│   │   ├── solana.ts      # Solana connection management
│   │   ├── token.ts       # Token operations
│   │   ├── metadata.ts    # Metadata upload (IPFS/Arweave)
│   │   └── pool.ts        # Liquidity pool operations
│   └── utils/
│       ├── keypair.ts     # Wallet/keypair utilities
│       └── validation.ts  # Input validation
├── config/
│   └── networks.ts        # Network configurations (devnet/mainnet)
└── tests/
    └── *.test.ts          # Test files
```

## Key Concepts

### SPL Tokens
Solana Program Library (SPL) tokens are Solana's equivalent of ERC-20 tokens. Each token has:
- **Mint Address**: The unique identifier for the token
- **Decimals**: Precision (usually 6-9 for meme coins)
- **Supply**: Total/circulating supply
- **Authorities**: Mint authority (can create more) and freeze authority

### Token Metadata
Using Metaplex Token Metadata standard:
- Name, Symbol, Description
- Image URL (stored on IPFS/Arweave)
- External URL, attributes

### Liquidity Pools
DEX pools (Raydium, Orca) that enable trading:
- Pair token with SOL or USDC
- Set initial price via liquidity ratio
- Earn LP tokens representing pool share

## Security Considerations

1. **Private Keys**: Never expose private keys in code or logs
2. **Authority Revocation**: Recommend revoking mint authority for trust
3. **Devnet Testing**: Always test on devnet before mainnet
4. **Transaction Confirmation**: Wait for finalized confirmation
5. **Input Validation**: Validate all user inputs before blockchain ops

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run MCP server (for testing)
npm run start

# Run tests
npm test

# Run on devnet
SOLANA_NETWORK=devnet npm run start
```

## Environment Variables

```env
SOLANA_NETWORK=devnet          # or mainnet-beta
SOLANA_RPC_URL=                 # Custom RPC endpoint (optional)
WALLET_PRIVATE_KEY=            # Base58 encoded private key
IPFS_API_KEY=                  # Pinata or NFT.Storage API key
```

## MCP Server Configuration

To use with Claude Code, add to MCP settings:

```json
{
  "mcpServers": {
    "claudecandle": {
      "command": "node",
      "args": ["/path/to/claudecandle/dist/index.js"],
      "env": {
        "SOLANA_NETWORK": "devnet",
        "WALLET_PRIVATE_KEY": "your-base58-private-key"
      }
    }
  }
}
```

## Example User Interaction

```
User: Create a meme coin called "DOGE2MOON" with symbol "D2M",
      1 billion supply, and this dog image for the logo.

Claude: I'll create your DOGE2MOON token on Solana devnet:
        1. Uploading your image to IPFS...
        2. Creating SPL token with 1B supply...
        3. Setting token metadata...

        Token created successfully!
        - Mint Address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
        - Explorer: https://solscan.io/token/7xKXtg...

        Would you like me to create a liquidity pool?
```

## Roadmap

### Phase 1: Core Token Creation
- [ ] Basic MCP server setup
- [ ] Create token tool
- [ ] Metadata upload (IPFS)
- [ ] Mint/transfer tools

### Phase 2: Liquidity & Trading
- [ ] Raydium pool creation
- [ ] Orca pool creation
- [ ] Price/pool info queries

### Phase 3: Advanced Features
- [ ] Token launch templates (fair launch, presale)
- [ ] Anti-rug features (locked liquidity)
- [ ] Social integrations (Twitter announcements)

### Phase 4: Production
- [ ] Mainnet deployment
- [ ] Security audit
- [ ] Documentation site

## Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [Solana Cookbook](https://solanacookbook.com/)
- [SPL Token Docs](https://spl.solana.com/token)
- [Metaplex Docs](https://docs.metaplex.com/)
- [Raydium SDK](https://github.com/raydium-io/raydium-sdk)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test on devnet
4. Submit a pull request

## License

MIT License - Use at your own risk. This is experimental software.

---

*ClaudeCandle: Light up the Solana blockchain with AI-powered meme coins*
