"use client"

import { useEffect, useState } from "react"
import { useAccount, useChainId, usePublicClient, useSwitchChain } from "wagmi"
import { BaseError } from "viem"
import { Button } from "@/components/ui/button"
import { TransactionStatus, type TransactionState } from "./transaction-status"
import {
  estimateSubmitScoreGas,
  getContractAddressPreview,
  getTimeUntilNextSubmissionSeconds,
  useSubmitScore,
  quizScoresAbi,
} from "@/lib/submitScore"
import { getSoneiumChainById, getTxInternalUrl, soneiumMainnet } from "@/lib/chains"
import { XCircle, ExternalLink, CheckCircle, Trophy, Award, Sparkles } from "lucide-react"
import { useActiveChain } from "@/hooks/use-active-chain"
import { useChainUI } from "@/hooks/use-chain-ui"
import { cn } from "@/lib/utils"
import { NFT_CONTRACTS, NFT_ABI } from "@/lib/nft-contracts"
import { NftMintModal } from "@/components/nft-mint"
import { useQuizFlow } from "@/components/quiz-flow-context"

interface ResultsScreenProps {
  score: number
  totalQuestions: number
  quizToken?: string
  userAnswers?: number[]
  ecosystem?: string
  startIndex?: number
  onRestart: () => void
  onScoreSubmitted?: () => void
}

function formatSwitchChainError(err: unknown): string {
  if (err instanceof BaseError) {
    return err.shortMessage || err.message
  }
  if (err instanceof Error) {
    const m = err.message.toLowerCase()
    if (m.includes("user rejected") || m.includes("user denied")) {
      return "Network switch was cancelled in your wallet."
    }
    return err.message
  }
  return "Could not switch network."
}

export function ResultsScreen({ 
  score, 
  totalQuestions, 
  quizToken,
  userAnswers,
  ecosystem,
  startIndex,
  onRestart, 
  onScoreSubmitted 
}: ResultsScreenProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const chainId = useChainId()
  const { chainConfig: cfg } = useActiveChain()
  const ui = useChainUI()
  const { setActive } = useQuizFlow()
  const chain = getSoneiumChainById(chainId) ?? soneiumMainnet

  useEffect(() => {
    setActive(true)
    return () => setActive(false)
  }, [setActive])
  const { switchChainAsync } = useSwitchChain()
  const { chainId: walletChainId, isConnected, chain: walletChain, address } = useAccount()
  const publicClient = usePublicClient()
  const submitScore = useSubmitScore()
  const [txState, setTxState] = useState<TransactionState>("idle")
  const [txHash, setTxHash] = useState<string>()
  const [txError, setTxError] = useState<string>()
  const [txPendingWarning, setTxPendingWarning] = useState<string>()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null)
  const [wrongNetwork, setWrongNetwork] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [isCheckingCooldown, setIsCheckingCooldown] = useState(true)

  const total = totalQuestions
  const percentage = Math.round((score / total) * 100)

  // Score Count-Up Animation
  const [displayScore, setDisplayScore] = useState(0)
  useEffect(() => {
    if (!mounted) return
    let start = 0
    if (score === 0) {
      setDisplayScore(0)
      return
    }
    const duration = 800
    const stepTime = Math.max(Math.floor(duration / score), 35)
    const timer = setInterval(() => {
      start += 1
      setDisplayScore(start)
      if (start >= score) {
        clearInterval(timer)
      }
    }, stepTime)
    return () => clearInterval(timer)
  }, [mounted, score])

  // Progress Bar reveal animation
  const [animatedPercent, setAnimatedPercent] = useState(0)
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        setAnimatedPercent(percentage)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [mounted, percentage])

  // NFT State variables
  const [totalPoints, setTotalPoints] = useState<number | null>(null)
  const [hasMinted, setHasMinted] = useState(false)
  const [loadingNft, setLoadingNft] = useState(true)
  const [showNftModal, setShowNftModal] = useState(false)

  useEffect(() => {
    if (!isConnected || !address || !publicClient) {
      setLoadingNft(false)
      return
    }
    let cancelled = false
    const fetchNftStatus = async () => {
      try {
        const quizContract = getContractAddressPreview(chainId)
        const nftContract = NFT_CONTRACTS[chainId]
        if (!quizContract || !nftContract) {
          if (!cancelled) setLoadingNft(false)
          return
        }
        
        const [pts, minted] = await Promise.all([
          publicClient.readContract({
            address: quizContract as `0x${string}`,
            abi: quizScoresAbi,
            functionName: "totalPoints",
            args: [address],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: nftContract as `0x${string}`,
            abi: NFT_ABI,
            functionName: "hasMinted",
            args: [address],
          }) as Promise<boolean>,
        ])

        if (!cancelled) {
          setTotalPoints(Number(pts))
          setHasMinted(minted)
          setLoadingNft(false)
        }
      } catch (err) {
        if (!cancelled) setLoadingNft(false)
      }
    }
    void fetchNftStatus()
    return () => {
      cancelled = true
    }
  }, [isConnected, address, chainId, publicClient, txState])

  const chainName = (() => {
    const id = mounted ? (walletChain?.id ?? chainId) : undefined
    if (id === 1868) return "Soneium"
    if (id === 57073) return "Ink"
    if (id === 8453) return "Base"
    if (id === 130) return "Unichain"
    if (id === 4326) return "MegaETH"
    if (id === 4441) return "LitVM"
    if (id === 5042002) return "Arc Testnet"
    if (id === 11155111) return "Sepolia"
    return mounted ? (walletChain?.name ?? "Web3") : "Web3"
  })()

  const getMessage = () => {
    if (score >= 5) return `Perfect score! You're a ${chainName} master!`
    if (score === 4) return `Great ${chainName} expertise!`
    if (score === 3) return `Good knowledge of ${chainName}!`
    return `Keep exploring ${chainName} to improve your score!`
  }

  const contractAddress = getContractAddressPreview(chainId)
  const isCooldownActive = cooldownRemaining > 0
  const hasSubmittedThisSession = txState === "confirmed"
  const isWrongNetwork = isConnected && walletChainId !== chainId

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  useEffect(() => {
    let cancelled = false
    const readCooldown = async () => {
      if (!isConnected || !address) {
        if (!cancelled) {
          setCooldownRemaining(0)
          setIsCheckingCooldown(false)
        }
        return
      }
      setIsCheckingCooldown(true)
      const seconds = await getTimeUntilNextSubmissionSeconds({
        chainId,
        player: address,
        publicClient,
      })
      if (!cancelled) {
        setCooldownRemaining(Math.max(0, seconds))
        setIsCheckingCooldown(false)
      }
    }
    void readCooldown()
    return () => {
      cancelled = true
    }
  }, [isConnected, address, chainId, publicClient, txState])

  useEffect(() => {
    if (cooldownRemaining <= 0) return
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownRemaining])

  useEffect(() => {
    if (txState !== "pending") {
      setTxPendingWarning(undefined)
      return
    }
    const timer = setTimeout(() => {
      setTxPendingWarning("Transaction is taking longer than expected")
    }, 60_000)
    return () => clearTimeout(timer)
  }, [txState])

  useEffect(() => {
    if (!showConfirmModal || !isConnected || !address) return
    let cancelled = false
    const readEstimate = async () => {
      const value = await estimateSubmitScoreGas({
        chainId,
        player: address,
        score,
        total,
        publicClient,
      })
      if (!cancelled) setEstimatedGas(value)
    }
    setEstimatedGas(null)
    void readEstimate()
    return () => {
      cancelled = true
    }
  }, [showConfirmModal, isConnected, address, chainId, score, total, publicClient])

  const handleConfirmedSubmitScore = async () => {
    setShowConfirmModal(false)
    setTxState("pending")
    setTxHash(undefined)
    setTxError(undefined)
    setTxPendingWarning(undefined)

    if (!isConnected) {
      setTxError("Connect your wallet before submitting your score.")
      setTxState("failed")
      return
    }

    if (walletChainId !== chainId) {
      setTxError("Wrong Network")
      setTxState("failed")
      setWrongNetwork(true)
      return
    }

    const result = await submitScore({ score, total, quizToken, userAnswers }, { chainId })

    if (result.success) {
      setTxHash(result.hash)
      setTxState("confirmed")
      onScoreSubmitted?.()
      // Advance wallet progress on server
      if (ecosystem && address) {
        fetch("/api/advance-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chainId, address: address.toLowerCase() }),
        }).catch((err) => console.warn("[advance-progress] failed:", err))
      }
      // Dispatch sync event for other tabs
      localStorage.setItem('quiz-cooldown-sync', Date.now().toString())
    } else {
      setTxError(result.error)
      if (result.hash) setTxHash(result.hash)
      setTxState("failed")
    }
  }

  const handleRetry = () => {
    setTxState("idle")
    setTxHash(undefined)
    setTxError(undefined)
    setTxPendingWarning(undefined)
    setWrongNetwork(false)
  }

  const openSubmitConfirmation = () => {
    if (isCheckingCooldown || isCooldownActive) return
    if (txState === "pending" || txState === "confirmed") return
    if (isWrongNetwork) {
      setWrongNetwork(true)
      setTxError("Wrong Network")
      return
    }
    setWrongNetwork(false)
    setShowConfirmModal(true)
  }

  const handleAction = async () => {
    if (isWrongNetwork) {
      try {
        await switchChainAsync({ chainId })
        setWrongNetwork(false)
        setTxError(undefined)
      } catch (err) {
        setTxError(formatSwitchChainError(err))
      }
    } else {
      openSubmitConfirmation()
    }
  }

  const accentColor = ui.accent

  return (
    <div className={cn('flex min-h-dvh flex-col items-center justify-center px-4 py-6 pt-16 sm:py-12 sm:pt-28', ui.page)}>
      <div className="flex w-full flex-col items-center text-center">
        <div
          className={cn('max-w-sm mx-auto w-full flex flex-col items-center px-8 py-9 transition-colors duration-300 animate-scale-in', ui.cardStrong)}
          style={{ borderColor: `${ui.accent}33` }}
        >
          <div className={cn('text-[10px] tracking-[0.14em] uppercase mb-6', ui.accentClass)}>
            {ui.key === 'megaeth' ? '// SCORE RESULT' : 'Score Result'}
          </div>

          <div className="relative">
            <div
              className="absolute inset-[-20px] pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, ${accentColor}15 0%, transparent 70%)`,
              }}
            />
            <div className={cn(
              'text-[clamp(2.5rem,13vw,5.5rem)] md:text-[88px] font-bold leading-none tracking-tight animate-[scale-in_0.6s_cubic-bezier(0.34,1.56,0.64,1)]',
              ui.isLight ? 'text-black' : 'text-white',
              ui.fontMono && 'font-mono',
            )}>
              {displayScore}
              <span className="text-[clamp(0.875rem,4vw,1.75rem)] md:text-[28px] font-light opacity-30">
                {' '}/ {total}
              </span>
            </div>
          </div>

          <div className={cn('w-full my-5 overflow-hidden relative', ui.progressTrack)}>
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{
                width: `${animatedPercent}%`,
                backgroundColor: accentColor,
                boxShadow: `0 0 12px ${accentColor}55`,
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[progressShimmer_2s_infinite]"
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div
              className={cn('px-3 py-1.5 text-xs font-medium', ui.radiusSm)}
              style={{
                backgroundColor: `${accentColor}1a`,
                border: `1px solid ${accentColor}33`,
                color: accentColor,
              }}
            >
              {percentage}% correct
            </div>
            <div className={cn('px-3 py-1.5 text-xs font-medium', ui.statCard, 'py-1.5')}>
              {score} pts earned
            </div>
          </div>

          <h2 className={cn('text-center mb-1.5 font-semibold text-[15px]', ui.isLight ? 'text-black' : 'text-white')}>
            {getMessage()}
          </h2>
          <p className={cn('text-center mb-6 text-xs', ui.bodyMuted)}>
            Points are added to the global leaderboard.
          </p>

          {/* NFT Unlock status card */}
          {isConnected && !loadingNft && NFT_CONTRACTS[chainId] && (
            <div 
              className={cn('w-full mb-6 p-4 border rounded-xl flex flex-col text-left gap-2.5 animate-slide-up relative overflow-hidden', ui.card)}
              style={{
                borderColor: totalPoints !== null && totalPoints >= 100 ? `${accentColor}55` : `${accentColor}22`,
                boxShadow: totalPoints !== null && totalPoints >= 100 ? `0 0 24px ${accentColor}22` : 'none',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-white/[0.03] pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className={cn("size-4", totalPoints !== null && totalPoints >= 100 ? "text-yellow-400 animate-[float_4s_infinite]" : "opacity-40")} />
                  <span className={cn('text-xs font-bold tracking-wider', ui.isLight ? 'text-black' : 'text-white')}>
                    {totalPoints !== null && totalPoints >= 100 ? "NFT BADGE UNLOCKED!" : "MASTER NFT BADGE"}
                  </span>
                </div>
                {totalPoints !== null && (
                  <span className="text-[10px] opacity-60 font-semibold uppercase tracking-wider">
                    {totalPoints >= 100 ? "100 / 100 pts" : `${totalPoints} / 100 pts`}
                  </span>
                )}
              </div>

              {totalPoints !== null && totalPoints >= 100 ? (
                <div>
                  <p className="text-[11px] opacity-70 leading-normal mb-2.5">
                    Congratulations! You reached {totalPoints} points on the leaderboard. You are eligible to claim your exclusive Master NFT badge.
                  </p>
                  {!hasMinted ? (
                    <button
                      onClick={() => setShowNftModal(true)}
                      className={cn(
                        "w-full cursor-pointer py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-lg text-white",
                        ui.btnPrimary
                      )}
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                        boxShadow: `0 0 15px ${accentColor}40`,
                      }}
                    >
                      <Sparkles className="size-3.5" />
                      Claim Master NFT Now
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 py-2 px-3 rounded-lg text-xs font-semibold justify-center">
                      <CheckCircle className="size-4" />
                      NFT Claimed successfully!
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1 mb-1.5">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${Math.min(100, totalPoints ?? 0)}%`, 
                        backgroundColor: accentColor,
                        boxShadow: `0 0 8px ${accentColor}`
                      }}
                    />
                  </div>
                  <p className="text-[10px] opacity-50 leading-normal">
                    {totalPoints !== null ? (
                      <>You have <strong>{totalPoints}/100</strong> pts. Earn <strong>{Math.max(0, 100 - totalPoints)}</strong> more to unlock the Master NFT badge!</>
                    ) : (
                      <>Loading your on-chain points progress...</>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            <Button
              size="lg"
              onClick={handleAction}
              disabled={txState === "pending" || isCooldownActive || hasSubmittedThisSession || isCheckingCooldown}
              className={cn(
                'w-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg disabled:hover:scale-100 disabled:opacity-50 relative overflow-hidden group', 
                ui.btnPrimary
              )}
              style={{ 
                boxShadow: txState !== "pending" && !isCooldownActive && !hasSubmittedThisSession ? `0 4px 20px ${accentColor}33` : undefined
              }}
            >
              {txState === "pending" ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Submitting Score...</span>
                </div>
              ) : isWrongNetwork ? (
                "Switch to " + chainName
              ) : isCooldownActive ? (
                `Wait ${formatCooldown(cooldownRemaining)}`
              ) : hasSubmittedThisSession ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-success" />
                  <span>Score Submitted!</span>
                </div>
              ) : (
                "Submit Score On-Chain"
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onRestart}
              className={cn('w-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-300', ui.btnOutline)}
            >
              Play Again
            </Button>
          </div>
        </div>
      </div>

      {wrongNetwork ? (
        <div className={cn('mt-6 p-4 animate-slide-up w-full max-w-sm', ui.warning)}>
          <p className="text-sm mb-2">Wrong Network. Please switch to {chain.name}.</p>
          <Button
            size="sm"
            variant="outline"
            className={cn('w-full', ui.btnOutline)}
            onClick={async () => {
              try {
                await switchChainAsync({ chainId })
                setWrongNetwork(false)
                setTxError(undefined)
              } catch (err) {
                setTxError(formatSwitchChainError(err))
              }
            }}
          >
            Switch Network
          </Button>
        </div>
      ) : null}

      {txState === "pending" || txState === "confirmed" ? (
        <TransactionStatus
          state={txState}
          txHash={txHash}
          chainId={chainId}
        />
      ) : null}

      {txState === "failed" ? (
        <div
          role="alert"
          className={cn('mt-6 w-full max-w-sm p-4 animate-slide-up', ui.error)}
        >
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="size-5 shrink-0 text-destructive" />
            <h3 className="text-sm font-medium text-foreground">Transaction Failed</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{txError}</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRetry} className={cn('flex-1', ui.btnOutline)}>
              Try Again
            </Button>
            {txHash && chainId ? (
              <a
                href={getTxInternalUrl(chainId, txHash)}
                target="_blank"
                rel="noreferrer"
                className={cn('flex-1 text-center', ui.btnOutline)}
              >
                View on Explorer
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {txPendingWarning ? (
        <div className={cn('mt-4 px-4 py-2 animate-slide-up w-full max-w-sm', ui.warning)}>
          <p className="text-xs">{txPendingWarning}</p>
        </div>
      ) : null}

      {showConfirmModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 safe-top safe-bottom backdrop-blur-md">
          <div className={cn('w-full max-w-md p-6 text-left shadow-2xl border animate-scale-in max-h-[85dvh] overflow-y-auto', ui.cardStrong)}>
            <h3 className={cn('mb-4 text-xl font-bold', ui.accentClass)}>
              {ui.key === 'megaeth' ? '// CONFIRM TRANSACTION' : 'Confirm Transaction'}
            </h3>
            <div className={cn('space-y-3 text-sm', ui.bodyMuted)}>
              <p><span className={ui.accentClass}>Chain:</span> {chain.name} ({chainId})</p>
              <p>
                <span className={ui.accentClass}>Contract:</span>{" "}
                {contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : "Not configured"}
              </p>
              <p><span className={ui.accentClass}>Score:</span> {score}/{total}</p>
              <p><span className={ui.accentClass}>Estimated gas:</span> {estimatedGas ? estimatedGas.toString() : "Estimating..."}</p>
              <p><span className={ui.accentClass}>From:</span> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</p>
            </div>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" className={cn('flex-1', ui.btnOutline)} onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button
                className={cn('flex-1', ui.btnPrimary)}
                onClick={handleConfirmedSubmitScore}
                disabled={!isConnected || !contractAddress}
              >
                Confirm & Sign
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {showNftModal && (
        <NftMintModal 
          defaultOpen 
          showTrigger={false} 
          onClose={() => setShowNftModal(false)} 
        />
      )}
    </div>
  )
}
