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
import { Trophy, Sparkles, Target, RotateCcw } from "lucide-react"
import { activeChainConfig } from "@/lib/active-chain-config"

interface ResultsScreenProps {
  score: number
  totalQuestions: number
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

export function ResultsScreen({ score, totalQuestions, onRestart, onScoreSubmitted }: ResultsScreenProps) {
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

    const result = await submitScore({ score, total }, { chainId })

    if (result.success) {
      setTxHash(result.hash)
      setTxState("confirmed")
      onScoreSubmitted?.()
      // Dispatch sync event for other tabs
      localStorage.setItem('quiz-cooldown-sync', Date.now().toString())
    } else {
      setTxError(result.error)
      setTxState("failed")
    }
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

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center px-4 py-12 ${isMegaEth ? 'font-mono' : ''}`}>
      {/* Background decoration removed - handled by ThemeBackground */}

      <div className="relative z-10 w-full max-w-md">
        {/* Results card */}
        <div className={`p-8 text-center border ${
          isMegaEth 
            ? 'bg-black border-white/15 rounded-none' 
            : isInk
              ? 'rounded-3xl border-white/10 bg-white/5 backdrop-blur-lg shadow-[0_0_50px_rgba(123,97,255,0.05)]'
            : isUnichain
              ? 'rounded-2xl border-white/10 bg-white/5 backdrop-blur-lg shadow-[0_0_50px_rgba(255,0,122,0.05)]'
            : isBase
              ? 'rounded-2xl border-black/5 bg-[#f4f5f7] shadow-sm'
              : 'rounded-2xl border border-border bg-card/50 backdrop-blur-lg'
        }`}>
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className={`flex items-center justify-center size-16 border ${
              isMegaEth 
                ? 'bg-black border-[#00ff88] text-[#00ff88] rounded-none' 
                : isInk
                  ? 'rounded-full bg-[#7B61FF]/10 border-[#7B61FF]/20 text-[#7B61FF]'
                : isUnichain
                  ? 'rounded-xl bg-[#FF007A]/10 border-[#FF007A]/20 text-[#FF007A]'
                : isBase
                  ? 'rounded-full bg-[#0052FF]/10 border-[#0052FF]/20 text-[#0052FF]'
                : 'rounded-full bg-primary/10 border-primary/20'
            }`}>
              {getIcon()}
            </div>
          </div>

          {/* Score display */}
          <div className="mb-4">
            <div className={`text-5xl md:text-7xl font-bold mb-2 ${isMegaEth ? 'font-mono uppercase text-white' : isUnichain ? 'font-serif italic text-white' : isInk ? 'tracking-tighter text-white' : isBase ? 'tracking-tighter text-black' : 'text-white'}`}>
              {score} / {total}
            </div>
            <div className={`text-lg ${isMegaEth ? 'text-white/40 uppercase' : isInk || isUnichain ? 'text-white/60' : isBase ? 'text-black/40' : 'text-muted-foreground'}`}>
              {percentage}% correct
            </div>
          </div>

          {/* Message */}
          <p className={`text-lg mb-8 text-balance ${isMegaEth ? 'text-white uppercase' : isInk || isUnichain ? 'text-white tracking-tight' : isBase ? 'text-black tracking-tight' : 'text-foreground'}`}>
            {getMessage()}
          </p>

          {/* Submit score button */}
          <div className="space-y-4">
            <Button
              size="lg"
              onClick={openSubmitConfirmation}
              disabled={
                txState === "pending" ||
                hasSubmittedThisSession ||
                isCheckingCooldown ||
                isCooldownActive
              }
              className={`w-full h-12 transition-all duration-200 ${
                isMegaEth 
                  ? 'rounded-none border border-[#00ff88] bg-black text-[#00ff88] hover:bg-[#00ff88] hover:text-black font-mono uppercase' 
                : isInk
                  ? 'rounded-full bg-[#7B61FF] hover:bg-[#6c54e6] text-white font-bold shadow-[0_0_20px_rgba(123,97,255,0.4)]'
                : isUnichain
                  ? 'rounded-2xl bg-[#FF007A] hover:bg-[#d60066] text-white font-bold shadow-[0_0_20px_rgba(255,0,122,0.4)]'
                : isBase
                  ? 'rounded-full bg-[#0052FF] hover:bg-[#0047FF] text-white font-bold shadow-lg shadow-[#0052FF]/20'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground font-medium'
              }`}
            >
              {hasSubmittedThisSession
                ? "Score already submitted"
                : isCheckingCooldown
                  ? "Checking cooldown..."
                  : isCooldownActive
                    ? `Next submission in ${formatCooldown(cooldownRemaining)}`
                    : "Submit Score On-Chain"}
            </Button>
            {wrongNetwork ? (
              <div className={`p-3 text-left ${isMegaEth ? 'border border-amber-500 bg-black' : 'rounded-lg border border-amber-500/30 bg-amber-500/10'}`}>
                <p className={`text-sm ${isMegaEth ? 'text-amber-500 uppercase' : 'text-amber-300'}`}>Wrong Network. Please switch to {chain.name}.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className={`mt-2 ${isMegaEth ? 'rounded-none border-white/20 text-white uppercase' : ''}`}
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

            <p className={`text-xs ${isMegaEth ? 'text-white/30 uppercase' : isInk || isUnichain ? 'text-white/40' : isBase ? 'text-black/40' : 'text-muted-foreground'}`}>
              Submits on the connected network ({chain.name}, id {chain.id}).
            </p>

            {/* Transaction status */}
            <TransactionStatus
              state={txState}
              txHash={txHash}
              chainId={chainId}
              errorMessage={txError}
            />
            {txPendingWarning ? (
              <p className={`text-xs ${isMegaEth ? 'text-amber-500 uppercase' : 'text-amber-400'}`}>{txPendingWarning}</p>
            ) : null}

            {/* Restart button */}
            <Button
              variant="outline"
              size="lg"
              onClick={onRestart}
              className={`w-full mt-4 transition-all duration-200 ${
                isMegaEth 
                  ? 'rounded-none border border-white/20 bg-black text-white hover:border-white font-mono uppercase' 
                : isInk
                  ? 'rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10'
                : isUnichain
                  ? 'rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10'
                : isBase
                  ? 'rounded-full border border-black/5 bg-white text-black hover:bg-black/5'
                  : 'border-border hover:bg-card'
              }`}
            >
              <RotateCcw className="mr-2 size-4" />
              Play Again
            </Button>
          </div>
        </div>
      </div>

      {showConfirmModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 text-left shadow-2xl border ${isMegaEth ? 'border-[#00ff88] bg-black rounded-none text-white' : isInk ? 'rounded-3xl border-white/10 bg-[#0A0A0F] text-white' : isUnichain ? 'rounded-2xl border-white/10 bg-[#0A0A0F] text-white' : isBase ? 'rounded-2xl border-black/5 bg-white text-black' : 'rounded-2xl border border-white/10 bg-[#161923] text-white'}`}>
            <h3 className={`mb-4 text-xl font-bold ${isMegaEth ? 'uppercase font-mono text-[#00ff88]' : isUnichain ? 'font-serif italic' : isBase ? 'text-black' : ''}`}>
              {isMegaEth ? '// CONFIRM TRANSACTION' : 'Confirm Transaction'}
            </h3>
            <div className={`space-y-3 text-sm ${isMegaEth ? 'font-mono uppercase text-white/70' : isInk || isUnichain ? 'text-white/70' : isBase ? 'text-black/60' : 'text-white/85'}`}>
              <p><span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : 'text-white/60'}>Chain:</span> {chain.name} ({chainId})</p>
              <p>
                <span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : 'text-white/60'}>Contract:</span>{" "}
                {contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : "Not configured"}
              </p>
              <p><span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : 'text-white/60'}>Score:</span> {score}/{total}</p>
              <p><span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : 'text-white/60'}>Estimated gas:</span> {estimatedGas ? estimatedGas.toString() : "Estimating..."}</p>
              <p><span className={isMegaEth ? 'text-[#00ff88]' : isInk ? 'text-[#7B61FF]' : isUnichain ? 'text-[#FF007A]' : isBase ? 'text-[#0052FF]' : 'text-white/60'}>From:</span> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</p>
            </div>
            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                className={`flex-1 ${isMegaEth ? 'rounded-none border-white/20 text-white uppercase' : isInk ? 'rounded-full' : isUnichain ? 'rounded-2xl' : isBase ? 'rounded-full border-black/10 text-black hover:bg-black/5' : ''}`}
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
