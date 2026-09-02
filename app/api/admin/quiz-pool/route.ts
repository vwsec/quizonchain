import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getSession } from "@/lib/admin-session"

const ALLOWED_FILES = [
  "quizzes-litvm.json",
  "quizzes-base.json",
  "quizzes-ink.json",
  "quizzes-unichain.json",
  "quizzes-soneium.json",
  "quizzes-megaeth.json",
  "quizzes-arc.json",
]

export async function GET(request: Request) {
  if (!(await getSession(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const file = searchParams.get("file")

  if (!file || !ALLOWED_FILES.includes(file)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 })
  }

  try {
    const filePath = path.join(process.cwd(), "data", file)
    const raw = fs.readFileSync(filePath, "utf-8")
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Pool file not found" }, { status: 404 })
  }
}
