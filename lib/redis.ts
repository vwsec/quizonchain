import { Redis } from "@upstash/redis"
import { getPoolFileKey } from "@/lib/quiz-data"

let redis: Redis | null = null

function normalizeEcosystem(ecosystem: string): string {
  return getPoolFileKey(ecosystem) ?? ecosystem.toLowerCase()
}

export function getRedis(): Redis | null {
  if (redis) return redis

  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    ""
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ""

  if (!url || !token) {
    console.warn("[redis] Upstash Redis not configured — wallet tracking disabled")
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

export async function getWalletProgress(
  ecosystem: string,
  address: string,
): Promise<number> {
  const r = getRedis()
  if (!r) return 0
  try {
    const key = `progress:${normalizeEcosystem(ecosystem)}:${address.toLowerCase()}`
    const val = await r.get<number>(key)
    return val ?? 0
  } catch (err) {
    console.error("[redis] getWalletProgress error:", err)
    return 0
  }
}

export async function incrementWalletProgress(
  ecosystem: string,
  address: string,
  amount: number,
): Promise<boolean> {
  const r = getRedis()
  if (!r) return false
  try {
    const key = `progress:${normalizeEcosystem(ecosystem)}:${address.toLowerCase()}`
    await r.incrby(key, amount)
    return true
  } catch (err) {
    console.error("[redis] incrementWalletProgress error:", err)
    return false
  }
}

export async function markSubmitted(
  ecosystem: string,
  address: string,
  startIndex: number,
): Promise<boolean> {
  const r = getRedis()
  if (!r) return false
  try {
    const key = `submitted:${normalizeEcosystem(ecosystem)}:${address.toLowerCase()}:${startIndex}`
    await r.set(key, true, { ex: 86_400 }) // 24h TTL
    return true
  } catch (err) {
    console.error("[redis] markSubmitted error:", err)
    return false
  }
}

export async function isSubmitted(
  ecosystem: string,
  address: string,
  startIndex: number,
): Promise<boolean> {
  const r = getRedis()
  if (!r) return false
  try {
    const key = `submitted:${normalizeEcosystem(ecosystem)}:${address.toLowerCase()}:${startIndex}`
    const exists = await r.exists(key)
    return exists === 1
  } catch (err) {
    console.error("[redis] isSubmitted error:", err)
    return false
  }
}
