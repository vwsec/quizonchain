"use client"

import { useState } from "react"
import Image from "next/image"
import { Leaderboard, type ChainFilterType } from "@/components/leaderboard"
import { useActiveChain } from "@/hooks/use-active-chain"

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
  const { chainConfig: cfg } = useActiveChain()
  const chainName = cfg?.name
  const isBase = chainName === 'Base'
  const isMegaEth = chainName === 'MegaETH'

  return (
    <main className="relative z-10 min-h-screen pt-24 pb-12 px-4 flex flex-col items-center">
        {/* Tab Switcher */}
          <div className="w-full max-w-[90vw] overflow-x-auto scrollbar-none">
            <div className={`flex items-center justify-start md:justify-center gap-2 mb-8 p-1 border w-fit mx-auto ${
              isMegaEth
                ? 'rounded-none bg-black border-white/15'
                : isBase
                  ? 'rounded-2xl bg-white/50 border-black/10'
                  : 'rounded-2xl backdrop-blur-md bg-black/50 border-[rgba(255,255,255,0.08)]'
            }`}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                const accent = getTabAccent(tab.id)
                const isNeutralTab = tab.id === 'Global' || tab.id === 'Sepolia'
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? isNeutralTab
                          ? isBase
                            ? 'bg-black/10 text-black'
                            : 'bg-white/10 text-white'
                          : 'text-white shadow-lg'
                        : isBase
                          ? 'bg-transparent text-gray-500 hover:text-black border border-black/10 hover:border-black/30'
                          : 'bg-transparent text-gray-400 hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-white/20'
                    }`}
                    style={isActive && !isNeutralTab ? {
                      backgroundColor: accent!,
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

        {/* Dynamic Leaderboard */}
        <div className="w-full">
          <Leaderboard chainFilter={activeTab} />
        </div>
    </main>
  )
}
