import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "quizonchain.app"
  if (
    (origin && !(origin === `https://${appDomain}` || origin === `https://www.${appDomain}`)) ||
    (referer && !(referer === `https://${appDomain}` || referer === `https://www.${appDomain}`))
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/sign-score', '/api/telegram'],
}
