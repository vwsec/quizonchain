import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://quizonchain.app',
  'https://www.quizonchain.app',
  'http://localhost:3000',
  'http://localhost:3100',
  'https://app.startale.com',
]

function isAllowed(value: string): boolean {
  return ALLOWED_ORIGINS.some((allowed) => value.replace(/\/$/, "") === allowed)
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (origin && !isAllowed(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (referer) {
    const refUrl = referer.replace(/\/$/, "")
    if (!isAllowed(refUrl)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/sign-score', '/api/telegram'],
}
