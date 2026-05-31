export const dynamic = 'force-dynamic'
export const maxDuration = 60

import Groq from "groq-sdk"
import { NextResponse } from "next/server"
import { SignJWT } from "jose"
import {
  BASE_DOCS_PAGES,
  INK_DOCS_PAGES,
  SONEIUM_DOCS_PAGES,
  UNICHAIN_DOCS_PAGES,
  MEGAETH_DOCS_PAGES,
  LITVM_DOCS_PAGES,
  ARC_DOCS_PAGES,
} from "@/lib/docsPages"
import { z } from "zod"

const INK_CHAIN_IDS = new Set([57073])
const BASE_CHAIN_ID = 8453
const UNICHAIN_CHAIN_ID = 130

const TARGET_CHARS = 3000
const MIN_COMBINED_CHARS = 800
const MIN_URL_TEXT_CHARS = 200
const MAX_URLS_TO_TRY = 6
const JINA_PREFIX = "https://r.jina.ai/"
const FETCH_TIMEOUT_MS = 8_000
const FETCH_DELAY_MS = 300
const GROQ_MODEL = "llama-3.3-70b-versatile"
const GROQ_RETRY_COUNT = 2
const GROQ_INITIAL_BACKOFF_MS = 1000

const TOPIC_ANGLES = [
  "consensus mechanisms",
  "tokenomics",
  "developer tooling",
  "bridge architecture",
  "account abstraction",
  "gas model",
  "governance",
  "block explorer features",
] as const

const questionHistoryCache = new Map<string, string[]>()
const MAX_CACHE_PER_ECOSYSTEM = 50

const ECOSYSTEM_ALIASES: Record<string, string[]> = {
  "litvm": ["litvm", "liteforge", "arbitrum"],
  "megaeth": ["megaeth", "megath"],
  "arc testnet": ["arc"],
  "ink": ["ink"],
  "soneium": ["soneium"],
  "base": ["base"],
  "unichain": ["unichain"],
}

const FORBIDDEN_IN_OPTIONS = [
  'soneium', 'ink', 'base', 'unichain', 'megaeth', 'megath',
  'arbitrum', 'optimism', 'polygon', 'solana', 'avalanche',
  'litvm', 'liteforge', 'arc',
]

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

const quizArraySchema = z.array(quizItemSchema).length(5)
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

function ensureGroqApiKey() {
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing. Set it in your environment variables.")
  }
  return apiKey
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchViaJinaReader(docUrl: string): Promise<string> {
  const jinaUrl = `${JINA_PREFIX}${docUrl}`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(jinaUrl, {
      signal: ctrl.signal,
      headers: {
        Accept: "text/plain,text/markdown,*/*",
      },
    })
    if (!res.ok) {
      throw new Error(`Jina Reader HTTP ${res.status}`)
    }
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

function isValidContent(text: string): boolean {
  if (text.length < 800) return false;
  const badSignals = ['404', 'not found', 'redirects to', 'page not found', 'access denied', 'login required', 'javascript required'];
  const lowerText = text.toLowerCase();
  const badCount = badSignals.filter(s => lowerText.includes(s)).length;
  return badCount < 2;
}

function isValidQuestion(q: ServerQuestion): boolean {
  const badPhrases = ['url', '404', 'page not found', 'accessing', 'result of visiting', 'result when trying', 'navigate to', 'click on'];
  const questionLower = q.question.toLowerCase();
  return !badPhrases.some(p => questionLower.includes(p));
}

function hasContaminatedOptions(question: ServerQuestion, currentEcosystem: string): boolean {
  const ecosystemLower = currentEcosystem.toLowerCase()
  const aliases = ECOSYSTEM_ALIASES[ecosystemLower] ?? [ecosystemLower]
  return question.options.some(option => {
    const optionLower = option.toLowerCase()
    return FORBIDDEN_IN_OPTIONS.some(forbidden => {
      const isSelfReference = aliases.some(alias => forbidden === alias || forbidden.includes(alias) || alias.includes(forbidden))
      if (isSelfReference) return false
      return optionLower.includes(forbidden)
    })
  })
}

function trimCorpus(text: string, maxChars: number): string {
  const collapsed = text.replace(/\s+/g, " ").trim()
  if (collapsed.length <= maxChars) return collapsed
  const start = Math.floor(Math.random() * Math.max(1, collapsed.length - maxChars))
  return collapsed.slice(start, start + maxChars)
}

function normalizeQuestion(q: string): string {
  return q.toLowerCase().replace(/[^\w\s]/g, "").trim()
}

function parseModelJson(raw: string): unknown {
  const trimmed = raw.trim()
  const fenced =
    /^```(?:json)?\s*([\s\S]*?)```/m.exec(trimmed)?.[1]?.trim() ?? null
  const candidate = fenced ?? trimmed
  try {
    return JSON.parse(candidate)
  } catch {
    const bracketStart = candidate.indexOf("[")
    const bracketEnd = candidate.lastIndexOf("]")
    if (bracketStart >= 0 && bracketEnd > bracketStart) {
      return JSON.parse(candidate.slice(bracketStart, bracketEnd + 1))
    }
    const objStart = candidate.indexOf("{")
    const objEnd = candidate.lastIndexOf("}")
    if (objStart >= 0 && objEnd > objStart) {
      return JSON.parse(candidate.slice(objStart, objEnd + 1))
    }
    throw new Error("Model response was not valid JSON")
  }
}

function toValidatedQuizArray(parsed: unknown) {
  if (Array.isArray(parsed)) {
    return quizArraySchema.parse(parsed)
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    "questions" in parsed &&
    Array.isArray((parsed as { questions: unknown }).questions)
  ) {
    return quizArraySchema.parse((parsed as { questions: unknown }).questions)
  }
  throw new Error("Expected a JSON array of 5 questions or { questions: [...] }")
}

function validateQuestions(data: unknown): ServerQuestion[] {
  if (!Array.isArray(data)) throw new Error("Invalid response")
  if (data.length !== 5) throw new Error("Wrong question count")
  return data.map((q, i) => {
    if (!q || typeof q !== "object") throw new Error(`Q${i}: invalid question`)
    const maybe = q as { question?: unknown; options?: unknown; correctIndex?: unknown }
    if (typeof maybe.question !== "string") throw new Error(`Q${i}: invalid question`)
    if (!Array.isArray(maybe.options) || maybe.options.length !== 4) {
      throw new Error(`Q${i}: invalid options`)
    }
    if (
      typeof maybe.correctIndex !== "number" ||
      maybe.correctIndex < 0 ||
      maybe.correctIndex > 3
    ) {
      throw new Error(`Q${i}: invalid answer`)
    }
    return {
      question: maybe.question,
      options: maybe.options.map((opt) => String(opt)),
      correctIndex: maybe.correctIndex,
    }
  })
}

async function signQuizToken(chainId: number | null, answers: number[]): Promise<string> {
  const secret = new TextEncoder().encode(quizJwtSecret)
  return await new SignJWT({
    answers,
    chainId: chainId ?? null,
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
) {
  const questions: PublicQuestion[] = items.map((q, i) => ({
    id: i + 1,
    question: q.question.trim(),
    options: q.options.map((o) => o.trim()),
    correctIndex: q.correctIndex,
  }))
  const answers = items.map((q) => q.correctIndex)
  const quizToken = await signQuizToken(chainId, answers)
  return NextResponse.json(
    {
      questions,
      quizToken,
      sources,
      usedFallbackQuestions,
      ecosystem,
    },
    { headers },
  )
}

function getFallbackQuestions(ecosystemName: "Ink" | "Soneium" | "Base" | "Unichain" | "MegaETH" | "LitVM" | "Arc Testnet") {
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

async function generateWithGroq(prompt: string, topicAngle: string): Promise<string> {
  const apiKey = ensureGroqApiKey()
  const groq = new Groq({ apiKey })

  let lastError: Error | unknown = null

  for (let attempt = 1; attempt <= GROQ_RETRY_COUNT; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: `You are a blockchain quiz generator v2. Focus this quiz on: ${topicAngle}. Each time you must produce a completely different set of questions — vary the topics, difficulty angles, and technical depth. Never repeat the same question format or subject across generations.

HARD RULES — These override all other instructions:
a) Generate questions and answers ONLY from facts explicitly stated in the documentation provided below. Do NOT use your training knowledge to fill gaps.
b) NEVER infer technical properties from token names, chain names, currency symbols, or naming conventions.
c) Your training data may be outdated. Do NOT rely on it for facts about consensus mechanisms, proof systems, protocol versions, or network upgrades. Use ONLY the provided documentation.
d) If the provided documentation does not contain enough factual content to generate a question with 4 verifiable answer options, skip that topic entirely. Do not guess.
e) Every answer option must be traceable to a specific sentence in the provided documentation. If you cannot trace it, do not include it.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 1.0,
        max_tokens: 2048,
        seed: Date.now() + Math.floor(Math.random() * 100000) + attempt,
      }, {
        timeout: 25_000,
      })

      const text = completion.choices[0]?.message?.content ?? ""
      const cleaned = text.replace(/<[^>]*>/g, "").replace(/```json|```/g, "").trim()
      return cleaned
    } catch (err) {
      lastError = err
      console.warn(`[generate-quiz] Groq attempt ${attempt} failed:`, err)
      if (attempt < GROQ_RETRY_COUNT) {
        const backoff = GROQ_INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1)
        await sleep(backoff)
      }
    }
  }

  throw lastError || new Error("Failed to generate quiz with Groq after retries")
}

async function handleGenerateQuiz(
  request: Request,
  selectedChainId: number | null,
  headers: Record<string, string>,
): Promise<NextResponse> {
  const requestChainId = selectedChainId ?? NaN

  // --- Strict Ecosystem Mapping ---
  const ecosystemConfigs: Record<number, { name: "Ink" | "Soneium" | "Base" | "Unichain" | "MegaETH" | "LitVM" | "Arc Testnet"; docs: string[] | readonly string[] }> = {
    [BASE_CHAIN_ID]: { name: "Base", docs: BASE_DOCS_PAGES },
    [UNICHAIN_CHAIN_ID]: { name: "Unichain", docs: UNICHAIN_DOCS_PAGES },
    [1868]: { name: "Soneium", docs: SONEIUM_DOCS_PAGES },
    [4326]: { name: "MegaETH", docs: MEGAETH_DOCS_PAGES },
    [4441]: { name: "LitVM", docs: LITVM_DOCS_PAGES },
    [5042002]: { name: "Arc Testnet", docs: ARC_DOCS_PAGES },
  }

  // Handle Ink IDs specifically since it's a Set
  const isInk = INK_CHAIN_IDS.has(requestChainId)
  
  let config: { name: "Ink" | "Soneium" | "Base" | "Unichain" | "MegaETH" | "LitVM" | "Arc Testnet"; docs: string[] | readonly string[] } | undefined

  config = isInk 
    ? { name: "Ink" as const, docs: INK_DOCS_PAGES } 
    : ecosystemConfigs[requestChainId]

  if (!config) {
    return NextResponse.json(
      { error: `Invalid or unsupported chainId (${requestChainId}).` },
      { status: 400, headers }
    )
  }

  const { name: ecosystemName, docs: docsPages } = config

  try {
    if (docsPages.length < 3) {
      const label = `${ecosystemName.toUpperCase()}_DOCS_PAGES`
      return NextResponse.json(
        { error: `${label} must contain at least 3 URLs.` },
        { status: 500, headers },
      )
    }

    const picked = fisherYatesPick(docsPages, MAX_URLS_TO_TRY)

    let scrapeResults = await Promise.all(
      picked.map(async (sourceUrl) => {
        try {
          const text = await fetchViaJinaReader(sourceUrl)
          if (text.length >= MIN_URL_TEXT_CHARS && isValidContent(text)) {
            return `--- Source: ${sourceUrl} ---\n${text}`
          }
        } catch {
          /* skip failed url and continue */
        }
        return null
      })
    )

    let chunks = scrapeResults.filter((c): c is string => c !== null)
    let concatenated = chunks.join("\n\n")
    let scrapedText = trimCorpus(concatenated, TARGET_CHARS)

    if (scrapedText.length < MIN_COMBINED_CHARS) {
      console.warn(`[generate-quiz] Low scrape yield (${scrapedText.length} chars), retrying remaining URLs for ${ecosystemName}`)
      const pickedSet = new Set(picked)
      const remaining = docsPages.filter(u => !pickedSet.has(u))
      if (remaining.length > 0) {
        const retryResults = await Promise.all(
          remaining.map(async (sourceUrl) => {
            try {
              const text = await fetchViaJinaReader(sourceUrl)
              if (text.length >= MIN_URL_TEXT_CHARS && isValidContent(text)) {
                return `--- Source: ${sourceUrl} ---\n${text}`
              }
            } catch {
              /* skip failed url */
            }
            return null
          })
        )
        const retryChunks = retryResults.filter((c): c is string => c !== null)
        chunks = [...chunks, ...retryChunks]
        concatenated = chunks.join("\n\n")
        scrapedText = trimCorpus(concatenated, TARGET_CHARS)
      }
    }

    if (scrapedText.length < MIN_URL_TEXT_CHARS) {
      console.error(`[generate-quiz] FALLBACK TRIGGERED reason=scrape_insufficient chain=${ecosystemName} chars=${scrapedText.length}`)
      return await buildQuizResponse(
        selectedChainId,
        getFallbackQuestions(ecosystemName),
        [],
        true,
        headers,
        ecosystemName,
      )
    }

    const [topicAngle] = fisherYatesPick([...TOPIC_ANGLES], 1)

    const prompt = `
Generate exactly 5 high-quality multiple choice questions based ONLY on the documentation below for ${ecosystemName}.

HARD RULES (these override all other instructions):
- Your training data may be outdated. Answer ONLY from facts explicitly stated in the documentation below.
- NEVER infer technical properties from token names, chain names, currency symbols, or naming conventions.
- Every answer option must be traceable to a specific sentence in the provided documentation.
- If the documentation lacks enough content for 4 verifiable answer options, skip that topic.

STRICT RULES:
- Focus on this topic area: ${topicAngle}
- Test real blockchain concepts, technical knowledge, or ecosystem understanding
- NEVER ask about URLs, page accessibility, 404 errors, or whether a webpage exists
- NEVER ask about documentation structure or navigation
- Questions should test: how things work technically, what concepts mean, why decisions were made, what values/parameters are used
- Mix difficulty: 2 easy, 2 medium, 1 hard
- Each wrong answer must be plausible — not obviously wrong
- Return ONLY valid JSON array, no markdown, no backticks

CRITICAL RULES FOR ANSWER OPTIONS:
- Every answer option (correct AND incorrect) must relate ONLY to the ${ecosystemName} ecosystem
- Do NOT mention, reference, or allude to any other blockchain, chain, or network in any answer option. This includes but is not limited to: Soneium, Ink, Base, Unichain, MegaETH, LitVM, Ethereum mainnet, Polygon, Arbitrum, Optimism, Solana
- Incorrect answer options must be plausible wrong answers about ${ecosystemName} specifically (e.g. wrong numbers, wrong names within the same ecosystem, wrong technical details) NOT answers about a completely different blockchain
- If you cannot generate 3 plausible wrong answers using only ${ecosystemName} knowledge, use variations of the correct answer (e.g. wrong values, inverted facts, close-but-wrong technical details) rather than importing facts from other chains

Good examples:
- 'What consensus mechanism does Soneium use?'
- 'What is the Chain ID of Ink mainnet?'
- 'Which standard does Ink use for account abstraction?'

Bad examples — NEVER generate:
- 'What happens when you access this URL?'
- 'What is the result of visiting the documentation page?'

Format:
[{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0}]

Documentation:
${scrapedText}
`.trim()

    let items: z.infer<typeof quizItemSchema>[] | null = null;
    let lastValid: z.infer<typeof quizItemSchema>[] | null = null;
    
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        let raw = await generateWithGroq(prompt, topicAngle)
        let parsed = parseModelJson(raw)
        let candidateItems = validateQuestions(toValidatedQuizArray(parsed))
        
        let validQuestions = candidateItems.filter(q => isValidQuestion(q) && !hasContaminatedOptions(q, ecosystemName));
        if (validQuestions.length >= 3) {
          lastValid = validQuestions;
        }
        if (validQuestions.length < 5) {
          throw new Error(`Generated questions failed quality check, retrying`);
        }

        const history = questionHistoryCache.get(ecosystemName) || []
        const newNormalized = validQuestions.map(q => normalizeQuestion(q.question))
        const overlap = newNormalized.filter(nq => history.includes(nq)).length
        if (overlap >= 4) {
          console.warn(`[generate-quiz] High overlap (${overlap}) for ${ecosystemName}, accepting anyway`)
          // Accept the set despite overlap rather than serving hardcoded fallback
        }

        items = validQuestions;
        break; // Success
      } catch (err) {
        console.warn(`[generate-quiz] Attempt ${attempt} failed:`, err);
      }
    }

    if (!items && lastValid) {
      console.warn(`[generate-quiz] Using partial set of ${lastValid.length} valid questions for ${ecosystemName} after failed attempts`)
      items = lastValid;
    }

    if (!items) {
      console.error(`[generate-quiz] FALLBACK TRIGGERED reason=groq_quality_fail chain=${ecosystemName}`)
      return await buildQuizResponse(
        selectedChainId,
        getFallbackQuestions(ecosystemName),
        picked,
        true,
        headers,
        ecosystemName,
      )
    }

    const cached = questionHistoryCache.get(ecosystemName) || []
    const newQuestions = items.map(q => normalizeQuestion(q.question))
    questionHistoryCache.set(ecosystemName, [...cached, ...newQuestions].slice(-MAX_CACHE_PER_ECOSYSTEM))

    const shuffled = fisherYatesShuffle(items)
    return await buildQuizResponse(
      selectedChainId,
      shuffled,
      picked,
      false,
      headers,
      ecosystemName,
    )
  } catch (err) {
    console.error("[generate-quiz]", err)
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("GROQ_API_KEY is missing")) {
      return NextResponse.json({ error: msg }, { status: 500, headers })
    }
    return await buildQuizResponse(
      selectedChainId,
      getFallbackQuestions(ecosystemName),
      [],
      true,
      headers,
      ecosystemName,
    )
  }
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
    return await handleGenerateQuiz(request, selectedChainId, headers)
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
    return await handleGenerateQuiz(request, selectedChainId, headers)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request."
    return NextResponse.json({ error: message }, { status: 400, headers })
  }
}
