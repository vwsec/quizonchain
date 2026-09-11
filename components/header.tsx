"use client"
import { useState, useEffect } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAccount } from "wagmi"
import { NftMintModal } from "./nft-mint"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { useActiveChain } from "@/hooks/use-active-chain"
import { useChainUI } from "@/hooks/use-chain-ui"
import { useConnectorType } from "@/hooks/use-connector-type"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: '/', label: 'Quiz' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/docs', label: 'Docs' },
  { href: '/support', label: 'Support' }
]

export function Header() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const pathname = usePathname()
  const { isConnected } = useAccount()
  const { chainConfig: cfg } = useActiveChain()
  const ui = useChainUI()
  const { isChainLocked } = useConnectorType()

  const appTitle = isConnected && cfg
    ? `Quiz On ${cfg.name === 'Arc Testnet' ? 'Arc' : cfg.name === 'LitVM' ? 'LitVM' : cfg.name === 'MegaETH' ? 'MegaETH' : cfg.name === 'Unichain' ? 'Unichain' : cfg.name === 'Base' ? 'Base' : cfg.name === 'Soneium' ? 'Soneium' : cfg.name === 'Sepolia' ? 'Sepolia' : cfg.name === 'Ink' ? 'Ink' : cfg.name === 'Abstract' ? 'Abstract' : 'Chain'}`
    : 'Quiz On Chain'
  const titleParts = appTitle.split(' ')
  const chainName = isConnected ? titleParts.slice(2).join(' ') : 'Chain'

  if (!mounted) return null

  const isActiveLink = (nav: typeof NAV_ITEMS[number]) =>
    pathname === nav.href

  const titleClass = cn(
    'text-lg font-bold whitespace-nowrap tracking-tight text-white',
  )

  return (
    <header className={ui.headerFloating}>
      <div className="flex items-center justify-between px-3 py-3 md:px-6 md:py-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 cursor-pointer">
          <Image
            src={
              !isConnected ? "/logo.webp"
              : cfg?.name === 'Soneium' ? "/chains/soneium.png"
              : cfg?.name === 'Sepolia' ? "/chains/sepolia.svg"
              : cfg?.name === 'Base' ? "/chains/base.png"
              : cfg?.name === 'Ink' ? "/chains/ink-logo-purple-white-icon.png"
              : cfg?.name === 'Unichain' ? "/chains/unichain.png"
              : "/logo.webp"
            }
            alt={appTitle}
            width={140}
            height={36}
            className="h-7 w-auto object-contain"
            priority
          />
          <span className={titleClass}>
            Quiz On <span className={ui.accentClass}>{chainName}</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          <nav className={ui.navPill} aria-label="Main navigation">
            {NAV_ITEMS.map((nav) => {
              const active = isActiveLink(nav)
              return (
                <Link
                  key={nav.href}
                  href={nav.href}
                  className={cn(
                    'px-4 py-2.5 text-sm transition-colors duration-200 text-center min-w-[88px]',
                    active ? ui.navActive : ui.navInactive,
                  )}
                >
                  {nav.label}
                </Link>
              )
            })}
          </nav>
          <NftMintModal />
<ConnectButton showBalance={false} chainStatus={isChainLocked ? 'none' : undefined} />
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-0.5">
          <Sheet>
            <SheetTrigger asChild>
              <button
                className={cn(
                  'p-3 transition-colors duration-200 cursor-pointer rounded-lg touch-target-lg',
                  'text-white hover:bg-white/10',
                )}
                aria-label="Open menu"
              >
                <Menu className="size-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className={cn('w-[280px] sm:w-[320px] max-w-[90vw] border-l p-0 max-h-dvh overflow-y-auto', ui.sheet)}>
              <div className="flex flex-col h-full safe-top safe-bottom">
                <div className={cn('px-6 py-4 border-b border-white/10')}>
                  <span className={titleClass}>
                    Quiz On <span className={ui.accentClass}>{chainName}</span>
                  </span>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Mobile navigation">
                  {NAV_ITEMS.map((nav) => {
                    const active = isActiveLink(nav)
                    return (
                      <SheetClose asChild key={nav.href}>
                        <Link
                          href={nav.href}
                          className={cn(
                            'flex items-center px-4 py-3.5 text-base font-medium transition-colors duration-200 rounded-lg cursor-pointer touch-target-lg',
                            active
                              ? cn(ui.navActive, 'w-full')
                              : ui.navInactive,
                          )}
                        >
                          {nav.label}
                        </Link>
                      </SheetClose>
                    )
                  })}
                </nav>
                <div className={cn('px-6 py-4 border-t border-white/10')}>
                  <p className={cn('text-xs', ui.bodyMuted)}>{appTitle}</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <NftMintModal />
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex justify-end">
              <div className="scale-[0.85] origin-right [&_button]:!min-h-[40px] [&_button]:!max-w-[140px]">
<ConnectButton showBalance={false} chainStatus={isChainLocked ? 'none' : undefined} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}