"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TelegramSettings } from "@/hooks/use-telegram-alerts"
import { sendTelegramMessage } from "@/lib/telegram"
import { toast } from "sonner"
import { Bell, Info, Send, ShieldCheck, Loader2 } from "lucide-react"
import { useActiveChain } from "@/hooks/use-active-chain"

interface TelegramAlertsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: TelegramSettings
  onSave: (settings: TelegramSettings) => void
}

export function TelegramAlertsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: TelegramAlertsModalProps) {
  const [localSettings, setLocalSettings] = useState<TelegramSettings>(settings)
  const [isTesting, setIsTesting] = useState(false)
  
  const { chainConfig: cfg, isConnected } = useActiveChain()
  const isMegaEth = isConnected && cfg?.name === 'MegaETH'
  const isInk = isConnected && cfg?.name === 'Ink'
  const isUnichain = isConnected && cfg?.name === 'Unichain'

  const handleTestConnection = async () => {
    if (!localSettings.botToken || !localSettings.chatId) {
      toast.error("Please provide both Bot Token and Chat ID")
      return
    }

    setIsTesting(true)
    try {
      await sendTelegramMessage(
        localSettings.botToken,
        localSettings.chatId,
        "<b>✅ Connection Test Successful!</b>\n\nYour Bubble Explorer is now correctly linked to this Telegram chat. You will receive alerts based on your configured filters."
      )
      toast.success("Test message sent! Check your Telegram.")
    } catch (error: any) {
      toast.error(`Connection failed: ${error.message}`)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = () => {
    onSave(localSettings)
    onClose()
  }

  const toggleType = (type: string) => {
    setLocalSettings(prev => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter(t => t !== type)
        : [...prev.selectedTypes, type]
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md bg-[#0c0c14]/95 backdrop-blur-xl border-white/10 text-white shadow-2xl ${isMegaEth ? 'rounded-none' : isInk ? 'rounded-3xl' : isUnichain ? 'rounded-2xl' : 'rounded-2xl'}`}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 ${isMegaEth ? 'bg-black border border-[#00ff88] text-[#00ff88] rounded-none' : isInk ? 'rounded-full bg-[#7B61FF]/20 text-[#7B61FF]' : isUnichain ? 'rounded-xl bg-[#FF007A]/20 text-[#FF007A]' : 'rounded-xl bg-blue-500/20 text-blue-400'}`}>
              < Bell className="w-5 h-5" />
            </div>
            <DialogTitle className={`text-xl font-bold tracking-tight ${isMegaEth ? 'font-mono uppercase' : isUnichain ? 'font-serif italic' : ''}`}>Telegram Alerts</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            Get notified instantly when high-value transactions are detected on-chain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Setup Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${isMegaEth ? 'text-[#00ff88] font-mono' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : 'text-blue-400'}`}>
                <ShieldCheck className="w-4 h-4" />
                Setup
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Enable Monitoring</span>
                <Switch 
                  checked={localSettings.enabled}
                  onCheckedChange={(val) => setLocalSettings(prev => ({ ...prev, enabled: val }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="botToken" className="text-xs text-gray-400">Bot API Token</Label>
              <Input 
                id="botToken"
                placeholder="123456789:ABCDefgh..."
                value={localSettings.botToken}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, botToken: e.target.value }))}
                className={`bg-white/5 border-white/10 transition-colors ${isMegaEth ? 'rounded-none focus:border-[#00ff88]' : isInk ? 'rounded-full px-4 focus:border-[#7B61FF]' : isUnichain ? 'rounded-xl focus:border-[#FF007A]' : 'focus:border-blue-500/50'}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chatId" className="text-xs text-gray-400">Chat ID</Label>
              <Input 
                id="chatId"
                placeholder="123456789"
                value={localSettings.chatId}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, chatId: e.target.value }))}
                className={`bg-white/5 border-white/10 transition-colors ${isMegaEth ? 'rounded-none focus:border-[#00ff88]' : isInk ? 'rounded-full px-4 focus:border-[#7B61FF]' : isUnichain ? 'rounded-xl focus:border-[#FF007A]' : 'focus:border-blue-500/50'}`}
              />
            </div>

            <Button 
              variant="outline" 
              className={`w-full border-white/10 hover:bg-white/5 text-xs h-9 transition-all ${isMegaEth ? 'rounded-none border-[#00ff88]/50 text-[#00ff88] font-mono' : isInk ? 'rounded-full' : isUnichain ? 'rounded-xl' : ''}`}
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Send className="w-3 h-3 mr-2" />}
              Test Connection
            </Button>
          </div>

          {/* Filters Section */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className={`text-sm font-semibold uppercase tracking-wider ${isMegaEth ? 'text-[#00ff88] font-mono' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : 'text-blue-400'}`}>Filters</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-gray-400">Min. Value ({cfg?.nativeCurrency?.symbol ?? 'ETH'})</Label>
                <span className={`text-xs font-mono ${isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : 'text-blue-400'}`}>{localSettings.minValueThreshold} {cfg?.nativeCurrency?.symbol ?? 'ETH'}</span>
              </div>
              <Input 
                type="number"
                step="0.01"
                min="0"
                value={localSettings.minValueThreshold}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, minValueThreshold: parseFloat(e.target.value) || 0 }))}
                className={`bg-white/5 border-white/10 ${isMegaEth ? 'rounded-none' : isInk ? 'rounded-full px-4' : isUnichain ? 'rounded-xl' : ''}`}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-gray-400">Transaction Types</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'coin_transfer', label: `Native ${cfg?.nativeCurrency?.symbol ?? 'ETH'}` },
                  { id: 'token_transfer', label: 'ERC-20' },
                  { id: 'contract_call', label: 'Smart Contract' },
                  { id: 'nft_transfer', label: 'NFTs' },
                ].map(type => (
                  <div key={type.id} className="flex items-center gap-2">
                    <Checkbox 
                      id={type.id}
                      checked={localSettings.selectedTypes.includes(type.id)}
                      onCheckedChange={() => toggleType(type.id)}
                    />
                    <label htmlFor={type.id} className="text-xs cursor-pointer select-none">{type.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Alert Cooldown</Label>
              <Select 
                value={String(localSettings.cooldownMinutes)} 
                onValueChange={(val) => setLocalSettings(prev => ({ ...prev, cooldownMinutes: parseInt(val) }))}
              >
                <SelectTrigger className={`bg-white/5 border-white/10 text-xs ${isMegaEth ? 'rounded-none' : isInk ? 'rounded-full px-4' : isUnichain ? 'rounded-xl' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0c0c14] border-white/10 text-white">
                  <SelectItem value="0">Every Match</SelectItem>
                  <SelectItem value="1">1 Minute</SelectItem>
                  <SelectItem value="5">5 Minutes</SelectItem>
                  <SelectItem value="15">15 Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-white/5 pt-4">
          <Button variant="ghost" onClick={onClose} className={`hover:bg-white/5 ${isMegaEth ? 'rounded-none uppercase font-mono' : isInk ? 'rounded-full' : isUnichain ? 'rounded-xl' : ''}`}>Cancel</Button>
          <Button onClick={handleSave} className={`text-white transition-all ${isMegaEth ? 'rounded-none bg-black border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black font-mono uppercase' : isInk ? 'rounded-full bg-[#7B61FF] hover:bg-[#6c54e6]' : isUnichain ? 'rounded-xl bg-[#FF007A] hover:bg-[#d60066]' : 'bg-blue-600 hover:bg-blue-700'}`}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
