import type { Metadata } from 'next'
import { Orbitron, Exo_2, Rajdhani, Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { Suspense } from 'react'
import { Providers } from './providers'
import { Web3Gate } from '@/components/web3-gate'
import { WalletProvider } from '@/components/wallet-provider'
import './globals.css'

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });
const exo2 = Exo_2({ subsets: ['latin'], variable: '--font-exo2' });
const rajdhani = Rajdhani({ subsets: ['latin'], variable: '--font-rajdhani', preload: false, weight: ['400', '500', '600', '700'] });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', preload: false });

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
  other: {
    // Base domain-ownership + builder-code attribution. Always emitted so
    // base.dev verification + Builder Code program work regardless of
    // NEXT_PUBLIC_ACTIVE_CHAIN. Harmless metadata on non-Base deployments.
    'base:app_id': '69fcb1ba5f11a2d419d3021c',
    'base:builder_code': 'bc_oreav9tv',
    'fc:miniapp': JSON.stringify({
      "version": "1",
      "imageUrl": "https://quizonchain.app/logo.png",
      "button": {
        "title": "Play Quiz On Chain",
        "action": {
          "type": "launch_miniapp",
          "url": "https://quizonchain.app",
          "name": "Quiz On Chain",
          "splashImageUrl": "https://quizonchain.app/logo.png",
          "splashBackgroundColor": "#000000"
        }
      }
    }),
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`theme-default ${orbitron.variable} ${exo2.variable} ${rajdhani.variable} ${outfit.variable}`} style={{ backgroundColor: '#000000' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preload" as="image" href="/logo.webp" fetchPriority="high" />
      </head>
      <body className="font-body antialiased safe-top safe-bottom min-h-dvh">
        <Providers>
          <WalletProvider>
            <Web3Gate>
              <Suspense fallback={null}>{children}</Suspense>
            </Web3Gate>
          </WalletProvider>
        </Providers>
        <Toaster theme="dark" position="top-right" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
