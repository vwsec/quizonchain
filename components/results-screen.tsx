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
import { getSoneiumChainById, soneiumMainnet } from "@/lib/chains"
import { XCircle, ExternalLink, CheckCircle } from "lucide-react"
import { useActiveChain } from "@/hooks/use-active-chain"

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
  const { chainConfig: cfg } = useActiveChain()
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

  const isMegaEth = isConnected && cfg?.name === 'MegaETH'
  const isInk = isConnected && cfg?.name === 'Ink'
  const isUnichain = isConnected && cfg?.name === 'Unichain'
  const isBase = isConnected && cfg?.name === 'Base'
  const isSoneium = isConnected && cfg?.name === 'Soneium'
  const isLitvm = isConnected && cfg?.name === 'LitVM'
  const isArc = isConnected && cfg?.name === 'Arc Testnet'
  const isSepolia = isConnected && cfg?.name === 'Sepolia'

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

  const accentTextColor = 
    isMegaEth ? 'text-[#00ff88]' 
    : isInk ? 'text-[#7B61FF]' 
    : isUnichain ? 'text-[#FF007A]' 
    : isBase ? 'text-[#0052FF]' 
    : isSoneium ? 'text-[#0047FF]' 
    : isArc ? 'text-[#4D8EE9]' 
    : isLitvm ? 'text-[#00F2FE]' 
    : 'text-primary'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full flex-col items-center text-center">

        {/* CARD WRAPPER */}
        <div
          className={`max-w-sm mx-auto w-full flex flex-col items-center px-8 py-9 ${
            isMegaEth ? 'bg-[#0a0a0a] rounded-none' :
            isInk ? 'bg-[#0a0a0a] rounded-2xl' :
            isSoneium ? 'bg-[#0a0a0a] rounded-2xl' :
            isBase ? 'bg-[#0d0d1a] rounded-2xl' :
            isUnichain ? 'bg-[#0a0a0a] rounded-3xl' :
            isLitvm ? 'bg-[#0a0a0a] rounded-xl' :
            isArc ? 'bg-[#0a0a0a] rounded-2xl' :
            isSepolia ? 'bg-[#0e0e0e] rounded-xl' :
            'bg-[#0a0a0a] rounded-2xl'
          }`}
          style={{
            border: isMegaEth ? `1px solid ${cfg?.color ?? '#00ff88'}`
                  : isInk ? `1px solid ${cfg?.color ?? '#8b5cf6'}66`
                  : isSoneium ? '1px solid rgba(255,255,255,0.08)'
                  : isBase ? `1px solid ${cfg?.color ?? '#0052ff'}33`
                  : isUnichain ? `1px solid ${cfg?.color ?? '#ff007a'}40`
                  : isLitvm ? '1px solid rgba(255,255,255,0.1)'
                  : isArc ? '1px solid rgba(255,255,255,0.12)'
                  : isSepolia ? '1px solid rgba(255,255,255,0.08)'
                  : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* [A] SECTION LABEL */}
          <div
            className={
              isMegaEth ? 'font-mono text-[10px] tracking-[0.18em] uppercase mb-7' :
              isInk ? 'font-sans text-[10px] tracking-[0.14em] uppercase mb-6' :
              isSoneium ? 'font-sans text-[10px] tracking-[0.12em] uppercase mb-6' :
              isBase ? 'font-sans text-[10px] tracking-[0.1em] uppercase mb-6' :
              isUnichain ? 'font-sans text-[10px] tracking-[0.12em] uppercase mb-6' :
              isLitvm ? 'font-sans text-[10px] tracking-[0.12em] uppercase mb-6' :
              isArc ? 'font-sans text-[10px] tracking-[0.12em] uppercase mb-6' :
              isSepolia ? 'font-sans text-[10px] tracking-[0.1em] uppercase mb-6' :
              'font-sans text-[10px] tracking-[0.12em] uppercase mb-6'
            }
            style={{ color: isMegaEth ? '#00ff88' : cfg?.color ?? '#8b5cf6' }}
          >
            SCORE RESULT
          </div>

          {/* [B] SCORE NUMBER */}
          <div className={
            isMegaEth ? 'font-mono text-[80px] font-bold leading-none tracking-[-2px] text-white' :
            isInk ? 'font-sans text-[88px] font-bold leading-none tracking-[-4px] text-white' :
            isSoneium ? 'font-sans text-[88px] font-bold leading-none tracking-[-4px] text-white' :
            isBase ? 'font-sans text-[88px] font-bold leading-none tracking-[-4px] text-white' :
            isUnichain ? 'font-sans text-[88px] font-bold leading-none tracking-[-4px] text-white' :
            isLitvm ? 'font-sans text-[84px] font-bold leading-none tracking-[-3px] text-white' :
            isArc ? 'font-sans text-[88px] font-bold leading-none tracking-[-4px] text-white' :
            isSepolia ? 'font-sans text-[84px] font-bold leading-none tracking-[-3px] text-white' :
            'font-sans text-[88px] font-bold leading-none tracking-[-4px] text-white'
          }>
            {score}
            <span className={
              isMegaEth ? 'font-mono text-[26px] opacity-35' :
              isInk ? 'text-[28px] font-light opacity-30' :
              isSoneium ? 'text-[28px] font-light opacity-30' :
              isBase ? 'text-[28px] font-light opacity-30' :
              isUnichain ? 'text-[28px] font-light opacity-30' :
              isLitvm ? 'text-[26px] font-light opacity-30' :
              isArc ? 'text-[28px] font-light opacity-30' :
              isSepolia ? 'text-[26px] font-light opacity-30' :
              'text-[28px] font-light opacity-30'
            }>
              {' '}/ {total}
            </span>
          </div>

          {/* [C] PROGRESS BAR */}
          <div className="w-full bg-white/10 h-[3px] rounded-full my-5">
            <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: cfg?.color ?? '#00ff88' }} />
          </div>

          {/* [D] STAT CHIPS */}
          <div className="flex items-center gap-3 mb-7">
            <div
              className={`px-3 py-1.5 text-xs font-medium ${
                isMegaEth ? 'rounded-none' :
                isInk ? 'rounded-lg' :
                isSoneium ? 'rounded-full' :
                isBase ? 'rounded-lg' :
                isUnichain ? 'rounded-full' :
                isLitvm ? 'rounded-lg' :
                isArc ? 'rounded-full' :
                isSepolia ? 'rounded-md' :
                'rounded-lg'
              }`}
              style={{
                backgroundColor: `${cfg?.color ?? '#00ff88'}1a`,
                border: `1px solid ${cfg?.color ?? '#00ff88'}40`,
                color: cfg?.color ?? '#00ff88',
              }}
            >
              {percentage}% correct
            </div>
            <div className={`px-3 py-1.5 text-xs font-medium bg-white/6 border border-white/10 text-white/45 ${
              isMegaEth ? 'rounded-none' :
              isInk ? 'rounded-lg' :
              isSoneium ? 'rounded-full' :
              isBase ? 'rounded-lg' :
              isUnichain ? 'rounded-full' :
              isLitvm ? 'rounded-lg' :
              isArc ? 'rounded-full' :
              isSepolia ? 'rounded-md' :
              'rounded-lg'
            }`}>
              {score} pts earned
            </div>
          </div>

          {/* [E] HEADLINE */}
          <h2 className={`text-center text-white mb-1.5 ${
            isMegaEth ? 'font-mono font-bold text-[14px] uppercase tracking-wide' :
            isInk ? 'font-sans font-semibold text-[15px]' :
            isSoneium ? 'font-sans font-semibold text-[15px]' :
            isBase ? 'font-sans font-bold text-[15px]' :
            isUnichain ? 'font-sans font-bold text-[15px]' :
            isLitvm ? 'font-sans font-semibold text-[14px]' :
            isArc ? 'font-sans font-semibold text-[15px]' :
            isSepolia ? 'font-sans font-medium text-[14px]' :
            'font-sans font-semibold text-[15px]'
          }`}>
            {getMessage()}
          </h2>

          {/* [F] SUBLINE */}
          <p className={`text-center mb-7 ${
            isMegaEth ? 'font-mono text-[11px] tracking-widest lowercase text-white/38' :
            isInk ? 'font-sans text-[12px] text-white/38' :
            isSoneium ? 'font-sans text-[12px] text-white/38' :
            isBase ? 'font-sans text-[12px] text-white/38' :
            isUnichain ? 'font-sans text-[12px] text-white/38' :
            isLitvm ? 'font-sans text-[12px] text-white/38' :
            isArc ? 'font-sans text-[12px] text-white/38' :
            isSepolia ? 'font-sans text-[11px] text-white/35' :
            'font-sans text-[12px] text-white/38'
          }`}>
            Points are added to the global leaderboard.
          </p>

          <div className="flex flex-col gap-3">
          {/* [G] PRIMARY BUTTON */}
          <Button
            size="lg"
            onClick={handleAction}
            disabled={txState === "pending" || isCooldownActive || hasSubmittedThisSession || isCheckingCooldown}
            className={`w-full transition-all duration-300 relative overflow-hidden group ${
              isMegaEth ? 'font-mono font-bold text-[12px] tracking-[0.1em] uppercase rounded-none py-[14px] text-black' :
              isInk ? 'font-sans font-semibold text-[13px] rounded-xl py-[14px] text-white' :
              isSoneium ? 'font-sans font-medium text-[13px] rounded-full py-[14px] text-white' :
              isBase ? 'font-sans font-bold text-[13px] rounded-xl py-[14px] text-white' :
              isUnichain ? 'font-sans font-bold text-[13px] rounded-full py-[14px] text-white' :
              isLitvm ? 'font-sans font-semibold text-[13px] rounded-xl py-[14px] text-black' :
              isArc ? 'font-sans font-semibold text-[13px] rounded-2xl py-[14px] text-black' :
              isSepolia ? 'font-sans font-medium text-[13px] rounded-xl py-[14px] text-white' :
              'font-sans font-semibold text-[13px] rounded-xl py-[14px] text-white'
            }`}
            style={{ backgroundColor: cfg?.color ?? '#0047FF' }}
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

          {/* [H] SECONDARY BUTTON */}
          <Button
            variant="outline"
            size="lg"
            onClick={onRestart}
            className={`w-full bg-transparent text-white/50 transition-all duration-300 ${
              isMegaEth ? 'font-mono text-[11px] uppercase rounded-none py-[13px]' :
              isInk ? 'font-sans text-[12px] rounded-xl py-[13px]' :
              isSoneium ? 'font-sans text-[12px] rounded-full py-[13px]' :
              isBase ? 'font-sans text-[12px] rounded-xl py-[13px]' :
              isUnichain ? 'font-sans text-[12px] rounded-full py-[13px]' :
              isLitvm ? 'font-sans text-[12px] rounded-xl py-[13px]' :
              isArc ? 'font-sans text-[12px] rounded-2xl py-[13px]' :
              isSepolia ? 'font-sans text-[12px] rounded-xl py-[13px]' :
              'font-sans text-[12px] rounded-xl py-[13px]'
            }`}
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Play Again
          </Button>
          </div>
        </div>
      </div>

      {wrongNetwork ? (
        <div className={`mt-6 p-4 rounded-xl border ${isMegaEth ? 'border-amber-500 bg-black' : isLitvm ? 'border-amber-500 bg-[#0B192C] text-amber-500 font-mono text-xs' : 'border-amber-500/30 bg-amber-500/10'}`}>
          <p className={`text-sm mb-2 ${isMegaEth ? 'text-amber-500 uppercase' : isLitvm ? 'text-amber-500 font-mono' : 'text-amber-300'}`}>Wrong Network. Please switch to {chain.name}.</p>
          <Button
            size="sm"
            variant="outline"
            className={`w-full ${isMegaEth ? 'rounded-none border-white/20 text-white uppercase' : isLitvm ? 'border-[#00F2FE]/30 bg-[#0B192C] text-[#00F2FE] hover:bg-[#00F2FE]/10 font-mono' : ''}`}
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

      {txState === "pending" || txState === "confirmed" || txState === "failed" ? (
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
          <Button size="sm" variant="outline" onClick={handleRetry} className="w-full">
            Try Again
          </Button>
        </div>
      ) : null}

      {txPendingWarning ? (
        <p className={`text-xs mt-2 ${isMegaEth ? 'text-amber-500 uppercase' : isLitvm ? 'text-[#00F2FE] font-mono' : 'text-amber-400'}`}>{txPendingWarning}</p>
      ) : null}

      {showConfirmModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 text-left shadow-2xl border ${isMegaEth ? 'border-[#00ff88] bg-black rounded-none text-white' : isInk ? 'rounded-3xl border-white/10 bg-[#0A0A0F] text-white' : isUnichain ? 'rounded-2xl border-white/10 bg-[#0A0A0F] text-white' : isBase ? 'rounded-2xl border-black/5 bg-white text-black' : isSoneium ? 'rounded-2xl border-[#0047FF]/20 bg-[#0A0A0F] text-white' : isArc ? 'rounded-2xl border-[#4D8EE9]/25 bg-[#0A0A0F] text-white' : isLitvm ? 'rounded-2xl border-[#00F2FE]/25 bg-[#0B192C] text-white font-mono' : 'rounded-2xl border border-white/10 bg-[#161923] text-white'}`}>
            <h3 className={`mb-4 text-xl font-bold ${isMegaEth ? 'uppercase font-mono text-[#00ff88]' : isUnichain ? 'font-serif italic' : isBase ? 'text-black' : isLitvm ? 'text-[#00F2FE]' : ''}`}>
              {isMegaEth ? '// CONFIRM TRANSACTION' : isLitvm ? 'Confirm Transaction' : 'Confirm Transaction'}
            </h3>
            <div className={`space-y-3 text-sm ${isMegaEth ? 'font-mono uppercase text-white/70' : isInk || isUnichain ? 'text-white/70' : isBase ? 'text-black/60' : isLitvm ? 'text-white/70' : 'text-white/85'}`}>
              <p><span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : isLitvm ? 'text-[#00F2FE]' : 'text-white/60'}>Chain:</span> {chain.name} ({chainId})</p>
              <p>
                <span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : isLitvm ? 'text-[#00F2FE]' : 'text-white/60'}>Contract:</span>{" "}
                {contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : "Not configured"}
              </p>
              <p><span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : isLitvm ? 'text-[#00F2FE]' : 'text-white/60'}>Score:</span> {score}/{total}</p>
              <p><span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : isLitvm ? 'text-[#00F2FE]' : 'text-white/60'}>Estimated gas:</span> {estimatedGas ? estimatedGas.toString() : "Estimating..."}</p>
              <p><span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : isSoneium ? 'text-[#0047FF]' : isArc ? 'text-[#4D8EE9]' : isLitvm ? 'text-[#00F2FE]' : 'text-white/60'}>From:</span> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</p>
            </div>
            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                className={`flex-1 ${isMegaEth ? 'rounded-none border-white/20 text-white uppercase' : isInk ? 'rounded-full' : isUnichain ? 'rounded-2xl' : isBase ? 'rounded-full border-black/10 text-black hover:bg-black/5' : isSoneium ? 'rounded-2xl border-[#0047FF]/20 text-white' : isArc ? 'rounded-2xl border-[#4D8EE9]/20 text-white' : isLitvm ? 'rounded-2xl border-[#00F2FE]/20 text-[#00F2FE] hover:bg-[#00F2FE]/10' : ''}`}
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
                  : isLitvm
                    ? 'rounded-2xl bg-[#00F2FE] hover:bg-[#00C9DB] text-[#0B192C] font-bold shadow-lg shadow-[#00F2FE]/20'
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
