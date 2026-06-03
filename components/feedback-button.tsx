"use client"

import { useState, useEffect } from "react"
import { MessageSquarePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { FeedbackModal } from "@/components/feedback-modal"
import { useActiveChain } from "@/hooks/use-active-chain"

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useActiveChain()

  useEffect(() => {
    setMounted(true)
  }, [])

  const themed = mounted && isConnected

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-lg transition-all active:scale-95 sm:px-5 sm:py-3",
          themed
            ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:shadow-[0_0_20px_var(--primary)]"
            : "bg-white text-black hover:bg-gray-200",
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
