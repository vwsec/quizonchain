"use client"

import { useState } from "react"
import { MessageSquarePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { FeedbackModal } from "@/components/feedback-modal"
import { useChainUI } from "@/hooks/use-chain-ui"
import { useQuizFlowActive } from "@/components/quiz-flow-context"

// Dark text on light accents, white text on dark accents (mirrors profile CTA contrast)
const LIGHT_ACCENTS = new Set(['default', 'megaeth', 'litvm', 'soneium', 'sepolia'])

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const ui = useChainUI()
  const isQuizFlowActive = useQuizFlowActive()

  // Hide during quiz flow (quiz screen + results screen) to avoid FAB collision
  if (isQuizFlowActive) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-lg transition-all duration-200 cursor-pointer sm:px-5 hover:opacity-90",
          "bg-[var(--chain-accent)] hover:shadow-[0_0_20px_var(--chain-accent)]",
          LIGHT_ACCENTS.has(ui.key) ? "text-[#0B0B0F]" : "text-white",
        )}
        aria-label="Give Feedback"
      >
        <MessageSquarePlus className="size-5 shrink-0" />
        <span className="hidden sm:inline">Feedback</span>
      </button>
      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  )
}