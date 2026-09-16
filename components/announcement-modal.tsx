"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useChainUI } from "@/hooks/use-chain-ui"
import { useActiveChain } from "@/hooks/use-active-chain"

const ANNOUNCEMENT_LINK =
  "https://x.com/quizonchain/status/2100243782482448664?s=20"

const STORAGE_KEY = "announcement-dismissed"

export function AnnouncementModal() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useActiveChain()
  const ui = useChainUI()

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true)
      }
    } catch {}
    setMounted(true)
  }, [])

  const dismiss = useCallback(() => {
    setOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {}
  }, [])

  if (!mounted) return null

  const themed = isConnected

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent
        className={cn(
          "sm:max-w-md border-t-2",
          themed ? "border-t-[var(--primary)]" : "border-t-white/20",
        )}
      >
        <DialogTitle className="sr-only">Arc Mainnet is live</DialogTitle>
        <div className="flex flex-col items-center gap-5 text-center">
          <img
            src="/announcement-arc.png"
            alt="Arc"
            className="w-full max-w-[280px] rounded-xl object-contain"
          />

          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
            {">> "}ARC MAINNET IS LIVE
          </p>

          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            Arc Mainnet is live. You can now answer questions, submit your score
            on @arc Mainnet, and mint an NFT when you hit 100 points.
          </p>

          <Button
            asChild
            className={cn(
              "bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500",
              "font-semibold",
            )}
          >
            <a href={ANNOUNCEMENT_LINK} target="_blank" rel="noopener noreferrer">
              Learn More →
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
