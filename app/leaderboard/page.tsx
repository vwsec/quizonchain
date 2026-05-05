import { Metadata } from 'next'
import LeaderboardContent from './LeaderboardContent'

export const metadata: Metadata = {
  title: 'Quiz On Chain',
  description: 'Learn blockchain. Prove it on-chain. AI-generated quiz questions across multiple L2 networks. Submit your score on-chain and climb the global leaderboard.',
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

export default function LeaderboardPage() {
  return <LeaderboardContent />
}
