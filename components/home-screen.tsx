"use client"

import { useEffect, useState } from "react"
import { useWallet } from "./wallet-provider"
import { Button } from "@/components/ui/button"
import { Shuffle } from "lucide-react"
import { useAccount, useConnect, useSwitchChain } from "wagmi"
import { getTimeUntilNextSubmissionSeconds } from "@/lib/submitScore"
import { NftProgressCard } from "./nft-mint"
import MegaEthLogo from "./megaeth-logo"
import InkLogo from "./ink-logo"
import UnichainLogo from "./unichain-logo"
import BaseLogo from "./base-logo"
import SoneiumLogo from "./soneium-logo"
import LitvmLogo from "./litvm-logo"
import ArcLogo from "./arc-logo"
import QuizOnChainLogo from "@/components/quiz-on-chain-logo"

interface HomeScreenProps {
  onStartQuiz: () => void
  onShuffleQuiz: () => void
  onRetryQuiz: () => void
  quizLoading: boolean
  quizError: string | null
  hasQuiz: boolean
  /** Increment after each quiz submission to trigger NFT progress re-fetch */
  nftRefreshKey?: number
  cooldownRemaining: number
  isCheckingCooldown: boolean
}

import { useActiveChain } from "@/hooks/use-active-chain"
import { soneiumMainnet } from "@/lib/chains"

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
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { isConnected: isWalletConnected, connect } = useWallet()
  const { isConnected: isAccountConnected } = useAccount()
  const { chainConfig: cfg, heroTitle, heroSubtitle, heroLabel, isConnected: hookIsConnected } = useActiveChain()

  const [startaleConnecting, setStartaleConnecting] = useState(false)
  const [startaleError, setStartaleError] = useState<string | null>(null)
  const { connectAsync, connectors } = useConnect()
  const { switchChainAsync } = useSwitchChain()

  const handleStartaleConnect = async () => {
    setStartaleConnecting(true)
    setStartaleError(null)

    const sc = connectors.find((c) => c.id === 'startaleApp')
    if (!sc) {
      setStartaleError('Startale connector not available')
      setStartaleConnecting(false)
      return
    }

    try {
      await connectAsync({ connector: sc, chainId: soneiumMainnet.id })
    } catch (err: any) {
      console.error('connect error', err)
      const isUserRejection =
        err?.code === 4001 ||
        err?.cause?.code === 4001
      if (isUserRejection) return
      setStartaleError('Connection failed. Please try again.')
      setTimeout(() => setStartaleError(null), 4000)
      return
    }

    try {
      await switchChainAsync({ chainId: soneiumMainnet.id })
    } catch (err: any) {
      console.error('switchChain error', err)
    } finally {
      setStartaleConnecting(false)
    }
  }

  const hero = { label: heroLabel, title: heroTitle, subtitle: heroSubtitle }
  const safeIsConnected = mounted ? (isWalletConnected || isAccountConnected) : false

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const isCooldownActive = cooldownRemaining > 0

  const canStart =
    safeIsConnected && hasQuiz && !quizLoading && quizError === null && !isCooldownActive && !isCheckingCooldown

  const isMegaEth = hookIsConnected && cfg?.name === 'MegaETH'
  const isInk = hookIsConnected && cfg?.name === 'Ink'
  const isUnichain = hookIsConnected && cfg?.name === 'Unichain'
  const isBase = hookIsConnected && cfg?.name === 'Base'
  const isSoneium = hookIsConnected && cfg?.name === 'Soneium'
  const isLitvm = hookIsConnected && cfg?.name === 'LitVM'
  const isArc = hookIsConnected && cfg?.name === 'Arc Testnet'

  if (!mounted) return null

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-16 pb-10">

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        {!safeIsConnected && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 relative z-10">
            <QuizOnChainLogo />
            <h1 style={{ color: 'white', fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>
              Quiz On Chain
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>
              Test your blockchain knowledge on-chain
            </p>
            <button
              onClick={connect}
              className="rounded-full bg-white px-9 py-[14px] text-base font-bold text-black"
            >
              Connect Wallet
            </button>
            <button
              onClick={handleStartaleConnect}
              disabled={startaleConnecting}
              className="flex items-center justify-center gap-2 rounded-full bg-white px-9 py-[14px] text-base font-bold text-black disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 181 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#startale-clip)">
                  <path d="M154.14 63.6385L127.779 89.9995L154.14 116.36L180.501 89.9995L154.14 63.6385Z" fill="black"/>
                  <path d="M26.8608 63.6399L0.5 90.0004L26.8608 116.361L53.2215 90.0004L26.8608 63.6399Z" fill="black"/>
                  <path d="M90.4992 0L64.1387 26.3608L90.4992 52.7216L116.86 26.3608L90.4992 0Z" fill="black"/>
                  <path d="M90.4997 127.278L64.1387 153.639L90.4997 180L116.86 153.639L90.4997 127.278Z" fill="black"/>
                  <path d="M154.141 26.3613H116.861V63.6413H154.141V26.3613Z" fill="black"/>
                  <path d="M64.1431 26.3613H26.8633V63.6413H64.1431V26.3613Z" fill="black"/>
                  <path d="M154.141 116.359H116.861V153.639H154.141V116.359Z" fill="black"/>
                  <path d="M64.1431 116.359H26.8633V153.639H64.1431V116.359Z" fill="black"/>
                </g>
                <defs>
                  <clipPath id="startale-clip">
                    <rect width="180" height="180" fill="white" transform="translate(0.5)"/>
                  </clipPath>
                </defs>
              </svg>
              {startaleConnecting ? "Connecting..." : "Connect with Startale"}
            </button>
            {startaleError && (
              <p className="text-sm text-red-400">{startaleError}</p>
            )}
          </div>
        )}
        {safeIsConnected && (<>
        {isMegaEth && <MegaEthLogo />}
        {isInk && <InkLogo />}
        {isUnichain && <UnichainLogo />}
        {isBase && <BaseLogo />}
        {isSoneium && <SoneiumLogo />}
        {isLitvm && <LitvmLogo />}
        {isArc && <ArcLogo />}
        <div className="mb-5 flex items-center gap-2">
          {!isMegaEth && !isInk && !isUnichain && !isBase && !isSoneium && !isLitvm && !isArc && <div className="size-2 rounded-full bg-[#0047FF]" />}
          <span className={`text-xs ${isLitvm ? 'lowercase' : 'uppercase'} tracking-[0.28em] ${isMegaEth ? 'text-[#00ff88] font-mono' : isInk ? 'text-[#6C5CE7] font-mono' : isUnichain ? 'text-[#FF007A] font-mono' : isBase ? 'text-[#0052FF] font-semibold' : isSoneium ? 'text-[#0047FF] font-semibold' : isLitvm ? 'text-[#00F2FE] font-mono' : isArc ? 'text-[#4D8EE9] font-mono' : 'text-white/55'}`}>
            {isMegaEth || isInk || isUnichain || isSoneium || isLitvm || isArc ? `// ${hero.label}` : hero.label}
          </span>
        </div>

        <h1 className={`mb-4 font-bold ${isMegaEth ? 'text-4xl md:text-7xl uppercase font-mono tracking-tight text-white' : isInk ? 'text-4xl md:text-7xl tracking-tighter text-white' : isUnichain ? 'text-4xl md:text-7xl tracking-tight font-serif text-white' : isBase ? 'text-4xl md:text-7xl tracking-tighter text-black' : isSoneium ? 'text-4xl md:text-7xl tracking-tight text-white' : isLitvm ? 'text-4xl md:text-7xl tracking-tight font-mono text-[#00F2FE]' : isArc ? 'text-4xl md:text-7xl tracking-tight text-white' : 'text-4xl md:text-6xl tracking-tight text-white'}`}>
          {isUnichain ? (
            <>
              The <span className="italic text-[#FF007A]">Knowledge</span> of Unichain
            </>
          ) : hero.title}
        </h1>

        <p className={`mb-8 ${isMegaEth ? 'text-white/40 font-mono lowercase text-sm' : isInk ? 'text-base md:text-lg text-white/70 font-medium' : isUnichain ? 'text-base text-[#FF007A]/80 font-medium' : isBase ? 'text-base text-black/60 font-medium' : isSoneium ? 'text-base md:text-lg text-white/60 tracking-tight' : isLitvm ? 'text-base md:text-lg text-[#00F2FE]/60 font-mono' : isArc ? 'text-base md:text-lg text-[#4D8EE9]/60' : 'text-sm text-white/55 md:text-base'}`}>
          {hero.subtitle}
        </p>

        {quizError && safeIsConnected && (
          <div className={`mb-4 flex max-w-md items-start gap-2 p-3 text-left text-sm ${isMegaEth ? 'border border-red-500 bg-black text-red-500' : isInk || isUnichain ? 'rounded-full border border-red-500/30 bg-red-500/10 text-red-300 backdrop-blur-md px-6 py-3' : isBase ? 'rounded-xl border border-red-200 bg-red-50 text-red-600' : isLitvm ? 'border border-red-500 bg-[#0B192C] text-red-500 font-mono' : isArc ? 'border border-red-500 bg-[#000B24] text-red-500' : 'rounded-xl border border-red-500/20 bg-red-500/10 text-red-200'}`}>
            <span className="mt-0.5">⚠️</span>
            <span className={`text-balance ${isMegaEth ? 'uppercase font-mono tracking-tighter' : isLitvm ?'font-mono tracking-tighter' : ''}`}>{quizError}</span>
          </div>
        )}

        <div className="flex w-full max-w-[400px] flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onShuffleQuiz}
            disabled={quizLoading || !safeIsConnected || isCooldownActive}
            className={`h-12 w-full transition-all duration-200 ${
              isMegaEth 
                ? 'rounded-none border border-[#00ff88] bg-black text-[#00ff88] hover:bg-[#00ff88] hover:text-black font-mono uppercase shadow-none' 
                : isInk
                  ? 'rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-lg shadow-none'
                : isUnichain
                  ? 'rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-lg shadow-none'
                : isBase
                  ? 'rounded-full border-2 border-black/5 bg-black/5 text-black hover:bg-black/10 shadow-none'
                : isSoneium
                  ? 'rounded-xl border border-[#0047FF]/20 bg-[#0047FF]/5 text-white hover:bg-[#0047FF]/10 hover:border-[#0047FF]/50 backdrop-blur-xl transition-all'
                : isLitvm ?'border border-[#00F2FE]/30 bg-[#0B192C] text-[#00F2FE] hover:bg-[#00F2FE]/10 hover:border-[#00F2FE]/50 font-mono'
                  : isArc ? 'border border-[#4D8EE9]/30 bg-[#000B24] text-[#4D8EE9] hover:bg-[#4D8EE9]/10 hover:border-[#4D8EE9]/50'
                  : 'rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] font-medium text-white hover:bg-[rgba(255,255,255,0.08)]'
            }`}
          >
            <Shuffle className="mr-2 size-5" />
            Shuffle Questions 🔀
          </Button>

          <Button
            size="lg"
            onClick={onStartQuiz}
            disabled={!canStart}
            className={`h-12 w-full transition-all duration-200 ${
              isMegaEth 
                ? 'rounded-none border border-[#00ff88] bg-black text-[#00ff88] hover:bg-[#00ff88] hover:text-black font-mono uppercase shadow-none' 
                : isInk
                  ? 'rounded-full bg-[#7B61FF] font-bold text-white hover:bg-[#6c54e6] shadow-[0_0_30px_rgba(123,97,255,0.4)]'
                : isUnichain
                  ? 'rounded-2xl bg-[#FF007A] font-bold text-white hover:bg-[#d60066] shadow-[0_0_30px_rgba(255,0,122,0.4)]'
                : isBase
                  ? 'rounded-full bg-[#0052FF] font-bold text-white hover:bg-[#0047FF] shadow-lg hover:shadow-xl'
                : isSoneium
                  ? 'rounded-xl bg-[#0047FF] font-bold text-white shadow-[0_0_30px_rgba(0,71,255,0.4)] hover:bg-[#003bd9] transition-all duration-300'
                : isLitvm ?'bg-[#00F2FE] font-bold text-[#0B192C] hover:bg-[#00C9DB] shadow-[0_0_30px_rgba(0,242,254,0.4)] font-mono'
                  : isArc ? 'bg-[#4D8EE9] font-bold text-white hover:bg-[#3A7BD6] shadow-[0_0_30px_rgba(77,142,233,0.4)]'
                  : 'rounded-xl bg-[#0047FF] font-medium text-white shadow-[0_0_24px_rgba(0,71,255,0.35)] hover:bg-[#0047FF]/90'
            }`}
          >
            {safeIsConnected && isCheckingCooldown
              ? "Checking cooldown..."
              : isCooldownActive
                ? `Next submission in ${formatCooldown(cooldownRemaining)}`
                : "Start Quiz"}
          </Button>

          {safeIsConnected && (
            <div className={isMegaEth ? 'font-mono uppercase text-xs' : isLitvm ?'font-mono text-xs' : isArc ? 'font-mono text-xs' : ''}>
              {quizError && !isCooldownActive && (
                <button
                  type="button"
                  onClick={onRetryQuiz}
                  disabled={quizLoading}
                  className="text-xs underline text-muted-foreground hover:text-foreground transition-colors"
                >
                  Try Again
                </button>
              )}
              {isCooldownActive && (
                <p className={`text-sm ${isMegaEth ? 'text-amber-500' : isLitvm ? 'text-amber-500 font-mono' : isArc ? 'text-amber-500' : 'text-amber-500/80'}`}>
                  You've recently submitted your score. Wait for the cooldown to play again.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Feature highlights */}
        <div className="mt-14 grid w-full max-w-4xl grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { value: '5', label: 'Questions' },
            { value: 'On-Chain', label: 'Results' },
            { value: 'Free', label: 'To Play' }
          ].map((item, i) => (
            <div key={i} className={`px-4 py-5 text-center ${
              isMegaEth 
                ? 'bg-black border border-white/10 rounded-none' 
                : isInk 
                  ? 'rounded-3xl border border-white/5 bg-white/5 backdrop-blur-lg shadow-[0_0_30px_rgba(255,255,255,0.02)]'
                : isUnichain
                  ? 'rounded-2xl border border-white/5 bg-white/5 backdrop-blur-lg shadow-[0_0_30px_rgba(255,255,255,0.02)]'
                : isBase
                  ? 'rounded-2xl border border-black/5 bg-[#f4f5f7] shadow-sm'
                : isSoneium
                  ? 'rounded-2xl border border-[#0047FF]/10 bg-white/[0.02] backdrop-blur-xl shadow-[0_0_30px_rgba(0,71,255,0.03)]'
                : isLitvm
                  ? 'bg-[#0B192C] border border-[#00F2FE]/20'
                  : isArc
                    ? 'bg-[#000B24] border border-[#4D8EE9]/20'
                  : 'rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] backdrop-blur-md'
            }`}>
              <div className={`text-2xl font-bold ${isMegaEth ? 'text-white font-mono' : isInk || isUnichain ? 'text-white tracking-tight' : isBase ? 'text-black tracking-tight' : isLitvm ? 'text-[#00F2FE] font-mono' : isArc ? 'text-[#4D8EE9]' : 'text-white'}`}>{item.value}</div>
              <div className={`text-sm ${isMegaEth ? 'text-white/40 uppercase font-mono' : isInk || isUnichain ? 'text-white/60 tracking-wider uppercase text-xs font-semibold' : isBase ? 'text-black/40 font-semibold' : isLitvm ?'text-[#00F2FE]/60 font-mono text-xs' : isArc ? 'text-[#4D8EE9]/60' : 'text-white/55'}`}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* NFT progress tracker — only visible when wallet connected + chain has NFT */}
        {safeIsConnected && (
          <NftProgressCard refreshKey={nftRefreshKey} />
        )}
        </>)}
      </div>
    </div>
  )
}
