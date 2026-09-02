export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { z } from "zod"
import { isAddress } from "viem"
import { getEcosystem } from "@/lib/quiz-data"
import { incrementWalletProgress } from "@/lib/redis"

const advanceSchema = z.object({
  chainId: z.number().int().positive(),
  address: z.string().min(1),
})

export async function POST(request: Request) {
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

  const { chainId, address } = parsed.data

  if (!isAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 })
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
