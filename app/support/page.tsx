import { Metadata } from 'next'
import SupportContent from './SupportContent'

// static prerender bakes inline RSC scripts without the CSP nonce; force-dynamic lets middleware attach it
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Support — Quiz On Chain',
  description: 'Get help with Quiz On Chain. Contact us on X or GitHub.',
  openGraph: {
    title: 'Support — Quiz On Chain',
    description: 'Get help with Quiz On Chain. Contact us on X or GitHub.',
    siteName: 'Quiz On Chain',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Support — Quiz On Chain',
    description: 'Get help with Quiz On Chain. Contact us on X or GitHub.',
    site: '@quizonchain',
  },
};

export default function SupportPage() {
  return <SupportContent />
}
