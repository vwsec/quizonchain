"use client"

// Bubble Explorer — real-time canvas visualization of chain activity.
// Owns the search UI + page composition. The canvas engine lives in
// hooks/use-explorer-bubbles.ts, presentational panels in explorer-panels.tsx,
// and types/constants/helpers in lib/explorer-config.ts.

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  ExternalLink,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Search,
  X,
  Loader2,
  Clock,
  FileCode,
  Coins,
  Wallet,
  Bell,
} from 'lucide-react'
import { safeStorage } from '../lib/safe-storage'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useTelegramAlerts } from '@/hooks/use-telegram-alerts'
import { useExplorerBubbles } from '@/hooks/use-explorer-bubbles'
import { AlertBotModal } from './alert-bot-modal'
import {
  CHAIN_CONFIG,
  SEARCH_TYPES,
  timeAgo,
  truncateString,
  getTxPrimaryType,
  getTypeColor,
  passesFilter,
  getAddr,
  formatNativeValue,
  type ChainType,
  type FilterType,
  type TxData,
} from '@/lib/explorer-config'
import {
  TransactionDetailOverlay,
  AddressPanel,
  BlockPanel,
  Legend,
} from './explorer-panels'

export type { ChainType } from '@/lib/explorer-config'

function StatsCard({ label, value, accent, live, litvm, hiddenSm }: {
  label: string
  value: string | number
  accent: string
  live?: boolean
  litvm?: boolean
  hiddenSm?: boolean
}) {
  return (
    <div className={`
      relative overflow-hidden rounded-xl px-3 py-2 md:px-4 md:py-2.5
      border transition-all duration-300 hover:scale-[1.03] hover:shadow-lg
      flex flex-col items-start justify-center gap-1
      ${litvm
        ? 'bg-[rgba(11,25,44,0.7)] border-[rgba(0,242,254,0.25)] shadow-[0_0_20px_rgba(0,242,254,0.12)]'
        : 'bg-white/[0.04] border-white/[0.08] backdrop-blur-md'
      }
      ${hiddenSm ? 'hidden sm:flex' : 'flex'}
    `}>
      <div className="flex items-center gap-1.5 w-full">
        <span className={`
          text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]
          ${litvm ? 'text-[#00F2FE]/60' : 'text-gray-500'}
        `}>
          {label}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {live && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]"></span>
              </span>
              <span className="text-[7px] md:text-[8px] font-black text-green-500 tracking-[0.3em] uppercase">Live</span>
            </>
          )}
        </div>
      </div>
      <span className={`
        text-sm md:text-xl font-mono font-bold tracking-tight tabular-nums
        ${litvm ? 'text-[#00F2FE]' : 'text-white'}
        ${live ? 'animate-pulse' : ''}
      `}>
        {value}
      </span>
      {/* accent glow line at bottom */}
      <div className={`
        absolute bottom-0 left-0 right-0 h-[1px]
        ${litvm ? 'bg-gradient-to-r from-transparent via-[#00F2FE]/40 to-transparent' : 'bg-white/5'}
      `} />
    </div>
  )
}

export default function BubbleExplorer({ chain, initialAddress, initialTxHash }: { chain: ChainType; initialAddress?: string; initialTxHash?: string }) {
  const isMegaEth = chain === 'megaeth'
  const isBase = chain === 'base'
  const isSoneium = chain === 'soneium'
  const isLitvm = chain === 'litvm'

  const config = CHAIN_CONFIG[chain]
  const router = useRouter()
  const pathname = usePathname()

  const { settings, saveSettings, monitorTransactions } = useTelegramAlerts(config.name, config.explorer, { symbol: config.currency, decimals: config.decimals })
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false)

  const engine = useExplorerBubbles({ chain, config, monitorTransactions })
  const {
    canvasRef,
    containerRef,
    miniMapCanvasRef,
    bubblesRef,
    loading,
    error,
    lastUpdate,
    stats,
    filter,
    setFilter,
    hoveredTx,
    activeSearch,
    setActiveSearch,
    setFocusedTxHash,
    fetchBubblesData,
    addSearchTxsToBubbles,
  } = engine

  // --- Search UI state ---
  const [searchQuery, setSearchQuery] = useState(initialAddress || initialTxHash || '')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<{ type: string; data: any } | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [liveSuggestions, setLiveSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  // Setup History and Check outside click
  useEffect(() => {
    const hist = safeStorage.get(`explorer_search_history_${chain}`)
    if (hist) {
       try { setSearchHistory(JSON.parse(hist)) } catch {}
    }

    const handleClickOutside = (e: MouseEvent) => {
       if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
          setShowSuggestions(false)
       }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [chain])

  const clearSearch = useCallback(() => {
    setActiveSearch(null)
    setSearchQuery('')
    setSearchError(null)
    setSearchResult(null)
    setFocusedTxHash(null)
    router.push(`/explorer/${chain}`)
  }, [chain, router, setActiveSearch, setFocusedTxHash])

  // Live Suggestions Debouncer
  useEffect(() => {
    if (!searchQuery.trim()) {
       setLiveSuggestions([])
       return
    }
    const handler = setTimeout(async () => {
       try {
          const res = await fetch(`${config.apiBase}/search?q=${encodeURIComponent(searchQuery.trim())}`)
          if (res.ok) {
             const data = await res.json()
             setLiveSuggestions(data.items || [])
          }
       } catch {}
    }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery, config.apiBase])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Skip when typing in any input/textarea/contenteditable, not just our search box
        const el = document.activeElement
        const isTyping = el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
        if (isTyping) return
        if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Sync searchQuery state with props for navigation
  useEffect(() => {
    if (initialAddress || initialTxHash) {
      setSearchQuery(initialAddress || initialTxHash || '')
    }
  }, [initialAddress, initialTxHash])

  // Initial load for address or transaction from URL props
  useEffect(() => {
    if (initialAddress) {
      handleSearch(initialAddress)
    } else if (initialTxHash) {
      handleSearch(initialTxHash)
    } else {
      setSearchResult(null)
      setFocusedTxHash(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress, initialTxHash])

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleSearch = async (overrideQuery?: string) => {
    const q = (typeof overrideQuery === 'string' ? overrideQuery : searchQuery).trim()
    if (!q) return

    setSearchLoading(true)
    setSearchError(null)
    setSearchResult(null)
    setFocusedTxHash(null)
    setShowSuggestions(false)

    const saveSearchToHistory = (queryStr: string) => {
      let hist = [...searchHistory]
      hist = hist.filter(item => item !== queryStr)
      hist.unshift(queryStr)
      hist = hist.slice(0, 5)
      setSearchHistory(hist)
      safeStorage.set(`explorer_search_history_${chain}`, JSON.stringify(hist))
    }

    try {
      // ponytail: ENS branch recurses into handleSearch with the resolved address,
      // so history is saved there; only successful lookups reach a save below.

      if (SEARCH_TYPES.TX_HASH.test(q)) {
        if (!pathname.includes(q)) {
          router.push(`/explorer/${chain}/tx/${q}`)
        }

        const res = await fetch(`${config.apiBase}/transactions/${q}`)
        if (!res.ok) {
          setSearchError(`Transaction not found on ${config.name}`)
          return
        }
        const data = await res.json()

        addSearchTxsToBubbles([data])

        setActiveSearch({
          type: 'tx',
          query: q,
          txData: data
        })
        setSearchResult({ type: 'transaction', data })
        setFocusedTxHash(q)
        saveSearchToHistory(q)
      }
      else if (SEARCH_TYPES.ADDRESS.test(q)) {
        if (!pathname.includes(q)) {
          router.push(`/explorer/${chain}/${q}`)
        }

        const [addrRes, txsRes, countersRes] = await Promise.all([
          fetch(`${config.apiBase}/addresses/${q}`),
          fetch(`${config.apiBase}/addresses/${q}/transactions`),
          fetch(`${config.apiBase}/addresses/${q}/counters`).catch(() => null)
        ])

        if (!addrRes.ok) throw new Error('404')

        const addrData = await addrRes.json()
        const txsData = txsRes.ok ? await txsRes.json() : {}
        const countersData = countersRes?.ok ? await countersRes.json() : {}

        const txsList = txsData.items || txsData.result || txsData.transactions || []

        addSearchTxsToBubbles(txsList, true)

        setActiveSearch({
          type: 'address',
          query: q,
          address: q,
          addressData: { ...addrData, counters: countersData },
          addressTxs: txsList
        })
        saveSearchToHistory(q)
      }
      else if (SEARCH_TYPES.BLOCK.test(q)) {
        const [blockRes, txsRes] = await Promise.all([
          fetch(`${config.apiBase}/blocks/${q}`),
          fetch(`${config.apiBase}/blocks/${q}/transactions`)
        ])

        if (!blockRes.ok) throw new Error('404')

        const blockData = await blockRes.json()
        const txsData = await txsRes.json()

        addSearchTxsToBubbles(txsData.items || [], true)

        setActiveSearch({
          type: 'block',
          query: q,
          blockData,
          blockTxs: txsData.items || []
        })
        saveSearchToHistory(q)
      }
      else {
        // ENS support
        if (q.endsWith('.eth')) {
          try {
            const ensRes = await fetch(`https://api.ensideas.com/ens/resolve/${q}`)
            if (ensRes.ok) {
              const ensData = await ensRes.json()
              if (ensData.address) {
                handleSearch(ensData.address)
                return
              }
            }
          } catch (e) {
            console.error("ENS resolution failed", e)
          }
        }

        const res = await fetch(`${config.apiBase}/search?q=${encodeURIComponent(q)}`)
        if (!res.ok) throw new Error('404')
        const data = await res.json()
        if (data && data.items && data.items.length > 0) {
           setActiveSearch({
             type: 'search',
             query: q,
             searchItems: data.items
           })
           setSearchResult({ type: 'search', data: data.items })
        } else {
           throw new Error('404')
        }
      }
    } catch (err: any) {
      console.error(`Search error for ${q}:`, err?.message || err)
      setSearchError(`Not found on ${config.name}`)
    } finally {
      setSearchLoading(false)
    }
  }

  // --- Render ---
  return (
    <>
    <div className="relative w-full h-[calc(100dvh-80px)] flex flex-col pt-1">

      {/* Top Header UI — normal flow, below the global floating header */}
      <div className="relative z-20 px-4 md:px-8 flex flex-col md:flex-row justify-between items-start gap-3">

        {/* Left Side: Stats */}
        <div className="space-y-1 md:space-y-4 pointer-events-auto w-full md:w-auto">
          <div className="flex items-center gap-4">
            <h1 className={`text-xl md:text-4xl font-extrabold tracking-tight ${isMegaEth ? 'uppercase font-mono' : isBase ? 'tracking-tighter' : ''}`} style={{ color: config.color }}>
              {config.name}
            </h1>
            <span className={`hidden md:inline text-xl font-medium tracking-tight ${isBase ? 'text-black/40' : 'text-gray-400'}`}>
              Activity Explorer
            </span>
          </div>

          {/* ─── STATS CARDS ─── */}
          <div className="flex flex-wrap gap-2 md:gap-3">
            <StatsCard
              label="Total TXs"
              value={stats.totalTxs}
              accent={config.color}
              live
              litvm
            />
            <StatsCard
              label="Latest Block"
              value={stats.latestBlock || '-'}
              accent={config.color}
              litvm
            />
            <StatsCard
              label="Avg Gas"
              value={Number(stats.avgGas).toLocaleString()}
              accent={config.color}
              litvm
              hiddenSm
            />
          </div>
        </div>

        {/* Right Side: Filters & Controls */}
          <div className="flex flex-col items-start md:items-end gap-1 md:gap-3 pointer-events-auto w-full md:w-auto">

          <div className={`flex flex-nowrap overflow-x-auto scrollbar-none p-0.5 md:p-1 border shadow-sm ${
            isMegaEth
              ? 'bg-black border-white/10 rounded-none'
              : isBase
                ? 'bg-black/5 border-black/5 rounded-full'
                : isLitvm
                  ? 'bg-[#0B192C]/60 border-[#00F2FE]/15 rounded-[14px] backdrop-blur-md'
                  : 'bg-white/[0.04] border-white/[0.08] backdrop-blur-md rounded-full'
          }`}>
            {([
              { key: 'all' as FilterType, label: 'All' },
              { key: 'transfers' as FilterType, label: 'Transfers' },
              { key: 'contract_calls' as FilterType, label: 'Contract Calls' },
              { key: 'token_transfers' as FilterType, label: 'Token Transfers' },
              { key: 'nfts' as FilterType, label: 'NFTs' },
            ]).map(f => {
              // Cheap per-frame count from the live bubble set; re-renders on each poll
              const count = f.key === 'all'
                ? bubblesRef.current.size
                : Array.from(bubblesRef.current.values()).filter(b => passesFilter(b.tx, f.key)).length
              return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`px-2 md:px-3 py-1.5 md:py-1 text-[11px] md:text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap shrink-0 ${
                  isMegaEth ? 'rounded-none font-mono' : isLitvm ? 'rounded-full border border-[#00F2FE]/40 bg-[#0B192C]/40' : 'rounded-full'
                } ${
                  filter === f.key
                  ? isMegaEth ? 'bg-[#00ff88] text-black shadow-sm' : isLitvm ? 'bg-[#00F2FE] text-[#0B192C] shadow-[0_0_12px_#00F2FE]' : 'text-white shadow-sm'
                  : count === 0
                    ? 'opacity-40 cursor-default'
                    : isMegaEth ? 'text-white/40 hover:text-white' : isLitvm ? 'text-[#00F2FE]/60 hover:text-[#00F2FE] border-[#00F2FE]/20 hover:border-[#00F2FE]/50' : isBase ? 'text-black/40 hover:text-black' : 'text-gray-400 hover:text-white'
                }`}
                style={filter === f.key && !isMegaEth ? { backgroundColor: config.color } : {}}
              >
                {f.label === 'Contract Calls' ? (
                  <>
                    <span className="hidden md:inline">Contract Calls</span>
                    <span className="md:hidden">Calls</span>
                  </>
                ) : f.label === 'Token Transfers' ? (
                  <>
                    <span className="hidden md:inline">Token Transfers</span>
                    <span className="md:hidden">Tokens</span>
                  </>
                ) : (
                  f.label
                )}
                <span className={`ml-1 font-mono opacity-60 ${f.label === 'Contract Calls' || f.label === 'Token Transfers' ? 'md:hidden' : ''}`}>{count}</span>
              </button>
              )
            })}
          </div>

          <div className="flex items-center gap-1 md:gap-3">
              <span className={`hidden sm:inline text-[10px] font-bold uppercase tracking-[0.2em] ${isMegaEth ? 'text-white/30 font-mono' : isBase ? 'text-black/30' : 'text-gray-500'}`}>
                 {lastUpdate ? `Updated ${timeAgo(lastUpdate.toISOString())}` : 'Loading…'}
              </span>

                 <button
                   onClick={() => setIsAlertsModalOpen(true)}
                   className={`group flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 border transition-all duration-200 shadow-sm ${
                     isMegaEth
                       ? 'bg-black border-white/15 text-white rounded-none font-mono uppercase hover:border-[#00ff88]/50'
                       : isBase
                         ? 'bg-black/5 border-black/5 text-black hover:bg-black/10 rounded-full'
                         : 'bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.1] backdrop-blur-md rounded-full'
                   }`}
                 >
                   <div className="relative">
                      <Bell className={`w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:rotate-12 ${isBase ? 'text-black' : 'text-white'}`} />
                      {settings.enabled && (
                        <div className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full border border-transparent md:border-2" />
                      )}
                   </div>
                   <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">AlertBot</span>
                 </button>

              <button
                 onClick={fetchBubblesData}
                 disabled={loading}
                 className={`p-1.5 md:p-2 border transition-all duration-200 shadow-sm ${
                   isMegaEth
                     ? 'bg-black border-white/15 text-white rounded-none hover:border-[#00ff88]/50'
                     : isBase
                       ? 'bg-black/5 border-black/5 text-black hover:bg-black/10 rounded-full'
                       : 'bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.1] backdrop-blur-md rounded-full'
                 } ${loading ? 'animate-spin opacity-50' : ''}`}
                 title="Refresh data"
              >
                 <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
              </button>
           </div>
        </div>
      </div>

      {/* Centered Search Bar — in flow, under the HUD */}
      <div className="relative z-30 mt-1 md:mt-2 px-4 flex flex-col items-center pointer-events-none">
        <span className={`text-[11px] font-bold uppercase tracking-widest mb-3 pointer-events-auto px-3 py-1 border backdrop-blur-md ${
          isMegaEth
            ? 'bg-black border-[#00ff88] text-[#00ff88] rounded-none font-mono'
            : isLitvm
              ? 'bg-[#0B192C]/80 border-[#00F2FE]/40 text-[#00F2FE] rounded-2xl font-mono shadow-[0_0_15px_rgba(0,242,254,0.15)]'
              : isBase
                ? 'bg-black/5 border-black/5 text-black/40 rounded-full'
                : 'bg-black/20 border-white/5 text-gray-500 rounded-full'
        }`}>
          Search on {config.name}
        </span>
        <div ref={searchWrapperRef} className="w-full max-w-[600px] relative pointer-events-auto transition-transform duration-300">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-auto cursor-pointer" onClick={() => handleSearch()}>
            {searchLoading ? (
              <Loader2 className={`h-4 w-4 animate-spin ${isBase ? 'text-black/20' : 'text-gray-500'}`} />
            ) : (
              <Search className={`h-4 w-4 transition-colors ${isBase ? 'text-black/40 hover:text-black' : 'text-gray-400 hover:text-white'}`} />
            )}
          </div>
          <input
            ref={searchInputRef}
            type="text"
            className={`w-full h-[48px] border pl-12 pr-14 transition-all duration-300 ${
              isMegaEth
                ? 'bg-black border-white/20 rounded-none text-[#00ff88] placeholder-[#00ff88]/30 font-mono focus:border-[#00ff88]'
                : isBase
                  ? 'bg-black/5 border-black/5 rounded-full text-black placeholder-black/20 focus:bg-black/10 focus:border-black/10'
                  : 'bg-white/[0.04] border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none backdrop-blur-xl'
            }`}
            style={!isMegaEth && !isBase && !isLitvm ? {
              borderColor: searchError ? '#ef4444' : (isSearchFocused ? config.color : 'rgba(255,255,255,0.15)'),
              boxShadow: isSearchFocused ? `0 0 30px ${config.color}15` : '0 10px 40px rgba(0,0,0,0.2)'
            } : {}}
            placeholder="Search address, tx hash, ENS name, contract..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (searchError) setSearchError(null)
              if (!showSuggestions) setShowSuggestions(true)
            }}
            onFocus={() => {
              setIsSearchFocused(true)
              setShowSuggestions(true)
            }}
            onBlur={() => setIsSearchFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch()
            }}
          />
          {searchQuery ? (
            <button
              onClick={() => {
                clearSearch()
                searchInputRef.current?.focus()
              }}
              aria-label="Clear search"
              className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${
                isBase ? 'text-black/40 hover:text-black' : 'text-gray-500 hover:text-white'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <div className="flex gap-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                  isBase ? 'bg-black/5 text-black/40 border-black/5' : 'bg-white/10 text-gray-400 border-white/5'
                }`}>⌘K</span>
                <span className={`text-[10px] py-0.5 ${isBase ? 'text-black/20' : 'text-gray-500'}`}>or</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                  isBase ? 'bg-black/5 text-black/40 border-black/5' : 'bg-white/10 text-gray-400 border-white/5'
                }`}>/</span>
              </div>
            </div>
          )}

          {/* Error Badge */}
          {searchError && (
            <div className="absolute top-[60px] left-0 right-0 flex justify-center pointer-events-none z-50">
              <div className="px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-full backdrop-blur-md shadow-lg">
                {searchError}
              </div>
            </div>
          )}

          {/* Suggestions Dropdown (History / Live Search) */}
          {showSuggestions && !searchResult && (
            <div className="absolute top-[60px] left-0 right-0 bg-[#0d0e15]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden pointer-events-auto z-50">
              {searchQuery.trim() ? (
                liveSuggestions.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto">
                    {liveSuggestions.map((item, i) => (
                       <button
                         key={i}
                         className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center justify-between transition-colors"
                         onClick={() => {
                            const val = item.address || item.url?.split('/').pop() || ''
                            setSearchQuery(val)
                            setShowSuggestions(false)
                            setTimeout(() => handleSearch(val), 50)
                         }}
                       >
                          <div className="flex items-center gap-3 w-full overflow-hidden">
                            <span className="text-gray-400">
                              {item.type === 'contract' ? <FileCode className="w-4 h-4" /> : item.type === 'token' ? <Coins className="w-4 h-4" /> : item.type === 'transaction' ? <Clock className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                            </span>
                            <div className="flex flex-col gap-0.5 w-[85%]">
                              <span className="text-sm font-bold text-white truncate">{item.name || 'Unknown'}</span>
                              <span className="text-xs text-gray-400 font-mono truncate">{item.address || item.url?.split('/').pop() || ''}</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded text-[9px] uppercase font-bold tracking-wider bg-white/10 text-gray-300 ml-2 shadow-sm border border-white/5 shrink-0">
                            {item.type}
                          </span>
                       </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-sm font-medium text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Searching network...
                  </div>
                )
              ) : (
                searchHistory.length > 0 ? (
                  <>
                    <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex gap-2 items-center">
                       <Clock className="w-3.5 h-3.5 text-gray-400" />
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Searches</span>
                    </div>
                    <div className="max-h-[250px] overflow-y-auto">
                       {searchHistory.map((item, i) => (
                          <button
                            key={i}
                            className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 transition-colors"
                            onClick={() => {
                               setSearchQuery(item)
                               setShowSuggestions(false)
                               setTimeout(() => handleSearch(item), 50)
                            }}
                          >
                             <Clock className="w-4 h-4 text-gray-500" />
                             <span className="text-sm font-medium text-gray-200">{item}</span>
                          </button>
                       ))}
                    </div>
                    <div className="bg-white/5 border-t border-white/10 p-1">
                       <button
                         onClick={(e) => {
                           e.stopPropagation()
                           setSearchHistory([])
                           safeStorage.remove(`explorer_search_history_${chain}`)
                           searchInputRef.current?.focus()
                         }}
                         className="w-full text-center py-2.5 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                       >
                         Clear history
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 flex flex-col gap-1.5">
                     <span className="text-[10px] bg-transparent px-2 font-bold text-gray-500 uppercase tracking-widest mb-1">Quick Examples</span>
                     <button onClick={() => { setSearchQuery('vitalik.eth'); setTimeout(() => handleSearch('vitalik.eth'), 50); setShowSuggestions(false) }} className="text-left py-2.5 px-3 rounded-lg text-sm text-gray-400 font-medium hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                        Try: <span className="font-mono text-white">vitalik.eth</span> <span className="opacity-50 text-xs ml-1">(ENS)</span>
                     </button>
                     <button onClick={() => { setSearchQuery('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'); setTimeout(() => handleSearch('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'), 50); setShowSuggestions(false) }} className="text-left py-2.5 px-3 rounded-lg text-sm text-gray-400 font-medium hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                        Try: <span className="font-mono text-white">0x833589fCD6...</span> <span className="opacity-50 text-xs ml-1">(Address)</span>
                     </button>
                     <button onClick={() => { setSearchQuery('0x7ec10b81eec6bc5f6b2b7ffaba72cde36ae6fc0de1cd0cc2c710f6071ea94998'); setTimeout(() => handleSearch('0x7ec10b81eec6bc5f6b2b7ffaba72cde36ae6fc0de1cd0cc2c710f6071ea94998'), 50); setShowSuggestions(false) }} className="text-left py-2.5 px-3 rounded-lg text-sm text-gray-400 font-medium hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                        Try: <span className="font-mono text-white">0x7e...</span> <span className="opacity-50 text-xs ml-1">(Tx Hash)</span>
                     </button>
                  </div>
                )
              )}
            </div>
          )}

          {/* Search Dropdown Panel (List) */}
          {searchResult?.type === 'search' && (
             <div className="absolute top-[60px] left-0 right-0 bg-[#0d0e15]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden pointer-events-auto z-50">
               <div className="flex justify-between items-center px-4 py-2 border-b border-white/10 bg-white/5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Search Results</span>
                   <button onClick={() => setSearchResult(null)} className="p-1 hover:bg-white/10 rounded-md transition-colors" aria-label="Close search results">
                      <X className="w-3 h-3 text-gray-400" />
                   </button>
               </div>
               <div className="max-h-[300px] overflow-y-auto">
                  {(searchResult.data as any[]).slice(0, 5).map((item, i) => (
                     <button
                       key={i}
                       className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center justify-between transition-colors"
                       onClick={() => {
                          const val = item.address || item.url?.split('/').pop() || ''
                          setSearchQuery(val)
                          setSearchResult(null)
                          setTimeout(() => handleSearch(val), 50)
                       }}
                     >
                        <div className="flex flex-col gap-1 w-full overflow-hidden">
                          <span className="text-sm font-bold text-white truncate w-[90%]">{item.name || 'Unknown'}</span>
                          <span className="text-xs text-gray-400 font-mono truncate w-[90%]">{item.address || item.url?.split('/').pop() || ''}</span>
                        </div>
                        <span className="px-2 py-1 rounded text-[9px] uppercase font-bold tracking-wider bg-white/10 text-gray-300 ml-2 shadow-sm border border-white/5 shrink-0">
                          {item.type}
                        </span>
                     </button>
                  ))}
               </div>
             </div>
          )}

          {/* Enhanced Transaction Detail Overlay */}
          {(searchLoading || searchError || (searchResult && searchResult.type === 'transaction')) && (
            <div className="fixed inset-0 z-[100] bg-[#080810]/95 backdrop-blur-3xl overflow-y-auto pointer-events-auto">
              <div className="flex min-h-full items-center justify-center p-4 md:p-12 lg:p-24">
              {searchLoading ? (
                /* Loading Skeleton */
                <div className="w-full max-w-4xl bg-[#0e0f18] border border-white/10 rounded-[40px] p-12 shadow-2xl animate-pulse">
                  <div className="h-8 bg-white/5 rounded-full w-48 mb-6" />
                  <div className="space-y-4">
                    <div className="h-24 bg-white/5 rounded-2xl w-full" />
                    <div className="h-48 bg-white/5 rounded-2xl w-full" />
                    <div className="h-12 bg-white/5 rounded-xl w-full" />
                  </div>
                </div>
              ) : searchError && searchQuery.startsWith('0x') && searchQuery.length === 66 ? (
                /* Not Found State */
                <div className="w-full max-w-md bg-black/60 border border-white/10 rounded-3xl p-10 shadow-2xl text-center">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
                      <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Transaction Not Found</h2>
                  <p className="text-gray-400 mb-8 leading-relaxed">This transaction hash doesn't appear to exist on {config.name}. It may be still pending or on a different chain.</p>
                  <button
                    onClick={() => {
                      setSearchError(null)
                      setSearchQuery('')
                      router.push(`/explorer/${chain}`)
                    }}
                    className="flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-bold mx-auto border border-white/5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Explorer
                  </button>
                </div>
              ) : searchResult && searchResult.type === 'transaction' ? (
                <TransactionDetailOverlay
                  data={searchResult.data}
                  config={config}
                  chain={chain}
                  isBase={isBase}
                  isLitvm={isLitvm}
                  onBack={() => {
                    setSearchResult(null)
                    handleBack()
                  }}
                  onClose={() => {
                    setSearchResult(null)
                    handleBack()
                  }}
                />
              ) : null}

              </div>
            </div>
          )}

          {/* Block Panel */}
          {searchResult?.type === 'block' && (
            <BlockPanel
              data={searchResult.data}
              config={config}
              onClose={() => {
                setSearchResult(null)
                router.push(`/explorer/${chain}`)
              }}
            />
          )}
        </div>
      </div>

      {/* Address Details Panel (Right Side Desktop) */}
      {searchResult?.type === 'address' && (
        <AddressPanel
          data={searchResult.data}
          config={config}
          onClose={() => {
            setSearchResult(null)
            router.push(`/explorer/${chain}`)
          }}
        />
      )}

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full relative z-10 overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-default outline-none touch-none"
        />

        {/* Search Results Overlay / Messages */}
        {activeSearch?.type === 'address' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div
              className="backdrop-blur-md border px-6 py-2 rounded-full flex items-center gap-3 shadow-lg"
              style={{
                backgroundColor: `${config.color}33`,
                borderColor: `${config.color}44`
              }}
            >
              <span className="text-white text-sm font-bold">
                {Array.from(bubblesRef.current.values()).filter(b => {
                  const addr = activeSearch.address?.toLowerCase()
                  return getAddr(b.tx.from) === addr || getAddr(b.tx.to) === addr
                }).length} transactions found for {truncateString(activeSearch.address || '', 8)}
              </span>
              <button
                onClick={clearSearch}
                aria-label="Clear search"
                className="pointer-events-auto bg-white/10 hover:bg-white/20 p-1 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {activeSearch?.type === 'block' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="bg-orange-600/20 backdrop-blur-md border border-orange-500/30 px-6 py-2 rounded-full flex items-center gap-3">
              <span className="text-white text-sm font-bold">Showing Block #{activeSearch.query}</span>
              <button
                onClick={clearSearch}
                aria-label="Clear search"
                className="pointer-events-auto bg-white/10 hover:bg-white/20 p-1 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && bubblesRef.current.size === 0 && (
          <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm z-20 pointer-events-none ${
            isLitvm ? 'bg-[#0B192C]/85' : isBase ? 'bg-white/80' : isSoneium ? 'bg-[#00040F]/80' : 'bg-[#080810]/80'
          }`}>
            <div className="flex flex-col items-center gap-4">
              <div className={`w-8 h-8 border-4 border-t-white rounded-full animate-spin ${
                isBase ? 'border-black/10 border-t-black' : 'border-white/20 border-t-white'
              }`} />
              <p className={`font-semibold tracking-widest text-sm uppercase ${
                isBase ? 'text-black/40' : 'text-gray-400'
              }`}>Mapping Data</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-auto gap-4 ${
            isLitvm ? 'bg-[#0B192C]/95' : isBase ? 'bg-white/95' : isSoneium ? 'bg-[#00040F]/95' : 'bg-[#080810]/95'
          }`}>
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className={`${isBase ? 'text-black' : 'text-white'} text-lg`}>Failed to connect to the network.</p>
            <button
              onClick={fetchBubblesData}
              className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full font-bold hover:bg-red-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Global Hover Tooltip Overlay */}
        {hoveredTx && (
          <div
            className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4"
            style={{
              left: Math.min(Math.max(hoveredTx.x, 150), (containerRef.current?.clientWidth || 2000) - 150) + 'px',
              top: hoveredTx.y - (bubblesRef.current.get(hoveredTx.tx.hash)?.radius || 15) - 10 + 'px'
            }}
          >
              <div className={`p-4 shadow-2xl border pointer-events-auto min-w-[200px] ${
                isMegaEth
                  ? 'bg-black border-[#00ff88] rounded-none text-white font-mono uppercase'
                  : isBase
                    ? 'bg-white border-black/5 rounded-2xl text-black'
                  : isSoneium
                    ? 'bg-[#00040F]/95 border-[#0047FF]/30 rounded-2xl text-white backdrop-blur-2xl shadow-[0_0_50px_rgba(0,71,255,0.2)]'
                    : isLitvm
                      ? 'bg-[#0B192C]/95 border-[#00F2FE]/30 rounded-2xl text-[#00F2FE] backdrop-blur-2xl shadow-[0_0_50px_rgba(0,242,254,0.25)]'
                      : 'bg-[#0a0a0f]/90 border-white/10 rounded-2xl text-white backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)]'
              }`}>
                <div className={`flex justify-between items-start mb-3 pb-2 border-b ${isBase ? 'border-black/5' : 'border-white/5'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: getTypeColor(getTxPrimaryType(hoveredTx.tx), config.color) }} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isBase ? 'text-black/40' : 'text-gray-500'}`}>
                      {hoveredTx.tx.transaction_types?.includes('contract_call') ? 'Contract Call' : 'Native Transfer'}
                    </span>
                  </div>
                  <ExternalLink className={`w-3 h-3 ${isBase ? 'text-black/20' : 'text-gray-600'}`} />
                </div>

                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isBase ? 'text-black/30' : 'text-gray-500'}`}>Value</span>
                  <span className={`text-sm font-bold ${isMegaEth ? 'text-[#00ff88]' : isBase ? 'text-black' : isSoneium ? 'text-[#0047FF]' : 'text-white'}`}>
                    {formatNativeValue(hoveredTx.tx.value || '0', config.decimals).slice(0, 8)} {config.currency}
                  </span>
                </div>

                <div className="flex justify-between items-baseline mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isBase ? 'text-black/30' : 'text-gray-500'}`}>Hash</span>
                  <span className={`text-[10px] font-mono ${isBase ? 'text-black/60' : 'text-gray-400'}`}>{truncateString(hoveredTx.tx.hash)}</span>
                </div>

                <div className={`pt-2 mt-2 flex justify-between border-t ${isBase ? 'border-black/5' : 'border-white/[0.08]'}`}>
                  <span className={`text-[9px] font-bold uppercase tracking-tighter ${isBase ? 'text-black/30' : 'text-gray-500'}`}>{timeAgo(hoveredTx.tx.timestamp)}</span>
                  <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest`} style={{ color: config.color }}>
                    Details <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
          </div>
        )}
      </div>

      {/* Mini-map Overlay */}
      <div className="absolute bottom-24 left-8 z-20 pointer-events-none">
          <canvas
            ref={miniMapCanvasRef}
            width={140}
            height={90}
            className="rounded-xl opacity-60"
            style={{
              border: `1px solid ${isLitvm ? '#00F2FE' : config.color}33`,
              background: isLitvm ? 'rgba(11,25,44,0.6)' : 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
            }}
          />
          <span
            className="block text-center text-[9px] font-bold uppercase tracking-widest mt-1"
            style={{ color: config.color + '88' }}
          >
            Overview
          </span>
        </div>

      {/* Live Ticker Marquee */}
      {!loading && bubblesRef.current.size > 0 && (
        <div
          className={`absolute bottom-0 inset-x-0 z-20 overflow-hidden border-t pointer-events-none select-none ${
            isMegaEth
              ? 'bg-black/80 border-[#00ff88]/15 text-[#00ff88]/60 font-mono'
              : isBase
                ? 'bg-white/80 border-black/5 text-black/30 backdrop-blur-md'
                : isLitvm
                  ? 'bg-[#0B192C]/70 border-[#00F2FE]/15 text-[#00F2FE]/40 font-mono'
                  : 'bg-black/40 border-white/[0.06] text-white/25 backdrop-blur-md'
          }`}
          style={{ height: 24 }}
        >
          <style>{`
            @keyframes ticker-scroll {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <div
            className="flex items-center gap-6 whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.18em] h-full"
            style={{ animation: 'ticker-scroll 40s linear infinite', width: 'max-content' }}
          >
            {/* Duplicate for seamless loop */}
            {[...Array(2)].flatMap((_, pass) =>
              Array.from(bubblesRef.current.values()).map((b, i) => {
                const type = getTxPrimaryType(b.tx)
                const typeLabel =
                  type === 'coin_transfer'    ? 'TRANSFER' :
                  type === 'contract_call'    ? 'CONTRACT' :
                  type === 'token_transfer'   ? 'TOKEN'    :
                  type === 'nft_transfer'     ? 'NFT'      : 'TX'
                return (
                  <span
                    key={`${pass}-${b.id}-${i}`}
                    className="flex items-center gap-2 shrink-0"
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: b.color + 'cc' }}
                    />
                    <span>{typeLabel}</span>
                    <span className="opacity-60 font-mono">{b.id.slice(0, 6)}…{b.id.slice(-4)}</span>
                    <span className="opacity-20 mx-1">|</span>
                  </span>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <Legend config={config} isBase={isBase} isMegaEth={isMegaEth} isSoneium={isSoneium} />

    </div>

      {/* Telegram Alerts Modal */}
      <AlertBotModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />
    </>
  )
}
