# Protocol Pal - MCP Server

> Model Context Protocol server that gives AI agents the power to execute blockchain transactions.

## Overview

This is the **MCP Server** that provides blockchain-related tools to AI agents. It's the core innovation of Protocol Pal - enabling AI agents to interact with smart contracts through structured tools.

### What This Server Provides

🔧 **Two MCP Tools:**
1. `check_wallet_balance` - Check ETH and ERC20 token balances
2. `prepare_natural_language_transaction` - Convert natural language → executable transaction

🌐 **Blockchain Support:**
- Network: Sepolia Testnet
- Protocols: Uniswap V2, NFT Drops
- Tokens: ETH, WETH, USDC, DAI, USDT, LINK, UNI

## Architecture

```
AI Agent
    ↓
MCP Tool Call
    ↓
MCP Server (this component)
    ↓
Intent Parser Agent (for transaction tool)
    ↓
Returns:
  - Contract address
  - Function name
  - Encoded args
  - ABI
  - Approval transaction (if needed)
```

## Tech Stack

- **MCP SDK:** @modelcontextprotocol/sdk 1.17.4
- **Nullshot MCP:** @nullshot/mcp 0.3.6
- **Validation:** Zod 3.25.76
- **Platform:** Cloudflare Workers + Durable Objects

## Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# No environment variables needed for local development
```

### Development

```bash
# Start MCP server with inspector
pnpm dev

# MCP Inspector will launch on port 6274
# Worker will run on port 8787
```

The dev command runs:
- **MCP Inspector** - Debug tool at http://localhost:6274
- **Cloudflare Worker** - MCP server at http://localhost:8787

## MCP Tools

### Tool 1: `check_wallet_balance`

Check native ETH and ERC20 token balances for any wallet.

**Inputs:**
```typescript
{
  walletAddress: string,  // Required: Ethereum address
  tokens?: Array<'WETH' | 'USDC' | 'DAI' | 'USDT' | 'LINK' | 'UNI'>
}
```

**Output:**
```json
{
  "balances": {
    "ETH": {
      "balance": "1.234567",
      "symbol": "ETH",
      "decimals": 18
    },
    "USDC": {
      "balance": "100.50",
      "symbol": "USDC",
      "decimals": 6,
      "address": "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"
    }
  },
  "walletAddress": "0x1234...",
  "network": "sepolia"
}
```

**Implementation:**
- Uses direct RPC calls to Alchemy Sepolia endpoint
- Calls `eth_getBalance` for native ETH
- Calls `balanceOf()` for each ERC20 token
- Fetches decimals dynamically

### Tool 2: `prepare_natural_language_transaction`

The main tool - transforms natural language into a complete, signable transaction.

**Inputs:**
```typescript
{
  query: string,        // e.g., "swap 0.01 eth for usdc"
  userAddress: string   // User's wallet address
}
```

**Output:**
```json
{
  "success": true,
  "requiresApproval": false,
  "approvalTransaction": null,
  "transaction": {
    "contract_key": "UNISWAP_ROUTER",
    "contract_address": "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
    "function_name": "swapExactETHForTokens",
    "args": [0, ["0x7b79...", "0x94a9..."], "0xUserAddress", 1234567890],
    "value": "0.01",
    "abi": [...]
  }
}
```

**For transactions requiring approval:**
```json
{
  "success": true,
  "requiresApproval": true,
  "approvalTransaction": {
    "contract_address": "0xTokenAddress",
    "function_name": "approve",
    "args": ["0xUniswapRouter", "100000000"],
    "value": "0.0",
    "abi": [...]
  },
  "transaction": {
    "contract_key": "UNISWAP_ROUTER",
    "function_name": "swapExactTokensForETH",
    // ...
  }
}
```

**Process:**
1. Calls Intent Parser Agent microservice
2. Receives JSON with contract/function/args
3. Replaces placeholders:
   - `[USER_WALLET_ADDRESS]` → actual address
   - `[CURRENT_TIMESTAMP_PLUS_600S]` → deadline
4. Retrieves contract address from mapping
5. Gets appropriate ABI
6. Detects if approval needed (token → ETH/token swaps)
7. Creates approval transaction if needed
8. Returns complete transaction data

## Supported Contracts

### Uniswap V2 Router (Sepolia)

**Address:** `0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008`

**Functions:**
- `swapExactETHForTokens` - Swap ETH → Token
- `swapExactTokensForETH` - Swap Token → ETH (requires approval)
- `swapExactTokensForTokens` - Swap Token → Token (requires approval)

### NFT Drop Contract

**Address:** `0x12f8e37677b8934FE4F21E1fE87e18152408e77d`

**Functions:**
- `claim` - Mint NFTs (free on testnet)

## Token Addresses (Sepolia)

| Token | Address | Decimals |
|-------|---------|----------|
| WETH | `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9` | 18 |
| USDC | `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8` | 6 |
| DAI | `0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357` | 18 |
| USDT | `0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0` | 6 |
| LINK | `0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5` | 18 |
| UNI | `0x4c4d5DFF92B35Df3293c46ACdf58FE0674940b64` | 18 |

## Key Files

- [`src/tools.ts`](./src/tools.ts) - Tool implementations (596 lines)
- [`src/server.ts`](./src/server.ts) - MCP server configuration
- [`src/index.ts`](./src/index.ts) - Worker entrypoint
- [`src/resources.ts`](./src/resources.ts) - MCP resources
- [`src/prompts.ts`](./src/prompts.ts) - MCP prompts

## How It Works

### Balance Checking

```typescript
// 1. Check ETH balance
const ethBalance = await fetch(RPC_URL, {
  method: 'POST',
  body: JSON.stringify({
    method: 'eth_getBalance',
    params: [walletAddress, 'latest']
  })
});

// 2. For each token, call balanceOf()
const tokenBalance = await fetch(RPC_URL, {
  method: 'POST',
  body: JSON.stringify({
    method: 'eth_call',
    params: [{
      to: tokenAddress,
      data: '0x70a08231' + walletAddress.slice(2).padStart(64, '0')
    }, 'latest']
  })
});
```

### Transaction Preparation

```typescript
// 1. Call Intent Parser
const response = await fetch('http://localhost:54082/agent/chat', {
  method: 'POST',
  body: JSON.stringify({
    messages: [{ role: 'user', content: query }]
  })
});

// 2. Parse streaming response
const agentResponse = JSON.parse(streamedData);

// 3. Replace placeholders
const processedArgs = replacePlaceholders(
  agentResponse.args,
  userAddress
);

// 4. Get contract & ABI
const contractAddress = CONTRACT_ADDRESSES[agentResponse.contract_key];
const abi = getABI(agentResponse.contract_key, agentResponse.function_name);

// 5. Check approval
if (needsApproval) {
  approvalTransaction = {
    contract_address: approvalToken,
    function_name: "approve",
    args: [contractAddress, approvalAmount],
    abi: ERC20_ABI
  };
}
```

## Adding New Contracts

1. **Add contract address:**
```typescript
// src/tools.ts
const CONTRACT_ADDRESSES = {
  UNISWAP_ROUTER: "0xC532a...",
  NFT_DROP: "0x12f8e...",
  YOUR_CONTRACT: "0xYourAddress"  // Add here
};
```

2. **Add ABI:**
```typescript
const YOUR_CONTRACT_ABI = [
  {
    inputs: [...],
    name: "yourFunction",
    outputs: [...],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
```

3. **Update getABI function:**
```typescript
function getABI(contractKey: string): any[] {
  switch (contractKey) {
    case "YOUR_CONTRACT":
      return [...YOUR_CONTRACT_ABI];
    // ...
  }
}
```

4. **Update Intent Parser** to recognize your contract

## Testing

### Using MCP Inspector

1. Start dev server: `pnpm dev`
2. Open http://localhost:6274
3. Select tool to test
4. Enter parameters
5. View response

### Manual Testing

```bash
# Test balance check
curl -X POST http://localhost:8787/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "check_wallet_balance",
      "arguments": {
        "walletAddress": "0x1234...",
        "tokens": ["WETH", "USDC"]
      }
    }
  }'
```

## Deployment

```bash
# Deploy to Cloudflare Workers
pnpm deploy
```

## Configuration

Edit [`wrangler.jsonc`](./wrangler.jsonc):
- Service name
- Durable Object bindings
- Environment variables
- Route patterns

## Integration

### Using in an AI Agent

```typescript
import { ToolboxService } from '@nullshot/agent';
import mcpConfig from './mcp.json';

// In your agent constructor
super(state, env, model, [
  new ToolboxService(env, mcpConfig)
]);

// Tools are automatically available to the AI
```

### MCP Config

Add to your agent's `mcp.json`:
```json
{
  "mcpServers": {
    "protocol-pal-mcp": {
      "source": "github:yourorg/protocol-pal",
      "path": "/agent/mcp"
    }
  }
}
```

## Related Components

- **Intent Parser** ([`../../intent-parser-agent`](../../intent-parser-agent)) - Parses natural language
- **Chat Agent** ([`../`](../)) - Uses these tools
- **Frontend** ([`../../frontend`](../../frontend)) - Executes transactions

## Troubleshooting

### "Failed to connect to IntentParserAgent"
- Ensure Intent Parser is running on port 54082
- Check `INTENT_PARSER_AGENT_URL` in tools.ts

### Balance returns 0
- Verify wallet has funds on Sepolia
- Check RPC URL is correct
- Ensure token address is correct

### Transaction approval not detected
- Check `requires_approval` field in Intent Parser response
- Verify token address is in approval_token field

## Contributing

Built for the Nullshot hackathon. PRs welcome!

## License

MIT
