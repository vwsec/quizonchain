import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

import { activeChainConfig, isMultiChain } from '@/lib/active-chain-config'
import { ThemeBackground } from '@/components/theme-background'

const title = isMultiChain
  ? 'Quiz On Chain'
  : `Quiz On Chain — ${activeChainConfig.name}`

const description = isMultiChain
  ? 'Learn blockchain. Prove it on-chain. Questions sourced from official documentation across multiple L2 networks. Submit your score on-chain and climb the global leaderboard.'
  : `Test your ${activeChainConfig.name} blockchain knowledge. Prove it on-chain.`

export const metadata: Metadata = {
  title,
  description,
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
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isMegaEth = activeChainConfig.name === 'MegaETH'
  const isInk = activeChainConfig.name === 'Ink'
  const isUnichain = activeChainConfig.name === 'Unichain'
  const isBase = activeChainConfig.name === 'Base'

  return (
    <html lang="en" className={isMegaEth ? 'theme-megaeth' : isInk ? 'theme-ink' : isUnichain ? 'theme-unichain' : isBase ? 'theme-base' : ''}>
      <body className="font-sans antialiased">
        <Providers>
          <ThemeBackground />
          {children}
        </Providers>
        <Toaster theme="dark" position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
