"use client"

import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { getTxInternalUrl } from "@/lib/chains"
import { Loader2, XCircle, ExternalLink, CheckCircle } from "lucide-react"

export type TransactionState = "idle" | "pending" | "confirmed" | "failed"

interface TransactionStatusProps {
  state: TransactionState
  txHash?: string
  /** When set, the explorer link uses the correct chain explorer URL. */
  chainId?: number
  /** Shown under "Failed" when a transaction or preflight step errors. */
  errorMessage?: string
}

export function TransactionStatus({
  state,
  txHash,
  chainId,
  errorMessage,
}: TransactionStatusProps) {
  const router = useRouter()
  if (state === "idle") return null

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300",
        state === "failed" ? "items-start" : "items-center",
        state === "pending" && "border-primary/50 bg-primary/10",
        state === "confirmed" && "border-success/50 bg-success/10",
        state === "failed" && "border-destructive/50 bg-destructive/10"
      )}
    >
      {state === "pending" && (
        <>
          <Loader2 className="size-5 text-primary animate-spin" />
          <span className="text-sm font-medium text-foreground">
            Pending…
          </span>
          {txHash ? (
            <span className="ml-auto flex items-center gap-1 text-sm text-muted-foreground/30 cursor-default select-none">
              View
              <ExternalLink className="size-3" />
            </span>
          ) : null}
        </>
      )}
      {state === "confirmed" && (
        <>
          <CheckCircle className="size-5 text-success" />
          <span className="text-sm font-medium text-foreground">
            Confirmed
          </span>
          <button
            onClick={() => {
              if (txHash && chainId) {
                router.push(getTxInternalUrl(chainId, txHash))
              }
            }}
            className="ml-auto flex items-center gap-1 text-sm text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
          >
            View
            <ExternalLink className="size-3" />
          </button>
        </>
      )}
      {state === "failed" && (
        <>
          <XCircle className="size-5 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1 space-y-1 text-left">
            <span className="text-sm font-medium text-foreground">
              Failed
            </span>
            {errorMessage ? (
              <p className="text-xs text-muted-foreground break-words">
                {errorMessage}
              </p>
            ) : null}
          </div>
          {txHash && chainId ? (
            <button
              onClick={() => router.push(getTxInternalUrl(chainId, txHash))}
              className="ml-auto flex items-center gap-1 text-sm text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              View
              <ExternalLink className="size-3" />
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}
