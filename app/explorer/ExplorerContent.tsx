"use client"

import Link from "next/link"
import Image from "next/image"
import { useChainUI } from "@/hooks/use-chain-ui"
import { cn } from "@/lib/utils"

const CHAINS = [
  {
    id: 'ink',
    name: 'Ink',
    description: 'Explore Ink Onchain transactions visually',
    iconUrl: '/chains/ink-logo-purple-white-icon.png',
    accent: '#8b5cf6',
  },
  {
    id: 'soneium',
    name: 'Soneium',
    description: 'Explore Soneium transactions visually',
    iconUrl: '/chains/soneium.png',
    accent: '#0047FF',
  },
  {
    id: 'base',
    name: 'Base',
    description: 'Explore Base transactions visually',
    iconUrl: '/chains/base.png',
    accent: '#0052FF',
  },
  {
    id: 'unichain',
    name: 'Unichain',
    description: 'Explore Unichain transactions visually',
    iconUrl: '/chains/unichain.png',
    accent: '#FF007A',
  },
  {
    id: 'megaeth',
    name: 'MegaETH',
    description: 'Explore MegaETH transactions visually',
    iconUrl: '/chains/megaeth.png',
    accent: '#00ff88',
  },
  {
    id: 'litvm',
    name: 'LitVM',
    description: 'Explore LitVM LiteForge transactions visually',
    iconUrl: '/chains/litvm.png',
    accent: '#00F2FE',
  },
  {
    id: 'arc',
    name: 'Arc Testnet',
    description: 'Explore Arc Testnet transactions visually',
    iconUrl: '/chains/arc.png',
    accent: '#4D8EE9',
  },
  {
    id: 'sepolia',
    name: 'Sepolia',
    description: 'Explore Sepolia testnet transactions visually',
    iconUrl: '',
    accent: '#7C3AED',
  },
]

export default function ExplorerContent() {
  const ui = useChainUI()

  return (
    <main className={cn(ui.pageMain, ui.page)}>
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center mb-16 space-y-4 animate-slide-up">
          <p className={ui.label}>
            {ui.labelPrefix}{ui.key === 'megaeth' ? 'BLOCK EXPLORER' : 'Explorer'}
          </p>
          <h1 className={ui.heading}>
            {ui.key === 'megaeth' ? 'Block Explorer' : 'Block Explorer'}
          </h1>
          <p className={cn(ui.subheading, 'mx-auto')}>
            Select a network below to dive into real-time transaction data and analyze on-chain activity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {CHAINS.map((chain) => (
            <Link
              key={chain.id}
              href={`/explorer/${chain.id}`}
              className={cn(
                'group relative p-6 md:p-8 transition-colors duration-200 flex items-start gap-5 border cursor-pointer',
                ui.card,
                'hover:border-opacity-60',
              )}
              style={{ ['--hover-accent' as string]: chain.accent }}
            >
              <div className={cn(
                'relative w-14 h-14 overflow-hidden border flex items-center justify-center shrink-0 transition-colors duration-200',
                ui.isLight ? 'border-black/5 bg-white rounded-2xl' : 'border-white/10 bg-white/5 rounded-2xl',
                ui.key === 'megaeth' && 'rounded-none bg-black',
              )}>
                {chain.iconUrl ? (
                  <Image
                    src={chain.iconUrl}
                    alt={`${chain.name} logo`}
                    fill
                    className="object-contain p-1.5"
                  />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#7C3AED]" fill="currentColor" aria-hidden="true">
                    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 pt-0.5">
                <h2
                  className={cn(
                    'text-xl font-bold mb-1.5 transition-colors duration-200',
                    ui.isLight ? 'text-black group-hover:text-[#0052FF]' : 'text-white',
                  )}
                  style={{ color: undefined }}
                >
                  <span className="group-hover:opacity-90">{chain.name}</span>
                </h2>
                <p className={cn('text-sm leading-relaxed', ui.bodyMuted)}>
                  {chain.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
