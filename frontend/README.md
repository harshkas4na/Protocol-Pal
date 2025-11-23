# Protocol Pal - Frontend

> A beautiful, AI-powered Web3 chat interface for executing blockchain transactions through natural language.

## Overview

This is the **user-facing frontend** for Protocol Pal, built with Next.js and Thirdweb. Users connect their wallet and chat with an AI assistant that can execute blockchain transactions based on simple natural language commands.

### Features

- 🎨 **Modern Chat UI** - Beautiful, responsive interface with streaming responses
- 🔗 **Wallet Integration** - Seamless wallet connection via Thirdweb
- 💬 **Natural Language** - Just say "swap 0.01 ETH for USDC" or "mint 2 NFTs"
- 🔄 **Transaction Flow** - Automatic approval handling for ERC20 swaps
- ✅ **Real-time Updates** - Live transaction status and confirmation monitoring
- 📊 **Transaction Summaries** - Clear preview before execution

## Tech Stack

- **Framework:** Next.js 16.0.3 with React 19
- **Styling:** Tailwind CSS 4.1.9
- **Web3:** Thirdweb SDK + Ethers.js 5.7.2
- **UI Components:** Radix UI + shadcn/ui
- **Network:** Sepolia Testnet

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (MetaMask recommended)
- Sepolia testnet ETH ([get from faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values
```

### Environment Variables

Create a `.env.local` file:

```env
# Thirdweb Client ID (get from https://thirdweb.com/dashboard)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id

# Agent Backend URL (default: http://localhost:54237)
NEXT_PUBLIC_AGENT_URL=http://localhost:54237/agent/chat

# Alchemy RPC URL for Sepolia (for transaction monitoring)
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### Development

```bash
# Start the development server
npm run dev

# Open http://localhost:3000
```

**Important:** Make sure the backend services are running:
- Main Chat Agent (port 54237)
- MCP Server
- Intent Parser Agent

See [parent README](../README.md) for full setup instructions.

## Usage

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Select MetaMask or your preferred wallet
   - Switch to Sepolia testnet if prompted

2. **Chat with AI**
   - Type natural language requests like:
     - "Swap 0.01 ETH for USDC"
     - "Mint 1 NFT"
     - "Check my USDC balance"

3. **Review & Execute**
   - AI parses your request and shows transaction summary
   - Review the details (contract, amount, network)
   - Click "Execute Transaction" or "Approve & Execute"
   - Confirm in your wallet

4. **Track Status**
   - View real-time transaction status
   - Get confirmation when complete
   - Click Etherscan link to verify

## Architecture

```
User Input
    ↓
Chat Interface (page.tsx)
    ↓
Main Chat Agent (/agent)
    ↓
MCP Server (/agent/mcp)
    ↓
Intent Parser (/intent-parser-agent)
    ↓
Transaction JSON
    ↓
Thirdweb + MetaMask
    ↓
Sepolia Blockchain
```

## Key Files

- [`app/chat/page.tsx`](./app/chat/page.tsx) - Main chat interface (618 lines)
- [`app/page.tsx`](./app/page.tsx) - Landing page
- [`app/layout.tsx`](./app/layout.tsx) - Root layout with Thirdweb provider
- [`components/ui/`](./components/ui/) - shadcn/ui components

## Transaction Flow

### Simple Transaction (ETH → Token)
1. User: "swap 0.01 ETH for USDC"
2. Frontend sends to Chat Agent
3. Chat Agent calls MCP tool
4. MCP prepares transaction with ABI
5. Frontend shows summary
6. User clicks "Execute"
7. Thirdweb encodes + sends transaction
8. User confirms in MetaMask
9. Frontend monitors confirmation
10. Success! ✅

### Complex Transaction (Token → Token)
Requires **2 transactions**:
1. Approval transaction (allow Uniswap to spend tokens)
2. Wait for confirmation
3. Main swap transaction
4. Both confirmed ✅

## Customization

### Add New Supported Tokens

Edit the token addresses in:
- Backend: [`/agent/mcp/src/tools.ts`](../agent/mcp/src/tools.ts)
- Frontend will automatically support new tokens

### Change Network

1. Update `chain` in wallet connection:
   ```typescript
   <ConnectButton client={client} chain={sepolia} />
   ```

2. Update transaction preparation:
   ```typescript
   const tx = prepareTransaction({
     chain: yourNetwork, // Change here
     // ...
   })
   ```

3. Update contract addresses for target network

### Styling

- Global styles: [`app/globals.css`](./app/globals.css)
- Tailwind config: [`tailwind.config.js`](./tailwind.config.js)
- Component variants: Uses Tailwind classes

## Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm start

# Deploy to Vercel (recommended)
vercel deploy
```

### Vercel Deployment

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

Make sure to update `NEXT_PUBLIC_AGENT_URL` to your production backend URL.

## Troubleshooting

### "Failed to connect to backend"
- Check that all backend services are running
- Verify `NEXT_PUBLIC_AGENT_URL` is correct
- Check browser console for CORS errors

### "Please connect your wallet"
- Make sure MetaMask is installed
- Check that you're on Sepolia testnet
- Try refreshing the page

### "Transaction failed"
- Check you have enough Sepolia ETH
- Verify you're on the correct network
- Check gas price isn't too low

### Wallet not connecting
- Clear browser cache
- Disable conflicting wallet extensions
- Try a different browser

## Contributing

This is a hackathon project for Nullshot. Feel free to fork and improve!

## License

MIT
