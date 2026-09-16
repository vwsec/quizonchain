'use client'

// The full web3 app chrome (heavy UI only, no providers).
// wagmi/RainbowKit/viem are already provided by Providers in root layout.
import { ThemeUpdater } from '@/components/theme-updater'
import { ThemeBackground } from '@/components/theme-background'
import { Header } from '@/components/header'
import { FeedbackButton } from '@/components/feedback-button'
import { AnnouncementModal } from '@/components/announcement-modal'
import { QuizFlowProvider } from '@/components/quiz-flow-context'

export default function AppChrome({ children }: { children?: React.ReactNode }) {
  return (
    <QuizFlowProvider>
      <ThemeUpdater />
      <ThemeBackground />
      <Header />
      <main className="safe-x pb-safe-bottom">{children}</main>
      <FeedbackButton />
      <AnnouncementModal />
    </QuizFlowProvider>
  )
}