'use client'

// Web3Gate: the LCP fix.
//
// Every layout child (Header, WalletProvider, HomeContent, …) calls wagmi
// hooks, so the page paints NOTHING until the wagmi/RainbowKit/viem bundle
// is downloaded and hydrated. This gate shows a branded loading screen with
// a REAL progress counter (tracks the lazy chunk's resource loads via
// PerformanceObserver, like donprod.uk), then mounts the real app.
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// Module-level flag: survives component re-mounts, resets only on full page reload.
// Shows the branded splash on FIRST load only; re-mounts (nav transitions,
// Fast Refresh, React 19 re-renders) get null fallback.
let chromeHasLoadedOnce = false

// Lazy chunk: only the heavy UI chrome (Header, ThemeBackground, FeedbackButton, etc.)
// wagmi/RainbowKit/viem + all connector SDKs stay out of the initial JS payload.
const AppChrome = dynamic(() =>
  import('@/components/app-chrome').then((mod) => {
    // Flip flag once the chunk resolves so subsequent re-mounts skip the splash.
    chromeHasLoadedOnce = true
    return mod
  }),
{
  ssr: false,
  loading: () => (chromeHasLoadedOnce ? null : <Splash />),
})

function Splash() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    // Track script/fetch resources belonging to the lazy web3 chunk.
    // ponytail: progress = count of finished chunk requests vs observed total;
    // if the browser gives no entries fast, crawl to 90% so it never looks stuck.
    let done = 0
    const seen = new Set<string>()
    const bump = () => {
      done++
      setPct((p) => Math.max(p, Math.min(99, Math.round((done / Math.max(seen.size, 6)) * 100))))
    }
    const obs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const name = (e as PerformanceResourceTiming).name
        if (!name.includes('/_next/static/') || seen.has(name)) continue
        seen.add(name)
        if (e.duration > 0) bump()
      }
    })
    obs.observe({ type: 'resource', buffered: true })

    // Smooth crawl so the counter always moves; real events overtake it.
    const crawl = setInterval(() => setPct((p) => (p < 85 ? p + 1 : p)), 120)
    return () => {
      obs.disconnect()
      clearInterval(crawl)
    }
  }, [])

  return (
    <>
      <style>{`
        @keyframes qoc-breathe {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(255,255,255,0.15)); }
          50% { transform: scale(1.04); filter: drop-shadow(0 0 48px rgba(255,255,255,0.35)); }
        }
        @keyframes qoc-fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: '#000000', animation: 'qoc-fade-in .3s ease-out both' }}
        role="status"
        aria-label="Loading Quiz On Chain"
      >
        <div className="flex flex-col items-center gap-6">
          <img
            src="/logo.webp"
            alt=""
            width={130}
            height={130}
            decoding="sync"
            fetchPriority="high"
            style={{ borderRadius: '50%', animation: 'qoc-breathe 2s ease-in-out infinite' }}
          />
          {/* Percentage counter — monospace, like a terminal readout */}
          <span
            className="text-white tabular-nums"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 14,
              letterSpacing: '0.2em',
            }}
          >
            {pct}%
          </span>
        </div>

        {/* Top strip */}
        <div
          className="fixed top-4 left-4 right-4 flex items-center justify-between text-white/60 uppercase"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11, letterSpacing: '0.25em' }}
        >
          <span>Web3 Knowledge</span>
          <span className="hidden sm:inline">Quiz On Chain</span>
          <span>On-Chain</span>
        </div>

        {/* Bottom strip */}
        <div
          className="fixed bottom-4 left-4 right-4 flex items-center justify-between text-white/60 uppercase"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11, letterSpacing: '0.25em' }}
        >
          <span>
            Prove It <span style={{ color: '#fff' }}>On-Chain</span>
          </span>
          <span>@quizonchain</span>
        </div>
      </div>
    </>
  )
}

export function Web3Gate({ children }: { children: ReactNode }) {
  // No idle-delay gate: fetching the chunk starts at parse time, so the
  // splash below is only a brief dynamic-import fallback.
  return <AppChrome>{children}</AppChrome>
}
