"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ExternalLink, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useWallet } from "@/components/wallet-provider"
import { useActiveChain } from "@/hooks/use-active-chain"
import { NFT_CONTRACTS } from "@/lib/nft-contracts"
import { megaEth, soneiumMainnet, unichain } from "@/lib/chains"

const SECTIONS = [
  { id: "about", title: "About" },
  { id: "how-it-works", title: "How It Works" },
  { id: "supported-networks", title: "Supported Networks" },
  { id: "smart-contract", title: "Smart Contract" },
  { id: "scoring", title: "Scoring & Cooldown" },
  { id: "achievements", title: "NFT Achievements" },
  { id: "explorer", title: "Blockchain Explorer" },
  { id: "telegram-alerts", title: "Telegram Alerts" },
  { id: "leaderboard", title: "Leaderboard" },
  { id: "faq", title: "FAQ" },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      aria-label="Copy to clipboard"
      className="shrink-0 p-1.5 rounded text-gray-500 hover:text-white transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

const NETWORKS = [
  {
    name: "Soneium",
    id: 1868,
    gasToken: "ETH",
    explorer: "soneium.blockscout.com",
    iconUrl: soneiumMainnet.iconUrl || "/chains/soneium.png",
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET,
  },
  {
    name: "Ink",
    id: 57073,
    gasToken: "ETH",
    explorer: "explorer.inkonchain.com",
    iconUrl: "/chains/ink-logo-purple-white-icon.png",
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_INK_MAINNET,
  },
  {
    name: "Base",
    id: 8453,
    gasToken: "ETH",
    explorer: "base.blockscout.com",
    iconUrl: "/chains/base.png",
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_MAINNET,
  },
  {
    name: "Unichain",
    id: 130,
    gasToken: "ETH",
    explorer: "unichain.blockscout.com",
    iconUrl: "/chains/unichain.png",
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN,
  },
  {
    name: "MegaETH",
    id: 4326,
    gasToken: "ETH",
    explorer: "megaeth.blockscout.com",
    iconUrl: megaEth.iconUrl || "/chains/megaeth.png",
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH,
  },
  {
    name: "LitVM LiteForge",
    id: 4441,
    gasToken: "zkLTC",
    explorer: "liteforge.explorer.caldera.xyz",
    iconUrl: "/chains/litvm.png",
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LITVM,
  },
  {
    name: "Arc Testnet",
    id: 5042002,
    gasToken: "USDC",
    explorer: "testnet.arcscan.app",
    iconUrl: "/chains/arc.png",
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARC,
  },
]

export default function DocsContent() {
  const [activeSection, setActiveSection] = useState("about")
  const { isConnected } = useWallet()
  const { chainConfig: cfg } = useActiveChain()
  const isMegaEth = isConnected && cfg?.name === 'MegaETH'
  const isInk = isConnected && cfg?.name === 'Ink'
  const isUnichain = isConnected && cfg?.name === 'Unichain'
  const isBase = isConnected && cfg?.name === 'Base'
  const isSoneium = isConnected && cfg?.name === 'Soneium'
  const isLitvm = isConnected && cfg?.name === 'LitVM'
  const isArc = isConnected && cfg?.name === 'Arc Testnet'

  const displayNetworks = NETWORKS

  useEffect(() => {
    const headings = document.querySelectorAll('section[id]')

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .map(e => e.target.id)

        if (visible.length > 0) {
          const topmost = Array.from(headings)
            .find(el => visible.includes(el.id))
          if (topmost) setActiveSection(topmost.id)
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    )

    headings.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) {
      const offset = 80
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
  }

  const networkText = "multiple blockchain ecosystems"
  const step2Text = "Choose from Ink, Soneium, Base, Unichain, MegaETH, LitVM, or Arc"

  return (
    <main className={`relative z-10 min-h-screen pt-24 pb-12 px-4 md:px-8 ${isMegaEth ? 'text-white font-mono' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0] font-mono' : 'text-white'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
          {/* Sticky Sidebar */}
          <aside className="hidden md:block w-[260px] shrink-0 sticky top-[80px] self-start h-fit max-h-[calc(100vh-100px)] overflow-y-auto">
            <nav className="space-y-1 pr-4">
              <h3 className={`text-xs font-semibold ${isLitvm ? 'lowercase' : 'uppercase'} tracking-wider mb-4 px-3 ${isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isLitvm ? 'text-[#00F2FE]' : isArc ? 'text-[#4D8EE9]' : !isConnected ? 'text-white' : 'text-[#0047FF]'}`}>
                {isMegaEth ? '// DOCUMENTATION' : isLitvm ? '>> documentation' : 'Documentation'}
              </h3>
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-medium transition-all duration-200 border-l-[2px]",
                    isMegaEth 
                      ? activeSection === section.id
                        ? "text-[#00ff88] border-[#00ff88] bg-[#00ff88]/5 rounded-none uppercase"
                        : "text-white/40 border-transparent hover:text-white hover:bg-white/5 rounded-none uppercase"
                      : isInk
                        ? activeSection === section.id
                          ? "text-[#7B61FF] border-[#7B61FF] bg-[#7B61FF]/10 rounded-r-3xl"
                          : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent rounded-r-3xl"
                        : isUnichain
                          ? activeSection === section.id
                            ? "text-[#FF007A] border-[#FF007A] bg-[#FF007A]/10 rounded-r-2xl"
                            : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent rounded-r-2xl"
                      : isBase
                        ? activeSection === section.id
                          ? "text-[#0052FF] border-[#0052FF] bg-[#0052FF]/5 rounded-r-full"
                          : "text-black/40 border-transparent hover:text-black hover:bg-black/5 rounded-r-full"
                      : isLitvm
                        ? activeSection === section.id
                          ? "text-[#00F2FE] border-[#00F2FE] bg-[#00F2FE]/10 rounded-none lowercase font-mono"
                          : "text-[#E2E8F0]/40 border-transparent hover:text-[#E2E8F0] hover:bg-white/5 rounded-none lowercase font-mono"
                      : isArc
                        ? activeSection === section.id
                          ? "text-[#4D8EE9] border-[#4D8EE9] bg-[#4D8EE9]/10 rounded-r-full"
                          : "text-white/40 border-transparent hover:text-white hover:bg-white/5 rounded-r-full"
                      : isSoneium
                          ? activeSection === section.id
                            ? "text-[#0047FF] border-[#0047FF] bg-[#0047FF]/10 rounded-r-full shadow-[inset_0_0_10px_rgba(0,71,255,0.1)]"
                            : "text-white/40 border-transparent hover:text-white hover:bg-white/5 rounded-r-full"
: activeSection === section.id
  ? !isConnected
    ? "text-white border-white/20 bg-white/[0.08] rounded-md"
    : "text-[#0047FF] border-[#0047FF] bg-[#0047FF]/10 rounded-md"
  : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent rounded-md"
                  )}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0 max-w-4xl space-y-24">
            <section id="about">
              <h1 className={`text-4xl font-extrabold mb-8 pl-3 border-l-2 ${isMegaEth ? 'border-[#00ff88] uppercase text-white' : isInk ? 'border-[#7B61FF] tracking-tight text-white' : isUnichain ? 'border-[#FF007A] font-serif italic text-white' : isBase ? 'border-[#0052FF] tracking-tighter text-black' : isSoneium ? 'border-[#0047FF] text-white tracking-tight' : isLitvm ?'border-[#00F2FE] text-[#E2E8F0]' : !isConnected ? 'border-white/20 text-white' : 'border-[#0047FF] text-white'}`}>
                {isMegaEth ? '// WHAT IS QUIZ ON CHAIN?' : 'What is Quiz On Chain?'}
              </h1>
              <div className={`p-8 border ${isMegaEth ? 'bg-black border-white/15 rounded-none shadow-none' : isInk ? 'rounded-3xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md' : isUnichain ? 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md' : isBase ? 'rounded-2xl bg-[#f4f5f7] border-black/5 shadow-sm' : isSoneium ? 'rounded-2xl bg-white/[0.03] border-[#0047FF]/20 backdrop-blur-xl shadow-[0_0_30px_rgba(0,71,255,0.05)]' : isLitvm ? 'bg-[#0B192C] border border-[#00F2FE]/20 rounded-none' : 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md'}`}>
                <p className={`${isMegaEth ? 'text-white/60 text-base leading-relaxed' : isBase ? 'text-black/70 leading-relaxed text-lg font-medium' : isSoneium ? 'text-white/80 leading-relaxed text-lg font-medium' : isLitvm ? 'text-[#E2E8F0]/60 text-base leading-relaxed' : 'text-gray-300 leading-relaxed text-lg'}`}>
                  Quiz On Chain is a Web3 quiz application that tests your knowledge of {networkText}. Answer 5 questions generated from official documentation, then submit your score on-chain to compete on the global leaderboard.
                </p>
              </div>
            </section>

            <section id="how-it-works">
              <h2 className={`text-3xl font-extrabold mb-10 pl-3 border-l-2 ${isMegaEth ? 'border-[#00ff88] uppercase text-white' : isInk ? 'border-[#7B61FF] text-white' : isUnichain ? 'border-[#FF007A] text-white' : isBase ? 'border-[#0052FF] text-black' : isSoneium ? 'border-[#0047FF] text-white tracking-tight' : isLitvm ? 'border-[#00F2FE] text-[#E2E8F0]' : isArc ? 'border-[#4D8EE9] text-white' : !isConnected ? 'border-white/20 text-white' : 'border-[#0047FF] text-white'}`}>
                {isMegaEth ? '// HOW IT WORKS' : isLitvm ? '>> how it works' : 'How It Works'}
              </h2>
              <div className="relative space-y-10 pl-4 md:pl-0">
                {!isMegaEth && !isInk && !isUnichain && !isBase && !isSoneium && !isLitvm && !isArc && (
                  <div className={`absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b hidden md:block ${isConnected ? 'from-[#0047FF] via-[#0047FF]/20 to-[#0047FF]' : 'from-white/20 via-white/10 to-white/20'}`} />
                )}
                {isLitvm && (
                  <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#00F2FE] via-[#00F2FE]/20 to-[#00F2FE] hidden md:block" />
                )}
                {isArc && (
                  <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#4D8EE9] via-[#4D8EE9]/20 to-[#4D8EE9] hidden md:block" />
                )}
                {isSoneium && (
                  <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#0047FF] via-[#0047FF]/10 to-[#0047FF] hidden md:block shadow-[0_0_10px_rgba(0,71,255,0.2)]" />
                )}
                {isBase && (
                  <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#0052FF] via-[#0052FF]/20 to-[#0052FF] hidden md:block" />
                )}
                {isInk && (
                  <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#7B61FF] via-[#7B61FF]/20 to-[#7B61FF] hidden md:block" />
                )}
                {isUnichain && (
                  <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#FF007A] via-[#FF007A]/20 to-[#FF007A] hidden md:block" />
                )}
                
                {[
                  { step: "Step 1", title: "Connect your wallet", desc: "" },
                  { step: "Step 2", title: "Select your blockchain", desc: step2Text },
                  { step: "Step 3", title: "Take the quiz", desc: "Answer 5 questions sourced from official blockchain documentation" },
                  { step: "Step 4", title: "Submit your score on-chain", desc: "Sign a transaction to permanently record your score on the blockchain" },
                  { step: "Step 5", title: "Check the leaderboard", desc: "See how you rank against other players globally and per chain" },
                  { step: "Step 6", title: "Earn NFTs", desc: "Reach 100 points to mint an exclusive QuizMaster NFT and gain Master status" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 md:gap-8 relative items-start group">
                    <div className={`flex-shrink-0 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center font-black text-base md:text-xl z-20 transition-transform group-hover:scale-110 ${
                      isMegaEth 
                        ? 'bg-black border border-[#00ff88] text-[#00ff88] rounded-none' 
                        : isInk
                          ? 'rounded-full bg-[#7B61FF] text-white shadow-[0_0_20px_rgba(123,97,255,0.4)]'
                        : isUnichain
                          ? 'rounded-xl md:rounded-2xl bg-[#FF007A] text-white shadow-[0_0_20px_rgba(255,0,122,0.4)]'
                        : isBase
                          ? 'rounded-full bg-[#0052FF] text-white shadow-lg shadow-[#0052FF]/20'
                        : isSoneium
                          ? 'rounded-full bg-[#0047FF] text-white shadow-[0_0_25px_rgba(0,71,255,0.5)]'
                        : isLitvm
                          ? 'bg-[#00F2FE] text-[#0B192C] rounded-none shadow-[0_0_20px_rgba(0,242,254,0.4)]'
                        : isArc
                          ? 'rounded-full bg-[#4D8EE9] text-white shadow-[0_0_20px_rgba(77,142,233,0.4)]'
                          : !isConnected
  ? 'rounded-full bg-white/10 text-white'
  : 'rounded-full bg-[#0047FF] text-white shadow-[0_0_20px_rgba(0,71,255,0.4)]'
                    }`}>
                      {i + 1}
                    </div>
                    <div className={`p-4 md:p-6 flex-1 transition-all border ${
                      isMegaEth 
                        ? 'bg-black border-white/10 rounded-none hover:border-[#00ff88]/30' 
                        : isInk
                          ? 'rounded-2xl md:rounded-3xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md hover:bg-white/[0.06] hover:border-[#7B61FF]/50'
                        : isUnichain
                          ? 'rounded-xl md:rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md hover:bg-white/[0.06] hover:border-[#FF007A]/50 text-white'
                        : isBase
                          ? 'rounded-xl md:rounded-2xl bg-[#f4f5f7] border-black/5 hover:border-[#0052FF]/30 text-black'
                        : isSoneium
                          ? 'rounded-xl md:rounded-2xl bg-white/[0.02] border-[#0047FF]/10 hover:bg-white/[0.04] hover:border-[#0047FF]/40 text-white backdrop-blur-xl'
                        : isLitvm
                          ? 'bg-[#0B192C] border-[#00F2FE]/20 rounded-none hover:border-[#00F2FE]/50'
                        : isArc
                          ? 'rounded-xl md:rounded-2xl bg-white/[0.02] border-[#4D8EE9]/10 hover:bg-white/[0.04] hover:border-[#4D8EE9]/40 text-white backdrop-blur-xl'
                          : 'rounded-xl md:rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md hover:bg-white/[0.06] text-white'
                    }`}>
                      <h4 className={`text-base md:text-xl font-bold mb-1 md:mb-2 ${isMegaEth || isLitvm ?'' : ''}`}>{item.step}: {item.title}</h4>
                      <p className={`${isMegaEth ? 'text-white/40 text-sm leading-relaxed' : isBase ? 'text-black/60 text-sm md:text-base leading-relaxed' : isSoneium ? 'text-white/50 text-sm md:text-base leading-relaxed' : isLitvm ? 'text-[#E2E8F0]/50 text-sm leading-relaxed' : 'text-gray-400 text-sm md:text-base leading-relaxed'}`}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
 
            <section id="supported-networks">
              <h2 className={`text-3xl font-extrabold mb-8 pl-3 border-l-2 ${isMegaEth ? 'border-[#00ff88] uppercase text-white' : isInk ? 'border-[#7B61FF] text-white' : isUnichain ? 'border-[#FF007A] text-white' : isBase ? 'border-[#0052FF] text-black' : isLitvm ? 'border-[#00F2FE] text-[#E2E8F0]' : isArc ? 'border-[#4D8EE9] text-white' : !isConnected ? 'border-white/20 text-white' : 'border-[#0047FF] text-white'}`}>
                {isMegaEth ? '// SUPPORTED NETWORKS' : isLitvm ? '>> supported networks' : "Supported Networks"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {displayNetworks.map((network) => (
                  <div key={network.name} className={`p-6 transition-all flex flex-col justify-between border ${
                    isMegaEth 
                      ? 'bg-black border-white/10 rounded-none hover:border-[#00ff88]/30' 
                      : isInk
                        ? 'rounded-3xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md hover:border-[#7B61FF]/50'
                      : isUnichain
                        ? 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md hover:border-[#FF007A]/50'
                      : isLitvm
                        ? 'bg-[#0B192C] border-[#00F2FE]/20 rounded-none hover:border-[#00F2FE]/50'
                      : isArc
                        ? 'rounded-2xl bg-white/[0.02] border-[#4D8EE9]/10 hover:border-[#4D8EE9]/50 backdrop-blur-xl text-white'
                        : !isConnected ? 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md hover:border-white/30' : 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md hover:border-[#0047FF]/50'
                  }`}>
                    <div>
                      <div className="flex items-center gap-4 mb-5">
                        <div className={`relative w-8 h-8 overflow-hidden p-1 flex-shrink-0 ${isMegaEth ? 'bg-black border border-white/15 rounded-none' : isLitvm ? 'border border-[#00F2FE]/30 rounded-none bg-[#0B192C]' : 'rounded-full bg-white/10'}`}>
                          <Image
                            src={network.iconUrl}
                            alt={network.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <h4 className={`text-2xl font-bold ${isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'} ${isMegaEth || isLitvm ?'' : ''}`}>{network.name}</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className={`${isMegaEth ? 'text-white/20 uppercase tracking-widest text-[10px]' : isBase ? 'text-black/40 font-medium tracking-tight uppercase' : isLitvm ?'text-[#E2E8F0]/30 tracking-widest text-[10px]' : 'text-gray-500 font-medium tracking-tight uppercase'}`}>Chain ID</span>
                          <span className={`font-mono px-2 py-0.5 ${isMegaEth ? 'text-[#00ff88] bg-white/5 rounded-none' : isBase ? 'text-black/60 bg-black/5 rounded' : isLitvm ? 'text-[#00F2FE] bg-white/5' : 'text-gray-300 bg-white/5 rounded'}`}>{network.id}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={`${isMegaEth ? 'text-white/20 uppercase tracking-widest text-[10px]' : isBase ? 'text-black/40 font-medium tracking-tight uppercase' : isLitvm ?'text-[#E2E8F0]/30 tracking-widest text-[10px]' : 'text-gray-500 font-medium tracking-tight uppercase'}`}>Gas Token</span>
                          <span className={`font-mono px-2 py-0.5 ${isMegaEth ? 'text-[#00ff88] bg-white/5 rounded-none' : isBase ? 'text-black/60 bg-black/5 rounded' : isLitvm ? 'text-[#00F2FE] bg-white/5' : 'text-gray-300 bg-white/5 rounded'}`}>{network.gasToken}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={`${isMegaEth ? 'text-white/20 uppercase tracking-widest text-[10px]' : isBase ? 'text-black/40 font-medium tracking-tight uppercase' : isLitvm ?'text-[#E2E8F0]/30 tracking-widest text-[10px]' : 'text-gray-500 font-medium tracking-tight uppercase'}`}>Explorer</span>
                          <a
                            href={`https://${network.explorer}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1 transition-colors ${isMegaEth ? 'text-[#00ff88] hover:text-[#00ff88]/70' : isInk ? 'text-[#7B61FF] hover:text-[#7B61FF]/80' : isUnichain ? 'text-[#FF007A] hover:text-[#FF007A]/80' : isLitvm ? 'text-[#00F2FE] hover:text-[#00F2FE]/80' : !isConnected ? 'text-white/60 hover:text-white' : 'text-[#0047FF] hover:text-[#0047FF]/80'}`}
                          >
                            {network.explorer}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="smart-contract">
              <h2 className={`text-3xl font-extrabold mb-8 pl-3 border-l-2 ${isMegaEth ? 'border-[#00ff88] uppercase text-white' : isInk ? 'border-[#7B61FF] text-white' : isUnichain ? 'border-[#FF007A] text-white' : isBase ? 'border-[#0052FF] text-black' : isLitvm ?'border-[#00F2FE] text-[#E2E8F0]' : !isConnected ? 'border-white/20 text-white' : 'border-[#0047FF] text-white'}`}>
                {isMegaEth ? '// SMART CONTRACT' : isLitvm ? '>> smart contract' : 'Smart Contract'}
              </h2>
              <div className="space-y-8">
                <div className={`p-8 border ${isMegaEth ? 'bg-black border-white/15 rounded-none' : isInk ? 'rounded-3xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md' : isUnichain ? 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md' : isBase ? 'rounded-2xl bg-[#f4f5f7] border-black/5' : isLitvm ? 'bg-[#0B192C] border-[#00F2FE]/20 rounded-none' : 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md'}`}>
                  <p className={`${isMegaEth ? 'text-white/60 text-base leading-relaxed' : isBase ? 'text-black/60 leading-relaxed text-lg' : isLitvm ? 'text-[#E2E8F0]/60 text-base leading-relaxed' : 'text-gray-300 leading-relaxed text-lg'}`}>
                    Your scores are stored permanently on-chain using the <code className={`px-1.5 py-0.5 rounded ${isMegaEth ? 'text-[#00ff88] bg-white/5 font-mono' : isInk ? 'text-[#7B61FF] bg-[#7B61FF]/10' : isUnichain ? 'text-[#FF007A] bg-[#FF007A]/10' : isBase ? 'text-[#0052FF] bg-black/5' : isLitvm ? 'text-[#00F2FE] bg-white/5 font-mono' : !isConnected ? 'text-white bg-white/10' : 'text-[#0047FF] bg-[#0047FF]/10'}`}>QuizScores</code> smart contract deployed on each network. The contract records your score, total questions, and timestamp. A trusted signer verifies each score before it can be submitted, preventing cheating.
                  </p>
                </div>
                
                <div className={`overflow-hidden border ${isMegaEth ? 'bg-black border-white/15 rounded-none shadow-none' : isInk ? 'rounded-3xl border-white/[0.08] bg-white/[0.02] backdrop-blur-sm' : isUnichain ? 'rounded-2xl border-white/[0.08] bg-white/[0.02] backdrop-blur-sm' : isBase ? 'rounded-2xl border-black/5 bg-white shadow-sm' : isLitvm ? 'bg-[#0B192C] border-[#00F2FE]/20 rounded-none' : 'rounded-2xl border-white/[0.08] bg-white/[0.02] backdrop-blur-sm'}`}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`${isMegaEth ? 'bg-white/5' : isBase ? 'bg-black/5' : isLitvm ? 'bg-white/5' : 'bg-white/[0.04]'}`}>
                        <th className={`px-6 py-4 text-xs font-bold ${isLitvm ? 'lowercase' : 'uppercase'} tracking-widest border-b ${isMegaEth ? 'text-white/40 border-white/10' : isBase ? 'text-black/40 border-black/5' : isLitvm ? 'text-[#E2E8F0]/40 border-[#00F2FE]/15' : 'text-gray-500 border-white/[0.08]'}`}>Network</th>
                        <th className={`px-6 py-4 text-xs font-bold ${isLitvm ? 'lowercase' : 'uppercase'} tracking-widest border-b ${isMegaEth ? 'text-white/40 border-white/10' : isBase ? 'text-black/40 border-black/5' : isLitvm ? 'text-[#E2E8F0]/40 border-[#00F2FE]/15' : 'text-gray-500 border-white/[0.08]'}`}>Contract Address</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isMegaEth ? 'divide-white/10' : isLitvm ? 'divide-[#00F2FE]/15' : 'divide-white/[0.08]'}`}>
                      {displayNetworks.map((network) => (
                        <tr key={network.name} className={`transition-colors group ${isBase ? 'hover:bg-black/5' : isLitvm ? 'hover:bg-white/[0.01]' : 'hover:bg-white/[0.01]'}`}>
                          <td className={`px-6 py-5 font-bold tracking-tight ${isMegaEth ? 'text-white uppercase' : isBase ? 'text-black' : isLitvm ?'text-[#E2E8F0]' : 'text-white'}`}>{network.name}</td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-between gap-4">
                              <span className={`font-mono text-xs break-all leading-relaxed transition-colors ${isMegaEth ? 'text-white/40 group-hover:text-[#00ff88]' : isBase ? 'text-black/40 group-hover:text-black/80' : isLitvm ? 'text-[#E2E8F0]/40 group-hover:text-[#00F2FE]' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                {network.address || "..."}
                              </span>
                              {network.address && <CopyButton text={network.address} />}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className={`text-lg font-bold mb-4 ${isMegaEth ? 'text-[#00ff88] uppercase' : isLitvm ? 'text-[#00F2FE] lowercase' : 'text-white'}`}>
                  QuizNFT
                </h3>
                <div className={`overflow-hidden border ${isMegaEth ? 'bg-black border-white/15 rounded-none shadow-none' : isInk ? 'rounded-3xl border-white/[0.08] bg-white/[0.02] backdrop-blur-sm' : isUnichain ? 'rounded-2xl border-white/[0.08] bg-white/[0.02] backdrop-blur-sm' : isBase ? 'rounded-2xl border-black/5 bg-white shadow-sm' : isLitvm ? 'bg-[#0B192C] border-[#00F2FE]/20 rounded-none' : 'rounded-2xl border-white/[0.08] bg-white/[0.02] backdrop-blur-sm'}`}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`${isMegaEth ? 'bg-white/5' : isBase ? 'bg-black/5' : isLitvm ? 'bg-white/5' : 'bg-white/[0.04]'}`}>
                        <th className={`px-6 py-4 text-xs font-bold ${isLitvm ? 'lowercase' : 'uppercase'} tracking-widest border-b ${isMegaEth ? 'text-white/40 border-white/10' : isBase ? 'text-black/40 border-black/5' : isLitvm ? 'text-[#E2E8F0]/40 border-[#00F2FE]/15' : 'text-gray-500 border-white/[0.08]'}`}>Network</th>
                        <th className={`px-6 py-4 text-xs font-bold ${isLitvm ? 'lowercase' : 'uppercase'} tracking-widest border-b ${isMegaEth ? 'text-white/40 border-white/10' : isBase ? 'text-black/40 border-black/5' : isLitvm ? 'text-[#E2E8F0]/40 border-[#00F2FE]/15' : 'text-gray-500 border-white/[0.08]'}`}>NFT Contract Address</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isMegaEth ? 'divide-white/10' : isLitvm ? 'divide-[#00F2FE]/15' : 'divide-white/[0.08]'}`}>
                      {displayNetworks.map((network) => {
                        const nftAddr = NFT_CONTRACTS[network.id]
                        const displayAddr = nftAddr || "—"
                        return (
                          <tr key={network.name} className={`transition-colors group ${isBase ? 'hover:bg-black/5' : isLitvm ? 'hover:bg-white/[0.01]' : 'hover:bg-white/[0.01]'}`}>
                            <td className={`px-6 py-5 font-bold tracking-tight ${isMegaEth ? 'text-white uppercase' : isBase ? 'text-black' : isLitvm ?'text-[#E2E8F0]' : 'text-white'}`}>{network.name}</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-between gap-4">
                                <span className={`font-mono text-xs break-all leading-relaxed transition-colors ${isMegaEth ? 'text-white/40 group-hover:text-[#00ff88]' : isBase ? 'text-black/40 group-hover:text-black/80' : isLitvm ? 'text-[#E2E8F0]/40 group-hover:text-[#00F2FE]' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                  {displayAddr}
                                </span>
                                {nftAddr && <CopyButton text={nftAddr} />}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section id="scoring">
              <h2 className={`text-3xl font-extrabold mb-8 pl-3 border-l-2 ${isMegaEth ? 'border-[#00ff88] uppercase text-white' : isInk ? 'border-[#7B61FF] text-white' : isUnichain ? 'border-[#FF007A] text-white' : isBase ? 'border-[#0052FF] text-black' : isLitvm ?'border-[#00F2FE] text-[#E2E8F0]' : !isConnected ? 'border-white/20 text-white' : 'border-[#0047FF] text-white'}`}>
                {isMegaEth ? '// SCORING & COOLDOWN' : isLitvm ? '>> scoring & cooldown' : 'Scoring & Cooldown'}
              </h2>
              <div className={`p-8 border ${
                isMegaEth 
                  ? 'bg-black border-[#00ff88]/30 rounded-none' 
                  : isInk
                    ? 'rounded-3xl bg-gradient-to-br from-[#7B61FF]/10 to-transparent border-[#7B61FF]/20 backdrop-blur-md'
                  : isUnichain
                    ? 'rounded-2xl bg-gradient-to-br from-[#FF007A]/10 to-transparent border-[#FF007A]/20 backdrop-blur-md'
                  : isBase
                    ? 'rounded-2xl bg-gradient-to-br from-[#0052FF]/5 to-transparent border-black/5 shadow-sm'
                  : isLitvm
                    ? 'bg-[#0B192C] border-[#00F2FE]/30 rounded-none'
                    : !isConnected
  ? 'rounded-2xl bg-white/[0.02] border-white/[0.08] backdrop-blur-md'
  : 'rounded-2xl bg-gradient-to-br from-[#0047FF]/10 to-transparent border-white/[0.08] backdrop-blur-md'
              }`}>
                 <p className={`${isMegaEth ? 'text-white/60 text-base leading-relaxed' : isBase ? 'text-black/60 text-base leading-relaxed' : isLitvm ? 'text-[#E2E8F0]/60 text-base leading-relaxed' : 'text-gray-300 leading-relaxed text-lg'}`}>
                   Each quiz round consists of 5 questions. Each correct answer awards 1 point for a maximum score of 5 per round. Your score is verified server-side against a signed JWT that was created when the quiz was generated — the server will only sign a valid score, preventing client-side manipulation. The server signs the approved score using ECDSA, and the smart contract verifies this signature before accepting the submission. After submitting a score on-chain, you must wait <span className={`font-bold underline underline-offset-4 ${isMegaEth ? 'text-[#00ff88] decoration-[#00ff88]/50' : isInk ? 'text-white decoration-[#7B61FF]' : isUnichain ? 'text-white decoration-[#FF007A]' : isBase ? 'text-black decoration-[#0052FF]' : isLitvm ? 'text-[#E2E8F0] decoration-[#00F2FE]' : !isConnected ? 'text-white decoration-white/50' : 'text-white decoration-[#0047FF]'}`}>1 hour</span> (contract-enforced) before you can play again. Players pay their own gas for score submission.
                 </p>
              </div>
            </section>

            <section id="achievements">
              <h2 className={`text-3xl font-extrabold mb-8 pl-3 border-l-2 ${isMegaEth ? 'border-[#00ff88] uppercase text-white' : isInk ? 'border-[#7B61FF] text-white' : isUnichain ? 'border-[#FF007A] text-white' : isBase ? 'border-[#0052FF] text-black' : isLitvm ?'border-[#00F2FE] text-[#E2E8F0]' : !isConnected ? 'border-white/20 text-white' : 'border-[#0047FF] text-white'}`}>
                {isMegaEth ? '// NFT ACHIEVEMENTS' : isLitvm ? '>> nft achievements' : 'NFT Achievements'}
              </h2>
              <div className={`p-8 border ${isMegaEth ? 'bg-black border-white/15 rounded-none' : isInk ? 'rounded-3xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md' : isUnichain ? 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md' : isBase ? 'rounded-2xl bg-[#f4f5f7] border-black/5' : isLitvm ? 'bg-[#0B192C] border-[#00F2FE]/20 rounded-none' : 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md'}`}>
                 <p className={`${isMegaEth ? 'text-white/60 text-base leading-relaxed' : isBase ? 'text-black/60 leading-relaxed text-lg' : isLitvm ? 'text-[#E2E8F0]/60 text-base leading-relaxed' : 'text-gray-300 leading-relaxed text-lg'}`}>
                     Once you reach <span className={`font-bold ${isMegaEth ? 'text-[#00ff88]' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>100 total points on any single chain</span>, you unlock the ability to mint an exclusive <span className={`font-bold ${isMegaEth ? 'text-[#00ff88]' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>"The What of Blockchain" (TWOB)</span> NFT directly in the app. One NFT is mintable per address per chain, across all 7 supported networks: Ink, Soneium, Base, Unichain, MegaETH, LitVM LiteForge, and Arc Testnet. Holding this NFT grants you the prestigious "Master" status on the leaderboard. You pay your own gas to mint (no gas tank).
                 </p>
              </div>
            </section>

            <section id="explorer">
              <h2 className={`text-3xl font-extrabold mb-8 pl-3 border-l-2 ${isMegaEth ? 'border-[#00ff88] uppercase text-white' : isInk ? 'border-[#7B61FF] text-white' : isUnichain ? 'border-[#FF007A] text-white' : isBase ? 'border-[#0052FF] text-black' : isLitvm ?'border-[#00F2FE] text-[#E2E8F0]' : !isConnected ? 'border-white/20 text-white' : 'border-[#0047FF] text-white'}`}>
                {isMegaEth ? '// BLOCKCHAIN EXPLORER' : isLitvm ? '>> blockchain explorer' : 'Blockchain Explorer'}
              </h2>
              <div className={`p-8 border space-y-4 ${isMegaEth ? 'bg-black border-white/15 rounded-none' : isInk ? 'rounded-3xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md' : isUnichain ? 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md' : isBase ? 'rounded-2xl bg-[#f4f5f7] border-black/5' : isLitvm ? 'bg-[#0B192C] border-[#00F2FE]/20 rounded-none' : 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md'}`}>
                <p className={`${isMegaEth ? 'text-white/60 text-base leading-relaxed' : isBase ? 'text-black/60 leading-relaxed text-lg' : isLitvm ? 'text-[#E2E8F0]/60 text-base leading-relaxed' : 'text-gray-300 leading-relaxed text-lg'}`}>
                  Dive into on-chain data with our interactive Blockchain Explorer. It features:
                </p>
                <ul className={`list-disc pl-6 space-y-2 ${isMegaEth ? 'text-white/50 text-sm' : isBase ? 'text-black/60 text-lg' : isLitvm ? 'text-[#E2E8F0]/50 text-sm' : 'text-gray-300 text-lg'}`}>
                  <li><span className={`font-bold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>Live Transaction Bubbles:</span> Transactions appear as animated floating bubbles on an interactive canvas.</li>
                  <li><span className={`font-bold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>Bubble Size:</span> Represents transaction value — larger bubbles mean higher-value transfers.</li>
                  <li><span className={`font-bold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>Bubble Color:</span> Color-coded by transaction type — native transfers, contract calls, token transfers, and NFT transfers.</li>
                  <li><span className={`font-bold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>Click to Inspect:</span> Click any bubble to open a detail panel showing value, from/to addresses, type, status, and timestamp.</li>
                  <li><span className={`font-bold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>Search Bar:</span> Search by address, transaction hash, or ENS name with live autocomplete and suggestions.</li>
                  <li><span className={`font-bold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>Address Orbit View:</span> Click an address to see all its transactions clustered in a focused orbit view.</li>
                  <li><span className={`font-bold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>Transaction Focus View:</span> Highlights connected addresses for a given transaction with visual links.</li>
                  <li><span className={`font-bold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>Filter Tabs:</span> Quickly switch between ALL, TRANSFERS, CONTRACT CALLS, TOKEN TRANSFERS, and NFTS views.</li>
                  <li><span className={`font-bold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>Real-Time Stats:</span> Live counters for Total TXs, Latest Block, and Average Gas displayed in the header.</li>
                  <li><span className={`font-bold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>Telegram Alerts:</span> Receive real-time notifications for matching transactions (see Telegram Alerts section).</li>
                  <li><span className={`font-bold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>Multi-Chain:</span> Supports all 7 chains — Ink, Soneium, Base, Unichain, MegaETH, LitVM LiteForge, and Arc Testnet.</li>
                </ul>
              </div>
            </section>

            <section id="telegram-alerts">
              <h2 className={`text-3xl font-extrabold mb-8 pl-3 border-l-2 ${isMegaEth ? 'border-[#00ff88] uppercase text-white' : isInk ? 'border-[#7B61FF] text-white' : isUnichain ? 'border-[#FF007A] text-white' : isBase ? 'border-[#0052FF] text-black' : isLitvm ?'border-[#00F2FE] text-[#E2E8F0]' : !isConnected ? 'border-white/20 text-white' : 'border-[#0047FF] text-white'}`}>
                {isMegaEth ? '// TELEGRAM ALERTS' : isLitvm ? '>> telegram alerts' : 'Telegram Alerts'}
              </h2>
              <div className={`p-8 border space-y-4 ${isMegaEth ? 'bg-black border-white/15 rounded-none' : isInk ? 'rounded-3xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md' : isUnichain ? 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md' : isBase ? 'rounded-2xl bg-[#f4f5f7] border-black/5' : isLitvm ? 'bg-[#0B192C] border-[#00F2FE]/20 rounded-none' : 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md'}`}>
                <p className={`${isMegaEth ? 'text-white/60 text-base leading-relaxed' : isBase ? 'text-black/60 leading-relaxed text-lg' : isLitvm ? 'text-[#E2E8F0]/60 text-base leading-relaxed' : 'text-gray-300 leading-relaxed text-lg'}`}>
                  The Bubble Explorer includes a real-time Telegram alert system. You can monitor live transactions on any supported chain and receive instant notifications in your Telegram account when high-value or specific transaction types occur.
                </p>
                <h4 className={`font-bold text-base ${isMegaEth ? 'text-[#00ff88] uppercase' : isLitvm ? 'text-[#00F2FE] lowercase' : 'text-white'}`}>How to set up:</h4>
                <ol className={`list-decimal pl-6 space-y-1.5 ${isMegaEth ? 'text-white/50 text-sm' : isBase ? 'text-black/60 text-base' : isLitvm ? 'text-[#E2E8F0]/50 text-sm' : 'text-gray-300 text-base'}`}>
                  <li>Create a Telegram bot via <code className={`px-1 py-0.5 rounded text-xs ${isMegaEth ? 'text-[#00ff88] bg-white/5' : isLitvm ? 'text-[#00F2FE] bg-white/5' : 'bg-white/10'}`}>@BotFather</code> and copy your bot token</li>
                  <li>Get your chat ID by messaging <code className={`px-1 py-0.5 rounded text-xs ${isMegaEth ? 'text-[#00ff88] bg-white/5' : isLitvm ? 'text-[#00F2FE] bg-white/5' : 'bg-white/10'}`}>@userinfobot</code> on Telegram</li>
                  <li>Open the Explorer on any chain</li>
                  <li>Click the <span className={`font-semibold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>"Alerts"</span> button in the top-right corner of the explorer</li>
                  <li>Enter your bot token and chat ID</li>
                  <li>Set your minimum ETH value threshold</li>
                  <li>Select which transaction types to monitor: Native transfers (coin sends), Contract calls, Token transfers, NFT transfers</li>
                  <li>Set cooldown minutes between alerts to avoid spam</li>
                  <li>Click <span className={`font-semibold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>"Test Connection"</span> to verify your setup</li>
                  <li>Toggle alerts ON — you will now receive real-time Telegram messages</li>
                </ol>
                <div className={`p-4 border ${isMegaEth ? 'bg-black border-[#00ff88]/20 rounded-none' : isInk ? 'rounded-2xl bg-[#7B61FF]/5 border-[#7B61FF]/15' : isUnichain ? 'rounded-xl bg-[#FF007A]/5 border-[#FF007A]/15' : isBase ? 'rounded-xl bg-[#0052FF]/5 border-black/5' : isLitvm ? 'bg-[#0B192C] border-[#00F2FE]/20 rounded-none' : 'rounded-xl bg-white/[0.03] border-white/[0.08]'}`}>
                  <p className={`text-xs ${isMegaEth ? 'text-white/40' : isBase ? 'text-black/40' : isLitvm ? 'text-[#E2E8F0]/40' : 'text-gray-400'}`}>
                    <span className={`font-bold ${isMegaEth ? 'text-[#00ff88]' : isLitvm ? 'text-[#00F2FE]' : 'text-white'}`}>Note:</span> Your bot token and chat ID are stored locally in your browser (localStorage) and never sent to any server except the Telegram API proxy.
                  </p>
                </div>
                <p className={`text-sm ${isMegaEth ? 'text-white/50' : isBase ? 'text-black/60' : isLitvm ? 'text-[#E2E8F0]/50' : 'text-gray-300'}`}>
                  Each alert includes the transaction type, value in the chain's native token, from/to addresses (truncated), and a direct link to the transaction in the chain's block explorer.
                </p>
              </div>
            </section>

            <section id="leaderboard">
              <h2 className={`text-3xl font-extrabold mb-8 pl-3 border-l-2 ${isMegaEth ? 'border-[#00ff88] uppercase text-white' : isInk ? 'border-[#7B61FF] text-white' : isUnichain ? 'border-[#FF007A] text-white' : isBase ? 'border-[#0052FF] text-black' : isLitvm ?'border-[#00F2FE] text-[#E2E8F0]' : !isConnected ? 'border-white/20 text-white' : 'border-[#0047FF] text-white'}`}>
                {isMegaEth ? '// LEADERBOARD' : isLitvm ? '>> leaderboard' : 'Leaderboard'}
              </h2>
              <div className={`p-8 border ${isMegaEth ? 'bg-black border-white/15 rounded-none' : isInk ? 'rounded-3xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md' : isUnichain ? 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md' : isBase ? 'rounded-2xl bg-[#f4f5f7] border-black/5' : isLitvm ? 'bg-[#0B192C] border-[#00F2FE]/20 rounded-none' : 'rounded-2xl bg-white/[0.04] border-white/[0.08] backdrop-blur-md'}`}>
                <p className={`${isMegaEth ? 'text-white/60 text-base leading-relaxed' : isBase ? 'text-black/60 leading-relaxed text-lg' : isLitvm ? 'text-[#E2E8F0]/60 text-base leading-relaxed' : 'text-gray-300 leading-relaxed text-lg'}`}>
                    The leaderboard tracks total points accumulated across all quizzes. Switch between 8 tabs: Global, Ink, Soneium, Base, Unichain, MegaETH, LitVM, and Arc. The Global leaderboard aggregates scores from Ink, Soneium, Base, and Unichain. MegaETH, LitVM, and Arc have their own per-chain tabs but are not included in the global aggregation. Use the <span className={`font-bold ${isMegaEth ? 'text-white' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>Show Masters Only</span> filter to see top-tier players who have minted their NFT. Your wallet address is displayed in truncated format for privacy.
                </p>
              </div>
            </section>

            <section id="faq" className="pb-40">
              <h2 className={`text-3xl font-extrabold mb-10 pl-3 border-l-2 ${isMegaEth ? 'border-[#00ff88] uppercase' : isInk ? 'border-[#7B61FF]' : isUnichain ? 'border-[#FF007A]' : isBase ? 'border-[#0052FF]' : isLitvm ? 'border-[#00F2FE]' : !isConnected ? 'border-white/20' : 'border-[#0047FF]'}`}>
                {isMegaEth ? '// FAQ' : isLitvm ? '>> faq' : 'FAQ'}
              </h2>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {[
                  { q: "Is the quiz free to play?", a: "Yes, playing the quiz is completely free. Submitting your score on-chain requires a small gas fee." },
                  { q: "How do I get a QuizMaster NFT?", a: "Keep playing and submitting scores! Once your total reaches 100 points on any single chain, a mint button will appear allowing you to claim your exclusive 'The What of Blockchain' (TWOB) NFT." },
                  { q: "What does the Blockchain Explorer do?", a: "It lets you visualize real-time transactions on supported networks. You can easily search for addresses and watch network activity dynamically." },
                  { q: "Are my scores stored permanently?", a: "Yes, scores submitted on-chain are stored permanently on the blockchain and cannot be deleted except by the contract owner." },
                  { q: "Are my scores stored permanently?", a: "Yes, scores submitted on-chain are stored permanently on the blockchain and cannot be deleted except by the contract owner." },
                  { q: "Which chains support NFT minting?", a: "All 7 chains — Ink, Soneium, Base, Unichain, MegaETH, LitVM LiteForge, and Arc Testnet. Each chain has its own NFT contract and you can mint one NFT per chain once you reach 100 points on that chain." },
                  { q: "What is zkLTC on LitVM LiteForge?", a: "zkLTC is the native gas token of the LitVM LiteForge testnet — a Litecoin-backed asset used to pay transaction fees on this EVM rollup." },
                  { q: "What is USDC on Arc Testnet?", a: "USDC is the native gas token of the Arc Testnet — a stablecoin-based fee model that eliminates gas price volatility for users." },
                  { q: "How do Telegram alerts work?", a: "From the Explorer page, click the Alerts button and configure your Telegram bot token and chat ID. You will receive real-time messages whenever transactions matching your filters occur on-chain. Your credentials are stored only in your browser's localStorage." },
                  { q: "Is my quiz score verified before going on-chain?", a: "Yes. When you finish a quiz, your answers are verified server-side against a signed JWT that was created when the quiz was generated. The server will only sign a valid score — preventing any client-side manipulation before the transaction is submitted." }
                ].map((faq, i) => (
                  <AccordionItem 
                    key={i} 
                    value={`item-${i}`}
                    className={`px-6 transition-all border ${
                      isMegaEth 
                        ? 'border-white/10 bg-black rounded-none data-[state=open]:border-[#00ff88]/50' 
                        : isInk
                          ? 'border-white/10 bg-white/5 rounded-3xl data-[state=open]:border-[#7B61FF]/50 data-[state=open]:bg-white/10 backdrop-blur-sm'
                        : isUnichain
                          ? 'border-white/10 bg-white/5 rounded-2xl data-[state=open]:border-[#FF007A]/50 data-[state=open]:bg-white/10 backdrop-blur-sm'
                        : isBase
                          ? 'border-black/5 bg-[#f4f5f7] rounded-2xl data-[state=open]:bg-white shadow-sm transition-all'
                        : isLitvm
                          ? 'border-[#00F2FE]/20 bg-[#0B192C] rounded-none data-[state=open]:border-[#00F2FE]/50'
                          : !isConnected
  ? 'border-white/[0.08] bg-white/[0.02] rounded-2xl data-[state=open]:bg-white/[0.04] data-[state=open]:border-white/30'
  : 'border-white/[0.08] bg-white/[0.02] rounded-2xl data-[state=open]:bg-white/[0.04] data-[state=open]:border-[#0047FF]/30'
                    }`}
                  >
                    <AccordionTrigger className={`text-lg font-bold hover:no-underline py-6 ${isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'} ${isMegaEth ? 'uppercase text-sm tracking-tight' : isInk || isUnichain ? 'tracking-tight' : isLitvm ?'text-sm tracking-tight' : ''}`}>
                      <div className="flex items-start text-left gap-4">
                        <span className={`${isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isLitvm ? 'text-[#00F2FE]' : !isConnected ? 'text-white' : 'text-[#0047FF]'} shrink-0 font-black`}>Q:</span>
                        {faq.q}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className={`text-base leading-relaxed pb-6 pl-9 ${isMegaEth ? 'text-white/50 lowercase text-sm' : isBase ? 'text-black/60' : isLitvm ? 'text-[#E2E8F0]/50 text-sm' : 'text-gray-400'}`}>
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </div>
        </div>
    </main>
  )
}
