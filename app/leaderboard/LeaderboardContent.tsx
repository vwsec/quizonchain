"use client"

import { useState } from "react"
import Image from "next/image"
import { WalletProvider } from "@/components/wallet-provider"
import { Header } from "@/components/header"
import { Leaderboard, type ChainFilterType } from "@/components/leaderboard"

import { soneiumMainnet, unichain } from "@/lib/chains"

const TABS: { id: ChainFilterType; label: string; iconUrl: string | null }[] = [
  { id: 'Global', label: 'Global', iconUrl: null },
  { id: 'Ink', label: 'Ink', iconUrl: '/chains/ink-logo-purple-white-icon.png' },
  { id: 'Soneium', label: 'Soneium', iconUrl: '/chains/soneium.png' },
  { id: 'Base', label: 'Base', iconUrl: '/chains/base.png' },
  { id: 'Unichain', label: 'Unichain', iconUrl: '/chains/unichain.png' },
  { id: 'MegaETH', label: 'MegaETH', iconUrl: '/chains/megaeth.png' },
]

import { activeChainConfig, isMultiChain } from "@/lib/active-chain-config"

export default function LeaderboardContent() {
  const initialTab: ChainFilterType = isMultiChain 
    ? 'Global' 
    : (activeChainConfig.name as ChainFilterType)
    
  const [activeTab, setActiveTab] = useState<ChainFilterType>(initialTab)

  return (
    <main className="relative z-10 min-h-screen pt-24 pb-12 px-4 flex flex-col items-center">
        {/* Tab Switcher */}
        {isMultiChain && (
          <div className="w-full max-w-[90vw] overflow-x-auto scrollbar-none">
            <div className="flex items-center justify-start md:justify-center gap-2 mb-8 p-1 backdrop-blur-md bg-black/50 border border-[rgba(255,255,255,0.08)] rounded-2xl w-fit mx-auto">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#0047FF] text-white shadow-lg shadow-[#0047FF]/20'
                        : 'bg-transparent text-gray-400 hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-white/20'
                    }`}
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
        )}

        {/* Dynamic Leaderboard */}
        <div className="w-full">
          <Leaderboard chainFilter={activeTab} />
        </div>
    </main>
  )
}
