"use client"

// Canvas engine for the bubble explorer: data fetching, bubble physics,
// the requestAnimationFrame render loop, minimap, and mouse/touch interaction.
// Extracted from the original 2,149-line bubble-explorer.tsx.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  getAddr,
  getTxPrimaryType,
  getTypeColor,
  formatNativeValue,
  passesFilter,
  type ActiveSearch,
  type Bubble,
  type ChainConfig,
  type ChainType,
  type FilterType,
  type Ripple,
  type TxData,
  type DefiProtocol,
} from '@/lib/explorer-config'

const DRAG_THRESHOLD = 5
const CLICK_TIME_THRESHOLD = 350
const MAX_BUBBLES = 60
const POLL_INTERVAL = 20000

// ponytail: LitVM's Blockscout /transactions endpoint is frequently 500/timeout.
// When config.rpcUrl is set we pull the last few blocks over JSON-RPC instead.
// Ceiling: token_transfers are not decoded (no receipt log parsing) so ERC-20
// swaps show as contract_call/coin_transfer, not token_transfer. Add eth_getTransactionReceipt
// log decoding here if typed token bubbles are needed.
async function rpcFetchLatestTxs(rpcUrl: string, blockCount = 2): Promise<{ txs: any[]; latestBlock: number }> {
  const jrpc = (method: string, params: any[]) =>
    fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    }).then((r) => r.json())

  const headHex: string = (await jrpc('eth_blockNumber', [])).result
  const head = parseInt(headHex, 16)
  const txs: any[] = []
  let latestBlock = head
  for (let i = 0; i < blockCount; i++) {
    const num = '0x' + (head - i).toString(16)
    const block = (await jrpc('eth_getBlockByNumber', [num, true])).result
    if (!block || !Array.isArray(block.transactions)) continue
    const ts = parseInt(block.timestamp, 16)
    for (const t of block.transactions) {
      const types: string[] = []
      if (t.to == null) types.push('contract_creation')
      else if (t.input && t.input !== '0x') types.push('contract_call')
      else types.push('coin_transfer')
      txs.push({
        hash: t.hash,
        value: t.value,
        from: { hash: t.from },
        to: t.to ? { hash: t.to } : null,
        transaction_types: types,
        gas_used: t.gas,
        timestamp: String(ts),
      })
    }
    if (i === 0) latestBlock = parseInt(block.number, 16)
  }
  return { txs, latestBlock }
}


export function useExplorerBubbles({
  chain,
  config,
  monitorTransactions,
}: {
  chain: ChainType
  config: ChainConfig
  monitorTransactions: (txs: (TxData & { alertType?: string; protocol?: string; frozenAddress?: string; tokenAddress?: string; drainerAddress?: string; victimAddress?: string; amount?: string })[]) => void
}) {
  const isMegaEth = chain === 'megaeth'
  const isInk = chain === 'ink'
  const isUnichain = chain === 'unichain'
  const isBase = chain === 'base'
  const isLitvm = chain === 'litvm'
  const isArc = chain === 'arc'

  const router = useRouter()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const miniMapCanvasRef = useRef<HTMLCanvasElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [stats, setStats] = useState({ totalTxs: 0, latestBlock: 0, avgGas: '0' })
  const [filter, setFilter] = useState<FilterType>('all')
  const [hoveredTx, setHoveredTx] = useState<{ tx: TxData; x: number; y: number } | null>(null)

  // Unified Search State (owned here so the render loop can read it via ref)
  const [activeSearch, setActiveSearch] = useState<ActiveSearch>(null)
  const activeSearchRef = useRef<ActiveSearch>(null)
  useEffect(() => { activeSearchRef.current = activeSearch }, [activeSearch])

  const [focusedTxHash, setFocusedTxHash] = useState<string | null>(null)
  const focusedTxHashRef = useRef<string | null>(null)
  useEffect(() => { focusedTxHashRef.current = focusedTxHash }, [focusedTxHash])

  // Refs for canvas synchronization
  const bubblesRef = useRef<Map<string, Bubble>>(new Map())
  const filterRef = useRef<FilterType>('all')
  useEffect(() => { filterRef.current = filter }, [filter])

  const mouseRef = useRef({ x: -1000, y: -1000, isHovering: false })
  const ripplesRef = useRef<Ripple[]>([])
  const rafRef = useRef<number>(0)
  const connectionPairsRef = useRef<Array<{ aId: string; bId: string; color: string }>>([])
  const isFetchingRef = useRef(false)
  const frameCountRef = useRef(0)
  const errorToastShownRef = useRef(false)

  // Dragging state
  const draggedBubbleRef = useRef<Bubble | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  // Click vs drag detection
  const isDraggingRef = useRef(false)
  const mouseDownTimeRef = useRef(0)
  const mouseDownPosRef = useRef({ x: 0, y: 0 })

  const rebuildConnectionPairs = () => {
    const pairs: Array<{ aId: string; bId: string; color: string }> = []
    const arr = Array.from(bubblesRef.current.values())
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i], b = arr[j]
        const aFrom = getAddr(a.tx.from)
        const aTo = getAddr(a.tx.to)
        const bFrom = getAddr(b.tx.from)
        const bTo = getAddr(b.tx.to)
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

  // Shared post-fetch pipeline: build bubbles, stats, and run alert detection.
  // Used by both the RPC path (LitVM) and the Blockscout path.
  const processFetchedTxs = useCallback((newTxs: TxData[], blockData: any) => {
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

    // Run detection hooks before alerting, so monitorTransactions sees enriched events
    const eventsForAlerts: Array<TxData & { alertType?: string; protocol?: string; frozenAddress?: string; tokenAddress?: string; drainerAddress?: string; victimAddress?: string; amount?: string }> = newTxs.map(tx => {
      const enriched: typeof tx & { alertType?: string; protocol?: string; frozenAddress?: string; tokenAddress?: string; drainerAddress?: string; victimAddress?: string; amount?: string } = tx
      // Freeze detection: tx interacts with a monitored token contract
      if (config.freezeMonitoredContracts?.includes(tx.to?.hash || '')) {
        enriched.alertType = 'freeze'
        enriched.tokenAddress = tx.to?.hash || ''
        enriched.frozenAddress = getAddr(tx.from) || ''
      }
      // DeFi detection
      const defi = config.defiProtocols?.find(p => p.address.toLowerCase() === (tx.to?.hash || '').toLowerCase())
      if (defi) {
        enriched.alertType = defi.type
        enriched.protocol = defi.name
      }
      return enriched
    })

    if (newTxs.length > 0) {
      monitorTransactions(eventsForAlerts)
    }
  }, [config, monitorTransactions])

  // --- Main Data Fetching (Bubbles) ---
  const fetchBubblesData = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      // RPC path (LitVM): Blockscout /transactions is unreliable, pull blocks via JSON-RPC.
      if (config.rpcUrl) {
        const { txs, latestBlock } = await rpcFetchLatestTxs(config.rpcUrl, 2)
        if (!txs.length) {
          setError(true)
          if (!errorToastShownRef.current) {
            errorToastShownRef.current = true
            toast.error("Could not fetch latest transactions. Using cached data.")
          }
          return
        }
        errorToastShownRef.current = false
        const newTxs: TxData[] = txs
        const blockData = { items: [{ height: latestBlock }] }
        processFetchedTxs(newTxs, blockData)
        return
      }

      const [txRes, blockRes] = await Promise.all([
        fetch(`${config.apiBase}/transactions`).catch(() => null),
        fetch(`${config.apiBase}/blocks`).catch(() => null),
      ])

      if (!txRes?.ok) {
        setError(true)
        // Toast only on the ok→error transition, not on every failed poll
        if (!errorToastShownRef.current) {
          errorToastShownRef.current = true
          toast.error("Could not fetch latest transactions. Using cached data.")
        }
        return
      }
      errorToastShownRef.current = false

      const txData = await txRes.json()
      const blockData = blockRes?.ok ? await blockRes.json() : null

      const newTxs: TxData[] = txData.items || []

      processFetchedTxs(newTxs, blockData)
    } catch (err) {
      const msg = err instanceof Error ? err.message.split('\n')[0] : String(err)
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Explorer] ${config.name} API unavailable:`, msg)
      }
      setError(true)
    } finally {
      isFetchingRef.current = false
      if (loading) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiBase, config.color, monitorTransactions, ...(config.freezeMonitoredContracts ?? []), ...(config.defiProtocols ?? [])])

  // Poll for new transactions (paused while a search is active)
  useEffect(() => {
    fetchBubblesData()
    if (!activeSearch) {
      const int = setInterval(fetchBubblesData, POLL_INTERVAL)
      return () => clearInterval(int)
    }
  }, [fetchBubblesData, activeSearch])

  // --- Canvas Rendering Loop ---
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
              : isLitvm
                ? 'rgba(0, 242, 254, 0.025)'
                : isArc
                  ? 'rgba(77, 142, 233, 0.025)'
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

      // Draw Spawn Ripples (skipped when user prefers reduced motion)
      if (!prefersReducedMotion) {
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
      }

      let hoverCandidate: { tx: TxData; x: number; y: number } | null = null

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

          if (prefersReducedMotion) continue

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

          // Address search highlighting (combines with filter)
          if (activeSearchRef.current?.type === 'address') {
            const addr = activeSearchRef.current.address?.toLowerCase()
            const matches = getAddr(b.tx.from) === addr || getAddr(b.tx.to) === addr
            if (targetOpacity > 0 && !matches) targetOpacity = 0.15
          }

          b.targetOpacity = targetOpacity
          b.currentOpacity += (b.targetOpacity - b.currentOpacity) * 0.08 * dt

          // Skip drawing if bubble is practically invisible
          if (b.currentOpacity < 0.01) continue

          if (!b.isDragging) {

            // 1. Repulsion from other bubbles (Optimized to run every 3 frames)
            if (shouldRunPhysics && !prefersReducedMotion) {
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

            if (!prefersReducedMotion) {
              // 2. Weak center attraction (stops bubbles drifting to edges)
              b.vx += (cw / 2 - b.x) * 0.0003
              b.vy += (ch / 2 - b.y) * 0.0003

              // 3. Address cluster attraction
              if (activeSearchRef.current?.type === 'address') {
                const addr = activeSearchRef.current.address?.toLowerCase()
                const matches = getAddr(b.tx.from) === addr || getAddr(b.tx.to) === addr
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
          }

          const dx = mouseRef.current.x - b.x
          const dy = mouseRef.current.y - b.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const isHovered = distance < b.radius

          if (isHovered && b.targetOpacity > 0.1) {
            hoverCandidate = { tx: b.tx, x: mouseRef.current.x, y: mouseRef.current.y }
            if (mouseRef.current.isHovering && !prefersReducedMotion) {
              b.vx -= dx * 0.005
              b.vy -= dy * 0.005
            }
          }

          const isFocused = b.tx.hash === focusedTxHashRef.current
          const drawRadius = isFocused ? b.radius * 1.5 : b.radius

          if (isFocused) {
            const pulse = prefersReducedMotion ? 0.5 : (Math.sin(time * 0.01) * 0.5 + 0.5)
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
            const matches = getAddr(b.tx.from) === addr || getAddr(b.tx.to) === addr
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
            const pulse = prefersReducedMotion ? 0.5 : (Math.sin(time * 0.01) * 0.5 + 0.5)
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
            if (!b.isDragging && !prefersReducedMotion) {
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

          const ethValue = parseFloat(formatNativeValue(b.tx.value || '0', config.decimals))
          const whaleThreshold = (config as any).whaleThreshold ?? 10
          const isWhale = ethValue >= whaleThreshold

          if (isWhale) {
            ctx.save()
            ctx.beginPath()
            ctx.arc(b.x, b.y, drawRadius + 4, 0, Math.PI * 2)
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.globalAlpha = prefersReducedMotion ? 0.5 : 0.5 + Math.sin(time * 0.01) * 0.3
            ctx.stroke()

            ctx.fillStyle = '#ffffff'
            ctx.font = `bold ${Math.min(Math.floor(drawRadius * 0.25), 16)}px sans-serif`
            ctx.textAlign = 'center'
            ctx.fillText('WHALE', b.x, b.y - drawRadius - 12)
            ctx.restore()
          }

          if (drawRadius > 20) {
            const formatted = ethValue >= 1 ? ethValue.toFixed(1) : ethValue.toFixed(2)
            const text = `${formatted}${config.currency}`
            ctx.fillStyle = '#ffffff'
            ctx.font = `bold ${Math.min(Math.floor(drawRadius * 0.4), 14)}px monospace`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(text, b.x, b.y)
          }
          // Reset alpha for next iteration
          ctx.globalAlpha = 1
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
      if (miniCanvas) {
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

    // Pause rendering while the tab is hidden (saves CPU/battery)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      } else if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('resize', updateSize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [config.color, config.name, chain]) // chain drives the per-chain grid color + flags

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
    } else {
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

  // Add search-result transactions to the bubble map
  const addSearchTxsToBubbles = (txs: TxData[], clearExisting = false) => {
    if (clearExisting) {
      bubblesRef.current.clear()
      ripplesRef.current = []
    }

    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    const width = canvas ? canvas.width / dpr : window.innerWidth
    const height = canvas ? canvas.height / dpr : window.innerHeight

    txs.forEach((tx) => {
      if (bubblesRef.current.has(tx.hash)) return
      const type = getTxPrimaryType(tx)
      const color = getTypeColor(type, config.color)
      const valueInWei = Number(BigInt(tx.value || '0'))
      const radius = Math.max(30, Math.min(150, Math.log10(valueInWei + 1) * 20))
      const margin = radius + 20
      const sx = margin + Math.random() * Math.max(1, width - margin * 2)
      const sy = margin + Math.random() * Math.max(1, height - margin * 2)

      bubblesRef.current.set(tx.hash, {
        id: tx.hash, x: sx, y: sy,
        vx: (Math.random() * 2 - 1), vy: (Math.random() * 2 - 1),
        radius, color, tx,
        targetOpacity: passesFilter(tx, filterRef.current) ? 1 : 0.1,
        currentOpacity: 0
      })

      ripplesRef.current.push({
        bubbleId: tx.hash,
        startTime: performance.now(),
        color
      })
    })

    rebuildConnectionPairs()
    setStats(prev => ({ ...prev, totalTxs: bubblesRef.current.size }))
  }

  return {
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
  }
}
