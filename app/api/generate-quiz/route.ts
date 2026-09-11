export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from "next/server"
import { SignJWT } from "jose"
import { z } from "zod"
import { isAddress } from "viem"
import fs from "fs"
import path from "path"
import { getEcosystem, getPoolFileKey, type PoolData } from "@/lib/quiz-data"
import { getWalletProgress } from "@/lib/redis"

const MAX_BODY_BYTES = 10 * 1024

const bodySchema = z.object({
  chainId: z.number().int().finite().optional(),
})

const rateLimit = new Map<string, { count: number; resetTime: number }>()

const quizItemSchema = z.object({
  question: z.string().min(4),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
})
type ServerQuestion = z.infer<typeof quizItemSchema>
type PublicQuestion = { id: number; question: string; options: string[]; correctIndex: number }
const QUIZ_TOKEN_TTL_SECONDS = 15 * 60
const quizJwtSecret = process.env.QUIZ_JWT_SECRET

function buildCorsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || '*',
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  } as const
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimit.get(ip)

  if (limit && now < limit.resetTime) {
    if (limit.count >= 5) return false
    limit.count++
  } else {
    rateLimit.set(ip, { count: 1, resetTime: now + 60_000 })
  }
  return true
}

function readSelectedChainId(request: Request, method: "GET" | "POST"): number | null {
  if (method === "GET") {
    const url = new URL(request.url)
    const raw = url.searchParams.get("chainId")
    if (raw == null || raw === "") return null
    const parsed = Number(raw)
    if (!Number.isInteger(parsed)) {
      throw new Error("Invalid chainId query param")
    }
    return parsed
  }

  throw new Error("POST body parser must call readSelectedChainIdFromBody")
}

async function readSelectedChainIdFromBody(request: Request): Promise<number | null> {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    throw new Error("Malformed JSON body")
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    throw new Error("Invalid request body")
  }
  return parsed.data.chainId ?? null
}

/** Fisher–Yates shuffle, then take the first `count` elements. */
function fisherYatesPick<T>(items: readonly T[], count: number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, Math.min(count, arr.length))
}

function fisherYatesShuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Randomize option order so the correct answer isn't always at index 0. */
function shuffleOptions<T extends { options: readonly string[]; correctIndex: number }>(question: T): T {
  const correctAnswer = question.options[question.correctIndex]
  const shuffled = fisherYatesShuffle([...question.options])
  const newCorrectIndex = shuffled.indexOf(correctAnswer)
  return { ...question, options: shuffled, correctIndex: newCorrectIndex }
}


async function signQuizToken(
  chainId: number | null,
  answers: number[],
  address?: string | null,
  startIndex?: number | null,
): Promise<string> {
  const secret = new TextEncoder().encode(quizJwtSecret)
  return await new SignJWT({
    answers,
    chainId: chainId ?? null,
    address: address ?? null,
    startIndex: startIndex ?? null,
    type: "quiz-answers",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${QUIZ_TOKEN_TTL_SECONDS}s`)
    .sign(secret)
}

async function buildQuizResponse(
  chainId: number | null,
  items: ServerQuestion[],
  sources: string[],
  usedFallbackQuestions: boolean,
  headers: Record<string, string>,
  ecosystem: string,
  address?: string | null,
  startIndex?: number,
) {
  const randomized = items.map(shuffleOptions)
  const questions: PublicQuestion[] = randomized.map((q, i) => ({
    id: i + 1,
    question: q.question.trim(),
    options: q.options.map((o) => o.trim()),
    correctIndex: q.correctIndex,
  }))
  const answers = randomized.map((q) => q.correctIndex)
  const quizToken = await signQuizToken(chainId, answers, address, startIndex)
  return NextResponse.json(
    {
      questions,
      quizToken,
      sources,
      usedFallbackQuestions,
      ecosystem,
      ...(address != null && startIndex != null ? { startIndex } : {}),
    },
    { headers },
  )
}

function getFallbackQuestions(ecosystemName: "Ink" | "Soneium" | "Base" | "Unichain" | "MegaETH" | "LitVM" | "Arc Testnet" | "Sepolia" | "Abstract") {
  if (ecosystemName === "Arc Testnet") {
    return [
      {
        id: 1,
        question: "What is the native gas token used on Arc Testnet?",
        options: ["ETH", "USDC", "MATIC", "BNB"],
        correctIndex: 1,
      },
      {
        id: 2,
        question: "What is the Chain ID of Arc Testnet?",
        options: ["1", "137", "5042002", "8453"],
        correctIndex: 2,
      },
      {
        id: 3,
        question: "Which company built the Arc blockchain?",
        options: ["Coinbase", "Circle", "Consensys", "Kraken"],
        correctIndex: 1,
      },
      {
        id: 4,
        question: "What is the RPC endpoint for Arc Testnet?",
        options: [
          "https://rpc.testnet.arc.network",
          "https://mainnet.arc.network",
          "https://rpc.arc.io",
          "https://testnet.arc.io/rpc",
        ],
        correctIndex: 0,
      },
      {
        id: 5,
        question: "What advantage does Arc's stablecoin gas model provide?",
        options: [
          "Eliminates gas price volatility",
          "Increases block size",
          "Reduces transaction finality time",
          "Enables cross-chain messaging",
        ],
        correctIndex: 0,
      },
    ]
  }

  if (ecosystemName === "MegaETH") {
    return [
      {
        id: 1,
        question: "What is MegaETH?",
        options: [
          "A high-performance EVM-compatible blockchain",
          "A Layer-1 for Bitcoin",
          "A decentralized storage network",
          "A cross-chain bridge protocol",
        ],
        correctIndex: 0,
      },
      {
        id: 2,
        question: "What is the Chain ID of MegaETH?",
        options: ["1", "4326", "8453", "137"],
        correctIndex: 1,
      },
      {
        id: 3,
        question: "What native token is used for gas on MegaETH?",
        options: ["ETH", "MEGA", "MATIC", "SOL"],
        correctIndex: 0,
      },
      {
        id: 4,
        question: "What is the RPC endpoint for MegaETH?",
        options: [
          "https://carrot.megaeth.com",
          "https://rpc.megaeth.com",
          "https://mainnet.megaeth.io",
          "https://megaeth.rpc.com",
        ],
        correctIndex: 0,
      },
      {
        id: 5,
        question: "Which block explorer is used for MegaETH?",
        options: [
          "https://www.megaexplorer.xyz",
          "https://etherscan.io",
          "https://basescan.org",
          "https://explorer.megaeth.com",
        ],
        correctIndex: 0,
      },
    ]
  }

  if (ecosystemName === "LitVM") {
    return [
      {
        id: 1,
        question: "What is LitVM LiteForge?",
        options: [
          "An EVM rollup testnet for Lit Protocol",
          "A Bitcoin Layer-2",
          "A decentralized exchange",
          "An Ethereum staking pool",
        ],
        correctIndex: 0,
      },
      {
        id: 2,
        question: "What is the native gas token on LitVM LiteForge?",
        options: ["zkLTC", "ETH", "LIT", "BTC"],
        correctIndex: 0,
      },
      {
        id: 3,
        question: "What is the Chain ID of LitVM LiteForge?",
        options: ["1", "4441", "57073", "8453"],
        correctIndex: 1,
      },
      {
        id: 4,
        question: "What is the RPC endpoint for LitVM LiteForge?",
        options: [
          "https://liteforge.rpc.caldera.xyz/http",
          "https://rpc.litvm.com",
          "https://liteforge.rpc.io",
          "https://litvm.caldera.rpc.com",
        ],
        correctIndex: 0,
      },
      {
        id: 5,
        question: "Which asset backs zkLTC on LitVM LiteForge?",
        options: [
          "Litecoin (LTC)",
          "Bitcoin (BTC)",
          "Ethereum (ETH)",
          "Solana (SOL)",
        ],
        correctIndex: 0,
      },
    ]
  }

  if (ecosystemName === "Sepolia") {
    return [
      {
        id: 1,
        question: "What is the Sepolia testnet used for?",
        options: [
          "Testing Ethereum dApps and smart contracts without spending real ETH",
          "Mining Bitcoin",
          "Storing files permanently",
          "Running a social network",
        ],
        correctIndex: 0,
      },
      {
        id: 2,
        question: "What is the Chain ID of Sepolia?",
        options: ["1", "11155111", "8453", "137"],
        correctIndex: 1,
      },
      {
        id: 3,
        question: "What native token is used for gas on Sepolia?",
        options: ["BTC", "ETH", "USDC", "SOL"],
        correctIndex: 1,
      },
      {
        id: 4,
        question: "How do developers usually get Sepolia ETH?",
        options: [
          "From a testnet faucet",
          "By buying it on a stock exchange",
          "By mining with a CPU",
          "By swapping NFTs",
        ],
        correctIndex: 0,
      },
      {
        id: 5,
        question: "What is a block explorer mainly used for?",
        options: [
          "Viewing transaction and block details",
          "Generating private keys",
          "Minting tokens without a wallet",
          "Changing chain consensus rules",
        ],
        correctIndex: 0,
      },
    ]
  }

  const networkLabel = ecosystemName
  const mainnetLabel =
    ecosystemName === "Ink"
      ? "Ink mainnet"
      : ecosystemName === "Base"
        ? "Base mainnet"
        : ecosystemName === "Unichain"
          ? "Unichain mainnet"
        : "Soneium mainnet"

  return [
    {
      id: 1,
      question: `What is ${networkLabel} in this app context?`,
      options: [
        "A blockchain network users can interact with",
        "A hardware wallet vendor",
        "A social network for developers",
        "A browser-only storage format",
      ],
      correctIndex: 0,
    },
    {
      id: 2,
      question: `Which native token symbol is used for gas on ${networkLabel}?`,
      options: ["BTC", "ETH", "USDC", "SOL"],
      correctIndex: 1,
    },
    {
      id: 3,
      question: `Which option represents a supported ${networkLabel} network in this app?`,
      options: [mainnetLabel, "Ethereum Mainnet", "Polygon", "Solana"],
      correctIndex: 0,
    },
    {
      id: 4,
      question: "What is a block explorer mainly used for?",
      options: [
        "Viewing transaction and block details",
        "Generating private keys",
        "Minting tokens without a wallet",
        "Changing chain consensus rules",
      ],
      correctIndex: 0,
    },
    {
      id: 5,
      question: "Why switch between networks in a wallet?",
      options: [
        "To access different apps and assets on different chains",
        "To avoid wallet signatures",
        "To disable gas fees permanently",
        "To increase internet speed",
      ],
      correctIndex: 0,
    },
  ]
}

// ──────────────────────────────────────────────
// Pool-based quiz generation
// ──────────────────────────────────────────────

function loadPool(ecosystem: string): PoolData | null {
  const key = getPoolFileKey(ecosystem)
  if (!key) return null
  try {
    const filePath = path.join(process.cwd(), "data", `quizzes-${key}.json`)
    const raw = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(raw) as PoolData
  } catch (err) {
    console.error(`[generate-quiz] Failed to load pool for ${ecosystem}:`, err)
    return null
  }
}

async function handleGenerateQuiz(
  request: Request,
  selectedChainId: number | null,
  headers: Record<string, string>,
  address?: string | null,
): Promise<NextResponse> {
  const ecosystem = getEcosystem(selectedChainId)
  if (!ecosystem) {
    return NextResponse.json(
      { error: `Invalid or unsupported chainId (${selectedChainId}).` },
      { status: 400, headers },
    )
  }

  // Anonymous responses (no wallet) are a random pick from a static pool — edge-cache
  // for a minute. Address-bound responses hold a per-user JWT/startIndex, stay no-store.
  const responseHeaders = address
    ? headers
    : { ...headers, "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }

  // Try pool first
  const poolData = loadPool(ecosystem)
  if (poolData && poolData.quizzes.length >= 5) {
    if (address) {
      // Sequential pool access with wallet tracking
      const startIndex = await getWalletProgress(ecosystem, address)
      const total = poolData.quizzes.length
      const items: ServerQuestion[] = []
      for (let i = 0; i < 5; i++) {
        const q = poolData.quizzes[(startIndex + i) % total]
        items.push({
          question: q.question,
          options: [...q.options],
          correctIndex: q.correctIndex,
        })
      }
      const shuffled = items.map(shuffleOptions)
      return buildQuizResponse(
        selectedChainId,
        shuffled,
        [],
        false,
        responseHeaders,
        ecosystem,
        address,
        startIndex,
      )
    }
    // Random pool access (no address — legacy flow)
    const picked = fisherYatesPick(poolData.quizzes, 5)
    const items = picked.map(shuffleOptions)
    return buildQuizResponse(
      selectedChainId,
      items,
      [],
      false,
      responseHeaders,
      ecosystem,
    )
  }

  // Fallback to hardcoded questions
  console.warn(`[generate-quiz] Pool unavailable for ${ecosystem}, using fallback`)
  return buildQuizResponse(
    selectedChainId,
    getFallbackQuestions(ecosystem as any),
    [],
    true,
    responseHeaders,
    ecosystem,
  )
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") || undefined
  const headers = buildCorsHeaders(origin)
  return new NextResponse(null, { status: 204, headers })
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin") || undefined
  const headers = buildCorsHeaders(origin)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "You reached the request limit for this minute. Please try again soon." },
      { status: 429, headers },
    )
  }

  try {
    if (!quizJwtSecret) {
      return NextResponse.json(
        { error: "Server configuration error: QUIZ_JWT_SECRET is not set" },
        { status: 500, headers },
      )
    }
    const selectedChainId = readSelectedChainId(request, "GET")
    const addressParam = new URL(request.url).searchParams.get("address")?.toLowerCase() || null
    if (addressParam && !isAddress(addressParam)) {
      return NextResponse.json({ error: "Invalid address parameter" }, { status: 400, headers })
    }
    return await handleGenerateQuiz(request, selectedChainId, headers, addressParam)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request."
    return NextResponse.json({ error: message }, { status: 400, headers })
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin") || undefined
  const headers = buildCorsHeaders(origin)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "You reached the request limit for this minute. Please try again soon." },
      { status: 429, headers },
    )
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0")
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Request body too large. Max size is 10kb." },
      { status: 413, headers },
    )
  }

  try {
    if (!quizJwtSecret) {
      return NextResponse.json(
        { error: "Server configuration error: QUIZ_JWT_SECRET is not set" },
        { status: 500, headers },
      )
    }
    const selectedChainId = await readSelectedChainIdFromBody(request)
    const body = await request.json()
    const addressParam = body.address?.toLowerCase() || null
    if (addressParam && !isAddress(addressParam)) {
      return NextResponse.json({ error: "Invalid address parameter" }, { status: 400, headers })
    }
    return await handleGenerateQuiz(request, selectedChainId, headers, addressParam)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request."
    return NextResponse.json({ error: message }, { status: 400, headers })
  }
}
