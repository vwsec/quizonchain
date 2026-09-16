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
import { useChainUI } from "@/hooks/use-chain-ui"
import { accentTextClass } from "@/lib/chain-ui"
import { NFT_CONTRACTS } from "@/lib/nft-contracts"
import { megaEth, soneiumMainnet, unichain, abstractMainnet } from "@/lib/chains"

const SECTIONS = [
  { id: "about", title: "About" },
  { id: "how-it-works", title: "How It Works" },
  { id: "supported-networks", title: "Supported Networks" },
  { id: "smart-contract", title: "Smart Contract" },
  { id: "scoring", title: "Scoring & Cooldown" },
  { id: "achievements", title: "NFT Achievements" },
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
  {
    name: "Arc",
    id: 5042,
    gasToken: "USDC",
    explorer: "explorer.arc.io",
    iconUrl: "/chains/arc.png",
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARC_MAINNET,
  },
  {
    name: "Abstract",
    id: 2741,
    gasToken: "ETH",
    explorer: "abscan.org",
    iconUrl: abstractMainnet.iconUrl || "/chains/abstract.png",
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ABSTRACT,
  },
]

export default function DocsContent() {
  const [activeSection, setActiveSection] = useState("about")
  const ui = useChainUI()

  // Dark number on light accents, white number on dark accents (mirrors profile CTA contrast)
  const stepNumberText = ['default', 'megaeth', 'litvm', 'soneium', 'sepolia'].includes(ui.key)
    ? 'text-[#0B0B0F]'
    : 'text-white'

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
  const step2Text = "Choose from Ink, Soneium, Base, Unichain, MegaETH, LitVM, Arc, or Abstract"

  return (
    <main className={cn("relative z-10 min-h-screen pt-28 pb-12 px-4 md:px-8", ui.page)}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
          {/* Sticky Sidebar */}
          <aside className="hidden md:block w-[260px] shrink-0 sticky top-[80px] self-start h-fit max-h-[calc(100vh-100px)] overflow-y-auto">
            <nav className="space-y-1 pr-4">
              <h3 className={cn('text-xs font-semibold tracking-wider mb-4 px-3', ui.label)}>
                {ui.labelPrefix}Documentation
              </h3>
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-medium transition-all duration-200 border-l-[2px]",
                    activeSection === section.id
                      ? cn("rounded-r-full border-[var(--chain-accent)] bg-white/5", accentTextClass(ui))
                      : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent rounded-r-full"
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
              <h1 className="text-4xl font-extrabold mb-8 pl-3 border-l-2 text-white border-[var(--chain-accent)]">
                {ui.labelPrefix}What is Quiz On Chain?
              </h1>
              <div className="p-8 border arc-card rounded-xl">
                <p className="text-gray-300 leading-relaxed text-lg">
                  Quiz On Chain is a Web3 quiz application that tests your knowledge of {networkText}. Answer 5 questions generated from official documentation, then submit your score on-chain to compete on the global leaderboard.
                </p>
              </div>
            </section>

            <section id="how-it-works">
              <h2 className="text-3xl font-extrabold mb-10 pl-3 border-l-2 text-white border-[var(--chain-accent)]">
                {ui.labelPrefix}How It Works
              </h2>
              <div className="relative space-y-10 pl-4 md:pl-0">
                <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[var(--chain-accent)] via-[var(--chain-accent)]/20 to-[var(--chain-accent)] hidden md:block" />
                
                {[
                  { step: "Step 1", title: "Connect your wallet", desc: "" },
                  { step: "Step 2", title: "Select your blockchain", desc: step2Text },
                  { step: "Step 3", title: "Take the quiz", desc: "Answer 5 questions sourced from official blockchain documentation" },
                  { step: "Step 4", title: "Submit your score on-chain", desc: "Sign a transaction to permanently record your score on the blockchain" },
                  { step: "Step 5", title: "Check the leaderboard", desc: "See how you rank against other players globally and per chain" },
                  { step: "Step 6", title: "Earn NFTs", desc: "Reach 100 points to mint an exclusive QuizMaster NFT and gain Master status" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 md:gap-8 relative items-start group">
                    <div className={`flex-shrink-0 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center font-black text-base md:text-xl z-20 transition-transform group-hover:scale-110 rounded-full bg-[var(--chain-accent)] ${stepNumberText}`}>
                      {i + 1}
                    </div>
                    <div className="p-4 md:p-6 flex-1 transition-all duration-200 border hover-lift arc-card rounded-xl">
                      <h4 className="text-base md:text-xl font-bold mb-1 md:mb-2 text-white">{item.step}: {item.title}</h4>
                      <p className="text-gray-400 text-sm md:text-base leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
 
            <section id="supported-networks">
              <h2 className="text-3xl font-extrabold mb-8 pl-3 border-l-2 text-white border-[var(--chain-accent)]">
                {ui.labelPrefix}Supported Networks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {displayNetworks.map((network) => (
                  <div key={network.name} className="p-6 transition-all flex flex-col justify-between border arc-card rounded-xl hover:border-[var(--chain-accent)]/50 transition-all duration-200 hover-lift">
                    <div>
                      <div className="flex items-center gap-4 mb-5">
                        <div className="relative w-8 h-8 overflow-hidden p-1 flex-shrink-0 rounded-full bg-white/10">
                          <Image
                            src={network.iconUrl}
                            alt={network.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <h4 className="text-2xl font-bold text-white">{network.name}</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 font-medium tracking-tight uppercase">Chain ID</span>
                          <span className="font-mono px-2 py-0.5 text-[var(--chain-accent)] bg-white/5 rounded">{network.id}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 font-medium tracking-tight uppercase">Gas Token</span>
                          <span className="font-mono px-2 py-0.5 text-[var(--chain-accent)] bg-white/5 rounded">{network.gasToken}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 font-medium tracking-tight uppercase">Explorer</span>
                          <a
                            href={`https://${network.explorer}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 transition-colors text-[var(--chain-accent)] hover:opacity-70"
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
              <h2 className="text-3xl font-extrabold mb-8 pl-3 border-l-2 text-white border-[var(--chain-accent)]">
                {ui.labelPrefix}Smart Contract
              </h2>
              <div className="space-y-8">
                <div className="p-8 border arc-card rounded-xl">
                  <p className="text-gray-300 leading-relaxed text-lg">
                    Your scores are stored permanently on-chain using the <code className="px-1.5 py-0.5 rounded text-[var(--chain-accent)] bg-white/10 font-mono">QuizScores</code> smart contract deployed on each network. The contract records your score, total questions, and timestamp. A trusted signer verifies each score before it can be submitted, preventing cheating.
                  </p>
                </div>
                
                <div className="overflow-hidden border arc-card rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest border-b text-gray-500 border-white/10">Network</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest border-b text-gray-500 border-white/10">Contract Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.08]">
                      {displayNetworks.map((network) => (
                        <tr key={network.name} className="transition-colors group hover:bg-white/[0.02]">
                          <td className="px-6 py-5 font-bold tracking-tight text-white">{network.name}</td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-mono text-xs break-all leading-relaxed transition-colors text-gray-400 group-hover:text-gray-200">
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

                <h3 className="text-lg font-bold mb-4 text-[var(--chain-accent)]">
                  QuizNFT
                </h3>
                <div className="overflow-hidden border arc-card rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest border-b text-gray-500 border-white/10">Network</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest border-b text-gray-500 border-white/10">NFT Contract Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.08]">
                      {displayNetworks.map((network) => {
                        const nftAddr = NFT_CONTRACTS[network.id]
                        const displayAddr = nftAddr || "—"
                        return (
                          <tr key={network.name} className="transition-colors group hover:bg-white/[0.02]">
                            <td className="px-6 py-5 font-bold tracking-tight text-white">{network.name}</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-between gap-4">
                                <span className="font-mono text-xs break-all leading-relaxed transition-colors text-gray-400 group-hover:text-gray-200">
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
              <h2 className="text-3xl font-extrabold mb-8 pl-3 border-l-2 text-white border-[var(--chain-accent)]">
                {ui.labelPrefix}Scoring & Cooldown
              </h2>
              <div className="p-8 border arc-card rounded-xl">
                 <p className="text-gray-300 leading-relaxed text-lg">
                   Each quiz round consists of 5 questions. Each correct answer awards 1 point for a maximum score of 5 per round. Your score is verified server-side against a signed JWT that was created when the quiz was generated — the server will only sign a valid score, preventing client-side manipulation. The server signs the approved score using ECDSA, and the smart contract verifies this signature before accepting the submission. After submitting a score on-chain, you must wait <span className="font-bold underline underline-offset-4 text-[var(--chain-accent)] decoration-[var(--chain-accent)]">1 hour</span> (contract-enforced) before you can play again. Players pay their own gas for score submission.
                 </p>
              </div>
            </section>

            <section id="achievements">
              <h2 className="text-3xl font-extrabold mb-8 pl-3 border-l-2 text-white border-[var(--chain-accent)]">
                {ui.labelPrefix}NFT Achievements
              </h2>
              <div className="p-8 border arc-card rounded-xl">
                 <p className="text-gray-300 leading-relaxed text-lg">
                     Once you reach <span className="font-bold text-[var(--chain-accent)]">100 total points on any single chain</span>, you unlock the ability to mint an exclusive <span className="font-bold text-[var(--chain-accent)]">"The What of Blockchain" (TWOB)</span> NFT directly in the app. One NFT is mintable per address per chain, across all 9 supported networks: Ink, Soneium, Base, Unichain, MegaETH, LitVM LiteForge, Arc Testnet, Arc, and Abstract. Holding this NFT grants you the prestigious "Master" status on the leaderboard. You pay your own gas to mint (no gas tank).
                 </p>
              </div>
            </section>

            <section id="leaderboard">
              <h2 className="text-3xl font-extrabold mb-8 pl-3 border-l-2 text-white border-[var(--chain-accent)]">
                {ui.labelPrefix}Leaderboard
              </h2>
              <div className="p-8 border arc-card rounded-xl">
                <p className="text-gray-300 leading-relaxed text-lg">
                    The leaderboard tracks total points accumulated across all quizzes. Switch between 8 tabs: Global, Ink, Soneium, Base, Unichain, MegaETH, LitVM, and Arc. The Global leaderboard aggregates scores from Ink, Soneium, Base, and Unichain. MegaETH, LitVM, and Arc have their own per-chain tabs but are not included in the global aggregation. Use the <span className="font-bold text-white">Show Masters Only</span> filter to see top-tier players who have minted their NFT. Your wallet address is displayed in truncated format for privacy.
                </p>
              </div>
            </section>

            <section id="faq" className="pb-40">
              <h2 className="text-3xl font-extrabold mb-10 pl-3 border-l-2 text-white border-[var(--chain-accent)]">
                {ui.labelPrefix}FAQ
              </h2>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {[
                  { q: "Is the quiz free to play?", a: "Yes, playing the quiz is completely free. Submitting your score on-chain requires a small gas fee." },
                  { q: "How do I get a QuizMaster NFT?", a: "Keep playing and submitting scores! Once your total reaches 100 points on any single chain, a mint button will appear allowing you to claim your exclusive 'The What of Blockchain' (TWOB) NFT." },
                  { q: "Are my scores stored permanently?", a: "Yes, scores submitted on-chain are stored permanently on the blockchain and cannot be deleted except by the contract owner." },
                  { q: "Which chains support NFT minting?", a: "All 9 chains — Ink, Soneium, Base, Unichain, MegaETH, LitVM LiteForge, Arc Testnet, Arc, and Abstract. Each chain has its own NFT contract and you can mint one NFT per chain once you reach 100 points on that chain." },
                  { q: "What is zkLTC on LitVM LiteForge?", a: "zkLTC is the native gas token of the LitVM LiteForge testnet — a Litecoin-backed asset used to pay transaction fees on this EVM rollup." },
                  { q: "What is USDC on Arc Testnet?", a: "USDC is the native gas token of the Arc Testnet — a stablecoin-based fee model that eliminates gas price volatility for users." },
                  { q: "Is my quiz score verified before going on-chain?", a: "Yes. When you finish a quiz, your answers are verified server-side against a signed JWT that was created when the quiz was generated. The server will only sign a valid score — preventing any client-side manipulation before the transaction is submitted." }
                ].map((faq, i) => (
                  <AccordionItem 
                    key={i} 
                    value={`item-${i}`}
                    className="px-6 transition-all border arc-card border-white/[0.08] data-[state=open]:border-[var(--chain-accent)]/50 rounded-xl transition-all duration-200 hover-lift"
                  >
                    <AccordionTrigger className="text-lg font-bold hover:no-underline py-6 text-white">
                      <div className="flex items-start text-left gap-4">
                        <span className="text-[var(--chain-accent)] shrink-0 font-black">Q:</span>
                        {faq.q}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed pb-6 pl-9 text-gray-400">
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
