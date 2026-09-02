import { NextResponse } from "next/server"
import { createSession, makeSessionCookie, getSession } from "@/lib/admin-session"

// ponytail: in-memory rate limit, per-instance only; swap for Upstash if login abuse shows up across instances
const loginAttempts = new Map<string, { count: number; resetTime: number }>()

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = loginAttempts.get(ip)
  if (limit && now < limit.resetTime) {
    if (limit.count >= 5) return false
    limit.count++
  } else {
    loginAttempts.set(ip, { count: 1, resetTime: now + 300_000 })
  }
  return true
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.json({ error: "ADMIN_PASSWORD is not set. Configure it in your environment variables." }, { status: 500 })
  }

  let body: { password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (body.password !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = await createSession()
  return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": makeSessionCookie(token) } })
}

export async function GET(request: Request) {
  const authed = await getSession(request)
  return NextResponse.json({ authed })
}
