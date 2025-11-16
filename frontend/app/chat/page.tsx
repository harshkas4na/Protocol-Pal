'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, Sparkles, Loader2, Home, Wallet, Copy, Check, Clock, ArrowRightLeft, Coins } from 'lucide-react'
import { createThirdwebClient } from "thirdweb"
import { ConnectButton, useSendTransaction, useActiveAccount } from "thirdweb/react"
import { sepolia } from "thirdweb/chains"
import { prepareTransaction } from "thirdweb"
import { ethers } from "ethers"

const client = createThirdwebClient({ 
  clientId: "1353c50f8dafe774715b8df7c412f2e2" 
})

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isContractCall?: boolean
  transactionData?: any
  requiresApproval?: boolean
  approvalTransaction?: any
  displayMessage?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const account = useActiveAccount()
  const { mutate: sendTransaction } = useSendTransaction()

  // useEffect(() => {
  //   if (!hasInitialized) {
  //     setMessages([
  //       {
  //         id: '0',
  //         role: 'assistant',
  //         content: "Welcome to Protocol Pal 👋\n\nI'm your AI-powered Web3 assistant. Connect your wallet to the Sepolia testnet and tell me what you'd like to do in natural language.\n\nTry asking me to:\n• Swap 0.01 ETH for USDC\n• Check token balances\n• Mint NFTs\n• Send tokens\n\nHow can I help you today?",
  //         timestamp: new Date(),
  //       },
  //     ])
  //     setHasInitialized(true)
  //   }
  // }, [hasInitialized])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  const waitForTransactionConfirmation = async (txHash: string): Promise<void> => {
    const checkTransaction = async (): Promise<boolean> => {
      try {
        const response = await fetch('https://eth-sepolia.g.alchemy.com/v2/cJIehF2H1TGkdVlz9iaSf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [txHash],
            id: 1
          })
        })
        
        const data = await response.json()
        
        if (data.result && data.result.status) {
          const status = parseInt(data.result.status, 16)
          if (status === 1) return true
          if (status === 0) throw new Error(`Transaction reverted`)
        }
        return false
      } catch (error) {
        return false
      }
    }
    
    let attempts = 0
    const maxAttempts = 60
    
    while (attempts < maxAttempts) {
      const confirmed = await checkTransaction()
      if (confirmed) return
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++
    }
  }

  const executeTransaction = async (txData: any, label: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const { contract_address, function_name, args, value, abi, data, to } = txData

      // Handle simple transfer (data + to format)
      if (data !== undefined && to) {
        const valueInWei = value && parseFloat(value) > 0 
          ? BigInt(Math.floor(parseFloat(value) * 1e18))
          : BigInt(0)

        const tx = prepareTransaction({
          to: to as `0x${string}`,
          value: valueInWei,
          data: (data || '0x') as `0x${string}`,
          chain: sepolia,
          client: client,
        })

        sendTransaction(tx, {
          onSuccess: (result) => {
            resolve(result.transactionHash)
          },
          onError: (error) => {
            reject(error)
          },
        })
        return
      }

      // Handle ABI-based contract call
      if (!abi || !contract_address || !function_name) {
        reject(new Error("Missing transaction data. Please try again."))
        return
      }

      try {
        const iface = new ethers.utils.Interface(abi)
        const encodedData = iface.encodeFunctionData(function_name, args || [])

        const valueInWei = value && parseFloat(value) > 0 
          ? BigInt(Math.floor(parseFloat(value) * 1e18))
          : BigInt(0)

        const tx = prepareTransaction({
          to: contract_address as `0x${string}`,
          value: valueInWei,
          data: encodedData as `0x${string}`,
          chain: sepolia,
          client: client,
        })

        sendTransaction(tx, {
          onSuccess: (result) => {
            resolve(result.transactionHash)
          },
          onError: (error) => {
            reject(error)
          },
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  const executeContractCall = async (transactionData: any, approvalTransaction?: any) => {
    if (!account?.address) {
      alert("Please connect your wallet first.")
      return
    }

    setIsPreparing(true)
    try {
      if (approvalTransaction) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `🔄 Step 1/2: Requesting approval...\n\nPlease confirm the approval transaction in your wallet.`,
            timestamp: new Date(),
          },
        ])
        
        const approvalHash = await executeTransaction(approvalTransaction, "Approval")
        
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `✅ Approval sent: ${approvalHash.slice(0, 10)}...${approvalHash.slice(-8)}\n\n⏳ Waiting for confirmation...`,
            timestamp: new Date(),
          },
        ])
        
        await waitForTransactionConfirmation(approvalHash)
        
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `✅ Approval confirmed!\n\n🔄 Step 2/2: Sending main transaction...`,
            timestamp: new Date(),
          },
        ])
        
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      const txHash = await executeTransaction(transactionData, "Transaction")
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Transaction successful!\n\n📋 Hash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}\n\n🔍 View: https://sepolia.etherscan.io/tx/${txHash}`,
          timestamp: new Date(),
        },
      ])
      
    } catch (error) {
      const errorMessage = (error as Error).message || "Unknown error"
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ Transaction failed: ${errorMessage}\n\nTips:\n• Check wallet balance\n• Verify network (Sepolia)\n• Try rephrasing your request`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsPreparing(false)
    }
  }

  const generateSummary = (txData: any, requiresApproval: boolean) => {
    const functionName = txData.function_name || ''
    const contractKey = txData.contract_key || 'contract'
    const value = txData.value ? parseFloat(txData.value).toFixed(4) : '0'
    
    let summary = {
      title: '',
      details: [] as string[],
      icon: 'default'
    }

    if (functionName.toLowerCase().includes('swap') || contractKey.toLowerCase().includes('swap')) {
      summary.title = 'Token Swap'
      summary.icon = 'swap'
      summary.details = [
        `Using ${contractKey}`,
        parseFloat(value) > 0 ? `Sending ${value} ETH` : 'Token-to-token swap',
        'Network: Sepolia Testnet'
      ]
    } else if (functionName.toLowerCase().includes('mint')) {
      summary.title = 'Mint NFT'
      summary.icon = 'mint'
      summary.details = [
        `Collection: ${contractKey}`,
        parseFloat(value) > 0 ? `Cost: ${value} ETH` : 'Free mint',
        'Network: Sepolia Testnet'
      ]
    } else if (functionName.toLowerCase().includes('transfer')) {
      summary.title = 'Transfer Tokens'
      summary.icon = 'transfer'
      summary.details = [
        `Transferring via ${contractKey}`,
        parseFloat(value) > 0 ? `Amount: ${value} ETH` : 'Token transfer',
        'Network: Sepolia Testnet'
      ]
    } else {
      summary.title = functionName ? `${functionName.charAt(0).toUpperCase()}${functionName.slice(1)}` : 'Execute Transaction'
      summary.icon = 'default'
      summary.details = [
        `Contract: ${contractKey}`,
        parseFloat(value) > 0 ? `Value: ${value} ETH` : 'No ETH transfer',
        'Network: Sepolia Testnet'
      ]
    }

    if (requiresApproval) {
      summary.details.push('⚠️ Requires 2 transactions')
    }

    return summary
  }

  const handleAgentResponse = async (fullMessage: string) => {
    // Try to find JSON in the message
    const jsonMatch = fullMessage.match(/\{[\s\S]*"type"\s*:\s*"contractCall"[\s\S]*\}/)
    
    if (!jsonMatch) return

    try {
      const agentResponse = JSON.parse(jsonMatch[0])
      
      if (agentResponse.type === "contractCall" && agentResponse.transaction) {
        const summary = generateSummary(
          agentResponse.transaction,
          agentResponse.requiresApproval || false
        )

        // Extract the clean message before the JSON
        const cleanMessage = "I've prepared your transaction:"

        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                content: cleanMessage,
                displayMessage: cleanMessage,
                isContractCall: true,
                transactionData: agentResponse.transaction,
                requiresApproval: agentResponse.requiresApproval || false,
                approvalTransaction: agentResponse.approvalTransaction || null,
              },
            ]
          }
          return prev
        })
      }
    } catch (e) {
      console.error("Failed to parse transaction:", e)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const messageWithAddress = {
        ...userMessage,
        userAddress: account?.address || null,
      }

      const response = await fetch("https://intent-parser-agent-iw3xyyes1-harshkasana05-gmailcoms-projects.vercel.app/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, messageWithAddress],
        }),
      })

      if (!response.ok) throw new Error("Failed to connect to backend")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantMessage += chunk

          // Update message in real-time
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1]
            if (lastMessage && lastMessage.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: assistantMessage },
              ]
            } else {
              return [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: assistantMessage,
                  timestamp: new Date(),
                },
              ]
            }
          })
        }
        
        // Process for transaction data after streaming is complete
        await handleAgentResponse(assistantMessage)
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Sorry, I couldn't connect to the backend.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const suggestedPrompts = [
    "Swap 0.01 ETH for USDC",
    "Mint 1 NFT",
  ]

  const isEmpty = messages.length <= 1
  const showLoading = isLoading || isPreparing

  const getTransactionSummary = (msg: Message) => {
    if (!msg.transactionData) return null
    return generateSummary(msg.transactionData, msg.requiresApproval || false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center py-4 md:py-8 px-4">
      <Card className="w-full max-w-5xl h-[95vh] md:h-[90vh] border-slate-800 bg-slate-900/80 overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100">Protocol Pal</h1>
              <p className="text-xs text-slate-400">AI Web3 Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:flex-none">
              <ConnectButton client={client} chain={sepolia} theme="dark" />
            </div>
            <Link href="/">
              <Button size="sm" variant="outline" className="border-slate-700 hover:border-indigo-500 hover:bg-slate-800 text-slate-300">
                <Home size={16} />
              </Button>
            </Link>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-6 scroll-smooth">
          {isEmpty && (
            <div className="flex items-center justify-center h-full text-center px-4">
              <div className="max-w-md">
                <div className="mb-6 relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                  <Sparkles size={48} className="text-indigo-400 mx-auto relative z-10 animate-pulse" />
                </div>
                <p className="text-slate-100 text-xl font-semibold mb-3">Begin Your Journey</p>
                <p className="text-slate-400 text-sm mb-8">
                  {account?.address ? "Describe your transaction in natural language" : "Connect your wallet to get started"}
                </p>
                
                {account?.address && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Try asking:</p>
                    {suggestedPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(prompt)}
                        className="block w-full text-left px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all text-sm text-slate-300 hover:text-slate-100"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const summary = message.isContractCall ? getTransactionSummary(message) : null
            
            return (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                style={{animationDelay: `${index * 0.05}s`}}
              >
                <div className="relative group max-w-[85%] md:max-w-[80%]">
                  <div className={`rounded-2xl px-4 md:px-6 py-3 md:py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-lg'
                      : 'bg-slate-800/60 text-slate-100 border border-slate-700'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.displayMessage || message.content}
                    </p>
                    
                    {message.isContractCall && message.transactionData && summary && (
                      <div className="mt-4 p-4 bg-slate-900/80 rounded-xl border border-slate-700/50 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            summary.icon === 'swap' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                            summary.icon === 'mint' ? 'bg-gradient-to-br from-pink-500 to-rose-600' :
                            'bg-gradient-to-br from-blue-500 to-cyan-600'
                          }`}>
                            {summary.icon === 'swap' ? <ArrowRightLeft size={20} className="text-white" /> : <Coins size={20} className="text-white" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-100 mb-2">{summary.title}</h4>
                            <div className="space-y-1">
                              {summary.details.map((detail, idx) => (
                                <p key={idx} className="text-xs text-slate-400">• {detail}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {message.requiresApproval && (
                          <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <Clock size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-300">2 transactions required: approval + execution</p>
                          </div>
                        )}
                        
                        <Button
                          onClick={() => executeContractCall(message.transactionData, message.approvalTransaction)}
                          disabled={isPreparing || !account?.address}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-50 shadow-lg"
                        >
                          {!account?.address ? "Connect Wallet" : isPreparing ? (
                            <><Loader2 size={16} className="mr-2 animate-spin" />Processing...</>
                          ) : message.requiresApproval ? "Approve & Execute" : "Execute Transaction"}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className={`flex items-center gap-2 mt-2 text-xs text-slate-500 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    {message.role === 'assistant' && (
                      <button onClick={() => handleCopy(message.content, message.id)} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-400">
                        {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {showLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-slate-800/60 text-slate-100 rounded-2xl border border-slate-700 px-4 md:px-6 py-3 md:py-4 flex gap-3 items-center">
                <Loader2 size={16} className="animate-spin text-indigo-400" />
                <span className="text-sm">{isPreparing ? "Preparing transaction..." : "Thinking..."}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="px-4 md:px-6 py-4 border-t border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3">
            <Input
              type="text"
              placeholder={account?.address ? "What would you like to do?" : "Connect wallet to start..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!account?.address || showLoading}
              className="flex-1 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 rounded-xl disabled:opacity-50"
            />
            <Button type="submit" disabled={!input.trim() || showLoading || !account?.address} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-50 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Send size={18} />
            </Button>
          </form>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Always verify transaction details before confirming in your wallet.
          </p>
        </div>
      </Card>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  )
}