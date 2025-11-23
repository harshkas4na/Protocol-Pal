# Protocol Pal 🤖⛓️

> An AI-powered Web3 assistant that executes blockchain transactions through natural language.

[![Built for Nullshot](https://img.shields.io/badge/Built%20for-Nullshot-purple)](https://nullshot.ai)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)

## What is Protocol Pal?

Protocol Pal is a **conversational AI agent** that lets users execute blockchain transactions by simply talking. Instead of navigating complex DEX interfaces, users can say:

- 💬 "Swap 0.01 ETH for USDC"
- 💬 "Mint 2 NFTs"  
- 💬 "Check my token balances"

The AI understands the request, prepares the transaction, and executes it on the Sepolia testnet via MetaMask.

## Demo

https://github.com/user-attachments/assets/your-demo-video

## Architecture

Protocol Pal consists of **4 interconnected components**:

```
┌─────────────┐
│   User 👤   │ "swap 0.01 ETH for USDC"
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Frontend (Next.js + Thirdweb)       │  Beautiful chat UI
│  /frontend                           │  Wallet integration
└──────────────┬───────────────────────┘  Transaction execution
               │
               ↓
┌──────────────────────────────────────┐
│  Main Chat Agent (Gemini AI)         │  Conversational AI
│  /agent                              │  Can chat + call tools
└──────────────┬───────────────────────┘  Session management
               │
               ↓ (calls MCP tool)
┌──────────────────────────────────────┐
│  MCP Server                          │  Blockchain tools
│  /agent/mcp                          │  Balance checking
└──────────────┬───────────────────────┘  Transaction prep
               │
               ↓ (calls microservice)
┌──────────────────────────────────────┐
│  Intent Parser Agent (Gemini AI)     │  NLP → JSON
│  /intent-parser-agent                │  Specialized parser
└──────────────┬───────────────────────┘  158-line system prompt
               │
               ↓
        Transaction JSON
```

### Component Breakdown

| Component | Purpose | Tech Stack |
|-----------|---------|------------|
| **[Frontend](./frontend)** | User interface | Next.js 16, Thirdweb, Tailwind CSS |
| **[Chat Agent](./agent)** | Conversational AI | Gemini 2.5 Flash, Nullshot Agent SDK |
| **[MCP Server](./agent/mcp)** | Blockchain tools | Nullshot MCP SDK, Cloudflare Workers |
| **[Intent Parser](./intent-parser-agent)** | NL → JSON parser | Gemini 2.5 Flash, detailed prompts |

## Features

✨ **Natural Language** - Just talk to your AI  
🔗 **Wallet Integration** - Connect via MetaMask  
⚡ **Real-time Streaming** - See AI thinking in real-time  
🔄 **Approval Handling** - Automatic ERC20 approval detection  
📊 **Transaction Summaries** - Preview before execution  
✅ **Confirmation Tracking** - Monitor tx status on-chain  
🌐 **Global Edge** - Deployed on Cloudflare Workers  

### Supported Operations

#### Token Swaps (Uniswap V2)
- ✅ ETH → Token (e.g., "swap 0.01 ETH for USDC")
- ✅ Token → ETH (e.g., "swap 100 USDC for ETH")  
- ✅ Token → Token (e.g., "swap 50 USDC for DAI")

#### NFT Minting
- ✅ Free NFT claims (e.g., "mint 2 NFTs")

#### Balance Checking
- ✅ ETH and ERC20 balances (e.g., "check my balance")

**Network:** Sepolia Testnet

**Tokens Supported:**  
WETH, USDC, DAI, USDT, LINK, UNI

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Cloudflare Account** (free tier works)
- **Google AI API Key** ([get here](https://makersuite.google.com/app/apikey))
- **Thirdweb Client ID** ([get here](https://thirdweb.com/dashboard))
- **MetaMask** or any Web3 wallet
- **Sepolia ETH** ([faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/protocol-pal
cd protocol-pal
```

### Setup Each Component

#### 1. Intent Parser Agent

```bash
cd intent-parser-agent
pnpm install
cp .vars-example .dev.vars
# Edit .dev.vars and add your Google AI API key
pnpm dev  # Runs on port 54082
```

#### 2. MCP Server

```bash
cd ../agent/mcp
pnpm install
# No env vars needed for local development
pnpm dev  # MCP Inspector launches on port 6274
```

#### 3. Main Chat Agent

```bash
cd ../agent
pnpm install
cp .vars-example .dev.vars
# Edit .dev.vars and add your Google AI API key
pnpm dev  # Runs on port 54237
```

#### 4. Frontend

```bash
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local:
#   - Add Thirdweb Client ID
#   - Set NEXT_PUBLIC_AGENT_URL=http://localhost:54237/agent/chat
#   - Add Alchemy RPC URL (optional, for better monitoring)
npm run dev  # Runs on port 3000
```

### Access the App

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Switch to Sepolia testnet
4. Start chatting! Try: "swap 0.01 ETH for USDC"

## Environment Variables

### Intent Parser & Chat Agent

```env
AI_PROVIDER=google
AI_PROVIDER_API_KEY=your_google_ai_api_key
MODEL_ID=gemini-2.5-flash
```

### Frontend

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_AGENT_URL=http://localhost:54237/agent/chat
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

## How It Works

### Complete Flow Example

User: **"swap 0.01 ETH for USDC"**

```
1. Frontend sends message to Chat Agent
   ↓
2. Chat Agent detects this is a blockchain operation
   ↓
3. Calls MCP tool: prepare_natural_language_transaction
   ↓
4. MCP Server forwards to Intent Parser Agent
   ↓
5. Intent Parser returns:
   {
     "contract_key": "UNISWAP_ROUTER",
     "function_name": "swapExactETHForTokens",
     "args": [0, ["0xWETH", "0xUSDC"], "[USER_ADDRESS]", "[DEADLINE]"]
   }
   ↓
6. MCP Server:
   - Replaces [USER_ADDRESS] with actual address
   - Replaces [DEADLINE] with timestamp + 10 min
   - Fetches contract address & ABI
   - Checks if approval needed (No, it's ETH swap)
   ↓
7. Returns to Chat Agent with complete transaction
   ↓
8. Chat Agent formats as JSON response
   ↓
9. Frontend parses JSON, shows transaction summary
   ↓
10. User clicks "Execute Transaction"
    ↓
11. Frontend encodes transaction using ethers.js
    ↓
12. Sends via Thirdweb prepareTransaction()
    ↓
13. User confirms in MetaMask
    ↓
14. Transaction sent to Sepolia ⛓️
    ↓
15. Frontend monitors confirmation
    ↓
16. Success! Shows Etherscan link ✅
```

### For Token Swaps (Requires Approval)

User: **"swap 100 USDC for ETH"**

```
Same flow, but:

5. Intent Parser includes:
   {
     "requires_approval": true,
     "approval_token": "0xUSDC",
     "approval_amount": "100000000"
   }

6. MCP Server creates approval transaction:
   {
     "contract_address": "0xUSDC",
     "function_name": "approve",
     "args": ["0xUniswapRouter", "100000000"]
   }

11-13. Frontend sends approval tx first
14. Waits for confirmation
15. Then sends main swap tx
16. Both confirmed! ✅
```

## Project Structure

```
/web3-ai
├── /frontend                   # Next.js UI
│   ├── /app
│   │   ├── /chat
│   │   │   └── page.tsx       # Main chat interface
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing page
│   ├── /components/ui         # shadcn components
│   └── package.json
│
├── /agent                      # Main Chat Agent
│   ├── /src
│   │   └── index.ts           # Conversational AI
│   ├── mcp.json               # MCP dependencies
│   └── wrangler.jsonc
│
├── /agent/mcp                  # MCP Server
│   ├── /src
│   │   ├── tools.ts           # 2 tools (balance + tx prep)
│   │   ├── server.ts
│   │   └── index.ts
│   └── wrangler.jsonc
│
└── /intent-parser-agent        # Intent Parser
    ├── /src
    │   └── index.ts           # NL → JSON parser
    └── wrangler.jsonc
```

Each folder has its own detailed README:
- [Frontend README](./frontend/README.md)
- [Chat Agent README](./agent/README.md)
- [MCP Server README](./agent/mcp/README.md)
- [Intent Parser README](./intent-parser-agent/README.md)

## Tech Stack

### Frontend
- Next.js 16.0.3
- React 19.2.0
- Thirdweb SDK
- Tailwind CSS 4.1.9
- Radix UI + shadcn/ui

### Backend (All Agents)
- Cloudflare Workers
- Durable Objects
- Hono (HTTP routing)
- Vercel AI SDK v5
- Google Gemini 2.5 Flash
- Nullshot Agent SDK
- Nullshot MCP SDK

### Blockchain
- Ethers.js 5.7.2
- Sepolia Testnet
- Uniswap V2
- Alchemy RPC

## Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel deploy
```

Set environment variables in Vercel dashboard.

### Backend Services (Cloudflare Workers)

```bash
# Deploy intent parser
cd intent-parser-agent
pnpm wrangler secret put AI_PROVIDER_API_KEY
pnpm deploy

# Deploy MCP server
cd ../agent/mcp
pnpm deploy

# Deploy chat agent
cd ../agent
pnpm wrangler secret put AI_PROVIDER_API_KEY
pnpm deploy
```

Update frontend `NEXT_PUBLIC_AGENT_URL` to production URL.

## Development Best Practices

### Running All Services

Use tmux or separate terminals:

```bash
# Terminal 1
cd intent-parser-agent && pnpm dev

# Terminal 2  
cd agent/mcp && pnpm dev

# Terminal 3
cd agent && pnpm dev

# Terminal 4
cd frontend && npm run dev
```

### Debugging

Enable verbose logging in each component:
```typescript
console.log('[Component] Debug info:', data);
```

Use MCP Inspector at http://localhost:6274 to test tools.

### Testing Transactions

Use Sepolia faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

## Troubleshooting

### Services won't start
- Check all dependencies are installed (`pnpm install` / `npm install`)
- Verify Node.js version (18+)
- Check ports aren't already in use

### Frontend can't connect to backend
- Ensure all 3 backend services are running
- Verify `NEXT_PUBLIC_AGENT_URL` is correct
- Check browser console for errors

### Transactions fail
- Ensure you're on Sepolia testnet
- Check you have enough ETH for gas
- Verify token addresses are correct

### AI returns errors
- Check API keys are valid
- Verify rate limits aren't exceeded
- Review request format

## Contributing

This project was built for the Nullshot hackathon. Contributions are welcome!

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Areas for Improvement

- [ ] Multi-chain support (Polygon, BSC, etc.)
- [ ] More DeFi protocols (Aave, Compound)
- [ ] Gas estimation and optimization
- [ ] Price quotes before execution
- [ ] Transaction history persistence
- [ ] Slippage protection
- [ ] ENS integration
- [ ] Advanced intents ("split 1 ETH into USDC and DAI")

## Built With

- [Nullshot Agent SDK](https://nullshot.ai) - AI agent framework
- [Nullshot MCP SDK](https://nullshot.ai) - Model Context Protocol
- [Vercel AI SDK](https://sdk.vercel.ai) - AI integration
- [Thirdweb](https://thirdweb.com) - Web3 development
- [Cloudflare Workers](https://workers.cloudflare.com) - Edge computing
- [Google AI](https://ai.google.dev) - Gemini 2.5 Flash

## License

MIT License - see [LICENSE](LICENSE) file

## Contact

Built by [@harshkasana](https://github.com/harshkasana) for the Nullshot hackathon.

## Acknowledgments

- Nullshot team for the amazing MCP and Agent frameworks
- Thirdweb for making Web3 development easy
- Cloudflare for providing global edge infrastructure
- Google for Gemini 2.5 Flash API

---

**⭐ Star this repo if you find it useful!**

**🐛 Found a bug?** [Open an issue](https://github.com/yourusername/protocol-pal/issues)

**💡 Have an idea?** [Start a discussion](https://github.com/yourusername/protocol-pal/discussions)
