export const dynamic = 'force-dynamic'
import { jwtVerify } from "jose"
import { NextResponse } from "next/server"
import { z } from "zod"

const verifySchema = z.object({
  quizToken: z.string().min(1),
  answers: z.array(z.number().int().min(0).max(3)).length(5),
})

const verifySecret = process.env.QUIZ_JWT_SECRET

type QuizTokenPayload = {
  answers: number[]
  chainId: number | null
  type: "quiz-answers"
}

export async function POST(request: Request) {
  if (!verifySecret) {
    return NextResponse.json(
      { error: "Server configuration error: QUIZ_JWT_SECRET is not set" },
      { status: 500 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 })
  }

  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  try {
    const secret = new TextEncoder().encode(verifySecret)
    const { payload } = await jwtVerify(parsed.data.quizToken, secret)
    const quizPayload = payload as unknown as QuizTokenPayload

    if (
      quizPayload.type !== "quiz-answers" ||
      !Array.isArray(quizPayload.answers) ||
      quizPayload.answers.length !== 5
    ) {
      return NextResponse.json({ error: "Invalid quiz token" }, { status: 400 })
    }

    const score = parsed.data.answers.reduce((acc, answer, idx) => {
      return acc + (answer === quizPayload.answers[idx] ? 1 : 0)
    }, 0)

    return NextResponse.json({ score })
  } catch {
    return NextResponse.json({ error: "Invalid or expired quiz token" }, { status: 400 })
  }
}

