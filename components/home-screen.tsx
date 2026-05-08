"use client"

import { useEffect, useState } from "react"
import { useWallet } from "./wallet-provider"
import { Button } from "@/components/ui/button"
import { Shuffle } from "lucide-react"
import { useAccount, useChainId, usePublicClient } from "wagmi"
import { getTimeUntilNextSubmissionSeconds } from "@/lib/submitScore"
import { NftProgressCard } from "./nft-mint"
import MegaEthLogo from "./megaeth-logo"
import InkLogo from "./ink-logo"
import UnichainLogo from "./unichain-logo"
import BaseLogo from "./base-logo"
import SoneiumLogo from "./soneium-logo"

interface HomeScreenProps {
  onStartQuiz: () => void
  onShuffleQuiz: () => void
  quizLoading: boolean
  quizError: string | null
  hasQuiz: boolean
  /** Increment after each quiz submission to trigger NFT progress re-fetch */
  nftRefreshKey?: number
  cooldownRemaining: number
  isCheckingCooldown: boolean
}

import { activeChainConfig, isMultiChain } from "@/lib/active-chain-config"

function getHeroContent(chainId?: number) {
  if (isMultiChain) {
    if (chainId === 57073) {
      return {
        label: "INK",
        title: "The Knowledge of Ink",
        subtitle: "Test your Ink Onchain knowledge",
      }
    }
    if (chainId === 1868) {
      return {
        label: "SONEIUM",
        title: "The Knowledge of Soneium",
        subtitle: "Test your Soneium blockchain knowledge",
      }
    }
    if (chainId === 8453) {
      return {
        label: "BASE",
        title: "The Knowledge of Base",
        subtitle: "Test your Base blockchain knowledge",
      }
    }
    if (chainId === 130) {
      return {
        label: "UNICHAIN",
        title: "The Knowledge of Unichain",
        subtitle: "Test your Unichain knowledge",
      }
    }
    if (chainId === 4326) {
      return {
        label: 'MEGAETH',
        title: 'The Knowledge of MegaETH',
        subtitle: 'Test your MegaETH blockchain knowledge',
      }
    }
    // Default to Web3 content for fallback
    return {
      label: "WEB3",
      title: "The Knowledge of Web3",
      subtitle: "Test your blockchain knowledge across the ecosystem",
    }
  }

  return {
    label: activeChainConfig.heroLabel,
    title: activeChainConfig.heroTitle,
    subtitle: activeChainConfig.heroSubtitle,
  }
}

export function HomeScreen({
  onStartQuiz,
  onShuffleQuiz,
  quizLoading,
  quizError,
  hasQuiz,
  nftRefreshKey = 0,
  cooldownRemaining,
  isCheckingCooldown,
}: HomeScreenProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { isConnected: isWalletConnected } = useWallet()
  const { chain, address, isConnected: isAccountConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  const hero = mounted ? getHeroContent(chain?.id) : getHeroContent(undefined)
  const safeIsConnected = mounted ? (isWalletConnected || isAccountConnected) : false

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const isCooldownActive = cooldownRemaining > 0

  const canStart =
    safeIsConnected && hasQuiz && !quizLoading && quizError === null && !isCooldownActive && !isCheckingCooldown

  const isMegaEth = activeChainConfig.name === 'MegaETH'
  const isInk = activeChainConfig.name === 'Ink'
  const isUnichain = activeChainConfig.name === 'Unichain'
  const isBase = activeChainConfig.name === 'Base'
  const isSoneium = activeChainConfig.name === 'Soneium'

  if (!mounted) return null

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-24 pb-10">

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        {isMegaEth && <MegaEthLogo />}
        {isInk && <InkLogo />}
        {isUnichain && <UnichainLogo />}
        {isBase && <BaseLogo />}
        {isSoneium && <SoneiumLogo />}
        <div className="mb-5 flex items-center gap-2">
          {!isMegaEth && !isInk && !isUnichain && !isBase && !isSoneium && <div className="size-2 rounded-full bg-[#0047FF]" />}
          <span className={`text-xs uppercase tracking-[0.28em] ${isMegaEth ? 'text-[#00ff88] font-mono' : isInk ? 'text-[#6C5CE7] font-mono' : isUnichain ? 'text-[#FF007A] font-mono' : isBase ? 'text-[#0052FF] font-semibold' : isSoneium ? 'text-[#0047FF] font-semibold' : 'text-white/55'}`}>
            {isMegaEth || isInk || isUnichain || isSoneium ? `// ${hero.label}` : hero.label}
          </span>
        </div>

        <h1 className={`mb-4 font-bold ${isMegaEth ? 'text-4xl md:text-7xl uppercase font-mono tracking-tight text-white' : isInk ? 'text-4xl md:text-7xl tracking-tighter text-white' : isUnichain ? 'text-4xl md:text-7xl tracking-tight font-serif text-white' : isBase ? 'text-4xl md:text-7xl tracking-tighter text-black' : isSoneium ? 'text-4xl md:text-7xl tracking-tight text-white' : 'text-4xl md:text-6xl tracking-tight text-white'}`}>
          {isUnichain ? (
            <>
              The <span className="italic text-[#FF007A]">Knowledge</span> of Unichain
            </>
          ) : hero.title}
        </h1>

        <p className={`mb-8 ${isMegaEth ? 'text-white/40 font-mono lowercase text-sm' : isInk ? 'text-base md:text-lg text-white/70 font-medium' : isUnichain ? 'text-base text-[#FF007A]/80 font-medium' : isBase ? 'text-base text-black/60 font-medium' : isSoneium ? 'text-base md:text-lg text-white/60 tracking-tight' : 'text-sm text-white/55 md:text-base'}`}>
          {hero.subtitle}
        </p>

        {quizError && safeIsConnected && (
          <div className={`mb-4 flex max-w-md items-start gap-2 p-3 text-left text-sm ${isMegaEth ? 'border border-red-500 bg-black text-red-500' : isInk || isUnichain ? 'rounded-full border border-red-500/30 bg-red-500/10 text-red-300 backdrop-blur-md px-6 py-3' : isBase ? 'rounded-xl border border-red-200 bg-red-50 text-red-600' : 'rounded-xl border border-red-500/20 bg-red-500/10 text-red-200'}`}>
            <span className="mt-0.5">⚠️</span>
            <span className={`text-balance ${isMegaEth ? 'uppercase font-mono tracking-tighter' : ''}`}>{quizError}</span>
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
            <div className={isMegaEth ? 'font-mono uppercase text-xs' : ''}>
              {!hasQuiz && !quizLoading && !isCooldownActive && (
                <p className="text-sm text-muted-foreground">
                  Load a quiz with shuffle or fix the error above, then start.
                </p>
              )}
              {quizError && !quizLoading && !isCooldownActive && (
                <p className="text-xs text-muted-foreground">
                  Try Shuffle again or check your connection.
                </p>
              )}
              {isCooldownActive && (
                <p className={`text-sm ${isMegaEth ? 'text-amber-500' : 'text-amber-500/80'}`}>
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
                  : 'rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] backdrop-blur-md'
            }`}>
              <div className={`text-2xl font-bold ${isMegaEth ? 'text-white font-mono' : isInk || isUnichain ? 'text-white tracking-tight' : isBase ? 'text-black tracking-tight' : 'text-white'}`}>{item.value}</div>
              <div className={`text-sm ${isMegaEth ? 'text-white/40 uppercase font-mono' : isInk || isUnichain ? 'text-white/60 tracking-wider uppercase text-xs font-semibold' : isBase ? 'text-black/40 font-semibold' : 'text-white/55'}`}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* NFT progress tracker — only visible when wallet connected + chain has NFT */}
        {safeIsConnected && (
          <NftProgressCard refreshKey={nftRefreshKey} />
        )}
      </div>
    </div>
  )
}
