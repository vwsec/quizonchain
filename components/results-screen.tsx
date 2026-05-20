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
} from "@/lib/submitScore"
import { getSoneiumChainById, soneiumMainnet, getTxExplorerUrl } from "@/lib/chains"
import { Trophy, Sparkles, Target, RotateCcw, XCircle, ExternalLink, CheckCircle } from "lucide-react"
import { activeChainConfig } from "@/lib/active-chain-config"

interface ResultsScreenProps {
  score: number
  totalQuestions: number
  quizToken?: string
  userAnswers?: number[]
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
  onRestart, 
  onScoreSubmitted 
}: ResultsScreenProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const chainId = useChainId()
  const chain = getSoneiumChainById(chainId) ?? soneiumMainnet
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

  const chainName = (() => {
    const id = mounted ? (walletChain?.id ?? chainId) : undefined
    if (id === 1868) return "Soneium"
    if (id === 57073) return "Ink"
    if (id === 8453) return "Base"
    if (id === 130) return "Unichain"
    if (id === 4326) return "MegaETH"
    if (id === 4441) return "LitVM"
    if (id === 5042002) return "Arc Testnet"
    return mounted ? (walletChain?.name ?? "Web3") : "Web3"
  })()

  const getMessage = () => {
    if (score >= 5) return `Perfect score! You're a ${chainName} master!`
    if (score === 4) return `Great ${chainName} expertise!`
    if (score === 3) return `Good knowledge of ${chainName}!`
    return `Keep exploring ${chainName} to improve your score!`
  }

  const getIcon = () => {
    if (percentage >= 80) return <Trophy className="size-8 text-primary" />
    if (percentage >= 60) return <Sparkles className="size-8 text-primary" />
    return <Target className="size-8 text-primary" />
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

  const isMegaEth = activeChainConfig.name === 'MegaETH'
  const isInk = activeChainConfig.name === 'Ink'
  const isUnichain = activeChainConfig.name === 'Unichain'
  const isBase = activeChainConfig.name === 'Base'
  const isSoneium = activeChainConfig.name === 'Soneium'
  const isArc = activeChainConfig.name === 'Arc Testnet'

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

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center px-4 py-12 ${isMegaEth ? 'font-mono' : ''}`}>
      {/* Background decoration removed - handled by ThemeBackground */}

      <div className="flex w-full flex-col items-center text-center">
        <div className={`mb-8 md:mb-10 p-4 md:p-6 shadow-2xl relative group ${
          isMegaEth 
            ? 'bg-black border-2 border-[#00ff88] rounded-none' 
            : isInk 
              ? 'bg-white/5 border border-white/10 rounded-full backdrop-blur-xl' 
            : isUnichain 
              ? 'bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl' 
            : isBase 
              ? 'bg-black/5 border border-black/5 rounded-full' 
            : isSoneium
              ? 'bg-white/[0.03] border border-[#0047FF]/20 rounded-2xl backdrop-blur-xl shadow-[0_0_50px_rgba(0,71,255,0.1)]'
            : isArc
              ? 'bg-white/[0.02] border border-[#4D8EE9]/20 rounded-2xl backdrop-blur-xl shadow-[0_0_50px_rgba(77,142,233,0.1)]'
              : 'bg-white/5 border border-white/10 rounded-2xl'
        }`}>
          <div className={`mb-3 md:mb-4 flex items-center justify-center p-3 md:p-4 ${
            isMegaEth ? 'bg-black border border-[#00ff88] rounded-none' : isInk ? 'bg-[#7B61FF]/20 rounded-full' : isUnichain ? 'bg-[#FF007A]/20 rounded-xl' : isBase ? 'bg-[#0052FF]/10 rounded-full' : isSoneium ? 'bg-[#0047FF]/20 rounded-xl' : isArc ? 'bg-[#4D8EE9]/20 rounded-xl' : 'bg-white/10 rounded-xl'
          }`}>
            {percentage >= 80 ? <Trophy className={`size-6 md:size-8 ${isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : 'text-primary'}`} /> : percentage >= 60 ? <Sparkles className={`size-6 md:size-8 ${isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : 'text-primary'}`} /> : <Target className={`size-6 md:size-8 ${isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : 'text-primary'}`} />}
          </div>
          <div className={`text-4xl md:text-5xl font-black mb-2 ${isMegaEth ? 'font-mono text-white' : isBase ? 'text-black' : 'text-white'}`}>
            {score} <span className={`text-xl md:text-2xl ${isMegaEth ? 'text-white/40' : isBase ? 'text-black/40' : 'text-white/40'}`}>/ {total}</span>
          </div>
          <div className={`text-xs md:text-sm font-black uppercase tracking-widest ${isMegaEth ? 'text-[#00ff88] font-mono' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : 'text-primary'}`}>
            {percentage}% Correct
          </div>
        </div>

        <h2 className={`text-3xl font-black mb-3 max-w-md ${isMegaEth ? 'font-mono uppercase text-white' : isBase ? 'text-black' : 'text-white'}`}>
          {getMessage()}
        </h2>
        <p className={`mb-10 ${isMegaEth ? 'font-mono lowercase text-white/40 text-sm' : isBase ? 'text-black/40' : 'text-white/40'}`}>
          Points will be added to the global leaderboard.
        </p>

        <div className="flex w-full max-w-[400px] flex-col gap-3">
          <Button
            size="lg"
            onClick={handleAction}
            disabled={txState === "pending" || isCooldownActive || hasSubmittedThisSession || isCheckingCooldown}
            className={`h-14 text-lg font-black transition-all duration-300 relative overflow-hidden group ${
              isMegaEth 
                ? 'rounded-none bg-black border-2 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black font-mono uppercase shadow-none' 
                : isInk
                  ? 'rounded-full bg-[#7B61FF] text-white hover:bg-[#7B61FF]/90 shadow-[0_0_25px_rgba(123,97,255,0.4)] border-none'
                : isUnichain
                  ? 'rounded-2xl bg-[#FF007A] text-white hover:bg-[#FF007A]/90 shadow-[0_0_25px_rgba(255,0,122,0.4)] border-none'
                : isBase
                  ? 'rounded-full bg-[#0052FF] text-white hover:bg-[#0052FF]/90 shadow-lg shadow-[#0052FF]/20 border-none'
                : isSoneium
                  ? 'rounded-2xl bg-[#0047FF] text-white hover:bg-[#0047FF]/90 shadow-[0_0_30px_rgba(0,71,255,0.5)] border-none'
                : isArc
                  ? 'rounded-2xl bg-[#4D8EE9] text-white hover:bg-[#3A7BD6] shadow-[0_0_30px_rgba(77,142,233,0.5)] border-none'
                  : 'rounded-2xl bg-[#0047FF] text-white hover:bg-[#0047FF]/90 shadow-none'
            }`}
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
            className={`h-12 border-2 transition-all duration-300 ${
              isMegaEth 
                ? 'rounded-none border-white/20 bg-black text-white/60 hover:border-white hover:text-white font-mono uppercase' 
                : isInk
                  ? 'rounded-full border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white backdrop-blur-xl'
                : isUnichain
                  ? 'rounded-2xl border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white backdrop-blur-xl'
                : isBase
                  ? 'rounded-full border-black/5 bg-black/5 text-black/40 hover:bg-black/10 hover:text-black'
                : isSoneium
                  ? 'rounded-2xl border-[#0047FF]/20 bg-[#0047FF]/5 text-white/60 hover:bg-[#0047FF]/10 hover:text-white backdrop-blur-xl'
                : isArc
                  ? 'rounded-2xl border-[#4D8EE9]/20 bg-[#4D8EE9]/5 text-white/60 hover:bg-[#4D8EE9]/10 hover:text-white backdrop-blur-xl'
                  : 'rounded-2xl border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <RotateCcw className="mr-2 size-5" />
            Play Again
          </Button>
        </div>
      </div>

      {wrongNetwork ? (
        <div className={`mt-6 p-4 rounded-xl border ${isMegaEth ? 'border-amber-500 bg-black' : 'border-amber-500/30 bg-amber-500/10'}`}>
          <p className={`text-sm mb-2 ${isMegaEth ? 'text-amber-500 uppercase' : 'text-amber-300'}`}>Wrong Network. Please switch to {chain.name}.</p>
          <Button
            size="sm"
            variant="outline"
            className={`w-full ${isMegaEth ? 'rounded-none border-white/20 text-white uppercase' : ''}`}
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
          errorMessage={txError}
        />
      ) : null}

      {txState === "failed" ? (
        <div className="mt-4 w-full max-w-md p-4 rounded-xl border border-destructive/50 bg-destructive/10">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="size-5 shrink-0 text-destructive" />
            <h3 className="text-sm font-medium text-foreground">Transaction Failed</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{txError}</p>
          {txHash ? (
            <a
              href={getTxExplorerUrl(chainId, txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline mb-3"
            >
              View Transaction <ExternalLink className="size-3" />
            </a>
          ) : null}
          <Button size="sm" variant="outline" onClick={handleRetry} className="w-full">
            Try Again
          </Button>
        </div>
      ) : null}

      {txPendingWarning ? (
        <p className={`text-xs mt-2 ${isMegaEth ? 'text-amber-500 uppercase' : 'text-amber-400'}`}>{txPendingWarning}</p>
      ) : null}

      {showConfirmModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 text-left shadow-2xl border ${isMegaEth ? 'border-[#00ff88] bg-black rounded-none text-white' : isInk ? 'rounded-3xl border-white/10 bg-[#0A0A0F] text-white' : isUnichain ? 'rounded-2xl border-white/10 bg-[#0A0A0F] text-white' : isBase ? 'rounded-2xl border-black/5 bg-white text-black' : isSoneium ? 'rounded-2xl border-[#0047FF]/20 bg-[#0A0A0F] text-white' : isArc ? 'rounded-2xl border-[#4D8EE9]/25 bg-[#0A0A0F] text-white' : 'rounded-2xl border border-white/10 bg-[#161923] text-white'}`}>
            <h3 className={`mb-4 text-xl font-bold ${isMegaEth ? 'uppercase font-mono text-[#00ff88]' : isUnichain ? 'font-serif italic' : isBase ? 'text-black' : ''}`}>
              {isMegaEth ? '// CONFIRM TRANSACTION' : 'Confirm Transaction'}
            </h3>
            <div className={`space-y-3 text-sm ${isMegaEth ? 'font-mono uppercase text-white/70' : isInk || isUnichain ? 'text-white/70' : isBase ? 'text-black/60' : 'text-white/85'}`}>
              <p><span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : 'text-white/60'}>Chain:</span> {chain.name} ({chainId})</p>
              <p>
                <span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : 'text-white/60'}>Contract:</span>{" "}
                {contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : "Not configured"}
              </p>
              <p><span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : 'text-white/60'}>Score:</span> {score}/{total}</p>
              <p><span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : 'text-white/60'}>Estimated gas:</span> {estimatedGas ? estimatedGas.toString() : "Estimating..."}</p>
              <p><span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : 'text-white/60'}>From:</span> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</p>
            </div>
            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                className={`flex-1 ${isMegaEth ? 'rounded-none border-white/20 text-white uppercase' : isInk ? 'rounded-full' : isUnichain ? 'rounded-2xl' : isBase ? 'rounded-full border-black/10 text-black hover:bg-black/5' : isSoneium ? 'rounded-2xl border-[#0047FF]/20 text-white' : isArc ? 'rounded-2xl border-[#4D8EE9]/20 text-white' : ''}`}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 transition-all duration-200 ${
                  isMegaEth 
                    ? 'rounded-none bg-[#00ff88] text-black hover:bg-[#00ff88]/80 font-mono uppercase font-bold' 
                  : isInk
                    ? 'rounded-full bg-[#7B61FF] hover:bg-[#6c54e6] text-white font-bold'
                  : isUnichain
                    ? 'rounded-2xl bg-[#FF007A] hover:bg-[#d60066] text-white font-bold'
                  : isBase
                    ? 'rounded-full bg-[#0052FF] hover:bg-[#0047FF] text-white font-bold shadow-lg shadow-[#0052FF]/20'
                  : isSoneium
                    ? 'rounded-2xl bg-[#0047FF] hover:bg-[#003bd9] text-white font-bold shadow-lg shadow-[#0047FF]/20'
                  : isArc
                    ? 'rounded-2xl bg-[#4D8EE9] hover:bg-[#3A7BD6] text-white font-bold shadow-lg shadow-[#4D8EE9]/20'
                    : 'bg-[#0047FF] hover:bg-[#0047FF]/90'
                }`}
                onClick={handleConfirmedSubmitScore}
                disabled={!isConnected || !contractAddress}
              >
                Confirm & Sign
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
