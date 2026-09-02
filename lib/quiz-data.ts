export interface Question {
  id: number
  question: string
  options: string[]
  correctIndex: number
}

export interface PoolMeta {
  ecosystem: string
  batchId: string
  generatedAt: string
  totalQuizzes: number
  questionsPerSession: number
}

export interface QuestionSource {
  url: string
  section: string      // heading path, e.g. "## Overview > ### Installation"
  heading: string      // the specific heading text
  fetchedAt: string    // ISO8601 timestamp
}

export interface PoolQuiz {
  id: number
  question: string
  options: string[]
  correctIndex: number
  source?: QuestionSource  // optional for backward compat with existing pools
}

export interface PoolData {
  meta: PoolMeta
  quizzes: PoolQuiz[]
}

// ─────────────────────────────────────────────
// Ecosystem / chain helpers
// ─────────────────────────────────────────────

export const INK_CHAIN_IDS = new Set([57073])
export const BASE_CHAIN_ID = 8453
export const UNICHAIN_CHAIN_ID = 130

export const ECOSYSTEM_BY_CHAIN_ID: Record<number, string> = {
  [BASE_CHAIN_ID]: "Base",
  [UNICHAIN_CHAIN_ID]: "Unichain",
  1868: "Soneium",
  4326: "MegaETH",
  4441: "LitVM",
  5042002: "Arc Testnet",
}

export const ECOSYSTEM_FILE_KEY: Record<string, string> = {
  base: "base",
  unichain: "unichain",
  soneium: "soneium",
  megaeth: "megaeth",
  litvm: "litvm",
  arc: "arc",
  "arc testnet": "arc",
  ink: "ink",
}

export function getEcosystem(chainId: number | null): string | null {
  if (chainId == null) return null
  if (INK_CHAIN_IDS.has(chainId)) return "Ink"
  return ECOSYSTEM_BY_CHAIN_ID[chainId] ?? null
}

export function getPoolFileKey(ecosystem: string): string | null {
  return ECOSYSTEM_FILE_KEY[ecosystem.toLowerCase()] ?? null
}
