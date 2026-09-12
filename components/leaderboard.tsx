"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAccount } from "wagmi"
import { createPublicClient, http, isAddress, type Chain } from "viem"
import { fetchGlobalLeaderboard, getChainLeaderboard, type GlobalPlayer } from "@/lib/chain-leaderboard"
import { soneiumMainnet, inkMainnet, base, unichain, megaEth, litvmTestnet, arcTestnet, sepoliaTestnet, abstractMainnet } from "@/lib/chains"
import { NFT_ABI } from "@/lib/nft-contracts"
import { AlertCircle, Star } from "lucide-react"

export type ChainFilterType = 'Global' | 'Ink' | 'Soneium' | 'Base' | 'Unichain' | 'MegaETH' | 'LitVM' | 'Arc Testnet' | 'Sepolia' | 'Abstract'

import { useChainUI } from "@/hooks/use-chain-ui"
import { accentTextClass } from "@/lib/chain-ui"
import { cn } from "@/lib/utils"

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
  Abstract: process.env.NEXT_PUBLIC_NFT_CONTRACT_ABSTRACT,
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
  Abstract: abstractMainnet,
}

// ─── 5-minute in-memory cache ─────────────────────────────────────────────────
interface NftCache {
  holderSet: Set<string>      // lowercase addresses
  totalMinted: number
  expiry: number
}
const nftCache = new Map<string, NftCache>() // key = chainFilter

// NFTMinted(address indexed player, uint256 tokenId)
const NFT_MINTED_TOPIC0 = "0x4cc0a9c4a99ddc700de1af2c9f916a7cbfdb71f14801ccff94061ad1ef8a8040"

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

  // Fetch totalMinted + all holders from NFTMinted events
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

      // Fetch all holders from NFTMinted events (paginated)
      // This is the correct way — get ALL minters, not just top players
      try {
        const logs = await client.getLogs({
          address: nftAddress,
          event: {
            type: 'event',
            name: 'NFTMinted',
            inputs: [
              { name: 'player', type: 'address', indexed: true },
              { name: 'tokenId', type: 'uint256', indexed: false },
            ],
          },
          fromBlock: BigInt(0),
          toBlock: 'latest',
        })
        for (const log of logs) {
          // topics[1] = indexed player address (32-byte padded)
          const player = '0x' + (log.topics[1] as string).slice(26)
          holderSet.add(player.toLowerCase())
        }
      } catch {
        // Fallback: check hasMinted for provided players if event scan fails
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
      }
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
  const ui = useChainUI()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<GlobalPlayer[]>([])
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [failedNetworks, setFailedNetworks] = useState<string[]>([])

  // NFT-specific state
  const [holderSet, setHolderSet] = useState<Set<string>>(new Set())
  const [totalMinted, setTotalMinted] = useState(0)
  const [nftLoading, setNftLoading] = useState(false)

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
        const top = res.players.slice(0, 100)
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
        else if (chainFilter === 'Abstract') chainConfig = { chain: abstractMainnet, contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ABSTRACT!, chainName: "Abstract" }

        if (chainConfig?.contractAddress) {
          try {
            const players = await getChainLeaderboard(chainConfig)
            setTotalPlayers(players.length)
            const top = players.slice(0, 100)
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
      case "Sepolia": iconUrl = '/chains/sepolia.svg'; break
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
          className={`w-5 h-5 rounded-full shrink-0 object-cover border border-white/10 bg-black/20`}
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
    <div className="w-full max-w-4xl mx-auto p-6 transition-all backdrop-blur-xl bg-black/60 border border-white/10 rounded-2xl shadow-2xl">

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className={cn('text-[10px] uppercase mb-1 tracking-widest', ui.label)}>
            {ui.labelPrefix}Leaderboard
          </div>
          <h2 className={`font-bold ${ui.heading}`}>
            {titlePrefix} Leaderboard
          </h2>
        </div>
        <button
          onClick={loadLeaderboard}
          disabled={loading}
          className={cn('p-2 transition-colors disabled:opacity-50 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white', ui.radiusSm)}
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
            className="flex items-center gap-2 border px-4 py-2.5 rounded-xl"
            style={{ borderColor: `${ui.accent}40`, background: `${ui.accent}0D` }}
          >
            {nftLoading ? (
              <div
                className="h-3.5 w-3.5 animate-spin rounded-full border-2"
                style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: ui.accent }}
              />
            ) : (
              <Star fill={ui.accent} color={ui.accent} className="w-4 h-4 shrink-0" />
            )}
            <span className="text-sm font-semibold text-white">
              {nftLoading ? "…" : totalMinted}
            </span>
            <span className="text-xs text-white/50">Masters</span>
          </div>
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
            <tr className="border-b text-xs sm:text-sm border-white/10 text-gray-400">
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
                <tr key={i} className="border-b animate-pulse border-white/5">
                  {/* Rank placeholder */}
                  <td className="py-4.5 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="size-4 rounded-full bg-white/10" />
                      <div className="w-6 h-4 rounded bg-white/10" />
                    </div>
                  </td>
                  {/* Wallet address placeholder */}
                  <td className="py-4.5">
                    <div className="flex items-center gap-2">
                      <div className="w-28 h-4 rounded bg-white/10" />
                      {i < 2 && (
                        <div className="w-14 h-4 rounded-full bg-white/10" />
                      )}
                    </div>
                  </td>
                  {/* Chains column placeholder (Global only) */}
                  {chainFilter === 'Global' && (
                    <td className="py-4.5">
                      <div className="flex items-center gap-1">
                        <div className="size-5 rounded-full bg-white/10" />
                        <div className="size-5 rounded-full bg-white/10" />
                      </div>
                    </td>
                  )}
                  {/* Stats columns */}
                  <td className="py-4.5">
                    <div className="w-10 h-4 rounded ml-auto bg-white/10" />
                  </td>
                  <td className="py-4.5 hidden md:table-cell">
                    <div className="w-8 h-4 rounded ml-auto bg-white/10" />
                  </td>
                  <td className="py-4.5 pr-4 hidden md:table-cell">
                    <div className="w-10 h-4 rounded ml-auto bg-white/10" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
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
                      Leaderboard Empty
                    </h3>
                    <p className="text-xs text-muted-foreground opacity-75 mb-6 leading-relaxed">
                      Be the first to secure a spot on the ${chainFilter === 'Global' ? 'global' : chainFilter} leaderboard by playing the quiz!
                    </p>
                    <Link
                      href="/"
                      className="inline-flex cursor-pointer items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-white shadow-md rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${ui.accent}, ${ui.accent}cc)`,
                        boxShadow: `0 4px 15px ${ui.accent}33`
                      }}
                    >
                      Start Quiz Challenge
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
data.map((player) => {
                const isHolder = holderSet.has(player.address.toLowerCase())
                const isMe = player.address.toLowerCase() === address?.toLowerCase()
                const rankColor = player.rank === 1
                  ? accentTextClass(ui)
                  : player.rank === 2
                    ? "text-gray-300"
                    : player.rank === 3
                      ? "text-amber-600"
                      : "text-white/60"

                return (
                  <tr
                    key={player.address}
                    className={`border-b transition-all duration-200 border-white/5 ${
                      isMe
                        ? "bg-[var(--chain-accent)]/10 hover:bg-[var(--chain-accent)]/15"
                        : "hover:bg-white/5"
                    }`}
                    style={
                      isMe
                        ? { boxShadow: `inset 2px 0 0 ${ui.accent}`, ['--chain-accent' as string]: ui.accent }
                        : {}
                    }
                  >
                    {/* Rank */}
                    <td className="py-4 pl-4 font-medium">
                      <div className="flex items-center gap-2">
                        {player.rank === 1 && (
                          <Star fill={ui.accent} color={ui.accent} className="w-4 h-4" />
                        )}
                        <span className={rankColor}>
                          #{player.rank}
                        </span>
                      </div>
                    </td>

                    {/* Wallet address + badges */}
                    <td className="py-4 font-mono text-xs md:text-sm text-white">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="truncate">{truncateAddress(player.address)}</span>

                        {/* NFT Holder star */}
                        {isHolder && hasNftContract && (
                          <span
                            title="NFT Master — reached 100 points"
                            className="flex items-center gap-0.5 border px-1.5 py-0.5 text-[10px] font-bold rounded-full uppercase"
                            style={{ background: `${ui.accent}1A`, borderColor: `${ui.accent}66`, color: ui.accent }}
                          >
                            <Star fill={ui.accent} color={ui.accent} className="w-2.5 h-2.5" />
                            Master
                          </span>
                        )}

                        {/* You badge */}
                        {isMe && (
                          <span
                            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: ui.accent }}
                          >
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

                    <td className="py-4 text-right font-bold text-white">{player.points}</td>
                    <td className="py-4 text-right hidden md:table-cell text-white/40">{player.games}</td>
                    <td className={cn("py-4 pr-4 text-right font-medium hidden md:table-cell", accentTextClass(ui))}>
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
      {!loading && totalPlayers > 100 && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing top 100 of {totalPlayers} unique players
        </div>
      )}
    </div>
  )
}
