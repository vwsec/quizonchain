"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Question } from "@/lib/quiz-data"
import { cn } from "@/lib/utils"
import { ChevronRight, CheckCircle, XCircle } from "lucide-react"

interface QuizScreenProps {
  questions: Question[]
  onComplete: (answers: number[]) => void
}

import { useActiveChain } from "@/hooks/use-active-chain"

export function QuizScreen({ questions, onComplete }: QuizScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const answersRef = useRef<number[]>(Array(questions.length).fill(-1))

  const { chainConfig: cfg, isConnected } = useActiveChain()

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const isMegaEth = isConnected && cfg?.name === 'MegaETH'
  const isInk = isConnected && cfg?.name === 'Ink'
  const isUnichain = isConnected && cfg?.name === 'Unichain'
  const isBase = isConnected && cfg?.name === 'Base'
  const isSoneium = isConnected && cfg?.name === 'Soneium'
  const isLitvm = isConnected && cfg?.name === 'LitVM'
  const isArc = isConnected && cfg?.name === 'Arc Testnet'

  const handleSelectAnswer = (index: number) => {
    if (isAnswered) return
    setSelectedAnswer(index)
    setIsAnswered(true)
    answersRef.current[currentQuestion] = index
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      onComplete(answersRef.current)
    }
  }

  const getChainAccentColor = () => {
    if (isMegaEth) return '#00ff88'
    if (isInk) return '#8b5cf6'
    if (isUnichain) return '#FF007A'
    if (isBase) return '#0052FF'
    if (isSoneium) return '#0047FF'
    if (isLitvm) return '#00F2FE'
    if (isArc) return '#4D8EE9'
    return '#0047FF'
  }

  const chainAccent = getChainAccentColor()

  const getOptionStyles = (index: number) => {
    if (!isAnswered) {
      const baseSelected = `border-2 ${isMegaEth ? 'rounded-none' : isInk ? 'rounded-full' : isUnichain ? 'rounded-2xl' : 'rounded-xl'}`
      const baseUnselected = `${isMegaEth ? 'rounded-none border border-white/15' : isInk ? 'rounded-full border-2' : isUnichain ? 'rounded-2xl border-2' : 'rounded-xl border-2'}`
      
      if (selectedAnswer === index) {
        return `${baseSelected} ${isMegaEth ? 'border-[#00ff88] bg-black text-[#00ff88]' : isLitvm ? 'border-[#00F2FE] bg-[#00F2FE]/10 text-white' : 'border-[var(--chain-accent)] bg-[var(--chain-accent)]/10 text-white'}`
      }
      return `${baseUnselected} ${
        isMegaEth ? 'border-white/15 bg-black hover:border-white text-white' :
        isLitvm ? 'border-[#00F2FE]/20 bg-[#0B192C] hover:border-[#00F2FE]/50 text-white' :
        isBase ? 'border-black/5 bg-black/5 hover:border-[#0052FF]/30 text-black hover:bg-black/10' :
        'border-white/10 bg-white/5 hover:border-[var(--chain-accent)]/50 hover:bg-white/[0.08] text-white'
      }`
    }

    const isCorrect = index === question.correctIndex
    const isSelected = selectedAnswer === index

    if (isCorrect) {
      return isMegaEth 
        ? "border-2 border-[#00ff88] bg-black text-[#00ff88]" 
        : `border-2 ${isMegaEth ? 'rounded-none' : isInk ? 'rounded-full' : isUnichain ? 'rounded-2xl' : 'rounded-xl'} border-[#22c55e] bg-[rgba(34,197,94,0.15)] text-[#22c55e]`
    }
    if (isSelected && !isCorrect) {
      return isMegaEth
        ? "border-2 border-red-500 bg-black text-red-500"
        : `border-2 ${isMegaEth ? 'rounded-none' : isInk ? 'rounded-full' : isUnichain ? 'rounded-2xl' : 'rounded-xl'} border-[#ef4444] bg-[rgba(239,68,68,0.15)] text-[#ef4444]`
    }
    return isMegaEth
      ? "border border-white/5 bg-black opacity-30 text-white"
      : isBase
        ? "border-2 border-black/5 bg-black/5 opacity-40 text-black"
      : isLitvm
        ? "border border-[#00F2FE]/10 bg-[#0B192C] opacity-40 text-white/50"
        : "border-2 border-white/10 bg-white/5 opacity-40 text-white"
  }

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center px-4 py-12 ${isMegaEth || isLitvm ? 'font-mono' : ''}`}>
      {/* Background decoration removed - handled by ThemeBackground */}

      <div className="relative z-10 w-full max-w-2xl" style={{ '--chain-accent': chainAccent } as React.CSSProperties}>
        {/* Progress section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium ${isMegaEth ? 'text-white/40 uppercase' : isLitvm ? 'text-[#00F2FE]/40 lowercase' : isBase ? 'text-black/40' : 'text-muted-foreground'}`}>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            {isAnswered && (
              <span className={`text-sm font-medium ${isMegaEth ? 'text-[#00ff88] uppercase' : isLitvm ? 'text-[#00F2FE] lowercase' : isBase ? 'text-[#0052FF]' : 'text-primary'}`}>
                Answer recorded
              </span>
            )}
          </div>
          <div className={`relative h-2 w-full overflow-hidden ${isMegaEth ? 'bg-white/10 rounded-none' : isLitvm ? 'bg-white/5 rounded-2xl' : isInk || isUnichain ? 'bg-white/5 rounded-full' : isBase ? 'bg-black/5 rounded-full' : isSoneium ? 'bg-white/10 rounded-full' : isArc ? 'bg-white/10 rounded-full' : 'bg-white/10 rounded-full'}`}>
            <div
              className={`h-full transition-all duration-500 ease-out ${isMegaEth ? 'rounded-none' : 'rounded-full'}`}
              style={{
                width: `${progress}%`,
                backgroundColor: isMegaEth ? "#00ff88" : isLitvm ? "#00F2FE" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isSoneium ? "#0047FF" : isArc ? "#4D8EE9" : "#0047FF",
                boxShadow: `0 0 12px ${isMegaEth ? "#00ff88" : isLitvm ? "#00F2FE" : isInk ? "#7B61FF" : isUnichain ? "#FF007A" : isBase ? "#0052FF" : isSoneium ? "#0047FF" : isArc ? "#4D8EE9" : "#0047FF"}66`,
                transition: "width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className={`p-5 md:p-8 mb-6 border transition-all duration-300 ${
          isMegaEth 
            ? 'border-white/15 bg-black rounded-none hover:border-[#00ff88]/30' 
            : isInk
              ? 'rounded-2xl md:rounded-3xl border-white/10 bg-white/5 backdrop-blur-lg hover:border-[#8b5cf6]/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.05)]'
            : isUnichain
              ? 'rounded-xl md:rounded-2xl border-white/10 bg-white/5 backdrop-blur-lg hover:border-[#FF007A]/30'
            : isBase
              ? 'rounded-xl md:rounded-2xl border-black/5 bg-[#f4f5f7] hover:border-[#0052FF]/20'
            : isSoneium
              ? 'rounded-xl md:rounded-2xl border-[#0047FF]/20 bg-white/[0.03] backdrop-blur-xl hover:border-[#0047FF]/30'
            : isLitvm
              ? 'rounded-xl md:rounded-2xl border-[#00F2FE]/20 bg-[#0B192C] backdrop-blur-xl hover:border-[#00F2FE]/40 hover:shadow-[0_0_50px_rgba(0,242,254,0.12)]'
            : isArc
              ? 'rounded-xl md:rounded-2xl border-[#4D8EE9]/20 bg-white/[0.02] backdrop-blur-xl hover:border-[#4D8EE9]/30'
              : 'rounded-xl md:rounded-2xl border-border bg-card/50 backdrop-blur-lg'
        }`}>
          <h2 className={`text-lg md:text-2xl font-semibold text-balance ${isMegaEth ? 'uppercase text-white' : isLitvm ? 'text-[#00F2FE]' : isUnichain ? 'font-serif italic text-white' : isInk ? 'tracking-tight text-white' : isBase ? 'tracking-tighter text-black' : isSoneium ? 'tracking-tight text-white' : 'text-white'}`}>
            {question.question}
          </h2>
        </div>

        {/* Answer options */}
        <div className="grid gap-3 mb-6">
          {question.options.map((option, index) => {
            const isCorrect = index === question.correctIndex
            const isSelected = selectedAnswer === index

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectAnswer(index)}
                disabled={isAnswered}
                className={cn(
                  "w-full text-left px-4 md:px-5 py-3 md:py-4 transition-all duration-200 flex items-center justify-between gap-3 md:gap-4",
                  isMegaEth ? "rounded-none border border-white/15" : isLitvm ? "rounded-xl border border-[#00F2FE]/20 backdrop-blur-md" : isInk ? "rounded-full border-2 backdrop-blur-md" : isUnichain ? "rounded-2xl border-2 backdrop-blur-md" : isSoneium ? "rounded-xl border border-[#0047FF]/20 backdrop-blur-md" : isArc ? "rounded-xl border border-[#4D8EE9]/20 backdrop-blur-md" : "rounded-xl border-2 backdrop-blur-md",
                  getOptionStyles(index)
                )}
              >
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "flex items-center justify-center size-8 text-sm font-medium border",
                    isMegaEth ? "rounded-none" : isInk ? "rounded-full" : isUnichain ? "rounded-xl" : "rounded-lg",
                    isAnswered && isCorrect ? (isMegaEth ? "bg-[#00ff88] text-black border-[#00ff88]" : isSoneium ? "bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]" : "bg-[#22c55e]/20 border-[#22c55e]/50 text-[#22c55e]") :
                    isAnswered && isSelected && !isCorrect ? (isMegaEth ? "bg-red-500 text-black border-red-500" : "bg-[#ef4444]/20 border-[#ef4444]/50 text-[#ef4444]") :
                    (isMegaEth ? "bg-black text-white/50 border-white/10" : isBase ? "bg-white text-black/40 border-black/5" : isSoneium ? "bg-white/[0.05] text-white/50 border-[#0047FF]/20" : isArc ? "bg-white/[0.05] text-white/50 border-[#4D8EE9]/20" : isLitvm ? "bg-[#0B192C] text-[#00F2FE]/50 border-[#00F2FE]/20" : "bg-white/5 text-white/50 border-white/10")
                  )}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={`font-medium ${isMegaEth ? 'uppercase' : isBase ? 'text-black' : isSoneium || isLitvm ? 'text-white' : ''}`}>{option}</span>
                </div>
                {isAnswered && isCorrect && (
                  <CheckCircle className="size-5 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="size-5 shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {/* Feedback Banner */}
        {isAnswered && question.correctIndex !== undefined && (
          <div className={cn(
            "mb-8 p-4 border flex items-center gap-3 animate-slide-up",
            isMegaEth ? "rounded-none uppercase text-xs tracking-wider" : isLitvm ? "rounded-xl border-[#00F2FE]/30 bg-[#00F2FE]/10 text-white font-mono text-xs" : isInk ? "rounded-full px-6 backdrop-blur-md" : isSoneium ? "rounded-xl border-[#0047FF]/30 bg-[#0047FF]/10 text-white backdrop-blur-md" : isArc ? "rounded-xl border-[#4D8EE9]/30 bg-[#4D8EE9]/10 text-white backdrop-blur-md" : "rounded-xl backdrop-blur-md",
            selectedAnswer === question.correctIndex 
              ? (isMegaEth ? "border-[#00ff88] text-[#00ff88]" : isSoneium ? "border-[#00ff88] text-[#00ff88]" : "bg-[rgba(34,197,94,0.15)] border-[#22c55e] text-[#22c55e]")
              : (isMegaEth ? "border-red-500 text-red-500" : "bg-[rgba(239,68,68,0.15)] border-[#ef4444] text-[#ef4444]")
          )}>
            {selectedAnswer === question.correctIndex ? (
              <>
                <CheckCircle className="size-5 shrink-0" />
                <span className="font-medium">Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="size-5 shrink-0" />
                <span className="font-medium">
                  Incorrect — the correct answer was <span className="font-bold underline">{question.options[question.correctIndex]}</span>
                </span>
              </>
            )}
          </div>
        )}

        {/* Next button */}
        {isAnswered && (
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleNext}
              className={`transition-all duration-300 group ${
                isMegaEth 
                  ? 'rounded-none border border-[#00ff88] bg-black text-[#00ff88] hover:bg-[#00ff88] hover:text-black font-mono uppercase' 
                : isInk
                  ? 'rounded-full bg-[#7B61FF] hover:bg-[#6c54e6] text-white font-bold px-8 hover:shadow-[0_0_30px_rgba(123,97,255,0.6)] hover:scale-[1.02] active:scale-[0.98]'
                : isUnichain
                  ? 'rounded-2xl bg-[#FF007A] hover:bg-[#d60066] text-white font-bold px-8 hover:shadow-[0_0_30px_rgba(255,0,122,0.6)] hover:scale-[1.02] active:scale-[0.98]'
                : isBase
                  ? 'rounded-full bg-[#0052FF] hover:bg-[#0047FF] text-white font-bold px-8 hover:shadow-[0_0_30px_rgba(0,82,255,0.5)] hover:scale-[1.02] active:scale-[0.98]'
                : isSoneium
                  ? 'rounded-xl bg-[#0047FF] hover:bg-[#003bd9] text-white font-bold px-8 hover:shadow-[0_0_30px_rgba(0,71,255,0.6)] hover:scale-[1.02] active:scale-[0.98]'
                : isLitvm
                  ? 'rounded-xl bg-[#00F2FE] hover:bg-[#00C9DB] text-[#0B192C] font-mono font-bold px-8 hover:shadow-[0_0_30px_rgba(0,242,254,0.6)] hover:scale-[1.02] active:scale-[0.98]'
                : isArc
                  ? 'rounded-xl bg-[#4D8EE9] hover:bg-[#3A7BD6] text-white font-bold px-8 hover:shadow-[0_0_30px_rgba(77,142,233,0.6)] hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground font-medium'
              }`}
            >
              {currentQuestion < questions.length - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="ml-2 size-5" />
                </>
              ) : (
                "See Results"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
