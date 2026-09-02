"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAccount } from "wagmi"
import { createPublicClient, http, isAddress, type Chain } from "viem"
import { fetchGlobalLeaderboard, getChainLeaderboard, type GlobalPlayer } from "@/lib/chain-leaderboard"
import { soneiumMainnet, inkMainnet, base, unichain, megaEth, litvmTestnet, arcTestnet, sepoliaTestnet } from "@/lib/chains"
import { NFT_ABI } from "@/lib/nft-contracts"
import { AlertCircle, Star } from "lucide-react"

export type ChainFilterType = 'Global' | 'Ink' | 'Soneium' | 'Base' | 'Unichain' | 'MegaETH' | 'LitVM' | 'Arc Testnet' | 'Sepolia'

import { useActiveChain } from "@/hooks/use-active-chain"

// ─── NFT contract addresses per chain ────────────────────────────────────────
const NFT_CONTRACT_MAP: Record<string, string | undefined> = {
  Ink:     process.env.NEXT_PUBLIC_NFT_CONTRACT_INK,
  Soneium: process.env.NEXT_PUBLIC_NFT_CONTRACT_SONEIUM,
  Base:    process.env.NEXT_PUBLIC_NFT_CONTRACT_BASE,
  Unichain: process.env.NEXT_PUBLIC_NFT_CONTRACT_UNICHAIN,
  MegaETH: process.env.NEXT_PUBLIC_NFT_CONTRACT_MEGAETH,
  LitVM:   process.env.NEXT_PUBLIC_NFT_CONTRACT_LITVM,
  'Arc Testnet': process.env.NEXT_PUBLIC_NFT_CONTRACT_ARC,
  Sepolia: process.env.NEXT_PUBLIC_NFT_CONTRACT_SEPOLIA,
}

const CHAIN_FOR_NAME: Record<string, Chain> = {
  Ink:     inkMainnet,
  Soneium: soneiumMainnet,
  Base:    base,
  Unichain: unichain,
  MegaETH: megaEth,
  LitVM:   litvmTestnet,
  'Arc Testnet': arcTestnet,
  Sepolia: sepoliaTestnet,
}

// ─── 5-minute in-memory cache ─────────────────────────────────────────────────
interface NftCache {
  holderSet: Set<string>      // lowercase addresses
  totalMinted: number
  expiry: number
}
const nftCache = new Map<string, NftCache>() // key = chainFilter

async function fetchNftData(
  chainFilter: ChainFilterType,
  playerAddresses: string[]
): Promise<{ holderSet: Set<string>; totalMinted: number }> {
  const cacheKey = chainFilter
  const cached = nftCache.get(cacheKey)
  if (cached && Date.now() < cached.expiry) {
    return { holderSet: cached.holderSet, totalMinted: cached.totalMinted }
  }

  // Determine which chains + NFT contracts to query
  const chainsToQuery: Array<{ chain: Chain; nftAddress: `0x${string}` }> = []

  if (chainFilter === 'Global') {
    for (const [name, addr] of Object.entries(NFT_CONTRACT_MAP)) {
      const chain = CHAIN_FOR_NAME[name]
      if (addr && chain && isAddress(addr)) {
        chainsToQuery.push({ chain, nftAddress: addr as `0x${string}` })
      }
    }
  } else {
    const addr = NFT_CONTRACT_MAP[chainFilter]
    const chain = CHAIN_FOR_NAME[chainFilter]
    if (addr && chain && isAddress(addr)) {
      chainsToQuery.push({ chain, nftAddress: addr as `0x${string}` })
    }
  }

  if (chainsToQuery.length === 0) {
    return { holderSet: new Set(), totalMinted: 0 }
  }

  const holderSet = new Set<string>()
  let totalMinted = 0

  // For each chain, fetch totalMinted + hasMinted for all players in parallel
  await Promise.allSettled(
    chainsToQuery.map(async ({ chain, nftAddress }) => {
      const client = createPublicClient({ chain, transport: http() })

      // Fetch totalMinted
      try {
        const minted = await client.readContract({
          address: nftAddress,
          abi: NFT_ABI,
          functionName: "totalMinted",
        }) as bigint
        totalMinted += Number(minted)
      } catch {
        // ignore per-chain errors
      }

      // Fetch hasMinted for every player in parallel
      const unique = [...new Set(playerAddresses.map(a => a.toLowerCase()))]
      const results = await Promise.allSettled(
        unique.map(addr =>
          client.readContract({
            address: nftAddress,
            abi: NFT_ABI,
            functionName: "hasMinted",
            args: [addr as `0x${string}`],
          }) as Promise<boolean>
        )
      )
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value) {
          holderSet.add(unique[i])
        }
      })
    })
  )

  // Cache for 5 minutes
  nftCache.set(cacheKey, { holderSet, totalMinted, expiry: Date.now() + 5 * 60 * 1000 })
  return { holderSet, totalMinted }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Leaderboard({ chainFilter = 'Global' }: { chainFilter?: ChainFilterType }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { address } = useAccount()
  const { chainConfig: cfg, isConnected } = useActiveChain()
  const isMegaEth = isConnected && cfg?.name === 'MegaETH'
  const isInk = isConnected && cfg?.name === 'Ink'
  const isUnichain = isConnected && cfg?.name === 'Unichain'
  const isBase = isConnected && cfg?.name === 'Base'
  const isSoneium = isConnected && (cfg?.name === 'Soneium' || cfg?.name === 'Sepolia')
  const isLitvm = isConnected && cfg?.name === 'LitVM'
  const isArc = isConnected && cfg?.name === 'Arc Testnet'
  const isSepolia = isConnected && cfg?.name === 'Sepolia'

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<GlobalPlayer[]>([])
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [failedNetworks, setFailedNetworks] = useState<string[]>([])

  // NFT-specific state
  const [holderSet, setHolderSet] = useState<Set<string>>(new Set())
  const [totalMinted, setTotalMinted] = useState(0)
  const [nftLoading, setNftLoading] = useState(false)
  const [showMastersOnly, setShowMastersOnly] = useState(false)

  // Track whether this chain has any NFT contract configured
  const hasNftContract =
    chainFilter === 'Global'
      ? Object.values(NFT_CONTRACT_MAP).some(a => a && isAddress(a))
      : !!(NFT_CONTRACT_MAP[chainFilter] && isAddress(NFT_CONTRACT_MAP[chainFilter]!))

  // Keep a ref to current raw data so NFT refresh doesn't need the whole loadLeaderboard cycle
  const rawDataRef = useRef<GlobalPlayer[]>([])

  const loadNftData = useCallback(async (players: GlobalPlayer[]) => {
    if (!hasNftContract || players.length === 0) return
    setNftLoading(true)
    try {
      const addrs = players.map(p => p.address)
      const { holderSet: hs, totalMinted: tm } = await fetchNftData(chainFilter, addrs)
      setHolderSet(hs)
      setTotalMinted(tm)
    } catch {
      // silently ignore NFT fetch errors
    } finally {
      setNftLoading(false)
    }
  }, [chainFilter, hasNftContract])

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true)

      if (chainFilter === 'Global') {
        const res = await fetchGlobalLeaderboard()
        setTotalPlayers(res.players.length)
        const top = res.players.slice(0, 20)
        setData(top)
        rawDataRef.current = top
        setFailedNetworks(res.failedChains)
        void loadNftData(top)
      } else {
        setFailedNetworks([])

        let chainConfig: { chain: Chain; contractAddress: string; chainName: string } | undefined
        if (chainFilter === 'Ink')  chainConfig = { chain: inkMainnet,      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_INK_MAINNET!,  chainName: "Ink" }
        else if (chainFilter === 'Soneium')  chainConfig = { chain: soneiumMainnet, contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET!,      chainName: "Soneium" }
        else if (chainFilter === 'Base') chainConfig = { chain: base,            contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_MAINNET!, chainName: "Base" }
        else if (chainFilter === 'Unichain') chainConfig = { chain: unichain,   contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN!,      chainName: "Unichain" }
        else if (chainFilter === 'MegaETH') chainConfig = { chain: megaEth,   contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH!,      chainName: "MegaETH" }
        else if (chainFilter === 'LitVM') chainConfig = { chain: litvmTestnet, contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LITVM!, chainName: "LitVM" }
        else if (chainFilter === 'Arc Testnet') chainConfig = { chain: arcTestnet, contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARC!, chainName: "Arc Testnet" }
        else if (chainFilter === 'Sepolia') chainConfig = { chain: sepoliaTestnet, contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA!, chainName: "Sepolia" }

        if (chainConfig?.contractAddress) {
          try {
            const players = await getChainLeaderboard(chainConfig)
            setTotalPlayers(players.length)
            const top = players.slice(0, 20)
            setData(top)
            rawDataRef.current = top
            void loadNftData(top)
          } catch (err) {
            const msg = err instanceof Error ? err.message.split('\n')[0] : String(err)
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[Leaderboard] ${chainFilter} RPC unavailable:`, msg)
            }
            setFailedNetworks([chainFilter])
            setData([])
            rawDataRef.current = []
            setTotalPlayers(0)
          }
        } else {
          setData([])
          rawDataRef.current = []
          setTotalPlayers(0)
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Leaderboard] Unexpected error during fetch:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [chainFilter, loadNftData])

  useEffect(() => {
    loadLeaderboard()
    const interval = setInterval(loadLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [loadLeaderboard])

  // Derived display list (apply Masters filter)
  const displayData = showMastersOnly
    ? data.filter(p => holderSet.has(p.address.toLowerCase()))
    : data

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const renderChainBadge = (chainName: string) => {
    let iconUrl = ''
    switch (chainName) {
      case "Ink":      iconUrl = '/chains/ink-logo-purple-icon.png'; break
      case "Soneium":  iconUrl = soneiumMainnet.iconUrl || '/icon.svg'; break
      case "Base":     iconUrl = '/chains/base.png'; break
      case "Unichain": iconUrl = unichain.iconUrl || 'https://github.com/Uniswap.png'; break
      case "MegaETH":  iconUrl = '/chains/megaeth.png'; break
      case "LitVM":
      case "LitVM LiteForge": iconUrl = '/chains/litvm.png'; break
      case "Arc Testnet": iconUrl = '/chains/arc.png'; break
      case "Sepolia": iconUrl = ''; break
    }
    if (iconUrl) {
      return (
        <Image
          key={chainName}
          src={iconUrl}
          alt={`${chainName} logo`}
          title={chainName}
          width={20}
          height={20}
          className={`w-5 h-5 rounded-full shrink-0 object-cover border ${isBase ? 'border-black/10 bg-black/5' : 'border-white/10 bg-black/20'}`}
        />
      )
    }
    return (
      <span key={chainName} title={chainName} className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-500 text-[10px] font-bold text-white shrink-0">
        {chainName[0]}
      </span>
    )
  }

  const titlePrefix = chainFilter === 'Global' ? 'Global' : chainFilter

  if (!mounted) return null

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 transition-all ${
      isMegaEth 
        ? 'bg-black border border-white/15 rounded-none font-mono shadow-none' 
        : isInk
          ? 'backdrop-blur-2xl bg-white/[0.02] border border-white/[0.08] rounded-3xl shadow-[0_0_40px_rgba(123,97,255,0.05)]'
        : isUnichain
          ? 'backdrop-blur-2xl bg-white/[0.02] border border-white/[0.08] rounded-2xl shadow-[0_0_40px_rgba(255,0,122,0.05)]'
        : isBase
          ? 'bg-[#f4f5f7] border border-black/5 rounded-2xl shadow-sm'
        : isLitvm
          ? 'bg-[#0B192C] border border-[#00F2FE]/20 rounded-none font-mono shadow-none'
        : isArc
          ? 'backdrop-blur-xl bg-[#000B24]/60 border border-[#4D8EE9]/15 rounded-2xl shadow-2xl'
          : 'backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl shadow-2xl'
    }`}>

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {isMegaEth && <div className="text-[10px] text-[#00ff88] uppercase mb-1 tracking-widest font-mono">// LEADERBOARD</div>}
          {isLitvm && <div className="text-[10px] text-[#00F2FE] lowercase mb-1 tracking-widest font-mono">{'>>'} leaderboard</div>}
          {isArc && <div className="text-[10px] text-[#4D8EE9] uppercase mb-1 tracking-widest">Leaderboard</div>}
          <h2 className={`font-bold ${isMegaEth ? 'text-3xl uppercase font-mono text-white' : isInk ? 'text-2xl tracking-tighter text-white' : isUnichain ? 'text-2xl font-serif italic text-white' : isBase ? 'text-2xl tracking-tighter text-black' : isLitvm ?'text-3xl font-mono text-[#E2E8F0]' : 'text-2xl text-white'}`}>
            {titlePrefix} Leaderboard
          </h2>
        </div>
        <button
          onClick={loadLeaderboard}
          disabled={loading}
          className={`p-2 transition-colors disabled:opacity-50 flex items-center justify-center ${
            isMegaEth 
              ? 'bg-black border border-white/15 rounded-none text-white hover:border-white' 
              : isInk
                ? 'rounded-full bg-white/5 hover:bg-[#7B61FF] text-white hover:shadow-[0_0_15px_rgba(123,97,255,0.4)]'
              : isUnichain
                ? 'rounded-xl bg-white/5 hover:bg-[#FF007A] text-white hover:shadow-[0_0_15px_rgba(255,0,122,0.4)]'
              : isBase
                ? 'rounded-full bg-black/5 hover:bg-[#0052FF] text-black hover:text-white transition-all'
              : isLitvm
                ? 'bg-[#0B192C] border border-[#00F2FE]/30 text-[#E2E8F0] hover:border-[#00F2FE] rounded-none'
                : 'rounded-lg bg-white/5 hover:bg-white/10 text-white'
          }`}
          aria-label="Refresh Leaderboard"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* ── NFT stats row ─────────────────────────────────────────────────── */}
      {hasNftContract && (
        <div className="mb-4 flex flex-wrap items-center gap-2 md:gap-3">
          {/* Masters count card */}
          <div
            className={`flex items-center gap-2 border px-4 py-2.5 ${isMegaEth ? 'rounded-none' : isInk ? 'rounded-3xl' : isUnichain ? 'rounded-2xl' : isBase ? 'rounded-full shadow-sm' : isLitvm ? 'rounded-none' : 'rounded-xl'}`}
            style={{
              borderColor: isMegaEth ? "rgba(0,255,136,0.25)" : isInk ? "rgba(123,97,255,0.25)" : isUnichain ? "rgba(255,0,122,0.25)" : isBase ? "rgba(0,82,255,0.2)" : isLitvm ? "rgba(0,242,254,0.25)" : isArc ? "rgba(77,142,233,0.25)" : "rgba(255,215,0,0.25)",
              background: isMegaEth ? "rgba(0,255,136,0.05)" : isInk ? "rgba(123,97,255,0.05)" : isUnichain ? "rgba(255,0,122,0.05)" : isBase ? "#ffffff" : isLitvm ? "rgba(0,242,254,0.05)" : isArc ? "rgba(77,142,233,0.05)" : "rgba(255,215,0,0.05)",
            }}
          >
            {nftLoading ? (
              <div
                className="h-3.5 w-3.5 animate-spin rounded-full border-2"
                style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isLitvm ? "#00F2FE" : isArc ? "#4D8EE9" : "#FFD700" }}
              />
            ) : (
              <Star fill={isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isLitvm ? "#00F2FE" : isArc ? "#4D8EE9" : "#FFD700"} color={isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isLitvm ? "#00F2FE" : isArc ? "#4D8EE9" : "#FFD700"} className="w-4 h-4 shrink-0" />
            )}
            <span className={`text-sm font-semibold ${isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>
              {nftLoading ? "…" : totalMinted}
            </span>
            <span className={`text-xs ${isBase ? 'text-black/50' : 'text-white/50'}`}>Masters</span>
          </div>

          {/* Show Masters Only toggle */}
          <button
            onClick={() => setShowMastersOnly(v => !v)}
            disabled={nftLoading || holderSet.size === 0}
            className={`flex items-center gap-1.5 border px-3 py-2 text-xs font-semibold transition-all hover-lift disabled:cursor-not-allowed disabled:opacity-40 ${isMegaEth ? 'rounded-none' : isInk ? 'rounded-full' : isUnichain ? 'rounded-xl' : isBase ? 'rounded-full' : isLitvm ? 'rounded-none' : 'rounded-xl'}`}
            style={
              showMastersOnly
                ? {
                    background: isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isLitvm ? "#00F2FE" : isArc ? "#4D8EE9" : "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                    borderColor: isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isLitvm ? "#00F2FE" : isArc ? "#4D8EE9" : "#FFD700",
                    color: isBase ? "#ffffff" : isLitvm ? "#0B192C" : isArc ? "#ffffff" : "#000",
                  }
                : {
                    borderColor: isMegaEth ? "rgba(0,255,136,0.3)" : isInk ? "rgba(123,97,255,0.3)" : isUnichain ? "rgba(255,0,122,0.3)" : isBase ? "rgba(0,82,255,0.3)" : isLitvm ? "rgba(0,242,254,0.3)" : isArc ? "rgba(77,142,233,0.3)" : "rgba(255,215,0,0.3)",
                    background: isMegaEth ? "rgba(0,255,136,0.05)" : isInk ? "rgba(123,97,255,0.05)" : isUnichain ? "rgba(255,0,122,0.05)" : isBase ? "#ffffff" : isLitvm ? "rgba(0,242,254,0.05)" : isArc ? "rgba(77,142,233,0.05)" : "rgba(255,215,0,0.05)",
                    color: isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isLitvm ? "#00F2FE" : isArc ? "#4D8EE9" : "#FFD700",
                  }
            }
          >
            <Star
              fill={showMastersOnly ? (isBase ? "#fff" : isLitvm ? "#0B192C" : isArc ? "#fff" : "#000") : (isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isLitvm ? "#00F2FE" : isArc ? "#4D8EE9" : isSoneium ? "#0047FF" : "#FFD700")}
              color={showMastersOnly ? (isBase ? "#fff" : isLitvm ? "#0B192C" : isArc ? "#fff" : "#000") : (isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isLitvm ? "#00F2FE" : isArc ? "#4D8EE9" : isSoneium ? "#0047FF" : "#FFD700")}
              className="w-3.5 h-3.5 shrink-0"
            />
            <span className="whitespace-nowrap">{showMastersOnly ? "All Players" : "Show Masters Only"}</span>
          </button>
        </div>
      )}

      {/* ── Error/Warning banner ───────────────────────────────────────────── */}
      {failedNetworks.length > 0 && !loading && (
        <div className={`mb-4 p-3 md:p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 text-xs md:text-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
          data.length > 0 
            ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
            : "bg-red-500/10 border-red-500/20 text-red-200"
        }`}>
          <div className="flex items-start md:items-center gap-2 md:gap-3">
            <div className={`p-1.5 md:p-2 rounded-lg ${data.length > 0 ? "bg-amber-500/20" : "bg-red-500/20"}`}>
              <AlertCircle className={`w-4 h-4 md:w-5 md:h-5 ${data.length > 0 ? "text-amber-400" : "text-red-400"}`} />
            </div>
            <div>
              <p className="font-bold flex items-center gap-2 flex-wrap">
                {data.length > 0 ? "Partial Data Displayed" : "Connection Error"}
                {data.length > 0 && <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-400 border border-amber-500/20 uppercase tracking-widest font-black">Limited View</span>}
              </p>
              <p className="text-xs opacity-80 mt-0.5 leading-relaxed">
                {data.length > 0 
                  ? `RPC nodes for ${failedNetworks.join(", ")} are currently busy. Scores from these chains may be missing.`
                  : `Failed to connect to ${failedNetworks.join(", ")}. Please check your network or try again.`}
              </p>
            </div>
          </div>
          <button 
            onClick={loadLeaderboard}
            className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shrink-0 border ${
              data.length > 0
                ? "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-200"
                : "bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-200"
            }`}
          >
            Reconnect Now
          </button>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto -mx-6 px-6 scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`border-b text-xs sm:text-sm ${isMegaEth ? 'border-white/15 text-white/40 uppercase' : isBase ? 'border-black/5 text-black/40' : isSoneium ? 'border-[#0047FF]/10 text-white/40' : isLitvm ? 'border-[#00F2FE]/15 text-[#E2E8F0]/40' : 'border-white/10 text-gray-400'}`}>
              <th className="pb-3 pl-4 font-medium sticky left-0 bg-inherit whitespace-nowrap z-10">Rank</th>
              <th className="pb-3 font-medium whitespace-nowrap">Wallet</th>
              {chainFilter === 'Global' && (
                <th className="pb-3 font-medium whitespace-nowrap">Chains</th>
              )}
              <th className="pb-3 text-right font-medium whitespace-nowrap">Points</th>
              <th className="pb-3 text-right font-medium whitespace-nowrap hidden md:table-cell">Games</th>
              <th className="pb-3 pr-4 text-right font-medium whitespace-nowrap hidden md:table-cell">Avg</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className={`border-b animate-pulse ${isBase ? 'border-black/5' : 'border-white/5'}`}>
                  {/* Rank placeholder */}
                  <td className="py-4.5 pl-4">
                    <div className="flex items-center gap-2">
                      <div className={`size-4 rounded-full ${isBase ? 'bg-black/10' : 'bg-white/10'}`} />
                      <div className={`w-6 h-4 rounded ${isBase ? 'bg-black/10' : 'bg-white/10'}`} />
                    </div>
                  </td>
                  {/* Wallet address placeholder */}
                  <td className="py-4.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-28 h-4 rounded ${isBase ? 'bg-black/10' : 'bg-white/10'}`} />
                      {i < 2 && (
                        <div className={`w-14 h-4 rounded-full ${isBase ? 'bg-black/10' : 'bg-white/10'}`} />
                      )}
                    </div>
                  </td>
                  {/* Chains column placeholder (Global only) */}
                  {chainFilter === 'Global' && (
                    <td className="py-4.5">
                      <div className="flex items-center gap-1">
                        <div className={`size-5 rounded-full ${isBase ? 'bg-black/10' : 'bg-white/10'}`} />
                        <div className={`size-5 rounded-full ${isBase ? 'bg-black/10' : 'bg-white/10'}`} />
                      </div>
                    </td>
                  )}
                  {/* Stats columns */}
                  <td className="py-4.5">
                    <div className={`w-10 h-4 rounded ml-auto ${isBase ? 'bg-black/10' : 'bg-white/10'}`} />
                  </td>
                  <td className="py-4.5 hidden md:table-cell">
                    <div className={`w-8 h-4 rounded ml-auto ${isBase ? 'bg-black/10' : 'bg-white/10'}`} />
                  </td>
                  <td className="py-4.5 pr-4 hidden md:table-cell">
                    <div className={`w-10 h-4 rounded ml-auto ${isBase ? 'bg-black/10' : 'bg-white/10'}`} />
                  </td>
                </tr>
              ))
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={chainFilter === 'Global' ? 6 : 5} className="py-16 text-center px-4">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto animate-scale-in">
                    <div className="mb-4 relative">
                      <div className="absolute inset-0 bg-white/5 blur-xl rounded-full scale-150 animate-pulse pointer-events-none" />
                      <div className="relative p-4 bg-white/[0.03] border border-white/[0.08] rounded-full flex items-center justify-center">
                        <Star className="size-8 text-yellow-500/80 animate-[float_4s_infinite]" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1.5 uppercase tracking-wide">
                      {showMastersOnly ? "No Masters Found" : "Leaderboard Empty"}
                    </h3>
                    <p className="text-xs text-muted-foreground opacity-75 mb-6 leading-relaxed">
                      {showMastersOnly 
                        ? "None of the players on this leaderboard have unlocked their NFT Master badge yet." 
                        : `Be the first to secure a spot on the ${chainFilter === 'Global' ? 'global' : chainFilter} leaderboard by playing the quiz!`}
                    </p>
                    {!showMastersOnly && (
                      <Link
                        href="/"
                        className={`inline-flex cursor-pointer items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-white shadow-md ${
                          isMegaEth || isLitvm ? 'rounded-none font-mono' : 'rounded-xl'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${cfg?.color ?? '#0047FF'}, ${(cfg?.color ?? '#0047FF')}cc)`,
                          boxShadow: `0 4px 15px ${(cfg?.color ?? '#0047FF')}33`
                        }}
                      >
                        Start Quiz Challenge
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              displayData.map((player) => {
                const isHolder = holderSet.has(player.address.toLowerCase())
                const isMe = player.address.toLowerCase() === address?.toLowerCase()
                const rankColor = isMegaEth 
                  ? (player.rank === 1 ? 'text-[#00ff88]' : 'text-white')
                  : isInk
                    ? (player.rank === 1 ? 'text-[#7B61FF]' : 'text-white/60')
                  : isUnichain
                    ? (player.rank === 1 ? 'text-[#FF007A]' : 'text-white/60')
                  : isBase
                    ? (player.rank === 1 ? 'text-[#0052FF]' : 'text-black/60')
                  : isSoneium
                    ? (player.rank === 1 ? 'text-[#0047FF]' : 'text-white/60')
                  : isLitvm
                    ? (player.rank === 1 ? 'text-[#00F2FE]' : 'text-[#E2E8F0]/60')
                  : isArc
                    ? (player.rank === 1 ? 'text-[#4D8EE9]' : 'text-white/60')
                    : (player.rank === 1 ? "text-yellow-400" : player.rank === 2 ? "text-gray-300" : player.rank === 3 ? "text-amber-600" : "text-gray-500")

                return (
                  <tr
                    key={player.address}
                    className={`border-b transition-all duration-200 ${isBase ? 'border-black/5' : 'border-white/5'} ${
                      isMe
                        ? (isMegaEth ? "bg-white/5" : isInk ? "bg-[#7B61FF]/10 hover:bg-[#7B61FF]/15" : isUnichain ? "bg-[#FF007A]/10 hover:bg-[#FF007A]/15" : isBase ? "bg-[#0052FF]/10 hover:bg-[#0052FF]/15" : isSoneium ? "bg-[#0047FF]/10 hover:bg-[#0047FF]/15" : isLitvm ? "bg-[#00F2FE]/10 hover:bg-[#00F2FE]/15" : isArc ? "bg-[#4D8EE9]/10 hover:bg-[#4D8EE9]/15" : "bg-[#0047FF]/10 hover:bg-[#0047FF]/15")
                        : (isBase ? "hover:bg-black/5" : isLitvm ? "hover:bg-white/[0.02]" : "hover:bg-white/5")
                    }`}
                    style={
                      isMe && !isBase && !isLitvm
                        ? { boxShadow: `inset 2px 0 0 ${cfg?.color ?? '#0047FF'}` }
                        : {}
                    }
                  >
                    {/* Rank */}
                    <td className="py-4 pl-4 font-medium">
                      <div className="flex items-center gap-2">
                        {player.rank === 1 && (
                          <Star fill={isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isLitvm ? "#00F2FE" : isArc ? "#4D8EE9" : "#FFD700"} color={isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isLitvm ? "#00F2FE" : isArc ? "#4D8EE9" : "#FFD700"} className="w-4 h-4" />
                        )}
                        <span className={rankColor}>
                          #{player.rank}
                        </span>
                      </div>
                    </td>

                    {/* Wallet address + badges */}
                    <td className={`py-4 font-mono text-xs md:text-sm ${isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'}`}>
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="truncate">{truncateAddress(player.address)}</span>

                        {/* NFT Holder star */}
                        {isHolder && hasNftContract && (
                          <span
                            title="NFT Master — reached 100 points"
                            className={`flex items-center gap-0.5 border px-1.5 py-0.5 text-[10px] font-bold ${
                              isMegaEth 
                                ? 'bg-black border-[#00ff88] text-[#00ff88] rounded-none uppercase' 
                                : isInk
                                  ? 'bg-[rgba(123,97,255,0.1)] border-[rgba(123,97,255,0.4)] text-[#7B61FF] rounded-full'
                                : isUnichain
                                  ? 'bg-[rgba(255,0,122,0.1)] border-[rgba(255,0,122,0.4)] text-[#FF007A] rounded-full'
                                : isBase
                                  ? 'bg-[rgba(0,82,255,0.1)] border-[rgba(0,82,255,0.4)] text-[#0052FF] rounded-full'
                                : isLitvm ?'bg-[rgba(0,242,254,0.1)] border-[rgba(0,242,254,0.4)] text-[#00F2FE] rounded-none'
                                  : isArc ? 'bg-[rgba(77,142,233,0.1)] border-[rgba(77,142,233,0.4)] text-[#4D8EE9] rounded-full'
                                    : 'bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.4)] text-[#FFD700] rounded-full'
                            }`}
                          >
                            <Star fill={isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isLitvm ? "#00F2FE" : isArc ? "#4D8EE9" : "#FFD700"} color={isMegaEth ? "#00ff88" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isLitvm ? "#00F2FE" : isArc ? "#4D8EE9" : "#FFD700"} className="w-2.5 h-2.5" />
                            Master
                          </span>
                        )}

                        {/* You badge */}
                        {isMe && (
                          <span className={`text-[10px] ${isLitvm ? 'lowercase' : 'uppercase'} font-bold tracking-wider px-2 py-0.5 ${

                            isMegaEth 
                              ? 'bg-[#00ff88] text-black rounded-none' 
                              : isInk
                                ? 'bg-[#7B61FF] text-white rounded-full'
                              : isUnichain
                                ? 'bg-[#FF007A] text-white rounded-xl'
                              : isBase
                                ? 'bg-[#0052FF] text-white rounded-full'
                              : isLitvm
                                ? 'bg-[#00F2FE] text-[#0B192C] rounded-none'
                              : isArc
                                ? 'bg-[#4D8EE9] text-white rounded-full'
                                : 'bg-[#0047FF] text-white rounded-full'
                          }`}>
                            You
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Chains (Global only) */}
                    {chainFilter === 'Global' && (
                      <td className="py-4">
                        <div className="flex items-center gap-1">
                          {player.chains.map(renderChainBadge)}
                        </div>
                      </td>
                    )}

                    <td className={`py-4 text-right font-bold ${isBase ? 'text-black' : isLitvm ? 'text-[#E2E8F0]' : 'text-white'} ${isMegaEth || isLitvm ? 'font-mono' : ''}`}>{player.points}</td>
                    <td className={`py-4 text-right hidden md:table-cell ${isBase ? 'text-black/40' : isLitvm ? 'text-[#E2E8F0]/40' : 'text-white/40'}`}>{player.games}</td>
                    <td className={`py-4 pr-4 text-right font-medium hidden md:table-cell ${isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isLitvm ? 'text-[#00F2FE]' : isArc ? 'text-[#4D8EE9]' : 'text-[#0047FF]'}`}>
                      {Math.round(player.avg)}%
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      {!loading && totalPlayers > 20 && !showMastersOnly && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing top 20 of {totalPlayers} unique players
        </div>
      )}
      {showMastersOnly && !nftLoading && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing {displayData.length} NFT Master{displayData.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}
