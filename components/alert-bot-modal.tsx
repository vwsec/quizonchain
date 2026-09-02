"use client"

import React, { useState } from "react"
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
import { AlertEventType, DEFAULT_ALERT_TYPES } from "@/lib/alert-types"
import { sendTelegramMessage, postTwitterAlert } from "@/lib/telegram"
import { toast } from "sonner"
import { AtSign, ShieldCheck, Loader2, Bot, Send, Bell, SlidersHorizontal, ChevronDown } from "lucide-react"
import { useActiveChain } from "@/hooks/use-active-chain"

interface AlertBotModalProps {
  isOpen: boolean
  onClose: () => void
  settings: TelegramSettings
  onSave: (settings: TelegramSettings) => void
}

const ALERT_TYPE_ROWS = [
  { type: "freeze" as AlertEventType, label: "Wallet Freeze", icon: "❄️", desc: "Issuer restricts an address" },
  { type: "drainer" as AlertEventType, label: "Drainer Activity", icon: "⚠️", desc: "Funds rapidly moved out" },
  { type: "swap" as AlertEventType, label: "DeFi Swap", icon: "🔄", desc: "DEX swap detected" },
  { type: "lend" as AlertEventType, label: "DeFi Lending", icon: "🏦", desc: "Deposit/withdraw lend" },
  { type: "borrow" as AlertEventType, label: "DeFi Borrowing", icon: "💸", desc: "Loan taken/repaid" },
  { type: "large_transfer" as AlertEventType, label: "Large Transfer", icon: "💰", desc: "Above threshold value" },
  { type: "suspicious_pattern" as AlertEventType, label: "Suspicious Pattern", icon: "🚨", desc: "Heuristic flag" },
  { type: "token_transfer" as AlertEventType, label: "Token Transfer", icon: "🪙", desc: "ERC-20 token move" },
  { type: "nft_transfer" as AlertEventType, label: "NFT Transfer", icon: "🖼️", desc: "NFT mint/transfer" },
  { type: "contract_call" as AlertEventType, label: "Contract Call", icon: "📜", desc: "Smart contract call" },
]

// ponytail: static class maps only — Tailwind JIT purges dynamic `bg-${x}-500` strings.
// LitVM = cyan glass; every other chain = neutral dark glass.
function accent(isLitvm: boolean) {
  return isLitvm
    ? {
        iconWrap: "bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/30",
        heading: "text-[#00F2FE]",
        value: "text-[#00F2FE]",
        inputFocus: "focus:border-[#00F2FE]/60 focus:ring-2 focus:ring-[#00F2FE]/30",
        primaryBtn: "bg-[#00F2FE] hover:bg-[#00C9DB] text-[#0B192C] font-mono",
        sectionBorder: "border-[#00F2FE]/10",
        glow: "shadow-[0_0_60px_rgba(0,242,254,0.12)]",
      }
    : {
        iconWrap: "bg-white/10 text-white border border-white/10",
        heading: "text-white",
        value: "text-white",
        inputFocus: "focus:border-white/30 focus:ring-2 focus:ring-white/20",
        primaryBtn: "bg-white text-black hover:bg-white/90",
        sectionBorder: "border-white/10",
        glow: "shadow-2xl",
      }
}

function Section({
  icon,
  title,
  accentCls,
  children,
}: {
  icon: React.ReactNode
  title: string
  accentCls: { iconWrap: string; heading: string; sectionBorder: string }
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`rounded-2xl border ${accentCls.sectionBorder} bg-white/[0.03] overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F2FE]/40"
        aria-expanded={open}
      >
        <span className={`p-1.5 rounded-lg ${accentCls.iconWrap}`}>{icon}</span>
        <span className={`text-sm font-semibold uppercase tracking-wider ${accentCls.heading}`}>{title}</span>
        <ChevronDown
          className={`w-4 h-4 ml-auto text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-4">{children}</div>}
    </div>
  )
}

export function AlertBotModal({ isOpen, onClose, settings, onSave }: AlertBotModalProps) {
  const [localSettings, setLocalSettings] = useState<TelegramSettings>(settings)
  const [isTelegramTesting, setIsTelegramTesting] = useState(false)
  const [isTwitterTesting, setIsTwitterTesting] = useState(false)
  const { chainConfig: cfg } = useActiveChain()
  const isLitvm = cfg?.name === "LitVM"
  const a = accent(isLitvm)

  const handleTestTelegramConnection = async () => {
    if (!localSettings.botToken || !localSettings.chatId) {
      toast.error("Please provide both Bot Token and Chat ID")
      return
    }
    setIsTelegramTesting(true)
    try {
      await sendTelegramMessage(
        localSettings.botToken,
        localSettings.chatId,
        "<b>✅ Connection Test Successful!</b>\n\nYour AlertBot is now correctly linked to this Telegram chat."
      )
      toast.success("Test message sent! Check your Telegram.")
    } catch (error: any) {
      toast.error(`Telegram connection failed: ${error.message}`)
    } finally {
      setIsTelegramTesting(false)
    }
  }

  const handleTestTwitterPost = async () => {
    if (!localSettings.twitterPostHook) {
      toast.error("Twitter posting endpoint not configured")
      return
    }
    setIsTwitterTesting(true)
    try {
      const res = await postTwitterAlert(
        `✅ AlertBot test successful!<br/><br/>Your ${cfg?.name ?? "LitVM"} Bubble Explorer is correctly posting alerts to Twitter/X.`
      )
      if (res.ok) toast.success(`Test tweet posted! (id: ${res.tweetId})`)
      else toast.error(`Twitter posting failed: ${res.error}`)
    } catch (error: any) {
      toast.error(`Twitter test failed: ${error.message}`)
    } finally {
      setIsTwitterTesting(false)
    }
  }

  const handleSave = () => {
    onSave(localSettings)
    onClose()
  }

  const toggleAlertType = (type: AlertEventType) => {
    setLocalSettings((prev) => ({
      ...prev,
      selectedAlertTypes: prev.selectedAlertTypes.includes(type)
        ? prev.selectedAlertTypes.filter((t) => t !== type)
        : [...prev.selectedAlertTypes, type],
    }))
  }

  const toggleTxType = (type: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter((t) => t !== type)
        : [...prev.selectedTypes, type],
    }))
  }

  const TX_TYPE_LABELS: Record<string, string> = {
    coin_transfer: `Native ${cfg?.nativeCurrency?.symbol ?? "ETH"}`,
    token_transfer: "ERC-20 Token",
    contract_call: "Smart Contract Call",
    nft_transfer: "NFT Transfer",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-lg w-[92vw] bg-[#0B192C]/80 backdrop-blur-2xl border ${a.sectionBorder} text-white ${a.glow} rounded-3xl p-0 gap-0`}
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-xl ${a.iconWrap}`}>
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className={`text-lg font-bold tracking-tight ${isLitvm ? "font-mono uppercase" : ""}`}>
                AlertBot
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400 mt-0.5">
                On-chain monitoring for {cfg?.name ?? "this network"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4 space-y-3 scrollbar-none">
          {/* Enable */}
          <div className={`flex items-center justify-between rounded-2xl border ${a.sectionBorder} bg-white/[0.03] px-4 py-3`}>
            <div className="flex items-center gap-3">
              <span className={`p-1.5 rounded-lg ${a.iconWrap}`}>
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">Monitoring Active</p>
                <p className="text-[11px] text-gray-400">Master switch for all alerts</p>
              </div>
            </div>
            <Switch
              checked={localSettings.enabled}
              onCheckedChange={(val) => setLocalSettings((prev) => ({ ...prev, enabled: val }))}
            />
          </div>

          <Section icon={<Bot className="w-4 h-4" />} title="Telegram" accentCls={a}>
            <div className="space-y-2">
              <Label htmlFor="botToken" className="text-xs text-gray-400">Bot API Token</Label>
              <Input
                id="botToken"
                placeholder="123456789:ABCDefgh..."
                value={localSettings.botToken}
                onChange={(e) => setLocalSettings((prev) => ({ ...prev, botToken: e.target.value }))}
                className={`bg-black/30 border-white/10 ${a.inputFocus}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chatId" className="text-xs text-gray-400">Chat ID</Label>
              <Input
                id="chatId"
                placeholder="123456789"
                value={localSettings.chatId}
                onChange={(e) => setLocalSettings((prev) => ({ ...prev, chatId: e.target.value }))}
                className={`bg-black/30 border-white/10 ${a.inputFocus}`}
              />
            </div>
            <Button
              variant="outline"
              className="w-full border-green-500/30 hover:bg-green-500/10 text-green-400 text-xs h-9 font-mono"
              onClick={handleTestTelegramConnection}
              disabled={isTelegramTesting}
            >
              {isTelegramTesting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Send className="w-3 h-3 mr-2" />}
              Test Telegram Connection
            </Button>
          </Section>

          <Section icon={<AtSign className="w-4 h-4" />} title="X / Twitter" accentCls={a}>
            <div className="space-y-2">
              <Label htmlFor="twitterHook" className="text-xs text-gray-400">Twitter Posting Endpoint</Label>
              <Input
                id="twitterHook"
                placeholder="https://your-server/api/twitter-post"
                value={localSettings.twitterPostHook || ""}
                onChange={(e) => setLocalSettings((prev) => ({ ...prev, twitterPostHook: e.target.value }))}
                className={`bg-black/30 border-white/10 ${a.inputFocus} font-mono text-xs`}
              />
              <p className="text-[10px] text-gray-500">URL of a server endpoint that posts to X API.</p>
            </div>
            <Button
              variant="outline"
              className="w-full border-sky-500/30 hover:bg-sky-500/10 text-sky-400 text-xs h-9"
              onClick={handleTestTwitterPost}
              disabled={isTwitterTesting || !localSettings.twitterPostHook}
            >
              {isTwitterTesting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <AtSign className="w-3 h-3 mr-2" />}
              Test Twitter Post
            </Button>
          </Section>

          <Section icon={<SlidersHorizontal className="w-4 h-4" />} title="Thresholds" accentCls={a}>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-gray-400">Min. Value ({cfg?.nativeCurrency?.symbol ?? "ETH"})</Label>
                <span className={`text-xs font-mono ${a.value}`}>
                  {localSettings.minValueThreshold} {cfg?.nativeCurrency?.symbol ?? "ETH"}
                </span>
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={localSettings.minValueThreshold}
                onChange={(e) => setLocalSettings((prev) => ({ ...prev, minValueThreshold: parseFloat(e.target.value) || 0 }))}
                className={`bg-black/30 border-white/10 ${a.inputFocus}`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Alert Cooldown</Label>
              <Select
                value={String(localSettings.cooldownMinutes)}
                onValueChange={(val) => setLocalSettings((prev) => ({ ...prev, cooldownMinutes: parseInt(val) }))}
              >
                <SelectTrigger className="bg-black/30 border-white/10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0B192C] border-white/10 text-white">
                  <SelectItem value="0">Every Match</SelectItem>
                  <SelectItem value="1">1 Minute</SelectItem>
                  <SelectItem value="5">5 Minutes</SelectItem>
                  <SelectItem value="15">15 Minutes</SelectItem>
                  <SelectItem value="60">1 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Section icon={<Bell className="w-4 h-4" />} title="Alert Event Types" accentCls={a}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALERT_TYPE_ROWS.map((item) => {
                const checked = localSettings.selectedAlertTypes.includes(item.type)
                return (
                  <label
                    key={item.type}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      checked ? `${a.sectionBorder} bg-white/[0.06]` : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <Checkbox
                      id={`alert-${item.type}`}
                      checked={checked}
                      onCheckedChange={() => toggleAlertType(item.type)}
                      className="mt-0.5"
                    />
                    <span className="text-lg leading-none">{item.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-white">{item.label}</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">{item.desc}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </Section>

          <Section icon={<SlidersHorizontal className="w-4 h-4" />} title="Transaction Type Filters" accentCls={a}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(TX_TYPE_LABELS).map(([type, label]) => {
                const checked = localSettings.selectedTypes.includes(type)
                return (
                  <label
                    key={type}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      checked ? `${a.sectionBorder} bg-white/[0.06]` : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <Checkbox
                      id={`tx-${type}`}
                      checked={checked}
                      onCheckedChange={() => toggleTxType(type)}
                    />
                    <span className="text-xs text-gray-300">{label}</span>
                  </label>
                )
              })}
            </div>
          </Section>
        </div>

        <DialogFooter className="px-5 py-4 border-t border-white/5 gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleSave} className={`${a.primaryBtn}`}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
