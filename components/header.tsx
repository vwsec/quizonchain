"use client"
import { useState, useEffect } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { NftMintModal } from "./nft-mint"


export function Header() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const pathname = usePathname()
  const activeChain = process.env.NEXT_PUBLIC_ACTIVE_CHAIN ?? ''
  
  const CHAIN_TITLES: Record<string, string> = {
    ink: 'Quiz On Ink',
    soneium: 'Quiz On Soneium',
    base: 'Quiz On Base',
    unichain: 'Quiz On Unichain',
    megaeth: 'Quiz On MegaETH',
  };

  const appTitle = CHAIN_TITLES[activeChain] ?? 'Quiz On Chain';
  const titleParts = appTitle.split(' ');
  const chainName = titleParts.slice(2).join(' ');

  const isMegaEth = activeChain === 'megaeth'
  const isInk = activeChain === 'ink'
  const isUnichain = activeChain === 'unichain'
  const isBase = activeChain === 'base'
  const isSoneium = activeChain === 'soneium'

  const accentColor = isMegaEth ? 'text-[#00ff88]' 
    : isInk ? 'text-[#8b5cf6]' 
    : isUnichain ? 'text-[#ff007a]' 
    : isBase ? 'text-[#0052ff]' 
    : isSoneium ? 'text-[#0047FF]' 
    : 'text-[#0047FF]';

  if (!mounted) return null

  return (
    <header className={`fixed inset-x-0 top-0 z-50 ${isMegaEth ? 'bg-black border-b border-white/10' : isInk || isUnichain ? 'bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5' : isBase ? 'bg-white/90 backdrop-blur-md border-b border-black/5' : isSoneium ? 'bg-[#00040F]/80 backdrop-blur-xl border-b border-[#0047FF]/10' : ''}`}>
      <div className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          {!isMegaEth && (
            <Image
              src={isSoneium ? "/chains/soneium.png" : isBase ? "/chains/base.png" : isInk ? "/chains/ink-logo-purple-white-icon.png" : isUnichain ? "/chains/unichain.png" : isMegaEth ? "/chains/megaeth.png" : "/logo.png"}
              alt={appTitle}
              width={140}
              height={36}
              className="h-8 w-auto object-contain"
              priority
            />
          )}
          <span className={`text-lg font-bold whitespace-nowrap ${isMegaEth ? 'text-white font-mono uppercase tracking-tight' : isInk || isUnichain ? 'text-white tracking-tighter' : isBase ? 'text-black tracking-tight' : 'text-white tracking-tight'}`}>
            Quiz On <span className={accentColor}>{chainName}</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <div className={`flex items-center p-1 ${isMegaEth ? 'bg-black border border-white/10 rounded-none' : isInk || isUnichain ? 'bg-white/5 border border-white/10 rounded-full backdrop-blur-lg' : isBase ? 'bg-black/5 border border-black/5 rounded-full' : isSoneium ? 'bg-white/[0.03] border border-[#0047FF]/20 rounded-full backdrop-blur-xl' : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl'}`}>
            {[
              { href: '/', label: 'Quiz' },
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/docs', label: 'Docs' },
              { href: '/explorer', label: 'Explorer', matchStart: true },
              { href: '/support', label: 'Support' }
            ].map((nav) => {
              const isActive = nav.matchStart ? pathname.startsWith(nav.href) : pathname === nav.href
              const activeClass = isMegaEth 
                ? 'bg-white text-black rounded-none' 
                : isInk
                  ? 'bg-[#7B61FF] text-white rounded-full shadow-[0_0_15px_rgba(123,97,255,0.3)]'
                : isUnichain
                  ? 'bg-[#FF007A] text-white rounded-xl shadow-[0_0_15px_rgba(255,0,122,0.3)]'
                : isBase
                  ? 'bg-[#0052FF] text-white rounded-full'
                : isSoneium
                  ? 'bg-[#0047FF] text-white rounded-full shadow-[0_0_20px_rgba(0,71,255,0.4)]'
                  : 'bg-[#0047FF] text-white rounded-lg'
              const inactiveClass = isMegaEth || isInk || isUnichain || isSoneium
                ? 'bg-transparent text-white/50 hover:text-white'
                : isBase
                  ? 'bg-transparent text-black/50 hover:text-black'
                  : 'bg-transparent text-[rgba(255,255,255,0.5)] hover:text-white'

              return (
                <Link
                  key={nav.href}
                  href={nav.href}
                  className={`px-3 py-1.5 text-sm transition-all duration-200 text-center min-w-[80px] ${isMegaEth ? 'font-mono uppercase font-medium' : isInk || isUnichain ? 'font-semibold tracking-tight' : 'font-medium'} ${
                    isActive ? activeClass : inactiveClass
                  }`}
                >
                  {nav.label}
                </Link>
              )
            })}
          </div>
          <NftMintModal />
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </header>
  )
}
