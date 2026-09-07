import { Metadata } from 'next'

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
  },
};

import { Web3Lazy } from '@/components/web3-lazy'

export default function Page() {
  return <Web3Lazy />
}
