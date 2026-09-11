export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { z } from "zod"
import { isAddress } from "viem"
import { jwtVerify } from "jose"
import { getEcosystem } from "@/lib/quiz-data"
import { incrementWalletProgress } from "@/lib/redis"

const quizJwtSecret = process.env.QUIZ_JWT_SECRET

const advanceSchema = z.object({
  chainId: z.number().int().positive(),
  address: z.string().min(1),
  quizToken: z.string().min(1),
})

export async function POST(request: Request) {
  if (!quizJwtSecret) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 })
  }

  const parsed = advanceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { chainId, address, quizToken } = parsed.data

  if (!isAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 })
  }

  try {
    const secret = new TextEncoder().encode(quizJwtSecret)
    const { payload } = await jwtVerify(quizToken, secret)
    if (payload.type !== "quiz-answers") {
      return NextResponse.json({ error: "Invalid quiz token" }, { status: 403 })
    }
    const tokenAddress = (payload.address as string)?.toLowerCase()
    if (!tokenAddress || tokenAddress !== address.toLowerCase()) {
      return NextResponse.json({ error: "Address mismatch" }, { status: 403 })
    }
    if (payload.chainId != null && payload.chainId !== chainId) {
      return NextResponse.json({ error: "Chain mismatch" }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid or expired quiz token" }, { status: 403 })
  }

  const ecosystem = getEcosystem(chainId)
  if (!ecosystem) {
    return NextResponse.json({ error: "Unsupported chain" }, { status: 400 })
  }

  const ok = await incrementWalletProgress(ecosystem, address, 5)
  if (!ok) {
    return NextResponse.json({ error: "Failed to advance progress" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
