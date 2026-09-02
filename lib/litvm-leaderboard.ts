/**
 * lib/litvm-leaderboard.ts
 *
 * Browser-side hybrid leaderboard loader for LitVM.
 * Loads a seed JSON (pre-dumped from the contract via Multicall3),
 * merges recent ScoreSubmitted events from Blockscout for incrementality,
 * and caches the result in localStorage.
 */

import type { GlobalPlayer } from "./chain-leaderboard"

// ── Constants ──────────────────────────────────────────────────────────────────
const CONTRACT = "0xBEd500d8d59547269085BBB4fa32Fab4394a4802"
const EXPLORER = "https://liteforge.explorer.caldera.xyz"
const TOPIC0 = "0x95d71264cfacf944422c8ffa4a8b9904b76ea2febd6d2c4450a72f991732dac5"
const CACHE_KEY = "litvm-leaderboard"
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min
const CHAIN_NAME = "LitVM"

// ── Types ──────────────────────────────────────────────────────────────────────
interface CacheEntry {
  players: Record<string, { points: number; games: number }>
  sorted: RankedEntry[]
  lastBlock: number
  timestamp: number
  version: number
}

interface RankedEntry {
  address: string
  points: number
  games: number
  avg: number
  rank: number
}

interface BlockscoutLog {
  blockNumber: string // hex
  data: string
  topics: string[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function now(): number {
  return Date.now()
}

function lsGet(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    return parsed.version === 2 ? parsed : null
  } catch {
    return null
  }
}

function lsSet(entry: CacheEntry): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

function decodePlayerFromTopic(topic: string): string {
  // topic is 32 bytes hex, address is the last 20 bytes
  return ("0x" + topic.slice(26)).toLowerCase()
}

function decodeScoreFromData(data: string): { score: number; total: number; timestamp: number } {
  // ABI-encoded (uint8, uint8, uint256) — each as 32-byte words
  const score = Number(BigInt("0x" + data.slice(2, 66)))
  const total = Number(BigInt("0x" + data.slice(66, 130)))
  const timestamp = Number(BigInt("0x" + data.slice(130, 194)))
  return { score, total, timestamp }
}

function computeAvg(points: number, games: number): number {
  return games > 0 ? Math.round((points / (games * 5)) * 100) : 0
}

function sortAndRank(players: Record<string, { points: number; games: number }>): RankedEntry[] {
  return Object.entries(players)
    .map(([address, data]) => ({
      address,
      points: data.points,
      games: data.games,
      avg: computeAvg(data.points, data.games),
      rank: 0, // temporary
    }))
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({ ...e, rank: i + 1 }))
}

function mergeEvents(
  players: Record<string, { points: number; games: number }>,
  events: BlockscoutLog[],
): number {
  let lastBlock = 0
  for (const ev of events) {
    const blockNum = Number(BigInt(ev.blockNumber))
    if (blockNum > lastBlock) lastBlock = blockNum

    const player = decodePlayerFromTopic(ev.topics[1])
    const { score } = decodeScoreFromData(ev.data)

    if (players[player]) {
      players[player].points += score
      players[player].games += 1
    } else {
      players[player] = { points: score, games: 1 }
    }
  }
  return lastBlock
}

async function fetchSeed(): Promise<Record<string, { points: number; games: number }>> {
  const res = await fetch("/data/leaderboard-litvm.json")
  if (!res.ok) throw new Error(`Seed fetch failed: ${res.status}`)
  const seed: { address: string; points: number; games: number }[] = await res.json()

  const map: Record<string, { points: number; games: number }> = {}
  for (const entry of seed) {
    map[entry.address.toLowerCase()] = { points: entry.points, games: entry.games }
  }
  return map
}

async function fetchEvents(fromBlock: number): Promise<BlockscoutLog[]> {
  const url =
    `${EXPLORER}/api?module=logs&action=getLogs` +
    `&address=${CONTRACT}` +
    `&fromBlock=${fromBlock}&toBlock=latest` +
    `&topic0=${TOPIC0}&offset=10000`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Events fetch failed: ${res.status}`)
  const json = await res.json()
  return (json.result ?? []) as BlockscoutLog[]
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Fetch the LitVM leaderboard. Returns GlobalPlayer[] sorted by points desc.
 *
 * Strategy:
 * 1. Check localStorage cache — if fresh (< 5 min) return it.
 * 2. Fetch seed JSON (static file from contract dump).
 * 3. Fetch recent ScoreSubmitted events from Blockscout.
 * 4. Merge, cache, return.
 *
 * When the seed is missing or stale (404), falls back to the cached data
 * or returns an empty array.
 */
export async function fetchLitvmLeaderboard(): Promise<GlobalPlayer[]> {
  // 1. Check localStorage
  const cached = lsGet()
  const cacheFresh = cached && now() - cached.timestamp < CACHE_TTL_MS

  if (cacheFresh) {
    return cached.sorted.map((e) => ({
      address: e.address as `0x${string}`,
      points: e.points,
      games: e.games,
      chains: [CHAIN_NAME],
      avg: e.avg,
      rank: e.rank,
    }))
  }

  // 2. Load seed + events
  try {
    const players = await fetchSeed()
    let lastBlock = 0

    // 3. Fetch events since the last scanned block
    const fromBlock = cached?.lastBlock ?? 0
    if (fromBlock > 0) {
      const events = await fetchEvents(fromBlock)
      if (events.length > 0) {
        const maxBlock = mergeEvents(players, events)
        lastBlock = Math.max(fromBlock, maxBlock)
      } else {
        lastBlock = fromBlock
      }
    }

    // 4. Sort, cache, return
    const sorted = sortAndRank(players)
    lsSet({
      players,
      sorted,
      lastBlock,
      timestamp: now(),
      version: 2,
    })

    return sorted.map((e) => ({
      address: e.address as `0x${string}`,
      points: e.points,
      games: e.games,
      chains: [CHAIN_NAME],
      avg: e.avg,
      rank: e.rank,
    }))
  } catch {
    // Seed not available (first run before dump) — return cached or empty
    if (cached) {
      return cached.sorted.map((e) => ({
        address: e.address as `0x${string}`,
        points: e.points,
        games: e.games,
        chains: [CHAIN_NAME],
        avg: e.avg,
        rank: e.rank,
      }))
    }
    return []
  }
}