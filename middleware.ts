import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "quizonchain.app"
  const normalize = (s: string) => s.replace(/\/$/, "");
  if (origin) {
    const isAllowed =
      normalize(origin) === `https://${appDomain}` ||
      normalize(origin) === `https://www.${appDomain}`;
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  if (referer) {
    const isAllowed =
      normalize(referer) === `https://${appDomain}` ||
      normalize(referer) === `https://www.${appDomain}`;
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/sign-score', '/api/telegram'],
}
