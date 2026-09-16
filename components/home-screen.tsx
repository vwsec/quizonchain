"use client"

import { useEffect, useState, useRef, type ReactNode } from "react"
import { useWallet } from "./wallet-provider"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Shuffle } from "lucide-react"
import { useAccount, useConnect as useWagmiConnect, useChainId } from "wagmi"
import { NftProgressCard } from "./nft-mint"
import MegaEthLogo from "./megaeth-logo"
import InkLogo from "./ink-logo"
import UnichainLogo from "./unichain-logo"
import BaseLogo from "./base-logo"
import SoneiumLogo from "./soneium-logo"
import LitvmLogo from "./litvm-logo"
import ArcLogo from "./arc-logo"
import AbstractLogo from "./abstract-logo"
import SepoliaLogo from "./sepolia-logo"
import QuizOnChainLogo from "@/components/quiz-on-chain-logo"
import { SignInWithBase } from "./sign-in-with-base"
import { SignInWithAbstract } from "./sign-in-with-abstract"
import { useActiveChain } from "@/hooks/use-active-chain"
import { useChainUI } from "@/hooks/use-chain-ui"
import { useConnectionLock, DIRECT_CONNECTOR_IDS } from "@/hooks/use-connection-lock"
import { useFarcasterMiniApp } from "@/hooks/use-farcaster-miniapp"
import { sdk } from "@farcaster/miniapp-sdk"
import { cn } from "@/lib/utils"

interface HomeScreenProps {
  onStartQuiz: () => void
  onShuffleQuiz: () => void
  onRetryQuiz: () => void
  quizLoading: boolean
  quizError: string | null
  hasQuiz: boolean
  nftRefreshKey?: number
  cooldownRemaining: number
  isCheckingCooldown: boolean
}

const CHAIN_LOGOS: Record<string, () => ReactNode> = {
  MegaETH: () => <MegaEthLogo />,
  Ink: () => <InkLogo />,
  Unichain: () => <UnichainLogo />,
  Base: () => <BaseLogo />,
  Soneium: () => <SoneiumLogo />,
  LitVM: () => <LitvmLogo />,
  'Arc Testnet': () => <ArcLogo />,
  Arc: () => <ArcLogo />,
  Abstract: () => <AbstractLogo />,
  Sepolia: () => <SepoliaLogo />,
}

export function HomeScreen({
  onStartQuiz,
  onShuffleQuiz,
  onRetryQuiz,
  quizLoading,
  quizError,
  hasQuiz,
  nftRefreshKey = 0,
  cooldownRemaining,
  isCheckingCooldown,
}: HomeScreenProps) {
  useEffect(() => { sdk.actions.ready() }, [])

  const { isMiniApp, hostSupportsNotifications, notificationDetails, addMiniApp } = useFarcasterMiniApp()
  const [notifPrompted, setNotifPrompted] = useState(false)

  useEffect(() => {
    if (isMiniApp && hostSupportsNotifications && !notificationDetails && !notifPrompted) {
      addMiniApp().catch(() => {})
      setNotifPrompted(true)
    }
  }, [isMiniApp, hostSupportsNotifications, notificationDetails, notifPrompted, addMiniApp])

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { isConnected: isWalletConnected, connect } = useWallet()
  const { isConnected: isAccountConnected, address } = useAccount()
  const { chainConfig: cfg, heroTitle, heroSubtitle, heroLabel, isConnected } = useActiveChain()
  const ui = useChainUI()

  const [startaleError, setStartaleError] = useState<string | null>(null)
  const { connectAsync, connectors } = useWagmiConnect()
  const { isActive: startaleActive, isLocked: startaleLocked } = useConnectionLock(DIRECT_CONNECTOR_IDS.startale)
  const { isLocked: walletLocked } = useConnectionLock()

  const handleStartaleConnect = async () => {
    const sc = connectors.find((c) => c.id === 'startaleApp')
    if (!sc) {
      setStartaleError('Startale connector not available')
      return
    }
    setStartaleError(null)
    try {
      await connectAsync({ connector: sc })
    } catch (err: unknown) {
      const e = err as { code?: number; cause?: { code?: number } }
      if (e?.code === 4001 || e?.cause?.code === 4001) return
      const inIframe = typeof window !== 'undefined' && window.parent !== window
      setStartaleError(inIframe ? 'Connection failed. Please try again.' : 'Startale Wallet only works inside the Startale App.')
      setTimeout(() => setStartaleError(null), 4000)
    }
  }

  const safeIsConnected = mounted ? (isWalletConnected || isAccountConnected) : false

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const isCooldownActive = cooldownRemaining > 0
  const canStart =
    safeIsConnected && hasQuiz && !quizLoading && quizError === null && !isCooldownActive && !isCheckingCooldown

  if (!mounted) return null

  const ChainLogo = cfg?.name ? CHAIN_LOGOS[cfg.name] : null

  return (
    <div className={cn("relative z-10 flex min-h-dvh items-center justify-center px-4 pt-20 pb-10 safe-x", ui.page)}>
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">

        {/* Disconnected — hero + connect */}
        {!safeIsConnected && (
          <div className="flex flex-col items-center justify-center min-h-dvh gap-6 relative z-10 animate-slide-up">
            <QuizOnChainLogo />
            <div className="space-y-3">
              <p className={ui.label}>Web3 Knowledge</p>
              <h1 className={ui.heading}>Quiz On Chain</h1>
              <p className={ui.subheading}>
                Test your blockchain knowledge. Prove it on-chain.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 w-full max-w-sm relative group">
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-30 blur-md group-hover:opacity-50 transition duration-500"></div>
              <button
                onClick={connect}
                disabled={walletLocked}
                className={cn(
                  'flex h-[56px] w-full items-center justify-center relative z-10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100',
                  ui.connectBtn
                )}
              >
                Connect Wallet
              </button>
              <div className="flex flex-col items-center gap-3 w-full relative z-10">
                <span className={cn('text-xs', ui.bodyMuted)}>or</span>
                <SignInWithBase />
              </div>
              <SignInWithAbstract />
              <button
                onClick={handleStartaleConnect}
                disabled={startaleActive || startaleLocked}
                className={cn('w-full flex items-center justify-center gap-2 relative z-10', ui.connectBtn, 'h-[56px] px-6 disabled:opacity-50', 'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100')}
              >
                <svg width="18" height="18" viewBox="0 0 181 180" fill="none" aria-hidden="true">
                  <g clipPath="url(#startale-clip)">
                    <path d="M154.14 63.6385L127.779 89.9995L154.14 116.36L180.501 89.9995L154.14 63.6385Z" fill="currentColor" />
                    <path d="M26.8608 63.6399L0.5 90.0004L26.8608 116.361L53.2215 90.0004L26.8608 63.6399Z" fill="currentColor" />
                    <path d="M90.4992 0L64.1387 26.3608L90.4992 52.7216L116.86 26.3608L90.4992 0Z" fill="currentColor" />
                    <path d="M90.4997 127.278L64.1387 153.639L90.4997 180L116.86 153.639L90.4997 127.278Z" fill="currentColor" />
                    <path d="M154.141 26.3613H116.861V63.6413H154.141V26.3613Z" fill="currentColor" />
                    <path d="M64.1431 26.3613H26.8633V63.6413H64.1431V26.3613Z" fill="currentColor" />
                    <path d="M154.141 116.359H116.861V153.639H154.141V116.359Z" fill="currentColor" />
                    <path d="M64.1431 116.359H26.8633V153.639H64.1431V116.359Z" fill="currentColor" />
                  </g>
                  <defs>
                    <clipPath id="startale-clip">
                      <rect width="180" height="180" fill="white" transform="translate(0.5)" />
                    </clipPath>
                  </defs>
                </svg>
                {startaleActive ? "Connecting..." : "Connect with Startale"}
              </button>
              {startaleError && (
                <p className="text-sm text-red-400">{startaleError}</p>
              )}
            </div>

            {/* Feature highlights — disconnected */}
            <div className="mt-4 grid w-full max-w-3xl grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
              {[
                { value: '5', label: 'Questions' },
                { value: 'On-Chain', label: 'Results' },
                { value: 'Free', label: 'To Play' },
              ].map((item) => (
                <div key={item.label} className={cn(ui.statCard, 'py-3 md:py-5')}>
                  <div className={cn('text-xl md:text-2xl font-bold', ui.accentClass)}>{item.value}</div>
                  <div className={cn('text-xs md:text-sm mt-0.5', ui.bodyMuted)}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected — chain hero */}
        {safeIsConnected && (
          <div className="animate-slide-up w-full flex flex-col items-center">
            {ChainLogo && ChainLogo()}

            <div
              className="mb-6 flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-semibold backdrop-blur-md transition-all duration-300 shadow-md"
              style={{ borderColor: `${ui.accent}50`, backgroundColor: `${ui.accent}10`, color: ui.accent, boxShadow: `0 0 15px ${ui.accent}15` }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: ui.accent }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: ui.accent }}></span>
              </span>
              <span className={cn(ui.label, 'text-xs uppercase font-bold tracking-widest leading-none select-none')}>
                {ui.labelPrefix}{heroLabel}
              </span>
            </div>

            <h1 className={cn(ui.heading, 'mb-4')}>
              {heroTitle}
            </h1>

            <p className={cn(ui.subheading, 'mb-8')}>{heroSubtitle}</p>

            {quizError && (
              <div className={cn(ui.error, 'mb-4 flex max-w-md items-start gap-2 text-left w-full')}>
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span className="text-balance">{quizError}</span>
              </div>
            )}

            <div className="flex w-full max-w-[400px] flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onShuffleQuiz}
                disabled={quizLoading || !safeIsConnected || isCooldownActive}
                className={cn('h-12 w-full', ui.btnSecondary)}
              >
                <Shuffle className="size-4 md:size-5" />
                <span className="hidden sm:inline">Shuffle Questions</span><span className="sm:hidden">Shuffle</span>
              </Button>

              <Button
                size="lg"
                onClick={onStartQuiz}
                disabled={!canStart}
                className={cn('h-12 w-full', ui.btnPrimary)}
              >
                {isCheckingCooldown
                  ? "Checking cooldown..."
                  : isCooldownActive
                    ? `Next submission in ${formatCooldown(cooldownRemaining)}`
                    : "Start Quiz"}
              </Button>

              <div>
                {quizError && !isCooldownActive && (
                  <button
                    type="button"
                    onClick={onRetryQuiz}
                    disabled={quizLoading}
                    className={cn('text-xs underline cursor-pointer transition-colors duration-200', ui.bodyMuted, 'hover:text-foreground')}
                  >
                    Try Again
                  </button>
                )}
                {isCooldownActive && (
                  <p className="text-sm text-amber-500/90">
                    You&apos;ve recently submitted your score. Wait for the cooldown to play again.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 grid w-full max-w-4xl grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
              {[
                { value: '5', label: 'Questions' },
                { value: 'On-Chain', label: 'Results' },
                { value: 'Free', label: 'To Play' },
              ].map((item) => (
                <div key={item.label} className={cn(ui.statCard, 'py-3 md:py-5')}>
                  <div className={cn('text-xl md:text-2xl font-bold', ui.accentClass)}>
                    {item.value}
                  </div>
                  <div className={cn('text-xs md:text-sm mt-0.5', ui.bodyMuted)}>{item.label}</div>
                </div>
              ))}
            </div>

            <NftProgressCard refreshKey={nftRefreshKey} />
          </div>
        )}
      </div>
    </div>
  )
}