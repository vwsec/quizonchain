'use client'

// Client wrapper so HomeContent (which statically imports wagmi) loads in
// the gate's lazy graph instead of the initial payload. The Web3Gate shell
// covers first paint.
import dynamic from 'next/dynamic'

const HomeContent = dynamic(() => import('@/app/HomeContent'), { ssr: false })

export function Web3Lazy() {
  return <HomeContent />
}
