"use client"

import { Header } from "@/components/header"
import { WalletProvider } from "@/components/wallet-provider"
import Link from "next/link"
import Image from "next/image"
import { activeChainConfig, isMultiChain } from "@/lib/active-chain-config"

const CHAINS = [
  {
    id: 'ink',
    name: 'Ink',
    description: 'Explore Ink Onchain transactions visually',
    iconUrl: '/chains/ink-logo-purple-white-icon.png',
    accentColor: 'group-hover:border-[#8E2DE2] group-hover:shadow-[0_0_20px_rgba(142,45,226,0.2)]',
    textAccent: 'group-hover:text-[#8E2DE2]',
  },
  {
    id: 'soneium',
    name: 'Soneium',
    description: 'Explore Soneium transactions visually',
    iconUrl: '/chains/soneium.png',
    accentColor: 'group-hover:border-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]',
    textAccent: 'group-hover:text-white',
  },
  {
    id: 'base',
    name: 'Base',
    description: 'Explore Base transactions visually',
    iconUrl: '/chains/base.png',
    accentColor: 'group-hover:border-[#0052FF] group-hover:shadow-[0_0_20px_rgba(0,82,255,0.2)]',
    textAccent: 'group-hover:text-[#0052FF]',
  },
  {
    id: 'unichain',
    name: 'Unichain',
    description: 'Explore Unichain transactions visually',
    iconUrl: '/chains/unichain.png',
    accentColor: 'group-hover:border-[#FF007A] group-hover:shadow-[0_0_20px_rgba(255,0,122,0.2)]',
    textAccent: 'group-hover:text-[#FF007A]',
  },
  {
    id: 'megaeth',
    name: 'MegaETH',
    description: 'Explore MegaETH transactions visually',
    iconUrl: '/chains/megaeth.png',
    accentColor: 'group-hover:border-[#00ff88] group-hover:shadow-[0_0_20px_rgba(0,255,136,0.2)]',
    textAccent: 'group-hover:text-[#00ff88]',
  }
]

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ExplorerContent() {
  const router = useRouter()
  const isMegaEth = activeChainConfig.name === 'MegaETH'
  const isInk = activeChainConfig.name === 'Ink'
  const isUnichain = activeChainConfig.name === 'Unichain'
  const isBase = activeChainConfig.name === 'Base'

  useEffect(() => {
    if (!isMultiChain) {
      router.push(`/explorer/${activeChainConfig.name.toLowerCase()}`)
    }
  }, [router])

  if (!isMultiChain) return null

  return (
    <main className={`relative z-10 min-h-screen pt-32 pb-12 px-4 md:px-8 ${isMegaEth ? 'text-white font-mono' : isBase ? 'text-black' : 'text-white'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h1 className={`font-extrabold tracking-tight ${isMegaEth ? 'text-4xl md:text-6xl uppercase text-white' : isInk ? 'text-4xl md:text-6xl tracking-tighter text-white' : isUnichain ? 'text-4xl md:text-6xl font-serif italic text-white' : isBase ? 'text-4xl md:text-6xl tracking-tighter text-black' : 'text-4xl md:text-5xl text-white'}`}>
              {isMegaEth ? '// BLOCK EXPLORER' : 'Block Explorer'}
            </h1>
            <p className={`${isMegaEth ? 'text-white/40 text-sm uppercase' : isInk || isUnichain ? 'text-white/70 text-lg' : isBase ? 'text-black/40 text-lg' : 'text-gray-400 text-lg'} max-w-2xl mx-auto`}>
              Select a network below to dive into real-time transaction data and analyze on-chain activity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CHAINS.map((chain) => (
              <Link 
                key={chain.id} 
                href={`/explorer/${chain.id}`}
                className={`group relative p-8 transition-all duration-300 flex items-start gap-6 border ${
                  isMegaEth 
                    ? 'bg-black border-white/10 rounded-none hover:border-[#00ff88]/50' 
                    : isInk
                      ? 'rounded-3xl bg-white/[0.02] border-white/[0.08] backdrop-blur-md hover:border-[#7B61FF]/50 shadow-[0_0_20px_rgba(123,97,255,0.05)]'
                    : isUnichain
                      ? 'rounded-2xl bg-white/[0.02] border-white/[0.08] backdrop-blur-md hover:border-[#FF007A]/50 shadow-[0_0_20px_rgba(255,0,122,0.05)]'
                    : isBase
                      ? 'rounded-3xl bg-[#f4f5f7] border-black/5 hover:border-[#0052FF]/50 shadow-sm'
                      : `rounded-3xl bg-white/[0.02] border-white/[0.08] backdrop-blur-md ${chain.accentColor}`
                }`}
              >
                <div className={`relative w-16 h-16 overflow-hidden transition-transform duration-300 border border-white/10 group-hover:scale-105 ${
                  isMegaEth ? 'bg-black rounded-none' : 'rounded-2xl bg-white/5 p-2 flex-shrink-0'
                }`}>
                  <Image
                    src={chain.iconUrl}
                    alt={`${chain.name} logo`}
                    fill
                    className={`object-contain ${isMegaEth ? 'p-2' : 'p-1'}`}
                  />
                </div>
                <div className="flex-1 pt-1">
                  <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                    isMegaEth 
                      ? 'text-white uppercase group-hover:text-[#00ff88]' 
                    : isBase
                      ? 'text-black group-hover:text-[#0052FF]'
                      : `text-gray-200 ${chain.textAccent}`
                  }`}>
                    {chain.name}
                  </h2>
                  <p className={`${isMegaEth ? 'text-white/40 text-sm' : isBase ? 'text-black/60 font-medium' : 'text-gray-400 font-medium'} leading-relaxed`}>
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
