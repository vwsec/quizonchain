'use client'

// The full web3 app chrome. Everything here depends on wagmi context, so it
// all lives behind the gate and loads as one lazy chunk.
import { Providers } from '@/app/providers'
import { WalletProvider } from '@/components/wallet-provider'
import { ThemeUpdater } from '@/components/theme-updater'
import { ThemeBackground } from '@/components/theme-background'
import { Header } from '@/components/header'
import { FeedbackButton } from '@/components/feedback-button'
import { QuizFlowProvider } from '@/components/quiz-flow-context'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ThemeUpdater />
      <WalletProvider>
        <QuizFlowProvider>
          <ThemeBackground />
          <Header />
          <main className="safe-x pb-safe-bottom">{children}</main>
          <FeedbackButton />
        </QuizFlowProvider>
      </WalletProvider>
    </Providers>
  )
}
