"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { sendTelegramMessage, formatTxAlertMessage } from '@/lib/telegram'
import { getTxPrimaryType } from '@/components/bubble-explorer'
import { toast } from 'sonner'

interface NativeCurrencyInfo {
  symbol: string
  decimals: number
}

export interface TelegramSettings {
  enabled: boolean
  botToken: string
  chatId: string
  minValueThreshold: number
  selectedTypes: string[]
  cooldownMinutes: number
}

const STORAGE_KEY = 'telegram_alert_settings'

export function useTelegramAlerts(networkName: string, explorerBase: string, nativeCurrency: NativeCurrencyInfo) {
  const [settings, setSettings] = useState<TelegramSettings>({
    enabled: false,
    botToken: '',
    chatId: '',
    minValueThreshold: 0.1,
    selectedTypes: ['coin_transfer', 'contract_call', 'token_transfer', 'nft_transfer'],
    cooldownMinutes: 0,
  })

  const [isLoaded, setIsLoaded] = useState(false)
  const processedTxsRef = useRef<Set<string>>(new Set())
  const lastAlertTimeRef = useRef<number>(0)

  // Load settings (with migration for old minEthThreshold field)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const stored = JSON.parse(saved)
        setSettings(prev => ({
          ...prev,
          ...stored,
          minValueThreshold: stored.minValueThreshold ?? stored.minEthThreshold ?? 0.1,
        }))
      } catch (e) {
        console.error('Failed to parse telegram settings', e)
      }
    }
    setIsLoaded(true)
  }, [])

  const saveSettings = (newSettings: TelegramSettings) => {
    setSettings(newSettings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
    toast.success('Alert settings saved')
  }

  const monitorTransactions = useCallback(async (txs: any[]) => {
    if (!settings.enabled || !settings.botToken || !settings.chatId || !isLoaded) return

    const newTxs = txs.filter(tx => !processedTxsRef.current.has(tx.hash))
    
    for (const tx of newTxs) {
      processedTxsRef.current.add(tx.hash)
      
      const formattedValue = tx.value ? Number(BigInt(tx.value)) / 1e18 : 0
      const txType = getTxPrimaryType(tx)
      
      const matchesValue = formattedValue >= settings.minValueThreshold
      const matchesType = settings.selectedTypes.includes(txType)
      
      if (matchesValue && matchesType) {
        // Cooldown check
        if (settings.cooldownMinutes > 0) {
          const now = Date.now()
          if (now - lastAlertTimeRef.current < settings.cooldownMinutes * 60 * 1000) {
            continue
          }
          lastAlertTimeRef.current = now
        }

        try {
          const message = formatTxAlertMessage(tx, networkName, explorerBase, nativeCurrency)
          await sendTelegramMessage(settings.botToken, settings.chatId, message)
          console.log(`[Alert Sent] ${tx.hash}`)
        } catch (error: any) {
          console.error('[Alert Failed]', error)
          // Don't toast for every failure to avoid spam, but log it
        }
      }
    }
  }, [settings, isLoaded, networkName, explorerBase, nativeCurrency])

  return {
    settings,
    saveSettings,
    monitorTransactions,
  }
}


