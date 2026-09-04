"use client"

import { useState, useEffect } from "react"
import { MessageSquarePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { FeedbackModal } from "@/components/feedback-modal"
import { useActiveChain } from "@/hooks/use-active-chain"
import { useQuizFlowActive } from "@/components/quiz-flow-context"

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useActiveChain()
  const isQuizFlowActive = useQuizFlowActive()

  useEffect(() => {
    setMounted(true)
  }, [])

  const themed = mounted && isConnected

  // Hide during quiz flow (quiz screen + results screen) to avoid FAB collision
  if (isQuizFlowActive) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-lg transition-colors duration-200 cursor-pointer sm:px-5",
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]",
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