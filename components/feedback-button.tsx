"use client"

import { useState } from "react"
import { MessageSquarePlus } from "lucide-react"
import { FeedbackModal } from "@/components/feedback-modal"

export function FeedbackButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-3 text-sm font-medium text-[var(--primary-foreground)] shadow-lg transition-all hover:bg-[var(--primary)]/90 hover:shadow-[0_0_20px_var(--primary)] active:scale-95 sm:px-5 sm:py-3"
        aria-label="Give Feedback"
      >
        <MessageSquarePlus className="size-5 shrink-0" />
        <span className="hidden sm:inline">Feedback</span>
      </button>
      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  )
}
