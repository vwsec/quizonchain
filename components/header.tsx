"use client"
import { useState, useEffect } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { NftMintModal } from "./nft-mint"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"

const NAV_ITEMS = [
  { href: '/', label: 'Quiz' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/docs', label: 'Docs' },
  { href: '/explorer', label: 'Explorer', matchStart: true },
  { href: '/support', label: 'Support' }
]

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
    litvm: 'Quiz On LitVM',
  };

  const appTitle = CHAIN_TITLES[activeChain] ?? 'Quiz On Chain';
  const titleParts = appTitle.split(' ');
  const chainName = titleParts.slice(2).join(' ');

  const isMegaEth = activeChain === 'megaeth'
  const isInk = activeChain === 'ink'
  const isUnichain = activeChain === 'unichain'
  const isBase = activeChain === 'base'
  const isSoneium = activeChain === 'soneium'
  const isLitvm = activeChain === 'litvm'

  const accentColor = isMegaEth ? 'text-[#00ff88]' 
    : isInk ? 'text-[#8b5cf6]' 
    : isUnichain ? 'text-[#ff007a]' 
    : isBase ? 'text-[#0052ff]' 
    : isSoneium ? 'text-[#0047FF]' 
    : isLitvm ? 'text-[#00F2FE]'
    : 'text-[#0047FF]';

  if (!mounted) return null

  const isActiveLink = (nav: typeof NAV_ITEMS[number]) =>
    nav.matchStart ? pathname.startsWith(nav.href) : pathname === nav.href

  return (
    <header className={`fixed inset-x-0 top-0 z-50 ${isMegaEth ? 'bg-black border-b border-white/10' : isInk || isUnichain ? 'bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5' : isBase ? 'bg-white/90 backdrop-blur-md border-b border-black/5' : isSoneium ? 'bg-[#00040F]/80 backdrop-blur-xl border-b border-[#0047FF]/10' : isLitvm ? 'bg-[#0B192C]/90 backdrop-blur-xl border-b border-[#00F2FE]/10' : ''}`}>
      <div className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
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
          <span className={`text-lg font-bold whitespace-nowrap ${isMegaEth ? 'text-white font-mono uppercase tracking-tight' : isInk || isUnichain ? 'text-white tracking-tighter' : isBase ? 'text-black tracking-tight' : isSoneium ? 'text-white tracking-tight' : isLitvm ? 'text-[#E2E8F0] tracking-tight' : 'text-white tracking-tight'}`} style={isLitvm ? { fontFamily: "'Rajdhani', Arial, sans-serif" } : undefined}>
            Quiz On <span className={accentColor}>{chainName}</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <div className={`flex items-center p-1 ${isMegaEth ? 'bg-black border border-white/10 rounded-none' : isInk || isUnichain ? 'bg-white/5 border border-white/10 rounded-full backdrop-blur-lg' : isBase ? 'bg-black/5 border border-black/5 rounded-full' : isSoneium ? 'bg-white/[0.03] border border-[#0047FF]/20 rounded-full backdrop-blur-xl' : isLitvm ? 'bg-[#0B192C]/80 border border-[#00F2FE]/15 rounded-xl backdrop-blur-xl' : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl'}`}>
            {NAV_ITEMS.map((nav) => {
              const active = isActiveLink(nav)
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
                : isLitvm
                  ? 'bg-[#00F2FE] text-[#0B192C] rounded-lg shadow-[0_0_20px_rgba(0,242,254,0.3)] font-bold'
                  : 'bg-[#0047FF] text-white rounded-lg'
              const inactiveClass = isMegaEth || isInk || isUnichain || isSoneium
                ? 'bg-transparent text-white/50 hover:text-white'
                : isLitvm
                  ? 'bg-transparent text-[#E2E8F0]/50 hover:text-[#00F2FE] transition-colors'
                : isBase
                  ? 'bg-transparent text-black/50 hover:text-black'
                  : 'bg-transparent text-[rgba(255,255,255,0.5)] hover:text-white'

              return (
                <Link
                  key={nav.href}
                  href={nav.href}
                  className={`px-3 py-1.5 text-sm transition-all duration-200 text-center min-w-[80px] ${isMegaEth ? 'font-mono uppercase font-medium' : isInk || isUnichain ? 'font-semibold tracking-tight' : isLitvm ? 'font-semibold tracking-wide' : 'font-medium'} ${
                    active ? activeClass : inactiveClass
                  }`}
                  style={isLitvm ? { fontFamily: "'Rajdhani', Arial, sans-serif" } : undefined}
                >
                  {nav.label}
                </Link>
              )
            })}
          </div>
          <NftMintModal />
          <ConnectButton showBalance={false} />
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-1">
          <NftMintModal />
          <ConnectButton showBalance={false} />
          <Sheet>
            <SheetTrigger asChild>
              <button
                className={`p-2 transition-colors ${
                  isMegaEth ? 'text-white hover:text-[#00ff88]' : isBase ? 'text-black hover:text-black/60' : isLitvm ? 'text-[#E2E8F0] hover:text-[#00F2FE]' : 'text-white hover:text-white/60'
                }`}
                aria-label="Open menu"
              >
                <Menu className="size-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className={`w-[280px] sm:w-[320px] border-l p-0 ${
                isMegaEth ? 'bg-black border-white/10' : isBase ? 'bg-white border-black/5' : isLitvm ? 'bg-[#0B192C] border-[#00F2FE]/15' : 'bg-[#0a0a0f] border-white/10'
              }`}
            >
              <div className="flex flex-col h-full">
                <div className={`px-6 py-6 border-b ${isMegaEth ? 'border-white/10' : isBase ? 'border-black/5' : isLitvm ? 'border-[#00F2FE]/15' : 'border-white/10'}`}>
                  <span className={`text-lg font-bold ${isMegaEth ? 'text-white font-mono uppercase tracking-tight' : isInk || isUnichain ? 'text-white tracking-tighter' : isBase ? 'text-black tracking-tight' : isLitvm ? 'text-[#E2E8F0] tracking-tight' : 'text-white tracking-tight'}`} style={isLitvm ? { fontFamily: "'Rajdhani', Arial, sans-serif" } : undefined}>
                    Quiz On <span className={accentColor}>{chainName}</span>
                  </span>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                  {NAV_ITEMS.map((nav) => {
                    const active = isActiveLink(nav)
                    return (
                      <SheetClose asChild key={nav.href}>
                        <Link
                          href={nav.href}
                          className={`flex items-center px-4 py-3 text-base font-medium transition-all rounded-lg ${
                            active
                              ? isMegaEth
                                ? 'bg-white/10 text-[#00ff88] font-mono uppercase'
                                : isBase
                                  ? 'bg-[#0052FF]/10 text-[#0052FF]'
                                  : isInk
                                    ? 'bg-[#7B61FF]/10 text-[#7B61FF]'
                                  : isUnichain
                                    ? 'bg-[#FF007A]/10 text-[#FF007A]'
                              : isSoneium
                                ? 'bg-[#0047FF]/10 text-[#0047FF]'
                              : isLitvm
                                ? 'bg-[#00F2FE]/10 text-[#00F2FE]'
                                : 'bg-[#0047FF]/10 text-[#0047FF]'
                          : isMegaEth
                            ? 'text-white/50 hover:text-white hover:bg-white/5 font-mono uppercase'
                            : isBase
                              ? 'text-black/50 hover:text-black hover:bg-black/5'
                            : isLitvm
                              ? 'text-[#E2E8F0]/50 hover:text-[#00F2FE] hover:bg-[#00F2FE]/5'
                              : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}
                          style={isLitvm ? { fontFamily: "'Rajdhani', Arial, sans-serif" } : undefined}
                        >
                          {nav.label}
                        </Link>
                      </SheetClose>
                    )
                  })}
                </nav>
                <div className={`px-6 py-4 border-t ${isMegaEth ? 'border-white/10' : isBase ? 'border-black/5' : isLitvm ? 'border-[#00F2FE]/15' : 'border-white/10'}`}>
                  <p className={`text-xs ${isBase ? 'text-black/40' : isLitvm ? 'text-[#E2E8F0]/40' : 'text-white/40'}`}>
                    Quiz On Chain
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
