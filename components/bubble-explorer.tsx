"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { formatEther } from 'viem'
import { ExternalLink, RefreshCw, AlertCircle, ArrowLeft, ArrowRight, Search, X, Loader2, Clock, FileCode, Coins, Wallet, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { safeStorage } from '../lib/safe-storage'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { Share2, Bell } from 'lucide-react'
import { useTelegramAlerts } from '@/hooks/use-telegram-alerts'
import { TelegramAlertsModal } from './telegram-alerts-modal'

// --- Types & Constants ---
const SEARCH_TYPES = {
  TX_HASH: /^0x[a-fA-F0-9]{64}$/i,
  ADDRESS: /^0x[a-fA-F0-9]{40}$/i,
  ENS: /\.eth$/i,
  BLOCK: /^\d+$/,
}
export type ChainType = 'soneium' | 'ink' | 'base' | 'unichain' | 'megaeth'

const CHAIN_CONFIG = {
  soneium: {
    apiBase: 'https://soneium.blockscout.com/api/v2',
    color: '#0047FF',
    name: 'Soneium',
    explorer: 'https://soneium.blockscout.com',
  },
  ink: {
    apiBase: 'https://explorer.inkonchain.com/api/v2',
    color: '#8b5cf6',
    name: 'Ink',
    explorer: 'https://explorer.inkonchain.com',
  },
  base: {
    apiBase: 'https://base.blockscout.com/api/v2',
    color: '#0052ff',
    name: 'Base',
    explorer: 'https://base.blockscout.com',
  },
  unichain: {
    apiBase: 'https://unichain.blockscout.com/api/v2',
    color: '#ff007a',
    name: 'Unichain',
    explorer: 'https://unichain.blockscout.com',
  },
  megaeth: {
    apiBase: 'https://megaeth.blockscout.com/api/v2',
    color: '#00ff88',
    name: 'MegaETH',
    explorer: 'https://megaeth.blockscout.com',
  },
} as const


type FilterType = 'all' | 'transfers' | 'contract_calls' | 'token_transfers' | 'nfts'
type ViewMode = 'bubbles' | 'network'

interface TxData {
  hash: string
  value: string
  from: { hash: string }
  to: { hash: string } | null
  transaction_types: string[]
  token_transfers?: { token: { type: string } }[]
  gas_used: string
  timestamp: string
}

type ActiveSearch = {
  type: 'address' | 'tx' | 'block' | 'search';
  query: string;
  address?: string;
  addressData?: any;
  addressTxs?: TxData[];
  txData?: any;
  blockData?: any;
  blockTxs?: TxData[];
  searchItems?: any[];
} | null;

interface Bubble {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  tx: TxData
  targetOpacity: number
  currentOpacity: number
  isDragging?: boolean
}

interface Ripple {
  bubbleId: string
  startTime: number
  color: string
}

// --- Helper Functions ---
export function getTxPrimaryType(tx: TxData) {
  const types = tx.transaction_types || []
  const transfers = tx.token_transfers || []
  
  const isNFT =
    transfers.some(t => ['ERC-721', 'ERC-1155'].includes(t.token?.type)) ||
    types.some(t => ['ERC-721', 'ERC-1155', 'nft_transfer'].includes(t))
  
  const isToken =
    transfers.some(t => t.token?.type === 'ERC-20') ||
    types.some(t => ['ERC-20', 'token_transfer'].includes(t))

  if (isNFT) return 'nft_transfer'
  if (isToken) return 'token_transfer'
  if (types.some(t => ['contract_call', 'contract_creation'].includes(t))) return 'contract_call'
  if (types.some(t => ['coin_transfer', 'native_transfer'].includes(t))) return 'coin_transfer'
  return 'default'
}

function getTypeColor(type: string, chainColor: string) {
  switch (type) {
    case 'coin_transfer': return chainColor
    case 'contract_call': return '#22c55e'
    case 'token_transfer': return '#f97316'
    case 'nft_transfer': return '#a855f7'
    default: return '#888888'
  }
}

function passesFilter(tx: TxData, filter: FilterType) {
  if (filter === 'all') return true
  const type = getTxPrimaryType(tx)
  if (filter === 'transfers') return type === 'coin_transfer'
  if (filter === 'contract_calls') return type === 'contract_call'
  if (filter === 'token_transfers') return type === 'token_transfer'
  if (filter === 'nfts') return type === 'nft_transfer'
  return false
}

function truncateString(str: string, max = 8) {
  if (!str) return 'Contract Creation'
  if (str.length <= max) return str
  return `${str.slice(0, 4)}...${str.slice(-4)}`
}

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}


// --- Main Component ---
export default function BubbleExplorer({ chain, initialAddress, initialTxHash }: { chain: ChainType; initialAddress?: string; initialTxHash?: string }) {
  const isMegaEth = chain === 'megaeth'
  const isInk = chain === 'ink'
  const isUnichain = chain === 'unichain'
  const isBase = chain === 'base'
  const isSoneium = chain === 'soneium'
  
  const config = CHAIN_CONFIG[chain]
  const router = useRouter()
  const pathname = usePathname()
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  const [stats, setStats] = useState({ totalTxs: 0, latestBlock: 0, avgGas: '0' })
  const [filter, setFilter] = useState<FilterType>('all')
  const [viewMode, setViewMode] = useState<ViewMode>(initialAddress ? 'network' : 'bubbles')
  const [networkStats, setNetworkStats] = useState({ address: '', sent: '0', received: '0' })
  
  const [hoveredTx, setHoveredTx] = useState<{ tx: TxData; x: number; y: number } | null>(null)
  
  const [searchQuery, setSearchQuery] = useState(initialAddress || initialTxHash || '')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<{ type: string; data: any } | null>(null)
  const [focusedTxHash, setFocusedTxHash] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [liveSuggestions, setLiveSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  // Unified Search State
  const [activeSearch, setActiveSearch] = useState<ActiveSearch>(null)
  const activeSearchRef = useRef<ActiveSearch>(null)
  useEffect(() => { activeSearchRef.current = activeSearch }, [activeSearch])

  // Network table state

  // Network table state
  const [networkTxs, setNetworkTxs] = useState<TxData[]>([])
  const [networkTableLoading, setNetworkTableLoading] = useState(false)
  const [networkNextParams, setNetworkNextParams] = useState<any>(null)
  const [networkPageStack, setNetworkPageStack] = useState<any[]>([])
  const [newTxHashes, setNewTxHashes] = useState<Set<string>>(new Set())
  const prevNetworkHashesRef = useRef<Set<string>>(new Set())

  const { settings, saveSettings, monitorTransactions } = useTelegramAlerts(config.name, config.explorer)
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false)

  // Scroll searched row into view
  const searchedRowRef = useRef<HTMLTableRowElement>(null)
  useEffect(() => {
    if (activeSearch?.type === 'tx' && viewMode === 'network' && searchedRowRef.current) {
      searchedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeSearch, viewMode])

  // Refs for canvas synchronization
  const bubblesRef = useRef<Map<string, Bubble>>(new Map())
  const networkNodesRef = useRef<Bubble[]>([])
  const filterRef = useRef<FilterType>('all')
  const viewModeRef = useRef<ViewMode>('bubbles')
  const networkCenterRef = useRef({ hash: '', sent: '0', received: '0' })
  const mouseRef = useRef({ x: -1000, y: -1000, isHovering: false })
  const ripplesRef = useRef<Ripple[]>([])
  const rafRef = useRef<number>(0)
  const connectionPairsRef = useRef<Array<{ aId: string; bId: string; color: string }>>([])
  const isFetchingRef = useRef(false)
  const focusedTxHashRef = useRef<string | null>(null)
  const frameCountRef = useRef(0)
  const miniMapCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // Dragging state
  const draggedBubbleRef = useRef<Bubble | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  
  // Click vs drag detection
  const isDraggingRef = useRef(false)
  const mouseDownTimeRef = useRef(0)
  const mouseDownPosRef = useRef({ x: 0, y: 0 })
  const DRAG_THRESHOLD = 5
  const CLICK_TIME_THRESHOLD = 350

  useEffect(() => { focusedTxHashRef.current = focusedTxHash }, [focusedTxHash])

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
    setNetworkPageStack([])
    router.push(`/explorer/${chain}`)
  }, [chain, router])

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
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        // Prevent default if we're not inside an input to avoid adding '/' to input immediately
        if (document.activeElement !== searchInputRef.current) {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
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

  useEffect(() => { filterRef.current = filter }, [filter])
  
  useEffect(() => { 
    viewModeRef.current = viewMode 
    
    // Initial load for address
    if (viewMode === 'network' && networkCenterRef.current.hash === '') {
      if (initialAddress) {
        if (initialAddress.endsWith('.eth')) {
          handleSearch(initialAddress)
        } else {
          fetchNetworkData(initialAddress)
        }
      } else {
        // Default to picking an arbitrary bubble if user toggles directly to network view without selecting
        const firstBubble = Array.from(bubblesRef.current.values())[0]
        if (firstBubble && firstBubble.tx.from?.hash) {
          fetchNetworkData(firstBubble.tx.from.hash)
        }
      }
    }

    // Initial load for transaction
    if (initialTxHash && !searchResult) {
      handleSearch(initialTxHash)
    }

    // Cleanup: If prompts vanish, clear search result
    if (!initialTxHash && !initialAddress && searchResult) {
      setSearchResult(null)
      setFocusedTxHash(null)
      if (viewMode === 'network') setViewMode('bubbles')
    }
  }, [viewMode, initialAddress, initialTxHash, searchResult])

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // --- Network Orbit Fetch Data ---
  const fetchNetworkData = async (address: string) => {
    setLoading(true)
    try {
      const [txsRes, coinsRes, countersRes] = await Promise.all([
        fetch(`${config.apiBase}/addresses/${address}/transactions`),
        fetch(`${config.apiBase}/addresses/${address}`),
        fetch(`${config.apiBase}/addresses/${address}/counters`).catch(() => null)
      ])
      
      if (!txsRes.ok) {
        toast.error("Address transactions could not be loaded.")
        setLoading(false)
        return
      }
      const data = await txsRes.json()
      const coinsData = coinsRes.ok ? await coinsRes.json() : {}
      const countersData = countersRes?.ok ? await countersRes.json() : {}
      const txs: TxData[] = data.items || []
      
      let sentWei = BigInt(0)
      let receivedWei = BigInt(0)

      txs.forEach((t) => {
        try {
          const val = BigInt(t.value || '0')
          if (t.from?.hash?.toLowerCase() === address.toLowerCase()) { sentWei += val }
          if (t.to?.hash?.toLowerCase() === address.toLowerCase()) { receivedWei += val }
        } catch {}
      })

      const sentEth = parseFloat(formatEther(sentWei)).toFixed(4)
      const recEth = parseFloat(formatEther(receivedWei)).toFixed(4)

      setNetworkStats({ address, sent: sentEth, received: recEth })
      networkCenterRef.current = { hash: address, sent: sentEth, received: recEth }
      
      setSearchResult({ 
         type: 'address', 
         data: { 
            hash: address, 
            coin_balance: coinsData.coin_balance, 
            is_contract: coinsData.is_contract, 
            counters: countersData 
         } 
      })

      const nodes: Bubble[] = []
      txs.forEach((tx) => {
        const type = getTxPrimaryType(tx)
        const color = getTypeColor(type, config.color)
        const valueInWei = Number(BigInt(tx.value || '0'))
        const radius = Math.max(30, Math.min(150, Math.log10(valueInWei + 1) * 20))

        nodes.push({
          id: tx.hash,
          x: 0, y: 0, 
          vx: 0, vy: 0, 
          radius, color, tx,
          targetOpacity: passesFilter(tx, filterRef.current) ? 1 : 0.1,
          currentOpacity: 0
        })
      })
      networkNodesRef.current = nodes

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const rebuildConnectionPairs = () => {
    const pairs: Array<{ aId: string; bId: string; color: string }> = []
    const arr = Array.from(bubblesRef.current.values())
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i], b = arr[j]
        const aFrom = a.tx.from?.hash?.toLowerCase()
        const aTo = a.tx.to?.hash?.toLowerCase()
        const bFrom = b.tx.from?.hash?.toLowerCase()
        const bTo = b.tx.to?.hash?.toLowerCase()
        const connected =
          (aFrom && bFrom && aFrom === bFrom) ||
          (aFrom && bTo && aFrom === bTo) ||
          (aTo && bFrom && aTo === bFrom) ||
          (aTo && bTo && aTo === bTo)
        if (!connected) continue
        const type = getTxPrimaryType(a.tx)
        const connectionColors: Record<string, string> = {
          coin_transfer: config.color,
          contract_call: '#22c55e',
          token_transfer: '#f97316',
          nft_transfer: '#a855f7',
        }
        pairs.push({ aId: a.id, bId: b.id, color: connectionColors[type] ?? '#444466' })
      }
    }
    connectionPairsRef.current = pairs
  }

  // --- Main Data Fetching (Bubbles) ---
  const fetchBubblesData = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    
    // Only poll base transactions if we process bubbles in background
    try {
      const [txRes, blockRes] = await Promise.all([
        fetch(`${config.apiBase}/transactions`).catch(() => null),
        fetch(`${config.apiBase}/blocks`).catch(() => null),
      ])

      if (!txRes?.ok) {
        setError(true)
        toast.error("Could not fetch latest transactions. Using cached data.")
        return
      }

      const txData = await txRes.json()
      const blockData = blockRes?.ok ? await blockRes.json() : null
      
      const newTxs: TxData[] = txData.items || []
      
      const canvas = canvasRef.current
      const width = canvas ? canvas.width : window.innerWidth
      const height = canvas ? canvas.height : window.innerHeight

      let avgGasSum = BigInt(0)

      newTxs.forEach((tx) => {
        avgGasSum += BigInt(tx.gas_used || 0)
        
        if (!bubblesRef.current.has(tx.hash)) {
          const type = getTxPrimaryType(tx)
          const color = getTypeColor(type, config.color)
          
          const valueInWei = Number(BigInt(tx.value || '0'))
          const radius = Math.max(30, Math.min(150, Math.log10(valueInWei + 1) * 20))
          
          const margin = radius + 20
          const sx = margin + Math.random() * (width - margin * 2)
          const sy = margin + Math.random() * (height - margin * 2)
          
          bubblesRef.current.set(tx.hash, {
            id: tx.hash,
            x: sx,
            y: sy,
            vx: (Math.random() * 2 - 1),
            vy: (Math.random() * 2 - 1),
            radius,
            color,
            tx,
            targetOpacity: passesFilter(tx, filterRef.current) ? 1 : 0.1,
            currentOpacity: 0
          })

          ripplesRef.current.push({
            bubbleId: tx.hash,
            startTime: performance.now(),
            color
          })
        }
      })
      
      const MAX_BUBBLES = 60
      if (bubblesRef.current.size > MAX_BUBBLES) {
        const entries = Array.from(bubblesRef.current.entries())
        const toDelete = entries.slice(0, bubblesRef.current.size - MAX_BUBBLES)
        toDelete.forEach(([key]) => bubblesRef.current.delete(key))
      }

      rebuildConnectionPairs()

      const gasTotal = newTxs.length > 0 ? (avgGasSum / BigInt(newTxs.length)) : BigInt(0)

      setStats({
        totalTxs: bubblesRef.current.size,
        latestBlock: blockData?.items?.[0]?.height || 0,
        avgGas: gasTotal.toString()
      })
      
      setLastUpdate(new Date())
      setError(false)

      // Monitor for new transactions to trigger alerts
      if (newTxs.length > 0) {
        monitorTransactions(newTxs)
      }
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      isFetchingRef.current = false
      if (loading) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiBase, config.color, monitorTransactions])


  useEffect(() => {
    fetchBubblesData()
    if (!activeSearch) {
      const int = setInterval(fetchBubblesData, 20000)
      return () => clearInterval(int)
    }
  }, [fetchBubblesData, activeSearch])

  // --- Network Table Fetch ---
  const fetchNetworkTableData = useCallback(async (pageParams?: any, isAutoRefresh = false) => {
    if (!isAutoRefresh) setNetworkTableLoading(true)
    try {
      let url = `${config.apiBase}/transactions`
      if (pageParams) {
        const params = new URLSearchParams()
        Object.entries(pageParams).forEach(([k, v]) => params.set(k, String(v)))
        url += `?${params.toString()}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      const data = await res.json()
      const txs: TxData[] = data.items || []

      // Flash new rows on auto-refresh of first page only
      if (isAutoRefresh && !pageParams && prevNetworkHashesRef.current.size > 0) {
        const freshHashes = new Set(
          txs.filter(t => !prevNetworkHashesRef.current.has(t.hash)).map(t => t.hash)
        )
        if (freshHashes.size > 0) {
          setNewTxHashes(freshHashes)
          setTimeout(() => setNewTxHashes(new Set()), 2000)
        }
      }

      prevNetworkHashesRef.current = new Set(txs.map(t => t.hash))
      setNetworkTxs(txs)
      setNetworkNextParams(data.next_page_params || null)
    } catch (err) {
      console.error('Network table fetch error:', err)
    } finally {
      setNetworkTableLoading(false)
    }
  }, [config.apiBase])

  // Auto-refresh network table
  useEffect(() => {
    if (viewMode !== 'network' || activeSearch) return
    fetchNetworkTableData()
    const interval = setInterval(() => {
      if (networkPageStack.length === 0) {
        fetchNetworkTableData(undefined, true)
      }
    }, 20000)
    return () => clearInterval(interval)
  }, [viewMode, activeSearch, fetchNetworkTableData, networkPageStack.length])

  const handleNetworkNextPage = () => {
    if (networkNextParams) {
      setNetworkPageStack(prev => [...prev, networkNextParams])
      fetchNetworkTableData(networkNextParams)
    }
  }

  const handleNetworkPrevPage = () => {
    const stack = [...networkPageStack]
    stack.pop()
    setNetworkPageStack(stack)
    if (stack.length === 0) {
      fetchNetworkTableData()
    } else {
      fetchNetworkTableData(stack[stack.length - 1])
    }
  }

  // --- Canvas Rendering Loop ---
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const updateSize = () => {
      const parent = containerRef.current
      if (parent) {
        const dpr = window.devicePixelRatio || 1
        canvas.width = parent.clientWidth * dpr
        canvas.height = parent.clientHeight * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        canvas.style.width = `${parent.clientWidth}px`
        canvas.style.height = `${parent.clientHeight}px`
      }
    }
    window.addEventListener('resize', updateSize)
    updateSize()

    let lastTime = performance.now()

    const loop = (time: number) => {
      const dt = (time - lastTime) / 16.66
      lastTime = time

      const cw = canvas.width / (window.devicePixelRatio || 1)
      const ch = canvas.height / (window.devicePixelRatio || 1)

      ctx.clearRect(0, 0, cw, ch)
      const now = performance.now()
      
      frameCountRef.current++
      const shouldRunPhysics = frameCountRef.current % 3 === 0

      // Draw background grid
      if (viewModeRef.current === 'bubbles') {
        const gridSize = 48
        ctx.save()
        ctx.lineWidth = 1
        ctx.strokeStyle = isMegaEth
          ? 'rgba(0, 255, 136, 0.025)'
          : isInk
            ? 'rgba(108, 92, 231, 0.03)'
            : isUnichain
              ? 'rgba(255, 0, 122, 0.03)'
              : isBase
                ? 'rgba(0, 82, 255, 0.03)'
                : 'rgba(0, 71, 255, 0.025)'

        for (let x = 0; x < cw; x += gridSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke()
        }
        for (let y = 0; y < ch; y += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke()
        }
        ctx.restore()

        // Cluster center glow for address search
        if (activeSearchRef.current?.type === 'address') {
          const gradient = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, 160)
          gradient.addColorStop(0, config.color + '18')
          gradient.addColorStop(1, 'transparent')
          ctx.save()
          ctx.beginPath()
          ctx.arc(cw / 2, ch / 2, 160, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
          ctx.restore()
        }
      }

      // Draw Spawn Ripples
      ripplesRef.current = ripplesRef.current.filter(r => now - r.startTime < 1000)
      for (const r of ripplesRef.current) {
        const b = bubblesRef.current.get(r.bubbleId)
        if (!b) continue
        const elapsed = now - r.startTime
        const progress = elapsed / 1000
        const rippleRad = b.radius + progress * 60
        ctx.save()
        ctx.beginPath()
        ctx.arc(b.x, b.y, rippleRad, 0, Math.PI * 2)
        ctx.strokeStyle = r.color
        ctx.globalAlpha = (1 - progress) * 0.6
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.restore()
      }
      
      let hoverCandidate: { tx: TxData; x: number; y: number } | null = null

      if (viewModeRef.current === 'bubbles') {
        // Draw connecting lines from pre-computed pairs
        for (const pair of connectionPairsRef.current) {
          const a = bubblesRef.current.get(pair.aId)
          const b = bubblesRef.current.get(pair.bId)
          if (!a || !b) continue
          
          if (a.currentOpacity < 0.15 || b.currentOpacity < 0.15) continue

          // Draw line
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = pair.color + '33'
          ctx.lineWidth = 1
          ctx.stroke()

          // Animated flow dot traveling from a to b
          const t = (now % 2000) / 2000
          const dotX = a.x + (b.x - a.x) * t
          const dotY = a.y + (b.y - a.y) * t
          ctx.beginPath()
          ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = pair.color + 'cc'
          ctx.fill()

          // Draw arrow at midpoint
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2
          const angle = Math.atan2(b.y - a.y, b.x - a.x)
          const arrowLen = 7
          const spread = 0.4
          ctx.beginPath()
          ctx.moveTo(mx, my)
          ctx.lineTo(mx - arrowLen * Math.cos(angle - spread), my - arrowLen * Math.sin(angle - spread))
          ctx.lineTo(mx - arrowLen * Math.cos(angle + spread), my - arrowLen * Math.sin(angle + spread))
          ctx.closePath()
          ctx.fillStyle = pair.color + '77'
          ctx.fill()
        }

        // Build array ONCE per frame (outside the per-bubble loop) to avoid O(n²) allocations
        const bubblesArr = Array.from(bubblesRef.current.values())

        for (const b of bubblesArr) {
          const id = b.id
          let targetOpacity = passesFilter(b.tx, filterRef.current) ? 1 : 0
          
          // Address search highlighting
          if (activeSearchRef.current?.type === 'address') {
            const addr = activeSearchRef.current.address?.toLowerCase()
            const matches = b.tx.from?.hash?.toLowerCase() === addr || b.tx.to?.hash?.toLowerCase() === addr
            if (!matches) targetOpacity = 0.15
            else targetOpacity = 1
          }

          b.targetOpacity = targetOpacity
          b.currentOpacity += (b.targetOpacity - b.currentOpacity) * 0.08 * dt

          // Skip drawing if bubble is practically invisible
          if (b.currentOpacity < 0.01) continue

          if (!b.isDragging) {

            // 1. Repulsion from other bubbles (Optimized to run every 3 frames)
            if (shouldRunPhysics) {
              for (const other of bubblesArr) {
                if (other.id === b.id) continue
                const dx = b.x - other.x
                const dy = b.y - other.y
                const dist = Math.sqrt(dx * dx + dy * dy) || 1
                const minDist = b.radius + other.radius + 25
                if (dist < minDist) {
                  const force = (minDist - dist) / minDist * 0.4
                  b.vx += (dx / dist) * force
                  b.vy += (dy / dist) * force
                }
              }
            }

            // 2. Weak center attraction (stops bubbles drifting to edges)
            b.vx += (cw / 2 - b.x) * 0.0003
            b.vy += (ch / 2 - b.y) * 0.0003

            // 3. Address cluster attraction
            if (activeSearchRef.current?.type === 'address') {
              const addr = activeSearchRef.current.address?.toLowerCase()
              const matches = b.tx.from?.hash?.toLowerCase() === addr || b.tx.to?.hash?.toLowerCase() === addr
              if (matches) {
                b.vx += (cw / 2 - b.x) * 0.008
                b.vy += (ch / 2 - b.y) * 0.008
              }
            }

            // 4. Damping (makes movement smooth)
            b.vx *= 0.88
            b.vy *= 0.88

            // 5. Speed cap
            const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy)
            if (speed > 2.5) {
              b.vx = (b.vx / speed) * 2.5
              b.vy = (b.vy / speed) * 2.5
            }

            // 6. Move
            b.x += b.vx * dt
            b.y += b.vy * dt

            // 7. Hard boundary — never leave canvas
            b.x = Math.max(b.radius + 5, Math.min(cw - b.radius - 5, b.x))
            b.y = Math.max(b.radius + 5, Math.min(ch - b.radius - 5, b.y))
          }

          const dx = mouseRef.current.x - b.x
          const dy = mouseRef.current.y - b.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const isHovered = distance < b.radius

          if (isHovered && b.targetOpacity > 0.1) {
            hoverCandidate = { tx: b.tx, x: mouseRef.current.x, y: mouseRef.current.y }
            if (mouseRef.current.isHovering) {
              b.vx -= dx * 0.005
              b.vy -= dy * 0.005
            }
          }

          const isFocused = b.tx.hash === focusedTxHashRef.current
          const drawRadius = isFocused ? b.radius * 1.5 : b.radius

          if (isFocused) {
            const pulse = Math.sin(time * 0.01) * 0.5 + 0.5
            ctx.save()
            ctx.globalAlpha = pulse * 0.4
            ctx.beginPath()
            ctx.arc(b.x, b.y, drawRadius + 10 + pulse * 10, 0, Math.PI * 2)
            ctx.fillStyle = '#ffffff'
            ctx.fill()
            ctx.restore()
          }

          // Address match glow
          if (activeSearchRef.current?.type === 'address') {
            const addr = activeSearchRef.current.address?.toLowerCase()
            const matches = b.tx.from?.hash?.toLowerCase() === addr || b.tx.to?.hash?.toLowerCase() === addr
            if (matches) {
              ctx.save()
              ctx.beginPath()
              ctx.arc(b.x, b.y, b.radius + 6, 0, Math.PI * 2)
              ctx.strokeStyle = config.color
              ctx.lineWidth = 3
              ctx.shadowBlur = 15
              ctx.shadowColor = config.color
              ctx.stroke()
              ctx.restore()
            }
          }

          // TX Hash match - Golden pulse and move to center
          if (activeSearchRef.current?.type === 'tx' && b.tx.hash === activeSearchRef.current.query) {
            const pulse = Math.sin(time * 0.01) * 0.5 + 0.5
            ctx.save()
            ctx.beginPath()
            ctx.arc(b.x, b.y, b.radius * 1.5 + 8 + pulse * 12, 0, Math.PI * 2)
            ctx.strokeStyle = '#FFD700'
            ctx.lineWidth = 4
            ctx.shadowBlur = 20
            ctx.shadowColor = '#FFD700'
            ctx.stroke()
            ctx.restore()

            // Gradually move to center
            if (!b.isDragging) {
              b.x += (cw / 2 - b.x) * 0.05
              b.y += (ch / 2 - b.y) * 0.05
            }
          }

          ctx.globalAlpha = b.currentOpacity
          ctx.beginPath()
          ctx.arc(b.x, b.y, drawRadius, 0, Math.PI * 2)
          ctx.fillStyle = `${b.color}22`
          ctx.fill()
          
          ctx.lineWidth = isHovered || isFocused ? 3 : 1
          ctx.strokeStyle = isHovered || isFocused ? '#ffffff' : b.color
          ctx.stroke()

          ctx.beginPath()
          ctx.arc(b.x, b.y, 2, 0, Math.PI * 2)
          ctx.fillStyle = isHovered || isFocused ? '#ffffff' : b.color
          ctx.fill()

          const ethValue = parseFloat(formatEther(BigInt(b.tx.value || '0')))
          const isWhale = ethValue > 1

          if (isWhale) {
            ctx.save()
            ctx.beginPath()
            ctx.arc(b.x, b.y, drawRadius + 4, 0, Math.PI * 2)
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.globalAlpha = 0.5 + Math.sin(time * 0.01) * 0.3
            ctx.stroke()
            
            ctx.fillStyle = '#ffffff'
            ctx.font = 'black 9px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('WHALE', b.x, b.y - drawRadius - 12)
            ctx.restore()
          }

          if (drawRadius > 20) {
            const formatted = ethValue >= 1 ? ethValue.toFixed(1) : ethValue.toFixed(2)
            const text = `${formatted}E`
            ctx.fillStyle = '#ffffff'
            ctx.font = `bold ${Math.floor(drawRadius * 0.4)}px monospace`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(text, b.x, b.y)
          }
          // Reset alpha for next iteration
          ctx.globalAlpha = 1
        }
      } else {
         // Network Orbit View
         const cx = cw / 2
         const cy = ch / 2
         const orbitR = Math.min(cw, ch) * 0.35

         ctx.save()
         ctx.beginPath()
         ctx.arc(cx, cy, 40, 0, Math.PI * 2)
         ctx.fillStyle = config.color
         ctx.shadowColor = config.color
         ctx.shadowBlur = 30
         ctx.fill()
         
         ctx.fillStyle = '#fff'
         ctx.font = 'bold 12px monospace'
         ctx.textAlign = 'center'
         ctx.textBaseline = 'middle'
         ctx.shadowBlur = 0
         ctx.fillText(truncateString(networkCenterRef.current.hash, 10), cx, cy)

         ctx.font = '11px sans-serif'
         ctx.fillStyle = '#ccc'
         ctx.fillText(`Sent: ${networkCenterRef.current.sent} ETH`, cx, cy + 64)
         ctx.fillText(`Received: ${networkCenterRef.current.received} ETH`, cx, cy + 80)
         ctx.restore()

         const total = networkNodesRef.current.length
         const timeOffset = time * 0.001

         for (let i = 0; i < total; i++) {
             const b = networkNodesRef.current[i]
             const type = getTxPrimaryType(b.tx)
             b.targetOpacity = passesFilter(b.tx, filterRef.current) ? 1 : 0.1
             b.currentOpacity += (b.targetOpacity - b.currentOpacity) * 0.02 * dt
             
             if (b.currentOpacity > 0.01) {
                  const angle = (i / total) * Math.PI * 2 + timeOffset
                  const bx = cx + orbitR * Math.cos(angle)
                  const by = cy + orbitR * Math.sin(angle)
                  b.x = bx
                  b.y = by

                   ctx.save()
                   ctx.globalAlpha = b.currentOpacity * 0.5
                   ctx.beginPath()
                   ctx.moveTo(cx, cy)
                   ctx.lineTo(bx, by)
                   
                   const type = getTxPrimaryType(b.tx)
                   ctx.strokeStyle = getTypeColor(type, config.color)
                   ctx.setLineDash(type === 'contract_call' ? [5, 5] : [])
                   ctx.lineWidth = 1
                   ctx.stroke()

                   // Arrowhead
                   const angleToNode = Math.atan2(by - cy, bx - cx)
                   const arrowSize = 6
                   ctx.beginPath()
                   ctx.moveTo(bx - (b.radius + 2) * Math.cos(angleToNode), by - (b.radius + 2) * Math.sin(angleToNode))
                   ctx.lineTo(
                     bx - (b.radius + arrowSize) * Math.cos(angleToNode - 0.5), 
                     by - (b.radius + arrowSize) * Math.sin(angleToNode - 0.5)
                   )
                   ctx.lineTo(
                     bx - (b.radius + arrowSize) * Math.cos(angleToNode + 0.5), 
                     by - (b.radius + arrowSize) * Math.sin(angleToNode + 0.5)
                   )
                   ctx.closePath()
                   ctx.fillStyle = getTypeColor(type, config.color)
                   ctx.fill()
                   ctx.restore()

                  const dx = mouseRef.current.x - bx
                  const dy = mouseRef.current.y - by
                  const distance = Math.sqrt(dx * dx + dy * dy)
                  const isHovered = distance < b.radius

                  if (isHovered && b.targetOpacity > 0.1) {
                      hoverCandidate = { tx: b.tx, x: mouseRef.current.x, y: mouseRef.current.y }
                  }

                  const isFocused = b.tx.hash === focusedTxHashRef.current
                  const drawRadius = isFocused ? b.radius * 1.5 : b.radius

                  if (isFocused) {
                    const pulse = Math.sin(time * 0.01) * 0.5 + 0.5
                    ctx.save()
                    ctx.globalAlpha = pulse * 0.4
                    ctx.beginPath()
                    ctx.arc(bx, by, drawRadius + 10 + pulse * 10, 0, Math.PI * 2)
                    ctx.fillStyle = '#ffffff'
                    ctx.fill()
                    ctx.restore()
                  }

                  ctx.save()
                  ctx.globalAlpha = b.currentOpacity
                  
                  ctx.beginPath()
                  ctx.arc(bx, by, drawRadius, 0, Math.PI * 2)
                  ctx.fillStyle = `${b.color}22`
                  ctx.fill()
                  
                  ctx.lineWidth = isHovered || isFocused ? 3 : 1
                  ctx.strokeStyle = isHovered || isFocused ? '#ffffff' : b.color
                  ctx.stroke()

                  const nodeX = bx + drawRadius * Math.cos(angle)
                  const nodeY = by + drawRadius * Math.sin(angle)
                  ctx.beginPath()
                  ctx.arc(nodeX, nodeY, 3, 0, Math.PI * 2)
                  ctx.fillStyle = isHovered || isFocused ? '#ffffff' : b.color
                  ctx.fill()

                  const ethValue = parseFloat(formatEther(BigInt(b.tx.value || '0')))
                  const isWhale = ethValue > 1

                  if (isWhale) {
                    ctx.save()
                    ctx.beginPath()
                    ctx.arc(bx, by, drawRadius + 4, 0, Math.PI * 2)
                    ctx.strokeStyle = '#ffffff'
                    ctx.lineWidth = 2
                    ctx.globalAlpha = 0.5 + Math.sin(time * 0.01) * 0.3
                    ctx.stroke()
                    
                    ctx.fillStyle = '#ffffff'
                    ctx.font = 'black 9px sans-serif'
                    ctx.textAlign = 'center'
                    ctx.fillText('WHALE', bx, by - drawRadius - 12)
                    ctx.restore()
                  }

                  if (drawRadius > 20) {
                    const formatted = ethValue >= 1 ? ethValue.toFixed(1) : ethValue.toFixed(2)
                    const text = `${formatted}E`
                    ctx.fillStyle = '#ffffff'
                    ctx.font = `bold ${Math.floor(drawRadius * 0.4)}px monospace`
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillText(text, bx, by)
                  }
                  
                  ctx.restore()
             }
         }
      }

      setHoveredTx(current => {
        if (!hoverCandidate && !current) return null
        if (hoverCandidate && current && hoverCandidate.tx.hash === current.tx.hash) {
           return { ...current, x: hoverCandidate.x, y: hoverCandidate.y }
        }
        return hoverCandidate
      })

      // Update Mini-map
      const miniCanvas = miniMapCanvasRef.current
      if (miniCanvas && viewModeRef.current === 'bubbles') {
        const mCtx = miniCanvas.getContext('2d')
        if (mCtx) {
          mCtx.clearRect(0, 0, 140, 90)
          for (const b of bubblesRef.current.values()) {
            if (b.currentOpacity < 0.05) continue
            const mx = (b.x / cw) * 140
            const my = (b.y / ch) * 90
            mCtx.beginPath()
            mCtx.arc(mx, my, Math.max(1.5, b.radius * 0.07), 0, Math.PI * 2)
            mCtx.fillStyle = b.color + 'bb'
            mCtx.fill()
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    
    return () => {
      window.removeEventListener('resize', updateSize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [config.color, config.name]) // Added config.name to deps since we use it in rendering now

  // --- Interaction Handlers ---
  const handleMouseDown = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    // Record for click vs drag detection
    mouseDownPosRef.current = { x: mx, y: my }
    mouseDownTimeRef.current = Date.now()
    isDraggingRef.current = false

    if (viewModeRef.current === 'bubbles') {
      const bubblesArray = Array.from(bubblesRef.current.values())
      for (let i = bubblesArray.length - 1; i >= 0; i--) {
        const b = bubblesArray[i]
        const dx = b.x - mx
        const dy = b.y - my
        if (Math.sqrt(dx * dx + dy * dy) <= b.radius + 4) {
          draggedBubbleRef.current = b
          dragOffsetRef.current = { x: mx - b.x, y: my - b.y }
          b.vx = 0
          b.vy = 0
          b.isDragging = true
          canvas.style.cursor = 'grabbing'
          break
        }
      }
    }
  }, [])

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    // Update mouseRef for hover logic
    mouseRef.current = {
      x: mx,
      y: my,
      isHovering: true
    }

    if (draggedBubbleRef.current) {
      // Mark as dragging if moved more than threshold
      const movedX = Math.abs(mx - mouseDownPosRef.current.x)
      const movedY = Math.abs(my - mouseDownPosRef.current.y)
      if (movedX > DRAG_THRESHOLD || movedY > DRAG_THRESHOLD) {
        isDraggingRef.current = true
      }

      const b = draggedBubbleRef.current
      const dpr = window.devicePixelRatio || 1
      const cw = canvas.width / dpr
      const ch = canvas.height / dpr

      b.x = mx - dragOffsetRef.current.x
      b.y = my - dragOffsetRef.current.y
      
      // Keep within bounds
      b.x = Math.max(b.radius, Math.min(cw - b.radius, b.x))
      b.y = Math.max(b.radius, Math.min(ch - b.radius, b.y))
    } else if (viewModeRef.current === 'bubbles') {
      // Grab cursor feedback
      const bubblesArray = Array.from(bubblesRef.current.values())
      const isHoveringAny = bubblesArray.some(b => {
        const dx = b.x - mx
        const dy = b.y - my
        return Math.sqrt(dx * dx + dy * dy) < b.radius
      })
      canvas.style.cursor = isHoveringAny ? 'grab' : 'default'
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (draggedBubbleRef.current) {
      const bubble = draggedBubbleRef.current
      const elapsed = Date.now() - mouseDownTimeRef.current

      // Release drag
      bubble.isDragging = false
      bubble.vx = (Math.random() - 0.5) * 0.4
      bubble.vy = (Math.random() - 0.5) * 0.4
      draggedBubbleRef.current = null
      if (canvasRef.current) canvasRef.current.style.cursor = 'default'

      // Only navigate if it was a clean click (not dragged, fast)
      if (!isDraggingRef.current && elapsed < CLICK_TIME_THRESHOLD) {
        router.push(`/explorer/${chain}/tx/${bubble.tx.hash}`)
      }

      isDraggingRef.current = false
    }
  }, [router, chain])

  const handleMouseLeave = useCallback(() => {
    if (draggedBubbleRef.current) {
      draggedBubbleRef.current.isDragging = false
      draggedBubbleRef.current.vx = (Math.random() - 0.5) * 0.4
      draggedBubbleRef.current.vy = (Math.random() - 0.5) * 0.4
      draggedBubbleRef.current = null
    }
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      handleMouseDown(mouseEvent)
    }
  }, [handleMouseDown])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      handleGlobalMouseMove(mouseEvent)
    }
  }, [handleGlobalMouseMove])

  const handleTouchEnd = useCallback(() => {
    handleMouseUp()
  }, [handleMouseUp])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('mousedown', handleMouseDown as any)
    window.addEventListener('mousemove', handleGlobalMouseMove as any)
    window.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseLeave as any)
    
    // Touch support
    canvas.addEventListener('touchstart', handleTouchStart as any, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove as any, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd as any, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown as any)
      window.removeEventListener('mousemove', handleGlobalMouseMove as any)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave as any)
      
      canvas.removeEventListener('touchstart', handleTouchStart as any)
      canvas.removeEventListener('touchmove', handleTouchMove as any)
      canvas.removeEventListener('touchend', handleTouchEnd as any)
    }
  }, [handleMouseDown, handleGlobalMouseMove, handleMouseUp, handleMouseLeave, handleTouchStart, handleTouchMove, handleTouchEnd])

  // Click navigation is now handled in handleMouseUp with drag detection

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
      saveSearchToHistory(q)
      
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
        
        setActiveSearch({
          type: 'tx',
          query: q,
          txData: data
        })
        setSearchResult({ type: 'transaction', data })
        setFocusedTxHash(q)
      } 
      else if (SEARCH_TYPES.ADDRESS.test(q)) {
        if (!pathname.includes(q)) {
          router.push(`/explorer/${chain}/${q}`)
        }
        
        const [addrRes, txsRes, countersRes] = await Promise.all([
          fetch(`${config.apiBase}/addresses/${q}`),
          fetch(`${config.apiBase}/addresses/${q}/transactions?limit=25`),
          fetch(`${config.apiBase}/addresses/${q}/counters`).catch(() => null)
        ])
        
        if (!addrRes.ok) throw new Error('404')
        
        const addrData = await addrRes.json()
        const txsData = await txsRes.json()
        const countersData = countersRes?.ok ? await countersRes.json() : {}

        setActiveSearch({
          type: 'address',
          query: q,
          address: q,
          addressData: { ...addrData, counters: countersData },
          addressTxs: txsData.items || []
        })
      }
      else if (SEARCH_TYPES.BLOCK.test(q)) {
        const [blockRes, txsRes] = await Promise.all([
          fetch(`${config.apiBase}/blocks/${q}`),
          fetch(`${config.apiBase}/blocks/${q}/transactions?limit=25`)
        ])
        
        if (!blockRes.ok) throw new Error('404')
        
        const blockData = await blockRes.json()
        const txsData = await txsRes.json()

        setActiveSearch({
          type: 'block',
          query: q,
          blockData,
          blockTxs: txsData.items || []
        })
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
      setSearchError(`Not found on ${config.name}`)
    } finally {
      setSearchLoading(false)
    }
  }

  // --- Render ---
  return (
    <>
    <div className="relative w-full h-[calc(100dvh-80px)] flex flex-col pt-16">
      
      {/* Top Header UI */}
      <div className="absolute top-16 inset-x-0 z-20 px-4 md:px-8 flex flex-col md:flex-row justify-between items-start pointer-events-none gap-3">
        
        {/* Left Side: Stats */}
        <div className="space-y-1 md:space-y-4 pointer-events-auto w-full md:w-auto">
          <div className="flex items-center gap-4">
            <h1 className={`text-xl md:text-4xl font-extrabold tracking-tight ${isMegaEth ? 'uppercase font-mono' : isBase ? 'tracking-tighter' : ''}`} style={{ color: config.color }}>
              {config.name}
            </h1>
            <span className={`hidden md:inline text-xl font-medium tracking-tight ${isBase ? 'text-black/40' : 'text-gray-400'}`}>
              {viewMode === 'bubbles' ? 'Activity Explorer' : 'Network Cluster'}
            </span>
          </div>

          {viewMode === 'bubbles' ? (
            <div className="flex flex-wrap gap-1.5 md:gap-3">
              <div className={`${isBase ? 'bg-black/5 border-black/5' : 'bg-white/[0.04] border-white/[0.08] backdrop-blur-md'} border rounded-lg md:rounded-xl px-2 md:px-4 py-1 md:py-2 flex flex-col shadow-sm`}>
                <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                  <span className={`text-[10px] md:text-xs uppercase font-bold tracking-wider ${isBase ? 'text-black/30' : 'text-gray-500'}`}>Total TXs</span>
                  <div className="flex items-center gap-1 md:gap-1.5 ml-auto translate-y-[-1px]">
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[7px] md:text-[9px] font-black text-green-500 tracking-[0.2em] uppercase">Live</span>
                  </div>
                </div>
                <span className={`text-xs md:text-lg font-mono ${isBase ? 'text-black' : 'text-white'}`}>{stats.totalTxs}</span>
              </div>
              <div className={`${isBase ? 'bg-black/5 border-black/5' : 'bg-white/[0.04] border-white/[0.08] backdrop-blur-md'} border rounded-lg md:rounded-xl px-2 md:px-4 py-1 md:py-2 flex flex-col shadow-sm`}>
                <span className={`text-[10px] md:text-xs uppercase font-bold tracking-wider ${isBase ? 'text-black/30' : 'text-gray-500'}`}>Latest Block</span>
                <span className={`text-xs md:text-lg font-mono`} style={{ color: config.color }}>{stats.latestBlock || '-'}</span>
              </div>
              <div className={`hidden sm:flex ${isBase ? 'bg-black/5 border-black/5' : 'bg-white/[0.04] border-white/[0.08] backdrop-blur-md'} border rounded-lg md:rounded-xl px-2 md:px-4 py-1 md:py-2 flex-col shadow-sm`}>
                <span className={`text-[10px] md:text-xs uppercase font-bold tracking-wider ${isBase ? 'text-black/30' : 'text-gray-500'}`}>Avg Gas</span>
                <span className={`text-xs md:text-lg font-mono`} style={{ color: config.color }}>{stats.avgGas}</span>
              </div>
            </div>
          ) : (
              <button 
                 onClick={() => {
                   setViewMode('bubbles')
                   router.push(`/explorer/${chain}`)
                 }}
                 className={`flex items-center gap-2 px-4 py-2 border transition-all duration-200 text-sm font-bold shadow-sm ${
                   isMegaEth 
                     ? 'bg-black border-[#00ff88] text-[#00ff88] rounded-none uppercase font-mono hover:bg-[#00ff88] hover:text-black' 
                     : isBase 
                       ? 'bg-black/5 border-black/5 text-black hover:bg-black/10 rounded-full' 
                       : 'bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.1] backdrop-blur-md rounded-full'
                 }`}
              >
                 <ArrowLeft className="w-4 h-4" /> Back to bubbles
              </button>
          )}
        </div>

        {/* Right Side: Filters & Controls */}
          <div className="flex flex-col items-start md:items-end gap-1 md:gap-3 pointer-events-auto w-full md:w-auto">
          
          <div className={`flex p-0.5 md:p-1 border shadow-sm ${
            isMegaEth 
              ? 'bg-black border-white/10 rounded-none' 
              : isBase 
                ? 'bg-black/5 border-black/5 rounded-full' 
                : 'bg-white/[0.04] border-white/[0.08] backdrop-blur-md rounded-full'
          }`}>
            <button
               onClick={() => {
                 setViewMode('bubbles')
                 router.push(`/explorer/${chain}`)
               }}
               className={`px-2 md:px-4 py-1 md:py-2 text-[10px] md:text-xs font-bold transition-all duration-200 ${
                 isMegaEth ? 'rounded-none uppercase font-mono' : 'rounded-full'
               } ${
                 viewMode === 'bubbles' 
                 ? isMegaEth ? 'bg-[#00ff88] text-black shadow-sm' : isBase ? 'bg-white text-black shadow-sm' : 'bg-white/10 text-white shadow-sm' 
                 : isMegaEth ? 'text-white/40 hover:text-white' : isBase ? 'text-black/40 hover:text-black' : 'text-gray-400 hover:text-white'
               }`}
            >
              Bubble View
            </button>
            <button
               onClick={() => setViewMode('network')}
               className={`px-2 md:px-4 py-1 md:py-2 text-[10px] md:text-xs font-bold transition-all duration-200 flex items-center gap-1 md:gap-2 ${
                 isMegaEth ? 'rounded-none uppercase font-mono' : 'rounded-full'
               } ${
                 viewMode === 'network' 
                 ? isMegaEth ? 'bg-[#00ff88] text-black shadow-sm' : isBase ? 'bg-white text-black shadow-sm' : 'bg-white/10 text-white shadow-sm' 
                 : isMegaEth ? 'text-white/40 hover:text-white' : isBase ? 'text-black/40 hover:text-black' : 'text-gray-400 hover:text-white'
               }`}
            >
              {viewMode === 'network' && (
                <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-green-500" />
                </span>
              )}
              <span className="hidden md:inline">Network View</span>
              <span className="md:hidden">Network</span>
            </button>
          </div>

          <div className={`flex flex-nowrap overflow-x-auto scrollbar-none p-0.5 md:p-1 border shadow-sm ${
            isMegaEth 
              ? 'bg-black border-white/10 rounded-none' 
              : isBase 
                ? 'bg-black/5 border-black/5 rounded-full' 
                : 'bg-white/[0.04] border-white/[0.08] backdrop-blur-md rounded-full'
          }`}>
            {([
              { key: 'all' as FilterType, label: 'All' },
              { key: 'transfers' as FilterType, label: 'Transfers' },
              { key: 'contract_calls' as FilterType, label: 'Contract Calls' },
              { key: 'token_transfers' as FilterType, label: 'Token Transfers' },
              { key: 'nfts' as FilterType, label: 'NFTs' },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-1.5 md:px-3 py-0.5 md:py-1.5 text-[9px] md:text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap shrink-0 ${
                  isMegaEth ? 'rounded-none font-mono' : 'rounded-full'
                } ${
                  filter === f.key
                  ? isMegaEth ? 'bg-[#00ff88] text-black shadow-sm' : 'text-white shadow-sm'
                  : isMegaEth ? 'text-white/40 hover:text-white' : isBase ? 'text-black/40 hover:text-black' : 'text-gray-400 hover:text-white'
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
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
              <span className={`hidden sm:inline text-[10px] font-bold uppercase tracking-[0.2em] ${isMegaEth ? 'text-white/30 font-mono' : isBase ? 'text-black/30' : 'text-gray-500'}`}>
                 Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : '-'}
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
                      <div className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full border border-transparent md:border-2" />
                    )}
                 </div>
                 <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Alerts</span>
              </button>

              <button
                 onClick={viewMode === 'bubbles' ? fetchBubblesData : () => networkCenterRef.current.hash && fetchNetworkData(networkCenterRef.current.hash)}
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

      {/* Centered Search Bar */}
      <div className="absolute top-[160px] md:top-[180px] inset-x-0 z-30 px-4 flex flex-col items-center pointer-events-none">
        <span className={`text-[11px] font-bold uppercase tracking-widest mb-3 pointer-events-auto px-3 py-1 border backdrop-blur-md ${
          isMegaEth 
            ? 'bg-black border-[#00ff88] text-[#00ff88] rounded-none font-mono' 
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
            disabled={searchLoading}
            className={`w-full h-[48px] border pl-12 pr-14 transition-all duration-300 disabled:opacity-50 ${
              isMegaEth 
                ? 'bg-black border-white/20 rounded-none text-[#00ff88] placeholder-[#00ff88]/30 font-mono focus:border-[#00ff88]' 
                : isBase 
                  ? 'bg-black/5 border-black/5 rounded-full text-black placeholder-black/20 focus:bg-black/10 focus:border-black/10' 
                  : 'bg-white/[0.04] border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none backdrop-blur-xl'
            }`}
            style={!isMegaEth && !isBase ? { 
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
              disabled={searchLoading}
              className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors disabled:opacity-50 ${
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
                  <button onClick={() => setSearchResult(null)} className="p-1 hover:bg-white/10 rounded-md transition-colors">
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
                /* Detailed Transaction Card */
                <div className="w-full max-w-4xl bg-[#0e0f18] border border-white/10 rounded-2xl md:rounded-[40px] shadow-2xl relative min-h-[650px] flex flex-col overflow-hidden">
                   <div className="p-4 md:p-8">
                     <div className="flex justify-between items-start mb-10">
                       <div className="space-y-1.5">
                          <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                             Transaction Details
                             <span className={`text-[10px] uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full border ${
                               (searchResult.data.result === 'success' || searchResult.data.status === 'ok')
                                 ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                 : 'bg-red-500/10 text-red-400 border-red-500/20'
                             }`}>
                               {searchResult.data.result === 'success' || searchResult.data.status === 'ok' ? '✓ Confirmed' : '⚠ Failed'}
                             </span>
                          </h2>
                          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                             <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {timeAgo(searchResult.data.timestamp)}</span>
                             <span className="text-white/10">|</span>
                             <span className="text-green-400 font-mono">#{searchResult.data.block_number || searchResult.data.block}</span>
                          </div>
                       </div>
                       <button 
                          onClick={() => {
                            setSearchResult(null)
                            handleBack()
                          }}
                          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 group"
                       >
                          <X className="w-6 h-6 text-gray-400 group-hover:text-white" />
                       </button>
                     </div>
  
                     <div className="space-y-6">
                        {/* Hashes Section */}
                        <div className="grid gap-4">
                           <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl group hover:border-white/10 transition-colors">
                              <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-3">Transaction Hash</span>
                              <div className="flex items-center justify-between gap-4">
                                 <span className="text-base font-mono text-gray-200 tracking-tight break-all leading-relaxed">{searchResult.data.hash}</span>
                                 <CopyButton text={searchResult.data.hash} />
                              </div>
                           </div>
  
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div 
                                onClick={() => router.push(`/explorer/${chain}/${searchResult.data.from.hash}`)}
                                className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl cursor-pointer hover:bg-white/[0.05] hover:border-white/20 transition-all group"
                              >
                                 <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-2">From</span>
                                 <div className="flex items-center justify-between">
                                    <span className="text-sm font-mono text-gray-400 truncate">{truncateString(searchResult.data.from.hash, 12)}</span>
                                    <CopyButton text={searchResult.data.from.hash} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                 </div>
                              </div>
                              <div 
                                onClick={() => {
                                  const targetHash = searchResult.data.to?.hash || searchResult.data.created_contract?.hash
                                  if (targetHash) router.push(`/explorer/${chain}/${targetHash}`)
                                }}
                                className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl cursor-pointer hover:bg-white/[0.05] hover:border-white/20 transition-all group"
                              >
                                 <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-2">
                                   {searchResult.data.to ? 'To' : (searchResult.data.created_contract ? 'Created Contract' : 'To')}
                                 </span>
                                 <div className="flex items-center justify-between">
                                    <span className="text-sm font-mono text-gray-400 truncate">
                                      {searchResult.data.to 
                                        ? truncateString(searchResult.data.to.hash, 12) 
                                        : (searchResult.data.created_contract ? truncateString(searchResult.data.created_contract.hash, 12) : 'Contract Creation')
                                      }
                                    </span>
                                    {(searchResult.data.to?.hash || searchResult.data.created_contract?.hash) && (
                                      <CopyButton 
                                        text={searchResult.data.to?.hash || searchResult.data.created_contract?.hash} 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity" 
                                      />
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
  
                        {/* Details Grid */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden divide-y divide-white/5">
                           <div className="grid grid-cols-1 md:grid-cols-2 p-4 md:p-6 gap-4 md:gap-12">
                              <div className="space-y-1">
                                 <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-1">Value</span>
                                 <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-white tracking-tighter">
                                       {parseFloat(formatEther(BigInt(searchResult.data.value || '0'))).toFixed(4)}
                                    </span>
                                    <span className="text-sm text-gray-600 font-bold uppercase tracking-widest">ETH</span>
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-1">Fee paid</span>
                                 <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-bold text-gray-400 tracking-tight">
                                       {formatEther(BigInt(searchResult.data.fee?.value || BigInt(searchResult.data.gas_used || 0) * BigInt(searchResult.data.gas_price || 0)))}
                                    </span>
                                    <span className="text-xs text-gray-600 font-bold uppercase tracking-widest">ETH</span>
                                 </div>
                              </div>
                           </div>
  
                           <div className="grid grid-cols-3 p-6 gap-4 bg-white/[0.01]">
                              <div className="space-y-1">
                                 <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-600">Gas Used</span>
                                 <span className="text-sm font-mono text-gray-300">{Number(searchResult.data.gas_used).toLocaleString()}</span>
                              </div>
                              <div className="space-y-1">
                                 <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-600">Gas Price</span>
                                 <span className="text-sm font-mono text-gray-300">{(Number(searchResult.data.gas_price) / 1e9).toFixed(6)} <span className="text-[10px] text-gray-500">Gwei</span></span>
                              </div>
                              <div className="space-y-1">
                                 <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-600">Type</span>
                                 <span className="text-sm font-black text-white uppercase tracking-tighter" style={{ color: config.color }}>{searchResult.data.transaction_types?.[0]?.replace('_', ' ') || 'Transfer'}</span>
                              </div>
                           </div>
                        </div>
  
                        {/* Actions Footer */}
                        <div className="flex flex-col gap-5 pt-4">
                           <div className="flex gap-4">
                              <button 
                                 onClick={() => {
                                    const focusAddr = searchResult.data.to?.hash || searchResult.data.from.hash
                                    router.push(`/explorer/${chain}/${focusAddr}`)
                                 }}
                                 className="flex-1 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-sm shadow-xl"
                              >
                                 View Address <ExternalLink className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  setSearchResult(null)
                                  handleBack()
                                }}
                                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-sm"
                              >
                                 Back
                              </button>
                           </div>
                           
                           <div className="flex justify-center border-t border-white/5 pt-5">
                              <a 
                                 href={`${config.explorer}/tx/${searchResult.data.hash}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-[10px] uppercase tracking-widest font-black text-gray-600 hover:text-white transition-colors flex items-center gap-2"
                              >
                                 Review on {config.name} Blockscout <ExternalLink className="w-3 h-3" />
                              </a>
                           </div>
                        </div>
                     </div>
                   </div>
                </div>
              ) : null}

              </div>
            </div>
          )}

          {/* Block Panel */}
          {searchResult?.type === 'block' && (
             <div className="absolute top-[60px] left-0 right-0 bg-[#0d0e15]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-5 pointer-events-auto z-50">
               <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                    Block <span className="text-gray-400 font-mono text-base">#{searchResult.data.height}</span>
                  </h3>
                  <button onClick={() => {
                    setSearchResult(null)
                    router.push(`/explorer/${chain}`)
                  }} className="p-1.5 hover:bg-white/10 rounded-md transition-colors border border-transparent hover:border-white/10">
                     <X className="w-4 h-4 text-gray-400" />
                  </button>
               </div>
               <div className="space-y-3 bg-white/[0.02] p-4 font-medium border border-white/5 rounded-xl">
                 <div className="flex justify-between items-center gap-4">
                   <span className="text-xs text-gray-500 uppercase tracking-widest">Miner</span>
                   <div className="flex items-center gap-1">
                     <span className="text-sm font-mono text-gray-200">{truncateString(searchResult.data.miner?.hash, 10)}</span>
                     {searchResult.data.miner?.hash && <CopyButton text={searchResult.data.miner.hash} />}
                   </div>
                 </div>
                 <div className="flex justify-between items-baseline gap-4">
                   <span className="text-xs text-gray-500 uppercase tracking-widest">Transactions</span>
                   <span className="text-sm font-mono text-white font-bold">{searchResult.data.tx_count}</span>
                 </div>
                 <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/5">
                   <div className="flex justify-between">
                     <span className="text-[10px] text-gray-500 uppercase tracking-widest whitespace-nowrap">Gas Usage</span>
                     <span className="text-[10px] uppercase font-bold text-gray-400 font-mono">
                      {((Number(searchResult.data.gas_used) / Number(searchResult.data.gas_limit)) * 100).toFixed(2)}%
                     </span>
                   </div>
                   <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          backgroundColor: config.color,
                          width: `${(Number(searchResult.data.gas_used) / Number(searchResult.data.gas_limit)) * 100}%` 
                        }} 
                      />
                   </div>
                 </div>
                 <div className="flex justify-between items-baseline gap-4 pt-2 mt-2 border-t border-white/5">
                   <span className="text-[10px] text-gray-500 uppercase tracking-widest">Timestamp</span>
                   <span className="text-xs text-gray-400">{new Date(searchResult.data.timestamp).toLocaleString()}</span>
                 </div>
               </div>
               <button 
                 onClick={() => window.open(`${config.explorer}/block/${searchResult.data.height}`, '_blank')}
                 className="w-full mt-4 py-2.5 hover:bg-white transition-colors hover:text-black bg-white/10 rounded-xl text-sm font-bold text-white flex justify-center items-center gap-2"
               >
                 View on Explorer <ExternalLink className="w-3.5 h-3.5" />
               </button>
             </div>
          )}
        </div>
      </div>

      {/* Address Details Panel (Right Side Desktop) */}
      {searchResult?.type === 'address' && (
        <div className="absolute top-40 right-4 md:right-8 left-4 md:left-auto w-auto md:w-80 bg-[#0d0e15]/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-5 pointer-events-auto z-30">
             <div className="flex justify-between items-start mb-5">
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2 tracking-tight">
                    Address Details
                    {searchResult.data.is_contract ? (
                      <span className="bg-purple-500/20 border border-purple-500/30 shadow-sm text-purple-400 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest">Contract</span>
                    ) : (
                      <span 
                        className="border shadow-sm px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest opacity-90"
                        style={{ 
                          backgroundColor: `${config.color}33`, 
                          borderColor: `${config.color}44`,
                          color: config.color 
                        }}
                      >
                        Wallet
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded shadow-inner">{truncateString(searchResult.data.hash, 10)}</span>
                    <CopyButton text={searchResult.data.hash} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                       onClick={() => {
                         navigator.clipboard.writeText(window.location.href)
                         toast.success('Explorer URL copied to clipboard!')
                       }}
                       className="p-2 hover:bg-white/10 rounded-md transition-colors border border-white/5 hover:border-white/10"
                       title="Share Explorer"
                    >
                      <Share2 className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                    <button onClick={() => {
                      setSearchResult(null)
                      setViewMode('bubbles')
                      router.push(`/explorer/${chain}`)
                    }} className="p-1.5 hover:bg-white/10 rounded-md transition-colors border border-transparent hover:border-white/10">
                       <X className="w-4 h-4 text-gray-400" />
                    </button>
                 </div>
             </div>
             
             <div className="space-y-4">
               <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                 <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">ETH Balance</span>
                 <div className="flex items-end gap-2">
                   <span className="text-3xl font-mono text-white font-extrabold tracking-tighter">
                     {parseFloat(formatEther(BigInt(searchResult.data.coin_balance || '0'))).toFixed(4)}
                   </span>
                   <span className="text-sm font-bold text-gray-500 mb-1">ETH</span>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3 pt-2">
                 <div className="flex flex-col bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                   <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-1">Total Txs</span>
                   <span className="text-base font-mono text-white tracking-tight">{searchResult.data.counters?.transactions_count || '-'}</span>
                 </div>
                 <div className="flex flex-col bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                   <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-1">Tokens</span>
                   <span className="text-base font-mono text-white tracking-tight">{searchResult.data.counters?.token_transfers_count || '-'}</span>
                 </div>
               </div>
               
               <button 
                 onClick={() => window.open(`${config.explorer}/address/${searchResult.data.hash}`, '_blank')}
                 className="w-full mt-2 py-3 bg-white/10 hover:bg-white/90 hover:text-black transition-colors rounded-xl text-sm font-bold text-white flex justify-center items-center gap-2 border border-white/5"
               >
                 View on Explorer <ExternalLink className="w-3.5 h-3.5" />
               </button>
             </div>
        </div>
      )}

      {/* Canvas Area */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full relative z-10 overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "w-full h-full cursor-default outline-none touch-none",
            viewMode === 'network' && "invisible absolute"
          )}
        />

        {/* Network View — Transaction Table */}
        {viewMode === 'network' && (
          <div className="w-full h-full overflow-auto">
            <div className="max-w-[1400px] mx-auto px-6 pt-4 pb-8">
              {/* Address Info Banner (Network View) */}
              {activeSearch?.type === 'address' && activeSearch.addressData && (
                <div className="mb-6 p-4 md:p-6 bg-white/[0.04] border border-white/[0.1] rounded-2xl md:rounded-3xl backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-5">
                    <div 
                      className="p-4 rounded-2xl border"
                      style={{ 
                        backgroundColor: `${config.color}11`, 
                        borderColor: `${config.color}33` 
                      }}
                    >
                      {activeSearch.addressData.is_contract ? (
                        <FileCode className="w-8 h-8" style={{ color: config.color }} />
                      ) : (
                        <Wallet className="w-8 h-8" style={{ color: config.color }} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-white font-mono">{truncateString(activeSearch.address || '', 12)}</h3>
                        <CopyButton text={activeSearch.address || ''} />
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${activeSearch.addressData.is_contract ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                          {activeSearch.addressData.is_contract ? 'Contract' : 'Wallet'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
                        <span className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> {parseFloat(formatEther(BigInt(activeSearch.addressData.coin_balance || '0'))).toFixed(4)} ETH</span>
                        <span>{activeSearch.addressData.counters?.transactions_count || 0} Transactions</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={clearSearch}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-sm font-bold border border-white/10 transition-all flex items-center gap-2"
                  >
                    Clear Search <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Block Info Banner (Network View) */}
              {activeSearch?.type === 'block' && (
                <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Clock className="w-5 h-5 text-orange-400" />
                      </div>
                      <h3 className="text-white font-bold">Showing Transactions for Block #{activeSearch.query}</h3>
                   </div>
                   <button onClick={clearSearch} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                     <X className="w-5 h-5" />
                   </button>
                </div>
              )}

              {/* Table Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {activeSearch ? 'Search Results' : 'Latest Transactions'}
                  </h2>
                  <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    {(activeSearch?.type === 'address' ? activeSearch.addressTxs : 
                      activeSearch?.type === 'block' ? activeSearch.blockTxs : 
                      networkTxs)?.filter(tx => passesFilter(tx, filter)).length || 0} shown
                  </span>
                </div>
                {!activeSearch && (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Auto-refresh 15s</span>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                        <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tx Hash</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Block</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Age</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">From</th>
                        <th className="px-2 py-3"></th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">To</th>
                        <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Value</th>
                        <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Type</th>
                        <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {networkTableLoading && networkTxs.length === 0 ? (
                        // Skeleton rows
                        Array.from({ length: 10 }).map((_, i) => (
                          <tr key={`skel-${i}`} className="border-b border-white/[0.04] animate-pulse">
                            {Array.from({ length: 9 }).map((_, j) => (
                              <td key={j} className="px-4 py-3.5">
                                <div className="h-4 bg-white/[0.04] rounded w-full" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        (activeSearch?.type === 'address' ? activeSearch.addressTxs : 
                         activeSearch?.type === 'block' ? activeSearch.blockTxs : 
                         networkTxs)
                          ?.filter(tx => passesFilter(tx, filter))
                          .map((tx) => {
                            const txType = getTxPrimaryType(tx)
                            const typeColor = getTypeColor(txType, config.color)
                            const ethValue = parseFloat(formatEther(BigInt(tx.value || '0')))
                            const gasPrice = BigInt((tx as any).gas_price || '0')
                            const gasUsed = BigInt(tx.gas_used || '0')
                            const fee = parseFloat(formatEther(gasPrice * gasUsed))
                            const isNew = newTxHashes.has(tx.hash)
                            const isSearched = activeSearch?.type === 'tx' && tx.hash === activeSearch.query

                            const typeLabel: Record<string, string> = {
                              coin_transfer: 'Transfer',
                              contract_call: 'Contract',
                              token_transfer: 'Token',
                              nft_transfer: 'NFT',
                              default: 'Tx',
                            }

                            return (
                              <tr
                                key={tx.hash}
                                ref={isSearched ? searchedRowRef : null}
                                className={cn(
                                   `border-b transition-colors duration-300 cursor-pointer ${isBase ? 'border-black/5 hover:bg-black/5' : 'border-white/[0.04] hover:bg-white/[0.03]'}`,
                                   isNew && (isBase ? "bg-green-500/10" : "animate-pulse bg-green-500/[0.06]"),
                                   isSearched && (isBase ? "border-l-2 shadow-inner" : "border-l-2")
                                 )}
                                 style={isSearched ? { 
                                    backgroundColor: `${config.color}22`,
                                    borderLeftColor: config.color 
                                  } : {}}
                              >
                                {/* Tx Hash */}
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => router.push(`/explorer/${chain}/tx/${tx.hash}`)}
                                    className="font-mono text-[13px] hover:underline transition-colors opacity-80 hover:opacity-100"
                                    style={{ color: config.color }}
                                  >
                                    {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                                  </button>
                                </td>

                                {/* Block */}
                                <td className="px-4 py-3">
                                  <span
                                    className="font-mono text-xs text-gray-400 hover:text-white cursor-pointer transition-colors"
                                    onClick={() => {
                                      const blockNum = (tx as any).block_number || (tx as any).block
                                      if (blockNum) window.open(`${config.explorer}/block/${blockNum}`, '_blank')
                                    }}
                                  >
                                    {(tx as any).block_number || (tx as any).block || '-'}
                                  </span>
                                </td>

                                {/* Age */}
                                <td className="px-4 py-3">
                                  <span
                                    className="text-xs text-gray-500"
                                    title={new Date(tx.timestamp).toLocaleString()}
                                  >
                                    {timeAgo(tx.timestamp)}
                                  </span>
                                </td>

                                {/* From */}
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => router.push(`/explorer/${chain}/${tx.from?.hash}`)}
                                    className="font-mono text-[13px] text-gray-300 hover:text-white hover:underline transition-colors"
                                  >
                                    {truncateString(tx.from?.hash || '', 10)}
                                  </button>
                                </td>

                                {/* Arrow */}
                                <td className="px-2 py-3 text-center">
                                  <ArrowRight className="w-3.5 h-3.5 text-gray-600 inline-block" />
                                </td>

                                {/* To */}
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => {
                                      const toHash = tx.to?.hash
                                      if (toHash) router.push(`/explorer/${chain}/${toHash}`)
                                    }}
                                    className="font-mono text-[13px] text-gray-300 hover:text-white hover:underline transition-colors"
                                  >
                                    {tx.to ? truncateString(tx.to.hash, 10) : 'Contract Creation'}
                                  </button>
                                </td>

                                {/* Value */}
                                <td className="px-4 py-3 text-right">
                                  <span className="font-mono text-xs text-white font-medium">
                                    {ethValue.toFixed(4)}
                                    <span className="text-gray-600 ml-1">ETH</span>
                                  </span>
                                </td>

                                {/* Type Badge */}
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider"
                                    style={{
                                      backgroundColor: `${typeColor}22`,
                                      color: typeColor,
                                    }}
                                  >
                                    {typeLabel[txType] || 'Tx'}
                                  </span>
                                </td>

                                {/* Fee */}
                                <td className="px-4 py-3 text-right">
                                  <span className="font-mono text-[11px] text-gray-500">
                                    {fee > 0 ? fee.toFixed(6) : '-'}
                                  </span>
                                </td>
                              </tr>
                            )
                          })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08] bg-white/[0.01]">
                  <button
                    onClick={handleNetworkPrevPage}
                    disabled={networkPageStack.length === 0}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors",
                      networkPageStack.length === 0
                        ? "text-gray-600 cursor-not-allowed"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-xs text-gray-500 font-medium">
                    Page {networkPageStack.length + 1}
                  </span>
                  <button
                    onClick={handleNetworkNextPage}
                    disabled={!networkNextParams}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors",
                      !networkNextParams
                        ? "text-gray-600 cursor-not-allowed"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Search Results Overlay / Messages */}
        {activeSearch?.type === 'address' && viewMode === 'bubbles' && (
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
                  return b.tx.from?.hash?.toLowerCase() === addr || b.tx.to?.hash?.toLowerCase() === addr
                }).length} transactions found for {truncateString(activeSearch.address || '', 8)}
              </span>
              <button 
                onClick={clearSearch}
                className="pointer-events-auto bg-white/10 hover:bg-white/20 p-1 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {activeSearch?.type === 'block' && viewMode === 'bubbles' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="bg-orange-600/20 backdrop-blur-md border border-orange-500/30 px-6 py-2 rounded-full flex items-center gap-3">
              <span className="text-white text-sm font-bold">Showing Block #{activeSearch.query}</span>
              <button 
                onClick={clearSearch}
                className="pointer-events-auto bg-white/10 hover:bg-white/20 p-1 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {activeSearch?.type === 'address' && viewMode === 'bubbles' && 
         Array.from(bubblesRef.current.values()).filter(b => {
           const addr = activeSearch.address?.toLowerCase()
           return b.tx.from?.hash?.toLowerCase() === addr || b.tx.to?.hash?.toLowerCase() === addr
         }).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className={`p-8 rounded-3xl flex flex-col items-center gap-4 max-w-md text-center border backdrop-blur-md shadow-2xl ${
              isBase ? 'bg-white/80 border-black/5 text-black' : isSoneium ? 'bg-[#00040F]/60 border-[#0047FF]/20 text-white shadow-[0_0_50px_rgba(0,71,255,0.1)]' : 'bg-black/60 border-white/10 text-white'
            }`}>
              <Search className={`w-12 h-12 ${isBase ? 'text-black/20' : 'text-gray-500'}`} />
              <p className={`font-bold text-lg ${isBase ? 'text-black/60' : 'text-gray-300'}`}>No transactions found in current view — showing in Network View</p>
              <button 
                onClick={() => setViewMode('network')}
                className="pointer-events-auto mt-2 px-6 py-2 text-white font-bold rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ backgroundColor: config.color }}
              >
                Switch to Network View
              </button>
            </div>
          </div>
        )}
        
        {/* Loading Overlay */}
        {loading && bubblesRef.current.size === 0 && viewMode === 'bubbles' && (
          <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm z-20 pointer-events-none ${
            isBase ? 'bg-white/80' : isSoneium ? 'bg-[#00040F]/80' : 'bg-[#080810]/80'
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
            isBase ? 'bg-white/95' : isSoneium ? 'bg-[#00040F]/95' : 'bg-[#080810]/95'
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
                    : 'bg-[#0a0a0f]/90 border-white/10 rounded-2xl text-white backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)]'
              }`}>
                <div className={`flex justify-between items-start mb-3 pb-2 border-b ${isBase ? 'border-black/5' : 'border-white/5'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: hoveredTx.color }} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isBase ? 'text-black/40' : 'text-gray-500'}`}>
                      {hoveredTx.tx.transaction_types?.includes('contract_call') ? 'Contract Call' : 'Native Transfer'}
                    </span>
                  </div>
                  <ExternalLink className={`w-3 h-3 ${isBase ? 'text-black/20' : 'text-gray-600'}`} />
                </div>
                
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isBase ? 'text-black/30' : 'text-gray-500'}`}>Value</span>
                  <span className={`text-sm font-bold ${isMegaEth ? 'text-[#00ff88]' : isBase ? 'text-black' : isSoneium ? 'text-[#0047FF]' : 'text-white'}`}>
                    {formatEther(BigInt(hoveredTx.tx.value || '0')).slice(0, 8)} ETH
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
      {viewMode === 'bubbles' && (
        <div className="absolute bottom-20 left-8 z-20 pointer-events-none">
          <canvas
            ref={miniMapCanvasRef}
            width={140}
            height={90}
            className="rounded-xl opacity-60"
            style={{
              border: `1px solid ${config.color}33`,
              background: 'rgba(0,0,0,0.4)',
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
      )}

      {/* Legend */}
      <div className={`absolute bottom-6 right-8 z-20 flex gap-4 p-3 border shadow-lg pointer-events-none ${
        isMegaEth 
          ? 'bg-black border-white/10 rounded-none' 
          : isBase 
            ? 'bg-white border-black/5 rounded-full shadow-xl' 
          : isSoneium
            ? 'bg-white/[0.03] border-[#0047FF]/20 backdrop-blur-xl rounded-full shadow-[0_0_30px_rgba(0,71,255,0.1)]'
            : 'bg-white/[0.02] border-white/[0.08] backdrop-blur-md rounded-full shadow-2xl'
      }`}>
        <LegendItem color={config.color} label="Native Transfer" isBase={isBase} />
        <LegendItem color="#22c55e" label="Contract Call" isBase={isBase} />
        <LegendItem color="#f97316" label="Token Transfer" isBase={isBase} />
        <LegendItem color="#a855f7" label="NFT Transfer" isBase={isBase} />
      </div>

    </div>

      {/* Telegram Alerts Modal */}
      <TelegramAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />
    </>
  )
}

function LegendItem({ color, label, isBase }: { color: string, label: string, isBase?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 pointer-events-auto">
      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
      <span className={`text-[10px] font-black uppercase tracking-widest ${isBase ? 'text-black/40' : 'text-gray-400'}`}>{label}</span>
    </div>
  )
}

function CopyButton({ text, className }: { text: string, className?: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={handleCopy} className={cn("p-1 hover:bg-white/10 rounded transition-colors", className)} title="Copy to clipboard">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-white" />}
    </button>
  )
}
