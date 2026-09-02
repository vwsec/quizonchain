import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import ExplorerContent from './ExplorerContent'

// static prerender bakes inline RSC scripts without the CSP nonce; force-dynamic lets middleware attach it
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Quiz On Chain',
  description: 'Learn blockchain. Prove it on-chain. Questions sourced from official documentation across multiple L2 networks. Submit your score on-chain and climb the global leaderboard.',
  openGraph: {
    title: 'Quiz On Chain',
    description: 'Learn blockchain. Prove it on-chain.',
    siteName: 'Quiz On Chain',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quiz On Chain',
    description: 'Learn blockchain. Prove it on-chain.',
    site: '@quizonchain',
  },
};

export default function ExplorerPage() {
  return <ExplorerContent />
}
