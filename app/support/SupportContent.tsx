"use client"

import { MessageSquare } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useWallet } from "@/components/wallet-provider"
import { useActiveChain } from "@/hooks/use-active-chain"

const XIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    aria-hidden="true" 
    className={className} 
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const FAQS = [
  { 
    q: "My transaction failed — what should I do?", 
    a: "Make sure you have enough ETH for gas on the selected network. Try switching to a different network or wait a few minutes and try again." 
  },
  { 
    q: "I submitted my score but it does not show on the leaderboard", 
    a: "The leaderboard refreshes every 30 seconds. Wait a moment and click the refresh button. If it still does not appear contact us on X." 
  },
  { 
    q: "How do I claim my NFT?", 
    a: "Reach 100 total points on any supported chain. The claim button will appear automatically on the home screen." 
  },
  { 
    q: "Can I play on multiple chains?", 
    a: "Yes. Each chain has its own leaderboard and NFT. You can play and submit scores on all chains independently." 
  },
  { 
    q: "Is my score stored permanently?", 
    a: "Yes. Scores submitted on-chain are stored permanently on the blockchain and cannot be deleted." 
  }
]

export default function SupportContent() {
  const { isConnected } = useWallet()
  const { chainConfig: cfg } = useActiveChain()
  const isMegaEth = isConnected && cfg?.name === 'MegaETH'
  const isInk = isConnected && cfg?.name === 'Ink'
  const isUnichain = isConnected && cfg?.name === 'Unichain'
  const isBase = isConnected && cfg?.name === 'Base'
  const isSoneium = isConnected && cfg?.name === 'Soneium'
  const isLitvm = isConnected && cfg?.name === 'LitVM'
  const isArc = isConnected && cfg?.name === 'Arc Testnet'

  return (
    <main className={`relative z-10 min-h-screen pt-32 pb-20 px-4 md:px-8 ${isMegaEth ? 'text-white font-mono' : isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0] font-mono' : 'text-white'}`}>
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className={`font-black ${isMegaEth ? 'text-5xl md:text-7xl uppercase tracking-tight text-white' : isInk ? 'text-5xl md:text-7xl tracking-tighter text-white' : isUnichain ? 'text-5xl md:text-7xl tracking-tight font-serif italic text-white' : isBase ? 'text-5xl md:text-7xl tracking-tighter text-black' : isSoneium ? 'text-5xl md:text-7xl tracking-tight text-white' : isLitvm ? 'text-5xl md:text-7xl tracking-tight text-[#E2E8F0]' : isArc ? 'text-5xl md:text-7xl tracking-tight text-white' : 'text-5xl tracking-tight text-white'}`}>
              {isMegaEth ? '// SUPPORT' : isLitvm ? '>> support' : 'Support'}
            </h1>
            <p className={`${isMegaEth ? 'text-white/40 uppercase text-sm' : isInk || isUnichain ? 'text-white/70 text-lg' : isBase ? 'text-black/40 text-lg font-medium' : isSoneium ? 'text-white/60 text-lg' : isLitvm ? 'text-[#E2E8F0]/40 text-sm' : isArc ? 'text-[#4D8EE9]/60 text-lg' : 'text-gray-400 text-lg'}`}>
              Need help? We are here for you.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Twitter Card */}
            <div className={`p-8 transition-all group relative overflow-hidden ${
              isMegaEth 
                ? 'bg-black border border-white/15 rounded-none hover:border-[#00ff88]' 
                : isInk || isUnichain
                  ? `bg-white/5 border border-white/10 backdrop-blur-lg hover:border-white/30 ${isInk ? 'rounded-3xl hover:shadow-[0_0_30px_rgba(123,97,255,0.1)]' : 'rounded-2xl hover:shadow-[0_0_30px_rgba(255,0,122,0.1)]'}`
                : isBase
                  ? 'bg-[#f4f5f7] border border-black/5 rounded-3xl hover:border-[#0052FF] shadow-sm'
                : isSoneium
                  ? 'rounded-2xl bg-white/[0.03] border-[#0047FF]/20 backdrop-blur-xl hover:border-[#0047FF]/50 shadow-[0_0_30px_rgba(0,71,255,0.05)]'
                : isLitvm
                  ? 'bg-[#0B192C] border border-[#00F2FE]/20 rounded-none hover:border-[#00F2FE]'
                : isArc
                  ? 'rounded-3xl bg-white/[0.02] border border-[#4D8EE9]/20 backdrop-blur-xl hover:border-[#4D8EE9]/50 shadow-[0_0_30px_rgba(77,142,233,0.05)]'
                  : !isConnected
                    ? 'rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl hover:border-white'
                    : 'rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl hover:border-[#0047FF]'
            }`}>
               {!isMegaEth && !isInk && !isUnichain && !isLitvm && !isArc && <div className="absolute inset-0 bg-gradient-to-br from-[#0047FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
               {isArc && <div className="absolute inset-0 bg-gradient-to-br from-[#4D8EE9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
               <div className="relative z-10 space-y-6">
                <div className={`w-12 h-12 flex items-center justify-center ${
                  isMegaEth ? 'bg-black border border-white/15 rounded-none text-[#00ff88]' : isInk ? 'bg-[#7B61FF]/10 text-[#7B61FF] rounded-2xl' : isUnichain ? 'bg-[#FF007A]/10 text-[#FF007A] rounded-xl' : isBase ? 'bg-[#0052FF]/10 text-[#0052FF] rounded-full' : isSoneium ? 'bg-[#0047FF]/10 text-[#0047FF] rounded-2xl' : isLitvm ? 'bg-[#00F2FE]/10 text-[#00F2FE]'                   : isArc ? 'bg-[#4D8EE9]/10 text-[#4D8EE9] rounded-2xl' : !isConnected ? 'rounded-2xl bg-white/10 text-white' : 'rounded-2xl bg-[#0047FF]/10 text-[#0047FF]'
                }`}>
                  <XIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-2xl font-bold mb-2 ${isMegaEth ? 'uppercase text-white' : isInk || isUnichain ? 'tracking-tight text-white' : isBase ? 'tracking-tighter text-black' : isLitvm ?'text-[#E2E8F0]' : 'text-white'}`}>Twitter / X</h3>
                  <p className={`${isMegaEth ? 'text-white/40 text-sm' : isInk || isUnichain ? 'text-white/60' : isBase ? 'text-black/40 font-medium' : isLitvm ? 'text-[#E2E8F0]/40 text-sm' : isArc ? 'text-white/60' : 'text-gray-400'} leading-relaxed`}>Follow us and send a DM for quick support</p>
                </div>
                <a
                  href="https://x.com/quizonchain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center w-full py-4 font-bold transition-all ${
                    isMegaEth 
                      ? 'bg-black border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black rounded-none uppercase' 
                      : isInk
                        ? 'bg-[#7B61FF] hover:bg-[#6c54e6] text-white rounded-full shadow-[0_0_20px_rgba(123,97,255,0.3)]'
                      : isUnichain
                        ? 'bg-[#FF007A] hover:bg-[#d60066] text-white rounded-2xl shadow-[0_0_20px_rgba(255,0,122,0.3)]'
                      : isBase
                        ? 'bg-[#0052FF] hover:bg-[#0047FF] text-white rounded-full shadow-lg transition-all'
                      : isLitvm ?'bg-[#0B192C] border border-[#00F2FE] text-[#00F2FE] hover:bg-[#00F2FE] hover:text-[#0B192C] rounded-none'
                  : isArc
                    ? 'bg-[#4D8EE9] hover:bg-[#3A7BD6] text-white rounded-xl shadow-[0_0_20px_rgba(77,142,233,0.3)]'
                    : !isConnected
                      ? 'bg-white hover:bg-white/80 text-black rounded-xl'
                      : 'bg-[#0047FF] hover:bg-blue-600 text-white rounded-xl shadow-[0_0_20px_rgba(0,71,255,0.3)]'
                  }`}
                >
                  Open X
                </a>
               </div>
            </div>

            {/* Discord Card */}
            <div className={`p-8 transition-all group relative overflow-hidden ${
              isMegaEth 
                ? 'bg-black border border-white/10 rounded-none' 
                : isInk || isUnichain
                  ? `bg-white/5 border border-white/10 backdrop-blur-lg ${isInk ? 'rounded-3xl' : 'rounded-2xl'}`
                  : isBase
                    ? 'bg-[#f4f5f7] border border-black/5 rounded-3xl'
                  : isLitvm
                    ? 'bg-[#0B192C] border border-[#00F2FE]/20 rounded-none'
                  : isArc
                    ? 'rounded-3xl bg-white/[0.02] border border-[#4D8EE9]/20 backdrop-blur-xl'
                    : 'rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl'
            }`}>
               <div className="relative z-10 space-y-6">
                <div className={`w-12 h-12 flex items-center justify-center ${
                  isMegaEth ? 'bg-black border border-white/10 rounded-none text-white/20' : isInk ? 'bg-white/5 text-white/40 rounded-2xl' : isUnichain ? 'bg-white/5 text-white/40 rounded-xl' : isBase ? 'bg-[#0052FF]/10 text-[#0052FF] rounded-full' : isLitvm ? 'bg-[#00F2FE]/10 text-[#00F2FE] rounded-none' : isArc ? 'bg-[#4D8EE9]/10 text-[#4D8EE9] rounded-2xl' : 'rounded-2xl bg-white/5 text-gray-500'
                }`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-2xl font-bold mb-2 ${isMegaEth ? 'uppercase text-white' : isInk || isUnichain ? 'tracking-tight text-white' : isBase ? 'tracking-tighter text-black' : isLitvm ?'text-[#E2E8F0]' : 'text-white'}`}>Community</h3>
                  <p className={`${isMegaEth ? 'text-white/40 text-sm' : isInk || isUnichain ? 'text-white/60' : isBase ? 'text-black/40 font-medium' : isLitvm ? 'text-[#E2E8F0]/40 text-sm' : isArc ? 'text-white/60' : 'text-gray-400'} leading-relaxed`}>Join our Discord or Telegram for community help</p>
                </div>
                <button
                  disabled
                  className={`w-full py-4 font-bold cursor-not-allowed ${
                    isMegaEth 
                      ? 'bg-black border border-white/10 text-white/20 rounded-none uppercase' 
                      : isInk 
                        ? 'bg-white/5 border border-white/10 text-white/40 rounded-full'
                      : isUnichain
                        ? 'bg-white/5 border border-white/10 text-white/40 rounded-2xl'
                      : isBase
                        ? 'bg-black/5 text-black/30 rounded-full'
                      : isSoneium
                        ? 'bg-[#0047FF]/5 border border-[#0047FF]/10 text-[#0047FF]/50 rounded-2xl'
                      : isLitvm ?'bg-[#0B192C] border border-[#00F2FE]/20 text-[#E2E8F0]/30 rounded-none'
                      : isArc
                        ? 'bg-[#4D8EE9]/5 border border-[#4D8EE9]/10 text-[#4D8EE9]/50 rounded-xl'
                        : 'bg-white/5 text-gray-500 rounded-2xl'
                  }`}
                >
                  Coming Soon
                </button>
               </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="space-y-8">
            <h2 className={`text-3xl font-bold ${isMegaEth ? 'uppercase font-mono text-[#00ff88]' : isBase ? 'text-black tracking-tighter' : isLitvm ?'font-mono text-[#00F2FE]' : isArc ? 'text-[#4D8EE9]' : 'text-white'}`}>Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {FAQS.map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  value={`item-${i}`}
                  className={`border px-6 py-2 transition-all ${
                    isMegaEth 
                      ? 'border-white/10 bg-black rounded-none data-[state=open]:border-[#00ff88]/50' 
                      : isInk
                        ? 'border-white/10 bg-white/5 rounded-3xl data-[state=open]:border-[#7B61FF]/50 data-[state=open]:bg-white/10 backdrop-blur-sm'
                      : isUnichain
                        ? 'border-white/10 bg-white/5 rounded-2xl data-[state=open]:border-[#FF007A]/50 data-[state=open]:bg-white/10 backdrop-blur-sm'
                      : isBase
                        ? 'bg-white border-black/5 rounded-2xl shadow-sm data-[state=open]:border-black/10'
                      : isLitvm
                        ? 'border-[#00F2FE]/20 bg-[#0B192C] rounded-none data-[state=open]:border-[#00F2FE]/50'
                  : isArc
                    ? 'border-white/[0.08] bg-white/[0.02] rounded-2xl data-[state=open]:bg-white/[0.04] data-[state=open]:border-[#4D8EE9]/40'
                    : !isConnected
                      ? 'border-white/[0.08] bg-white/[0.02] rounded-2xl data-[state=open]:bg-white/[0.04] data-[state=open]:border-white/30'
                      : 'border-white/[0.08] bg-white/[0.02] rounded-2xl data-[state=open]:bg-white/[0.04] data-[state=open]:border-[#0047FF]/30'
                  }`}
                >
                  <AccordionTrigger className={`hover:no-underline font-bold text-left ${isMegaEth ? 'font-mono uppercase text-[#00ff88]' : isBase ? 'text-black' : isLitvm ?'font-mono text-[#E2E8F0]' : isArc ? 'text-white data-[state=open]:text-[#4D8EE9]' : 'text-white'}`}>
                    <div className="flex items-start text-left gap-4">
                      {faq.q}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className={`text-base leading-relaxed pb-6 pl-9 ${isMegaEth ? 'text-white/50 lowercase text-sm' : isLitvm ? 'text-[#E2E8F0]/50 text-sm' : isArc ? 'text-[#4D8EE9]/60' : 'text-gray-400'}`}>
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
    </main>
  )
}
