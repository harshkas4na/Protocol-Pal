'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Sparkles, Zap, Shield, Brain, ChevronDown, Wrench, MessageCircle, Cpu, Play, Github, Twitter, BookOpen, Code, Rocket, CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: Sparkles,
      title: "Natural Language",
      description: "Speak to your wallet in plain English. No complex commands or syntax needed.",
      color: "from-indigo-500 to-purple-600"
    },
    {
      icon: Brain,
      title: "Intelligent Parsing",
      description: "Our agent understands context and builds optimized transactions automatically.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Zap,
      title: "Instant Execution",
      description: "Connect your wallet and execute transactions with a single confirmation.",
      color: "from-pink-500 to-rose-600"
    }
  ]

  const useCases = [
    "Swap 0.01 ETH for USDC on Uniswap",
    "Stake 100 USDC on Aave",
    "Bridge tokens to Polygon",
    "Mint NFTs from collection",
    "Check wallet balance",
    "Send tokens to address"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-x-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
          ? 'border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-xl'
          : 'border-b border-transparent bg-transparent'
          }`}
      >
        <div className="container max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 overflow-hidden">
              <img src="/logo.png" alt="Protocol Pal Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Protocol Pal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/harshkas4na/Protocol-Pal"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Github size={20} />
            </a>
            <Link href="/chat">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-6 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40">
                Launch App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(71 85 105 / 0.3) 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }} />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 container max-w-6xl mx-auto px-6">
          {/* Badge */}
          <div className="text-center mb-8 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-sm">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-sm tracking-wide text-indigo-300 font-medium">
                AI-Powered Web3 Assistant
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-8 leading-tight animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Natural Language is <br />
            Your New{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Wallet
              </span>
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-sm" />
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg md:text-xl text-slate-400 text-center max-w-3xl mx-auto mb-12 leading-relaxed animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Introducing Protocol Pal, the AI assistant that turns plain English into on-chain transactions.
            No more complex interfaces—just tell us what you want to do.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <Link href="/chat">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-8 py-6 text-lg shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40">
                Try the Demo
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold px-8 py-6 text-lg backdrop-blur-sm hover:border-indigo-500/50 transition-all">
              <BookOpen className="mr-2" size={20} />
              View Documentation
            </Button>
          </div>

          {/* Use Case Examples */}
          <div className="flex justify-center animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div className="inline-flex flex-wrap justify-center gap-2 max-w-2xl">
              {useCases.slice(0, 4).map((useCase, index) => (
                <div
                  key={index}
                  className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm hover:border-indigo-500/50 hover:text-slate-300 transition-all cursor-default"
                >
                  "{useCase}"
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="flex justify-center mt-20 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
              <ChevronDown size={20} className="animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-32 container max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            See it in <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Action</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Watch how Protocol Pal transforms natural language into executable Web3 transactions
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <Card className="w-full max-w-5xl border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl hover:shadow-indigo-500/10 transition-all backdrop-blur-sm">
            <div className="aspect-video bg-slate-900 relative overflow-hidden group">
              <video
                className="w-full h-full object-cover"
                controls
                playsInline
                src="/Live_Demo.mp4"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </Card>
        </div>

        <div className="flex justify-center">
          <Link href="/chat">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-8 py-4 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105">
              Try the Live Demo
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 container max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
            Powered by <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Advanced AI</span>
          </h2>
          <p className="text-slate-400 text-lg">
            State-of-the-art technology that makes Web3 accessible to everyone
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isActive = activeFeature === index

            return (
              <Card
                key={index}
                className={`border-slate-800 bg-slate-900/50 p-8 hover:bg-slate-800/80 transition-all duration-500 backdrop-blur-sm group cursor-pointer ${isActive ? 'ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/20' : ''
                  }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-100 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                  {feature.description}
                </p>
              </Card>
            )
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 bg-slate-900/30 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">
              Simple, Powerful <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Architecture</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              A composable system that connects conversational AI with blockchain execution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent -translate-y-1/2" />

            {/* Step 1 */}
            <Card className="border-slate-800 bg-slate-900/50 p-6 hover:bg-slate-800/80 transition-all backdrop-blur-sm relative group">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/50">
                1
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <MessageCircle size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-100">
                Chat UI
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                User connects their wallet and types a request in natural language
              </p>
            </Card>

            {/* Step 2 */}
            <Card className="border-slate-800 bg-slate-900/50 p-6 hover:bg-slate-800/80 transition-all backdrop-blur-sm relative group">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/50">
                2
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Brain size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-100">
                Main AI Agent
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                The agent understands intent and calls the appropriate MCP tool
              </p>
            </Card>

            {/* Step 3 */}
            <Card className="border-slate-800 bg-slate-900/50 p-6 hover:bg-slate-800/80 transition-all backdrop-blur-sm relative group">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/50">
                3
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Wrench size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-100">
                Web3 MCP Tool
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                A thin wrapper that delegates complex parsing to our internal agent
              </p>
            </Card>

            {/* Step 4 */}
            <Card className="border-slate-800 bg-slate-900/50 p-6 hover:bg-slate-800/80 transition-all backdrop-blur-sm relative group">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/50">
                4
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Cpu size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-100">
                IntentParserAgent
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our "chef" parses, validates, and builds the final signable transaction
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* For Builders Section */}
      <section className="py-32 container max-w-4xl mx-auto px-6">
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-12 text-center backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/50">
              <Code size={32} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-slate-100">
              Build Your Own <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI Agent</span>
            </h2>
            <p className="text-xl text-slate-400 mb-8 leading-relaxed max-w-2xl mx-auto">
              Our core MCP utility is open-source. Plug it into any NullShot agent to give it instant Web3 superpowers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 bg-transparent px-8 py-4 border hover:border-indigo-400 transition-all hover:scale-105"
              >
                <Github className="mr-2" size={20} />
                Get the MCP on GitHub
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 hover:bg-slate-800 text-slate-300 px-8 py-4 transition-all"
              >
                <BookOpen className="mr-2" size={20} />
                Read the Docs
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 container max-w-6xl mx-auto px-6">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-100">
            Ready to Experience the Future?
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Join the revolution of natural language Web3 interactions. No credit card required.
          </p>
          <Link href="/chat">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-12 py-6 text-lg shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40">
              <Rocket className="mr-2" size={24} />
              Launch Protocol Pal
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 overflow-hidden">
                <img src="/logo.png" alt="Protocol Pal Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Protocol Pal
              </span>
            </div>
            <p className="text-slate-500 text-sm text-center">
              A NullShot Hacks: Season 0 Submission. Built with NullShot, Edenlayer, and Thirdweb.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/harshkas4na/Protocol-Pal" className="text-slate-400 hover:text-slate-200 transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}