export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { z } from "zod"
import {
  encodeAbiParameters,
  isAddress,
  keccak256,
  toBytes,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { jwtVerify } from "jose"

const rateLimit = new Map<string, { count: number; resetTime: number }>()
const playerRateLimit = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimit.get(ip)
  if (limit && now < limit.resetTime) {
    if (limit.count >= 2) return false
    limit.count++
  } else {
    rateLimit.set(ip, { count: 1, resetTime: now + 60_000 })
  }
  return true
}

function checkPlayerRateLimit(playerAddress: string): boolean {
  const now = Date.now()
  const limit = playerRateLimit.get(playerAddress)
  if (limit && now < limit.resetTime) {
    if (limit.count >= 2) return false
    limit.count++
  } else {
    playerRateLimit.set(playerAddress, { count: 1, resetTime: now + 60_000 })
  }
  return true
}

const quizJwtSecret = process.env.QUIZ_JWT_SECRET

const bodySchema = z.object({
  playerAddress: z.string(),
  score: z.number().int().min(0).max(255),
  total: z.number().int().min(1).max(20),
  nonce: z.number().int(),
  chainId: z.number().int(),
  contractAddress: z.string(),
  quizToken: z.string().optional(), // Token from /api/generate-quiz
  answers: z.array(z.number().int().min(0).max(3)).optional(), // User's answers
})

function getSignerPrivateKey(): `0x${string}` {
  const raw = (process.env.QUIZ_SIGNER_PRIVATE_KEY || process.env.SIGNER_PRIVATE_KEY)?.trim()
  if (!raw) {
    throw new Error("QUIZ_SIGNER_PRIVATE_KEY or SIGNER_PRIVATE_KEY is missing on the server.")
  }
  const prefixed = raw.startsWith("0x") ? raw : `0x${raw}`
  if (!/^0x[0-9a-fA-F]{64}$/.test(prefixed)) {
    throw new Error("QUIZ_SIGNER_PRIVATE_KEY must be a 32-byte hex private key.")
  }
  return prefixed as `0x${string}`
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "quizonchain.app"
  console.log("ORIGIN:", request.headers.get("origin"));
  console.log("REFERER:", request.headers.get("referer"));
  console.log("APP_DOMAIN:", process.env.NEXT_PUBLIC_APP_DOMAIN);
  if (
    (origin && !(origin === `https://${appDomain}` || origin === `https://www.${appDomain}`)) ||
    (referer && !(referer === `https://${appDomain}` || referer === `https://www.${appDomain}`))
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  if (!quizJwtSecret) {
    return NextResponse.json(
      { error: "Server configuration error: QUIZ_JWT_SECRET is not set" },
      { status: 500 },
    )
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { playerAddress, score: clientScore, total, nonce, chainId, contractAddress, quizToken, answers } = parsed.data
  if (!checkPlayerRateLimit(playerAddress)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }
  if (!isAddress(playerAddress)) {
    return NextResponse.json({ error: "Invalid player address" }, { status: 400 })
  }
  if (!isAddress(contractAddress)) {
    return NextResponse.json({ error: "Invalid contract address" }, { status: 400 })
  }
  if (clientScore > total) {
    return NextResponse.json({ error: "Score cannot exceed total" }, { status: 400 })
  }

  // --- SERVER-SIDE SCORE VERIFICATION ---
  let finalScore = clientScore
  if (quizToken && answers) {
    try {
      const secret = new TextEncoder().encode(quizJwtSecret)
      const { payload } = await jwtVerify(quizToken, secret)
      const quizPayload = payload as { answers: number[], type: string }
      
      if (quizPayload.type !== "quiz-answers") {
        return NextResponse.json({ error: "Invalid quiz token type" }, { status: 400 })
      }

      // Re-calculate score on the server
      const serverCalculatedScore = answers.reduce((acc, ans, idx) => {
        return acc + (ans === quizPayload.answers[idx] ? 1 : 0)
      }, 0)

      if (serverCalculatedScore !== clientScore) {
        console.warn(`[Security] Score mismatch for ${playerAddress}: client said ${clientScore}, server calculated ${serverCalculatedScore}`)
        return NextResponse.json({ error: "Score verification failed. Please don't tamper with the results." }, { status: 403 })
      }
      finalScore = serverCalculatedScore
    } catch (err) {
      console.error("Quiz token verification failed:", err)
      return NextResponse.json({ error: "Invalid or expired quiz token" }, { status: 400 })
    }
  } else if (process.env.NODE_ENV === "production") {
    // In production, we REQUIRE the quizToken for verification
    return NextResponse.json({ error: "Security check failed: missing quiz token" }, { status: 403 })
  }

  try {
    const account = privateKeyToAccount(getSignerPrivateKey())

    // Must use encodeAbiParameters to match abi.encode (padded, not packed)
    const encoded = encodeAbiParameters(
      [
        { type: "address" },
        { type: "uint8" },
        { type: "uint8" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "address" },
      ],
      [
        playerAddress as `0x${string}`, 
        finalScore, 
        total, 
        BigInt(nonce), 
        BigInt(chainId), 
        contractAddress as `0x${string}`
      ]
    )

    const digest = keccak256(encoded)

    // toEthSignedMessageHash adds the Ethereum prefix '\x19Ethereum Signed Message:\n32'
    const signature = await account.signMessage({
      message: { raw: toBytes(digest) }
    })

    return NextResponse.json({
      signature,
      trustedSigner: account.address,
    })
  } catch (err) {
    console.error("Signature generation error:", err)
    const message = err instanceof Error ? err.message : "Failed to sign score."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

