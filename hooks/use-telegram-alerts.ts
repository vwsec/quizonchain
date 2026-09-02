"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { sendTelegramMessage, formatTxAlertMessage, formatFreezeAlert, formatDrainerAlert, formatDeFiAlert, postTwitterAlert } from "@/lib/telegram"
import { getTxPrimaryType } from "@/lib/explorer-config"
import { AlertEventType, DEFAULT_ALERT_TYPES } from "@/lib/alert-types"
import { toast } from "sonner"

export interface TelegramSettings {
  enabled: boolean
  botToken: string
  chatId: string
  minValueThreshold: number
  selectedTypes: string[]
  selectedAlertTypes: AlertEventType[]
  cooldownMinutes: number
  twitterPostHook?: string
}

const STORAGE_KEY = "telegram_alert_settings"

interface NativeCurrencyInfo {
  symbol: string
  decimals: number
}

export function useTelegramAlerts(networkName: string, explorerBase: string, nativeCurrency: NativeCurrencyInfo) {
  const [settings, setSettings] = useState<TelegramSettings>({
    enabled: false,
    botToken: "",
    chatId: "",
    minValueThreshold: 0.1,
    selectedTypes: ["coin_transfer", "contract_call", "token_transfer", "nft_transfer"],
    selectedAlertTypes: [...DEFAULT_ALERT_TYPES],
    cooldownMinutes: 0,
  })

  const [isLoaded, setIsLoaded] = useState(false)
  const processedTxsRef = useRef<Set<string>>(new Set())
  const lastAlertTimeRef = useRef<number>(0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const stored = JSON.parse(saved) as TelegramSettings
        setSettings(prev => ({
          ...prev,
          ...stored,
          minValueThreshold: stored.minValueThreshold ?? 0.1,
          cooldownMinutes: stored.cooldownMinutes ?? 0,
          twitterPostHook: stored.twitterPostHook,
        }))
      }
    } catch (e) {
      console.error("Failed to parse telegram settings", e)
    }
    setIsLoaded(true)
  }, [])

  const saveSettings = (newSettings: TelegramSettings) => {
    setSettings(newSettings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
    toast.success("Alert settings saved")
  }

  const monitorTransactions = useCallback(async (events: any[]) => {
    if (!settings.enabled || !settings.botToken || !settings.chatId || !isLoaded) return

    for (const event of events) {
      if (event.hash && processedTxsRef.current.has(event.hash)) continue
      if (event.hash) processedTxsRef.current.add(event.hash)

      const now = Date.now()
      if (settings.cooldownMinutes > 0) {
        if (now - lastAlertTimeRef.current < settings.cooldownMinutes * 60 * 1000) continue
        lastAlertTimeRef.current = now
      }

      let message: string | null = null

      if (event.alertType && settings.selectedAlertTypes.includes(event.alertType)) {
        const nc = {
          symbol: settings.selectedAlertTypes.includes("token_transfer") ? "zkLTC" : "ETH",
          decimals: 18,
        }
        switch (event.alertType) {
          case "freeze":
            message = formatFreezeAlert(event.tx || event, networkName, explorerBase, event.frozenAddress || "", event.tokenAddress || "", nc)
            break
          case "drainer":
            message = formatDrainerAlert(event.tx || event, networkName, explorerBase, event.drainerAddress || "", event.victimAddress || "", event.amount || "", nc)
            break
          case "swap":
          case "lend":
          case "borrow":
            message = formatDeFiAlert(event.tx || event, networkName, explorerBase, event.alertType, event.protocol || "Unknown", event.amount || "", nc)
            break
        }
      } else if (event.hash) {
        const formattedValue = event.value ? Number(BigInt(event.value)) / 1e18 : 0
        const txType = getTxPrimaryType(event)
        if (formattedValue < settings.minValueThreshold || !settings.selectedTypes.includes(txType)) continue
        message = formatTxAlertMessage(event, networkName, explorerBase, { symbol: "ETH", decimals: 18 })
      }

      if (!message) continue

      try {
        await sendTelegramMessage(settings.botToken, settings.chatId, message)
        if (settings.twitterPostHook) {
          try {
            const res = await postTwitterAlert(message)
            if (res.ok) console.log(`[Tweet Posted] ${res.tweetId}`)
            else console.error("[Tweet Failed]", res.error)
          } catch (err) {
            console.error("[Tweet Error]", err)
          }
        }
        console.log(`[Alert Sent] ${event.hash || event.alertType}`)
      } catch (error: any) {
        console.error("[Alert Failed]", error)
      }
    }
  }, [settings, isLoaded, networkName, explorerBase])

  return { settings, saveSettings, monitorTransactions }
}
