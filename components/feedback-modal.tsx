"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { X, ImageUp, Loader2, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useActiveChain } from "@/hooks/use-active-chain"
import { useChainUI } from "@/hooks/use-chain-ui"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const MAX_FILES = 4
const MAX_TOTAL_SIZE = 20 * 1024 * 1024

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [telegramUsername, setTelegramUsername] = useState("")
  const [xUsername, setXUsername] = useState("")
  const [evmAddress, setEvmAddress] = useState("")
  const [feedbackText, setFeedbackText] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [telegramUsernameError, setTelegramUsernameError] = useState("")
  const [xUsernameError, setXUsernameError] = useState("")
  const [evmAddressError, setEvmAddressError] = useState("")
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useActiveChain()
  const ui = useChainUI()

  useEffect(() => {
    setMounted(true)
  }, [])

  const themed = mounted && isConnected
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setTelegramUsername("")
    setXUsername("")
    setEvmAddress("")
    setFeedbackText("")
    setImages([])
    setImagePreviews([])
    setError("")
    setSuccess(false)
    setSubmitting(false)
    setTelegramUsernameError("")
    setXUsernameError("")
    setEvmAddressError("")
  }, [])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        reset()
      }
      onOpenChange(next)
    },
    [onOpenChange, reset],
  )

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("")
      const selected = Array.from(e.target.files ?? [])
      if (selected.length === 0) return

      const invalid = selected.find((f) => !ALLOWED_TYPES.includes(f.type))
      if (invalid) {
        setError(`"${invalid.name}" is not a supported image type. Allowed: PNG, JPG, WEBP, GIF.`)
        return
      }

      const combined = [...images, ...selected]
      if (combined.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} images allowed.`)
        return
      }

      const totalSize = combined.reduce((sum, f) => sum + f.size, 0)
      if (totalSize > MAX_TOTAL_SIZE) {
        setError("Total image size must not exceed 20 MB.")
        return
      }

      setImages(combined)

      const newPreviews = [...imagePreviews]
      for (const file of selected) {
        newPreviews.push(URL.createObjectURL(file))
      }
      setImagePreviews(newPreviews)

      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [images, imagePreviews],
  )

  const removeImage = useCallback(
    (index: number) => {
      URL.revokeObjectURL(imagePreviews[index])
      setImages((prev) => prev.filter((_, i) => i !== index))
      setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    },
    [imagePreviews],
  )

  const validateTelegramUsername = (value: string): string => {
    const stripped = value.replace(/^@/, "")
    if (stripped && !/^[a-zA-Z0-9_]{5,32}$/.test(stripped)) {
      return "Telegram username must be 5–32 characters and contain only letters, numbers, and underscores"
    }
    return ""
  }

  const validateXUsername = (value: string): string => {
    const stripped = value.replace(/^@/, "")
    if (stripped && !/^[a-zA-Z0-9_]{1,15}$/.test(stripped)) {
      return "X username must be 1–15 characters and contain only letters, numbers, and underscores"
    }
    return ""
  }

  const validateEvmAddress = (value: string): string => {
    if (value && !/^0x[0-9a-fA-F]{40}$/.test(value)) {
      return "Please enter a valid EVM address (0x followed by 40 hex characters)"
    }
    return ""
  }

  const handleSubmit = useCallback(async () => {
    setError("")

    const tgErr = validateTelegramUsername(telegramUsername)
    const xErr = validateXUsername(xUsername)
    const evmErr = validateEvmAddress(evmAddress)
    setTelegramUsernameError(tgErr)
    setXUsernameError(xErr)
    setEvmAddressError(evmErr)
    if (tgErr || xErr || evmErr) return

    if (!telegramUsername.trim() && !xUsername.trim() && !evmAddress.trim()) {
      setError("Please provide at least one contact — we will not forget your feedback.")
      return
    }

    if (feedbackText.trim().length < 10) {
      setError("Feedback must be at least 10 characters long.")
      return
    }

    setSubmitting(true)

    try {
      const fd = new FormData()
      if (telegramUsername.trim()) fd.append("telegramUsername", telegramUsername.trim())
      if (xUsername.trim()) fd.append("xUsername", xUsername.trim())
      if (evmAddress.trim()) fd.append("evmAddress", evmAddress.trim())
      fd.append("feedbackText", feedbackText.trim())
      for (const file of images) {
        fd.append("images[]", file)
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        body: fd,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        setSubmitting(false)
        return
      }

      setSuccess(true)
      setSubmitting(false)

      setTimeout(() => {
        handleOpenChange(false)
      }, 2500)
    } catch {
      setError("Network error. Please check your connection and try again.")
      setSubmitting(false)
    }
  }, [telegramUsername, xUsername, evmAddress, feedbackText, images, handleOpenChange])

  const charsLeft = 2000 - feedbackText.length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("sm:max-w-md border-t-2", themed ? "border-t-[var(--primary)]" : "border-t-white/20")}>
        <DialogHeader>
          <DialogTitle className={cn(themed ? "bg-gradient-to-r from-[var(--hero-gradient-from)] to-[var(--hero-gradient-to)] bg-clip-text text-transparent" : "text-white")}>Give Feedback</DialogTitle>
          <DialogDescription>
            Help us improve — report bugs, suggest features, or share your thoughts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telegram-username">Telegram Username</Label>
            <Input
              id="telegram-username"
              placeholder="@username"
              value={telegramUsername}
              onChange={(e) => {
                setTelegramUsername(e.target.value)
                setTelegramUsernameError("")
              }}
              onBlur={() => setTelegramUsernameError(validateTelegramUsername(telegramUsername))}
              disabled={submitting || success}
            />
            {telegramUsernameError && (
              <p className="text-sm text-[var(--destructive)]">{telegramUsernameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="x-username">X (Twitter) Username</Label>
            <Input
              id="x-username"
              placeholder="@username"
              value={xUsername}
              onChange={(e) => {
                setXUsername(e.target.value)
                setXUsernameError("")
              }}
              onBlur={() => setXUsernameError(validateXUsername(xUsername))}
              disabled={submitting || success}
            />
            {xUsernameError && (
              <p className="text-sm text-[var(--destructive)]">{xUsernameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="evm-address">EVM Address</Label>
            <Input
              id="evm-address"
              placeholder="0x..."
              value={evmAddress}
              onChange={(e) => {
                setEvmAddress(e.target.value)
                setEvmAddressError("")
              }}
              onBlur={() => setEvmAddressError(validateEvmAddress(evmAddress))}
              disabled={submitting || success}
            />
            {evmAddressError && (
              <p className="text-sm text-[var(--destructive)]">{evmAddressError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-text">
              Feedback <span className="text-[var(--destructive)]">*</span>
            </Label>
            <Textarea
              id="feedback-text"
              placeholder="Describe your bug, suggestion, or feedback..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value.slice(0, 2000))}
              disabled={submitting || success}
              rows={4}
              className="max-h-[100px] overflow-y-auto resize-none"
            />
            <p
              className={cn(
                "text-xs text-right",
                charsLeft < 50 ? "text-[var(--destructive)]" : "text-[var(--muted-foreground)]",
              )}
            >
              {charsLeft} characters left
            </p>
          </div>

          <div className="space-y-2">
            <Label>Screenshots / Images</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={submitting || success}
            />
            <div
              onClick={() => !submitting && !success && fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed py-3 px-4 text-sm transition-colors cursor-pointer",
                themed
                  ? "text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:border-white/50 hover:text-white",
                (submitting || success) && "pointer-events-none opacity-50",
              )}
            >
              <ImageUp className="size-5" />
              <span className="text-xs">Click to upload images (PNG, JPG, WEBP, GIF · max {MAX_FILES} · 20MB)</span>
            </div>

            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {imagePreviews.map((preview, i) => (
                  <div key={preview} className="relative size-20 rounded-lg overflow-hidden border">
                    <img
                      src={preview}
                      alt={`Upload ${i + 1}`}
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      disabled={submitting || success}
                      className="absolute top-0.5 right-0.5 size-5 flex items-center justify-center rounded-full bg-[var(--background)]/80 text-[var(--foreground)] hover:bg-[var(--background)]/90"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-[var(--destructive)]">{error}</p>
          )}

          {success && (
            <p className="text-sm text-[var(--success)] flex items-start gap-1.5"><CheckCircle className="size-4 shrink-0 mt-0.5" /> Feedback received! Thank you for helping us improve the app. We truly appreciate your feedback and will review it as soon as possible.</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
              className={cn(ui.btnOutline)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || success} className={cn(ui.btnPrimary)}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Sending..." : success ? "Sent!" : "Send Feedback"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
