"use client"

import { useState } from "react"
import Image from "next/image"
import { Leaderboard, type ChainFilterType } from "@/components/leaderboard"
import { useChainUI } from "@/hooks/use-chain-ui"
import { cn } from "@/lib/utils"

const TABS: { id: ChainFilterType; label: string; iconUrl: string | null }[] = [
  { id: 'Global', label: 'Global', iconUrl: null },
  { id: 'Ink', label: 'Ink', iconUrl: '/chains/ink-logo-purple-white-icon.png' },
  { id: 'Soneium', label: 'Soneium', iconUrl: '/chains/soneium.png' },
  { id: 'Base', label: 'Base', iconUrl: '/chains/base.png' },
  { id: 'Unichain', label: 'Unichain', iconUrl: '/chains/unichain.png' },
  { id: 'MegaETH', label: 'MegaETH', iconUrl: '/chains/megaeth.png' },
  { id: 'LitVM', label: 'LitVM', iconUrl: '/chains/litvm.png' },
  { id: 'Arc Testnet', label: 'Arc', iconUrl: '/chains/arc.png' },
  { id: 'Sepolia', label: 'Sepolia', iconUrl: null },
]

const CHAIN_ACCENT: Record<string, string> = {
  Ink: "#8B5CF6",
  Soneium: "#0047FF",
  Base: "#0052FF",
  Unichain: "#FF007A",
  MegaETH: "#00ff88",
  LitVM: "#00F2FE",
  "Arc Testnet": "#4D8EE9",
}

function getTabAccent(tabId: ChainFilterType): string | null {
  if (tabId === 'Global' || tabId === 'Sepolia') return null
  return CHAIN_ACCENT[tabId] ?? null
}

export default function LeaderboardContent() {
  const [activeTab, setActiveTab] = useState<ChainFilterType>('Global')
  const ui = useChainUI()

  return (
    <main className={cn(ui.pageMain, ui.page, 'flex flex-col items-center')}>
      <div className="w-full max-w-full md:max-w-[90vw] overflow-x-auto scrollbar-none mb-6 md:mb-8">
        <div className={cn('flex items-center justify-start md:justify-center gap-1.5 md:gap-2 p-1 w-fit mx-auto', ui.tabBar)}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const accent = getTabAccent(tab.id)
            const isNeutralTab = tab.id === 'Global' || tab.id === 'Sepolia'
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer',
                  ui.radiusSm,
                  isActive
                    ? isNeutralTab
                      ? ui.isLight
                        ? 'bg-black/10 text-black'
                        : 'bg-white/10 text-white'
                      : 'text-white'
                    : ui.tabInactive,
                )}
                style={isActive && !isNeutralTab && accent ? {
                  backgroundColor: accent,
                  boxShadow: `0 0 20px ${accent}33`,
                } : undefined}
              >
                {tab.iconUrl && (
                  <Image
                    src={tab.iconUrl}
                    alt={`${tab.label} logo`}
                    width={16}
                    height={16}
                    className="w-4 h-4 rounded-full shrink-0"
                  />
                )}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="w-full">
        <Leaderboard chainFilter={activeTab} />
      </div>
    </main>
  )
}
