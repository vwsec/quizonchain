"use server"

import { NextResponse } from "next/server"
import { getSession } from "@/lib/admin-session"

export async function POST(request: Request) {
  try {
    if (!(await getSession(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message } = await request.json()
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 })
    }

    const TWITTER_POST_URL = process.env.TWITTER_POST_URL
    if (!TWITTER_POST_URL) {
      return NextResponse.json({ error: "Twitter posting not configured" }, { status: 500 })
    }

    const response = await fetch(TWITTER_POST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error: `Twitter failed: ${error}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, tweetId: data.id || data.data?.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
