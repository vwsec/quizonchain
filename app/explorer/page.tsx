import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import ExplorerContent from './ExplorerContent'

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

const activeChain = process.env.NEXT_PUBLIC_ACTIVE_CHAIN;

export default function ExplorerPage() {
  if (activeChain) {
    redirect(`/explorer/${activeChain}`);
  }
  return <ExplorerContent />
}
