"use client"

import { MessageSquare } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useChainUI } from "@/hooks/use-chain-ui"
import { cn } from "@/lib/utils"

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const FAQS = [
  {
    q: "My transaction failed — what should I do?",
    a: "Make sure you have enough ETH for gas on the selected network. Try switching to a different network or wait a few minutes and try again.",
  },
  {
    q: "I submitted my score but it does not show on the leaderboard",
    a: "The leaderboard refreshes every 30 seconds. Wait a moment and click the refresh button. If it still does not appear contact us on X.",
  },
  {
    q: "How do I claim my NFT?",
    a: "Reach 100 total points on any supported chain. The claim button will appear automatically on the home screen.",
  },
  {
    q: "Can I play on multiple chains?",
    a: "Yes. Each chain has its own leaderboard and NFT. You can play and submit scores on all chains independently.",
  },
  {
    q: "Is my score stored permanently?",
    a: "Yes. Scores submitted on-chain are stored permanently on the blockchain and cannot be deleted.",
  },
]

export default function SupportContent() {
  const ui = useChainUI()

  return (
    <main className={cn(ui.pageMain, ui.page, 'md:px-8')}>
      <div className="max-w-4xl mx-auto space-y-16">
        <div className="text-center space-y-4 animate-slide-up">
          <p className={ui.label}>{ui.labelPrefix}Help Center</p>
          <h1 className={ui.heading}>Support</h1>
          <p className={ui.subheading}>Need help? We are here for you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={cn(ui.cardStrong, 'p-8 space-y-6')}>
            <div className={cn(
              'w-12 h-12 flex items-center justify-center',
              ui.radiusSm,
              'bg-white/10 text-white',
            )}>
              <XIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className={cn('text-2xl font-bold mb-2', 'text-white')}>
                Twitter / X
              </h3>
              <p className={cn('leading-relaxed', ui.bodyMuted)}>
                Follow us and send a DM for quick support
              </p>
            </div>
            <a
              href="https://x.com/quizonchain"
              target="_blank"
              rel="noopener noreferrer"
              className={cn('inline-flex items-center justify-center w-full py-4 font-bold', ui.btnPrimary)}
            >
              Open X
            </a>
          </div>

          <div className={cn(ui.card, 'p-8 space-y-6 opacity-80')}>
            <div className={cn(
              'w-12 h-12 flex items-center justify-center',
              ui.radiusSm,
              ui.bodyMuted,
              'bg-white/5',
            )}>
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className={cn('text-2xl font-bold mb-2', 'text-white')}>
                Community
              </h3>
              <p className={cn('leading-relaxed', ui.bodyMuted)}>
                Join our Discord or Telegram for community help
              </p>
            </div>
            <button
              disabled
              className={cn('w-full py-4 font-bold cursor-not-allowed opacity-50', ui.btnOutline)}
            >
              Coming Soon
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className={cn('text-3xl font-bold', ui.accentClass)}>Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className={cn('border px-6 py-2 transition-colors duration-200', ui.card)}
              >
                <AccordionTrigger className={cn(
                  'hover:no-underline font-semibold text-left cursor-pointer',
                  'text-white',
                )}>
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className={cn('text-base leading-relaxed pb-6', ui.bodyMuted)}>
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </main>
  )
}
