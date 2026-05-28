import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

import { ThemeBackground } from '@/components/theme-background'

const CHAIN_TITLES: Record<string, string> = {
  ink: 'Quiz On Ink',
  soneium: 'Quiz On Soneium',
  base: 'Quiz On Base',
  unichain: 'Quiz On Unichain',
  megaeth: 'Quiz On MegaETH',
  litvm: 'Quiz On LitVM',
  arc: 'Quiz On Arc',
};

const CHAIN_DESCRIPTIONS: Record<string, string> = {
  ink: 'Test your Ink Onchain knowledge. Prove it on-chain.',
  soneium: 'Test your Soneium blockchain knowledge. Prove it on-chain.',
  base: 'Test your Base blockchain knowledge. Prove it on-chain.',
  unichain: 'Test your Unichain knowledge. Prove it on-chain.',
  megaeth: 'Test your MegaETH blockchain knowledge. Prove it on-chain.',
  litvm: 'Test your LitVM LiteForge knowledge. Prove it on-chain.',
  arc: 'Test your Arc blockchain knowledge. Prove it on-chain.',
};

const activeChain = process.env.NEXT_PUBLIC_ACTIVE_CHAIN ?? '';
const title = CHAIN_TITLES[activeChain] ?? 'Quiz On Chain';
const description = CHAIN_DESCRIPTIONS[activeChain] ?? 'Learn blockchain. Prove it on-chain. Questions sourced from official documentation across multiple L2 networks.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: title,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@quizonchain',
    title,
    description,
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  other: activeChain === 'base' ? {
    'base:app_id': '69fcb1ba5f11a2d419d3021c',
    'base:builder_code': 'bc_2tnkhocu',
  } : {},
}

import { Header } from '@/components/header'
import { WalletProvider } from '@/components/wallet-provider'
import { ThemeUpdater } from '@/components/theme-updater'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" style={{ backgroundColor: '#0f1117' }}>
      <body className="font-sans antialiased">
        <Providers>
          <ThemeUpdater />
          <WalletProvider>
            <ThemeBackground />
            <Header />
            {children}
          </WalletProvider>
        </Providers>
        <Toaster theme="dark" position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
