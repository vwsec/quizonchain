import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://quizonchain.app',
  'https://www.quizonchain.app',
  'http://localhost:3000',
  'http://localhost:3100',
  'https://app.startale.com',
]

// Vercel assigns each deployment a random <project>-<hash>.vercel.app URL, so a
// fixed allowlist of preview names (quizonchain0/1/2) breaks every other preview.
// Allow any first-party Vercel deployment + the canonical domain instead.
function isFirstParty(origin: string): boolean {
  return (
    origin === 'https://quizonchain.app' ||
    origin === 'https://www.quizonchain.app' ||
    /https:\/\/quizonchain[a-z0-9-]*\.vercel\.app$/.test(origin) ||
    origin === 'http://localhost:3000' ||
    origin === 'http://localhost:3100'
  )
}

// common crawlers + AI-crawler wave (they send no Origin/Referer, so UA is the only cheap filter); expand if a real user reports being blocked
const BLOCKED_BOT_PATTERNS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'facebookexternalhit', 'twitterbot', 'rogerbot',
  'linkedinbot', 'embedly', 'quora link preview', 'showyoubot',
  'outbrain', 'pinterest', 'slackbot', 'vkshare', 'w3c_validator',
  'python-requests', 'python-urllib', 'go-http-client', 'curl',
  'wget', 'scrapy', 'semrush', 'ahrefsbot', 'dotbot', 'mj12bot',
  // AI crawlers + scrapers (2024-2026 wave)
  'gptbot', 'chatgpt-user', 'claudebot', 'anthropic-ai', 'perplexitybot',
  'bytespider', 'ccbot', 'amazonbot', 'meta-externalagent',
  'meta-externalfetcher', 'applebot', 'petalbot', 'cohere-ai', 'omgili',
  'imagesiftbot', 'seekrbot', 'youbot', 'dataforseo', 'zoominfobot',
  'diffbot', 'headlesschrome', 'phantomjs',
]


// Nonce-based CSP. Next.js applies the nonce to its inline scripts/styles when
// the x-nonce request header is set, so we can drop 'unsafe-inline'/'unsafe-eval'
// from script-src (Lighthouse flags both as ineffective CSP).
const cspWithNonce = (nonce: string) => `
  default-src 'self';
  script-src 'self' 'strict-dynamic' 'nonce-${nonce}' https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.walletconnect.com https://*.walletconnect.org;
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self' http://localhost:3100 https://app.startale.com;
  connect-src 'self' blob: data:
    https://*.walletconnect.com
    https://*.walletconnect.org
    https://*.coinbase.com
    https://*.walletlink.org
    wss://*.walletlink.org
    https://rpc-gel.inkonchain.com
    https://rpc.soneium.org
    https://mainnet.base.org
    https://mainnet.unichain.org
    https://mainnet.megaeth.com
    https://soneium.blockscout.com
    https://explorer.inkonchain.com
    https://base.blockscout.com
    https://unichain.blockscout.com
    https://megaeth.blockscout.com
    https://carrot.megaeth.com
    https://www.megaexplorer.xyz
    https://liteforge.explorer.caldera.xyz
    https://liteforge.rpc.caldera.xyz
    wss://liteforge.rpc.caldera.xyz
    https://testnet.arcscan.app
    https://rpc.testnet.arc.network
    wss://rpc.testnet.arc.network
    https://rpc.blockdaemon.testnet.arc.network
    https://rpc.drpc.testnet.arc.network
    https://rpc.quicknode.testnet.arc.network
    https://eth-sepolia.blockscout.com
    wss://eth-sepolia.blockscout.com
    https://ethereum-sepolia-rpc.publicnode.com
    https://rpc2.sepolia.org
    https://rpc.sepolia.org;
  block-all-mixed-content;
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim()

function makeNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return hex
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes: bot + origin protection (unchanged behavior)
  if (pathname.startsWith('/api')) {
    const ua = (request.headers.get('user-agent') ?? '').toLowerCase()
    for (const pattern of BLOCKED_BOT_PATTERNS) {
      if (ua.includes(pattern)) {
        return new NextResponse(null, { status: 444 })
      }
    }

    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')

    if (origin && !isFirstParty(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (referer) {
      try {
        const refOrigin = new URL(referer).origin
        if (!isFirstParty(refOrigin)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      } catch {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.next()
  }

  // Page routes: strict nonce-based CSP in production; dev needs eval for HMR/source maps
  if (process.env.NODE_ENV === 'production') {
    const nonce = makeNonce()
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Content-Security-Policy', cspWithNonce(nonce))
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
