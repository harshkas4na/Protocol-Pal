# Protocol Pal - Intent Parser Agent

> A specialized AI agent that parses natural language blockchain requests into structured JSON transactions.

## Overview

This is a **non-conversational, single-purpose AI agent** designed to do ONE thing extremely well: transform natural language like "swap 0.01 ETH for USDC" into precise JSON transaction objects.

### What Makes This Special

- 🎯 **Single Purpose** - ONLY parses intents, never converses
- 📝 **158-Line System Prompt** - Extremely detailed instructions
- 💯 **Deterministic Output** - Always returns JSON, never text
- 🧠 **Smart Parsing** - Handles decimals, token names, amounts
- ⚠️ **Error Handling** - Clear errors for unclear requests

## Why a Separate Agent?

Instead of making the main chat agent handle both conversation AND parsing, we separated concerns:

**Main Chat Agent:**
- Friendly conversation
- Contextual responses
- Calls this agent when needed

**Intent Parser Agent (this):**
- No context needed
- No conversation
- Pure input → JSON transformation
- Easier to debug and improve

This architecture makes both agents more reliable.

## Tech Stack

- **Framework:** Hono (HTTP routing)
- **AI SDK:** Vercel AI SDK v5.0.27
- **Model:** Google Gemini 2.5 Flash
- **Agent SDK:** @nullshot/agent 0.3.4
- **Platform:** Cloudflare Workers + Durable Objects

## Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .vars-example .dev.vars
# Edit .dev.vars with your API key
```

### Environment Variables

Create a `.dev.vars` file:

```env
# AI Provider
AI_PROVIDER=google

# Google AI API Key
AI_PROVIDER_API_KEY=your_google_ai_api_key

# Model ID
MODEL_ID=gemini-2.5-flash
```

### Development

```bash
# Start development server
pnpm dev

# Agent will be available at http://localhost:54082
```

## API

### POST `/agent/chat/:sessionId?`

**Note:** Despite the endpoint name, this is NOT a chat interface. It's designed to accept a single query and return JSON.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "swap 0.01 ETH for USDC"
    }
  ]
}
```

**Response (streaming):**
```json
{
  "action": "prepare_transaction",
  "contract_key": "UNISWAP_ROUTER",
  "function_name": "swapExactETHForTokens",
  "args": [
    0,
    ["0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"],
    "[USER_WALLET_ADDRESS]",
    "[CURRENT_TIMESTAMP_PLUS_600S]"
  ],
  "value": "0.01"
}
```

## System Prompt

The heart of this agent is its **158-line system prompt** that defines:

### Core Rules
```
- NEVER engage in conversation
- NEVER respond with plain text  
- ONLY output JSON
- Output errors as JSON: {"error": "..."}
```

### Supported Operations

#### 1. NFT Minting
User says: "mint 1 nft" or "claim 2 nfts"

```json
{
  "action": "prepare_transaction",
  "contract_key": "NFT_DROP",
  "function_name": "claim",
  "args": [
    "[USER_WALLET_ADDRESS]",
    1,
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    0,
    {
      "proof": [],
      "quantityLimitPerWallet": "0",
      "pricePerToken": "0",
      "currency": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    },
    "0x"
  ],
  "value": "0"
}
```

#### 2. Swap ETH → Token
User says: "swap 0.05 eth for usdc"

```json
{
  "action": "prepare_transaction",
  "contract_key": "UNISWAP_ROUTER",
  "function_name": "swapExactETHForTokens",
  "args": [
    0,
    ["0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"],
    "[USER_WALLET_ADDRESS]",
    "[CURRENT_TIMESTAMP_PLUS_600S]"
  ],
  "value": "0.05"
}
```

#### 3. Swap Token → ETH (Requires Approval)
User says: "swap 100 usdc for eth"

```json
{
  "action": "prepare_transaction",
  "contract_key": "UNISWAP_ROUTER",
  "function_name": "swapExactTokensForETH",
  "args": [
    100000000,
    0,
    ["0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"],
    "[USER_WALLET_ADDRESS]",
    "[CURRENT_TIMESTAMP_PLUS_600S]"
  ],
  "value": "0.0",
  "requires_approval": true,
  "approval_token": "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
  "approval_amount": "100000000"
}
```

#### 4. Swap Token → Token
User says: "swap 50 usdc for dai"

```json
{
  "action": "prepare_transaction",
  "contract_key": "UNISWAP_ROUTER",
  "function_name": "swapExactTokensForTokens",
  "args": [
    50000000,
    0,
    ["0x94a9...", "0x7b79...", "0xFF34..."],
    "[USER_WALLET_ADDRESS]",
    "[CURRENT_TIMESTAMP_PLUS_600S]"
  ],
  "value": "0.0",
  "requires_approval": true,
  "approval_token": "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
  "approval_amount": "50000000"
}
```

### Token Recognition

The agent recognizes tokens **case-insensitively**:

| User Can Say | Token | Address |
|--------------|-------|---------|
| "eth", "ethereum", "ether" | WETH | 0x7b79... |
| "usdc", "usd coin" | USDC | 0x94a9... |
| "dai", "dai" | DAI | 0xFF34... |
| "usdt", "tether" | USDT | 0xaA8E... |
| "link", "chainlink" | LINK | 0xf8Fb... |
| "uni", "uniswap" | UNI | 0x4c4d... |

### Amount Calculations

Agent handles decimals automatically:

**ETH/WETH (18 decimals):**
- User: "1.5 ETH" → `"1.5"`
- User: "swap 1.5 dai" → `1500000000000000000`

**USDC/USDT (6 decimals):**
- User: "100 USDC" → `100000000`
- User: "50.5 usdc" → `50500000`

### Error Handling

**Missing information:**
```json
{
  "error": "Missing required information. Please specify which tokens and how much."
}
```

**Unclear request:**
```json
{
  "error": "Request is unclear, please be more specific."
}
```

## Examples

### Valid Requests

✅ "mint 1 nft"  
✅ "swap 0.01 eth for usdc"  
✅ "trade 100 usdc for dai"  
✅ "swap 50 link for eth"  
✅ "exchange 1.5 dai for usdc"  

### Invalid Requests (Return Errors)

❌ "swap tokens" → Missing amounts  
❌ "hello" → Not a blockchain operation  
❌ "transfer 100" → Missing token name  

## Key Features

### 1. Placeholder System

The agent outputs placeholders that the MCP Server replaces:

- `[USER_WALLET_ADDRESS]` → Actual wallet address
- `[CURRENT_TIMESTAMP_PLUS_600S]` → Deadline (now + 10 minutes)

This keeps the prompt simple while allowing dynamic values.

### 2. Approval Detection

For token swaps (not ETH swaps), the agent automatically includes:
```json
{
  "requires_approval": true,
  "approval_token": "0xTokenAddress",
  "approval_amount": "AmountInSmallestUnit"
}
```

### 3. Path Construction

For token-to-token swaps, the agent builds the optimal path:
```json
"path": [
  "0xInputToken",
  "0xWETH",        // Always routes through WETH
  "0xOutputToken"
]
```

## Configuration

### Update Token List

Edit the system prompt in [`src/index.ts`](./src/index.ts):

```typescript
const SYSTEM_PROMPT = `...
Known Token Addresses (Sepolia Testnet):
- YOUR_TOKEN: "0xYourTokenAddress"
- USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"
...

Token Decimals:
- YOUR_TOKEN: XX decimals
...

Token Recognition Rules:
- User can say "YOUR_TOKEN", "your token name" → Use YOUR_TOKEN address
...
`;
```

### Add New Operations

To add support for new contract functions:

1. **Add contract details:**
```typescript
const SYSTEM_PROMPT = `...
3. YOUR_NEW_OPERATION

Contract: "YOUR_CONTRACT_KEY"
Function: "yourFunctionName"
Function Signature: yourFunction(type param1, type param2)

Rules for Args:
- param1: Description and rules
- param2: Description and rules
...
`;
```

2. **Add example:**
```typescript
const SYSTEM_PROMPT = `...
Examples

User: "your example request"
Output: { "action": "prepare_transaction", ... }
...
`;
```

## Testing

```bash
# Test with curl
curl -X POST http://localhost:54082/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "role": "user",
      "content": "swap 0.01 eth for usdc"
    }]
  }'
```

**Expected Response:**
```json
{
  "action": "prepare_transaction",
  "contract_key": "UNISWAP_ROUTER",
  "function_name": "swapExactETHForTokens",
  ...
}
```

## Deployment

```bash
# Add production API key
pnpm wrangler secret put AI_PROVIDER_API_KEY

# Deploy to Cloudflare Workers
pnpm deploy
```

## Architecture Decisions

### Why Streaming?

Even though we return JSON, we use streaming because:
1. Consistent with AI SDK patterns
2. The MCP Server reads streams anyway
3. Future-proof for progress updates

### Why So Detailed Prompt?

The 158-line prompt ensures:
- ✅ Handles all edge cases
- ✅ Consistent decimal calculations
- ✅ Clear error messages
- ✅ Proper approval detection
- ✅ Token name flexibility

### Why Gemini?

- **Fast:** Gemini 2.5 Flash is very quick
- **Structured Output:** Good at following JSON format
- **Cost:** Cheaper than GPT-4
- **Reliable:** Consistent responses

## Debugging

### Enable Verbose Logging

```typescript
// In src/index.ts
console.log('[Agent] Received messages:', JSON.stringify(messages, null, 2));
console.log('[Agent] Processing message array:', JSON.stringify(messageArray, null, 2));
```

### Test Specific Scenarios

Create a test file `test-intents.ts`:
```typescript
const testCases = [
  "mint 1 nft",
  "swap 0.01 eth for usdc",
  "swap 100 usdc for eth",
  "swap tokens", // Should error
];

for (const test of testCases) {
  // Call agent and check output
}
```

## Related Components

- **MCP Server** ([`../agent/mcp`](../agent/mcp)) - Calls this agent
- **Chat Agent** ([`../agent`](../agent)) - Indirectly uses this via MCP
- **Frontend** ([`../frontend`](../frontend)) - Displays parsed results

## Troubleshooting

### Returns text instead of JSON
- Check system prompt is being applied
- Verify model is Gemini 2.5 Flash
- Review prompt for ambiguity

### Wrong decimal calculations
- Check token decimals in prompt
- Verify multiplication logic
- Test with small amounts first

### Approval not detected
- Ensure `requires_approval` logic is in prompt
- Check function name detection
- Verify approval fields are present

## Contributing

Built for the Nullshot hackathon. Pull requests welcome!

## License

MIT
