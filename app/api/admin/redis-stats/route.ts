import { NextResponse } from "next/server"
import { getRedis } from "@/lib/redis"
import fs from "fs"
import path from "path"
import { getSession } from "@/lib/admin-session"

const ECOSYSTEMS = [
  { key: "litvm", name: "LitVM" },
  { key: "base", name: "Base" },
  { key: "ink", name: "Ink" },
  { key: "unichain", name: "Unichain" },
  { key: "soneium", name: "Soneium" },
  { key: "megaeth", name: "MegaETH" },
  { key: "arc", name: "Arc Testnet" },
  { key: "arc-mainnet", name: "Arc" },
]

/** Load pool metadata for an ecosystem — returns total quiz count or 0 if no pool file */
function getPoolSize(ecosystemKey: string): { totalQuizzes: number; questionsPerSession: number } {
  try {
    const filePath = path.join(process.cwd(), "data", `quizzes-${ecosystemKey}.json`)
    if (!fs.existsSync(filePath)) return { totalQuizzes: 0, questionsPerSession: 5 }
    const raw = fs.readFileSync(filePath, "utf-8")
    const pool = JSON.parse(raw)
    return {
      totalQuizzes: pool.meta?.totalQuizzes ?? pool.quizzes?.length ?? 0,
      questionsPerSession: pool.meta?.questionsPerSession ?? 5,
    }
  } catch {
    return { totalQuizzes: 0, questionsPerSession: 5 }
  }
}

export async function GET(request: Request) {
  try {
    if (!(await getSession(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const r = getRedis()
    if (!r) {
      return NextResponse.json({
        configured: false,
        message: "KV_REST_API_URL / KV_REST_API_TOKEN not set.",
        wallets: [],
        ecosystems: {},
      })
    }

    // Get all progress keys
    const progressKeys = await r.keys("progress:*")

    // Build a name→key reverse lookup for ecosystems with display names != key
    const ecoNameToKey: Record<string, string> = {}
    for (const eco of ECOSYSTEMS) {
      ecoNameToKey[eco.name.toLowerCase()] = eco.key
    }
    const progressArr = Array.isArray(progressKeys) ? progressKeys : []

    // Get all submitted keys
    const submittedKeys = await r.keys("submitted:*")
    const submittedArr = Array.isArray(submittedKeys) ? submittedKeys : []

    // Get individual wallet values in batch where possible
    // For each progress key, fetch the value (questions done)
    const wallets: {
      ecosystem: string
      ecosystemKey: string
      address: string
      questionsDone: number
      quizzesDone: number
      totalQuizzes: number
      questionsPerSession: number
      progressPct: number
      nearCompletion: boolean
    }[] = []

    // Batch-fetch all progress values via pipelines (sequential gets = ~300ms × N keys)
    const values = new Map<string, number | null>()
    // ponytail: chunk size 100 balances pipeline payload vs memory; lower if Upstash 413s
    for (let i = 0; i < progressArr.length; i += 100) {
      const chunk = progressArr.slice(i, i + 100)
      const pipe = r.pipeline()
      for (const key of chunk) pipe.get(key)
      const results = await pipe.exec()
      chunk.forEach((key, j) => {
        const v = results[j]
        values.set(key, typeof v === 'number' ? v : v != null ? Number(v) : null)
      })
    }

    // Pool sizes are per-ecosystem constants — read each JSON file once, not per wallet
    const poolSizes = new Map(ECOSYSTEMS.map(eco => [eco.key, getPoolSize(eco.key)]))

    for (const key of progressArr) {
      const parts = key.split(":")
      if (parts.length < 3) continue
      const ecoKeyRaw = parts[1].toLowerCase()
      // Normalize: if the stored key is a display name (e.g. "arc testnet"), map to the actual file key ("arc")
      const ecoKey = ecoNameToKey[ecoKeyRaw] ?? ecoKeyRaw
      const address = parts.slice(2).join(":").toLowerCase() // normalize for display

      const questionsDone = values.get(key) ?? 0
      const quizzesDone = Math.floor(questionsDone / 5)

      const poolInfo = poolSizes.get(ecoKey) ?? { totalQuizzes: 0, questionsPerSession: 5 }

      // Progress percentage: if pool exists, % of total; if no pool, mark as unlimited
      const totalQ = poolInfo.totalQuizzes
      const progressPct = totalQ > 0 ? Math.round((questionsDone / totalQ) * 100 * 10) / 10 : -1
      const nearCompletion = totalQ > 0 && progressPct >= 80

      wallets.push({
        ecosystem: ECOSYSTEMS.find((e) => e.key === ecoKey)?.name ?? ecoKey,
        ecosystemKey: ecoKey,
        address,
        questionsDone,
        quizzesDone,
        totalQuizzes: totalQ,
        questionsPerSession: poolInfo.questionsPerSession,
        progressPct,
        nearCompletion,
      })
    }

    // Sort: near-completion wallets first, then by progress descending
    wallets.sort((a, b) => {
      if (a.nearCompletion !== b.nearCompletion) return a.nearCompletion ? -1 : 1
      return b.progressPct - a.progressPct
    })

    // Per-ecosystem aggregate
    const ecosystems: Record<
      string,
      { wallets: number; submittedSessions: number; totalPool: number; nearCompletion: number }
    > = {}
    for (const eco of ECOSYSTEMS) {
      const ecoWallets = wallets.filter((w) => w.ecosystemKey === eco.key)
      const poolInfo = getPoolSize(eco.key)
      ecosystems[eco.key] = {
        wallets: ecoWallets.length,
        submittedSessions: submittedArr.filter((k) => k.startsWith(`submitted:${eco.key}:`)).length,
        totalPool: poolInfo.totalQuizzes,
        nearCompletion: ecoWallets.filter((w) => w.nearCompletion).length,
      }
    }

    return NextResponse.json({
      configured: true,
      totalWallets: wallets.length,
      totalSubmitted: submittedArr.length,
      wallets,
      ecosystems,
    })
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    console.error("[redis-stats] Error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
