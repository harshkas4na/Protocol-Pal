# Protocol Pal - Main Chat Agent

> The conversational AI agent that bridges natural language and blockchain transactions.

## Overview

This is the **main chat agent** that users interact with. It's a friendly, conversational AI that can both chat casually AND execute blockchain operations using MCP tools.

### What This Agent Does

- 🗣️ **Casual Conversation** - Chat naturally about Web3, crypto, or anything
- 🔧 **Tool Calling** - Uses MCP tools to execute blockchain transactions
- 🔄 **Streaming Responses** - Real-time response streaming for better UX
- 💾 **Session Memory** - Maintains conversation context using Durable Objects
- 🌐 **Global Edge** - Deployed on Cloudflare Workers for low latency

## Architecture

```
User Message
    ↓
Chat Agent (this component)
    ↓
Checks: Is this a blockchain request?
    ├─ No → Respond conversationally
    └─ Yes → Call prepare_natural_language_transaction tool
              ↓
         MCP Server processes request
              ↓
         Returns transaction JSON
              ↓
         Agent formats response for frontend
```

## Tech Stack

- **Framework:** Hono (HTTP routing)
- **AI SDK:** Vercel AI SDK v5.0.27
- **Model:** Google Gemini 2.5 Flash
- **Agent SDK:** @nullshot/agent 0.3.4
- **Platform:** Cloudflare Workers + Durable Objects
- **MCP:** @nullshot/mcp integration

## Quick Start

### Prerequisites

- Node.js 22+ and pnpm
- Cloudflare account (for deployment)
- Google AI API key ([get here](https://makersuite.google.com/app/apikey))

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
# AI Provider (currently only Google supported)
AI_PROVIDER=google

# Google AI API Key
AI_PROVIDER_API_KEY=your_google_ai_api_key

# Model ID (default: gemini-2.5-flash)
MODEL_ID=gemini-2.5-flash
```

### MCP Dependencies

This agent depends on the MCP Server. The dependency is configured in [`mcp.json`](./mcp.json):

```json
{
  "mcpServers": {
    "mcp-template": {
      "source": "github:null-shot/typescript-mcp-template"
    }
  }
}
```

Update this to point to your local MCP server during development.

### Development

```bash
# Start development server (includes MCP dependencies)
pnpm dev

# Agent will be available at http://localhost:54237
```

**Note:** Wrangler may show MCP services as "[not connected]" but they actually work - this is a known Wrangler race condition.

## API Endpoints

### POST `/agent/chat/:sessionId?`

Main chat endpoint with streaming response.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "swap 0.01 ETH for USDC",
      "userAddress": "0x1234..."
    }
  ]
}
```

**Response (streaming):**

For regular conversation:
```
Just streams the AI's response text...
```

For blockchain operations:
```json
{
  "type": "contractCall",
  "message": "I've prepared your transaction:",
  "transaction": {
    "contract_key": "UNISWAP_ROUTER",
    "contract_address": "0xC532a74...",
    "function_name": "swapExactETHForTokens",
    "args": [...],
    "value": "0.01",
    "abi": [...]
  },
  "requiresApproval": false,
  "approvalTransaction": null
}
```

**Session Management:**
- `sessionId` is optional
- If not provided, generates new UUID
- Sessions persist in Durable Objects
- Each session maintains conversation history

## System Prompt

The agent uses a detailed system prompt that instructs it to:

1. **Be friendly and conversational** for regular chat
2. **Detect blockchain requests** (swap, mint, transfer, etc.)
3. **Call MCP tool** with user query + wallet address
4. **Format response as JSON** with transaction data
5. **No extra explanation** - just the JSON for contract calls

See [`src/index.ts`](./src/index.ts) line 100-128 for the full prompt.

## How It Works

### Regular Chat Example

User: "What is Ethereum?"

```typescript
// Agent responds conversationally
"Ethereum is a decentralized blockchain platform..."
```

### Blockchain Request Example

User: "swap 0.01 ETH for USDC"

```typescript
// 1. Agent detects this is a blockchain operation
// 2. Calls prepare_natural_language_transaction tool
const toolResult = await mcpTool({
  query: "swap 0.01 ETH for USDC",
  userAddress: "0x1234..."
});

// 3. Tool returns transaction data
// 4. Agent outputs ONLY JSON:
{
  "type": "contractCall",
  "transaction": {...},
  "requiresApproval": false
}
```

## Key Features

### Streaming Response
```typescript
const result = await this.streamTextWithMessages(
  sessionId,
  messageArray,
  {
    system: SYSTEM_PROMPT,
    maxSteps: 10,
    experimental_toolCallStreaming: true
  }
);

return result.toTextStreamResponse();
```

### Tool Integration
```typescript
// Tools are automatically loaded from MCP config
super(state, env, model, [new ToolboxService(env, mcpConfig)]);
```

### Error Handling
```typescript
onError: (error: unknown) => {
  console.error("[ChatAgent] Error:", error);
}
```

## Customization

### Change AI Provider

To use OpenAI instead of Google:

```typescript
// Add to constructor switch statement
case "openai":
  provider = createOpenAI({ apiKey: env.AI_PROVIDER_API_KEY });
  model = provider.languageModel(env.MODEL_ID || "gpt-4");
  break;
```

Don't forget to:
```bash
pnpm add @ai-sdk/openai
```

### Modify System Prompt

Edit the system prompt in [`src/index.ts`](./src/index.ts) to change behavior:

```typescript
system: `You are a friendly Web3 assistant...
  [Your custom instructions here]
`
```

### Add More Tools

Update [`mcp.json`](./mcp.json) to include more MCP servers:

```json
{
  "mcpServers": {
    "mcp-template": {
      "source": "github:null-shot/typescript-mcp-template"
    },
    "your-custom-mcp": {
      "source": "github:yourorg/your-mcp-server"
    }
  }
}
```

## Deployment

### Deploy to Cloudflare Workers

```bash
# Add production secrets
pnpm wrangler secret put AI_PROVIDER_API_KEY
# Paste your API key when prompted

# Deploy
pnpm deploy
```

### Configuration

The [`wrangler.jsonc`](./wrangler.jsonc) file configures:
- Service name
- Durable Object bindings
- Environment variables
- MCP service bindings

## Testing

```bash
# Test locally
curl -X POST http://localhost:54237/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "role": "user",
      "content": "Hello!",
      "userAddress": "0x1234..."
    }]
  }'
```

## Monitoring

```bash
# View live logs
pnpm wrangler tail

# View in dashboard
https://dash.cloudflare.com
```

## Project Structure

```
/agent
├── src/
│   └── index.ts           # Main agent implementation
├── mcp.json               # MCP dependencies
├── wrangler.jsonc        # Cloudflare config
├── package.json          # Dependencies
├── .dev.vars             # Local environment (gitignored)
└── .vars-example         # Example env vars
```

## Related Components

- **MCP Server** ([`../agent/mcp`](../agent/mcp)) - Provides blockchain tools
- **Intent Parser** ([`../intent-parser-agent`](../intent-parser-agent)) - Parses natural language
- **Frontend** ([`../frontend`](../frontend)) - User interface

## Troubleshooting

### "Unsupported AI provider"
- Check `AI_PROVIDER` in `.dev.vars`
- Ensure it's set to "google"

### "Failed to call MCP tool"
- Verify MCP server is running
- Check `mcp.json` configuration
- Review Wrangler service bindings

### Sessions not persisting
- Check Durable Object bindings in wrangler.jsonc
- Verify session ID is being passed correctly

## Contributing

Built for the Nullshot hackathon. Contributions welcome!

## License

MIT
