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

import { activeChainConfig } from "@/lib/active-chain-config"

export function QuizScreen({ questions, onComplete }: QuizScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const answersRef = useRef<number[]>(Array(questions.length).fill(-1))

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const isMegaEth = activeChainConfig.name === 'MegaETH'
  const isInk = activeChainConfig.name === 'Ink'
  const isUnichain = activeChainConfig.name === 'Unichain'
  const isBase = activeChainConfig.name === 'Base'
  const isSoneium = activeChainConfig.name === 'Soneium'

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

  const getOptionStyles = (index: number) => {
    if (!isAnswered) {
      if (isMegaEth) {
        return selectedAnswer === index
          ? "border-[#00ff88] bg-black text-[#00ff88]"
          : "border-white/15 bg-black hover:border-white text-white"
      }
      if (isInk) {
        return selectedAnswer === index
          ? "border-[#7B61FF] bg-[#7B61FF]/10"
          : "border-white/10 bg-white/5 hover:border-[#7B61FF]/50 text-white"
      }
      if (isUnichain) {
        return selectedAnswer === index
          ? "border-[#FF007A] bg-[#FF007A]/10"
          : "border-white/10 bg-white/5 hover:border-[#FF007A]/50 text-white"
      }
      if (isBase) {
        return selectedAnswer === index
          ? "border-[#0052FF] bg-[#0052FF]/5 text-black"
          : "border-black/5 bg-black/5 hover:border-[#0052FF]/30 text-black"
      }
      if (isSoneium) {
        return selectedAnswer === index
          ? "border-[#0047FF] bg-[#0047FF]/10 text-white"
          : "border-white/10 bg-white/5 hover:border-[#0047FF]/50 text-white"
      }
      return selectedAnswer === index
        ? "border-primary bg-primary/10"
        : "border-border bg-card/50 hover:border-primary/50 hover:bg-card text-foreground"
    }

    const isCorrect = index === question.correctIndex
    const isSelected = selectedAnswer === index

    if (isCorrect) {
      return isMegaEth 
        ? "border-[#00ff88] bg-black text-[#00ff88]" 
        : "border-[#22c55e] bg-[rgba(34,197,94,0.15)] text-[#22c55e]"
    }
    if (isSelected && !isCorrect) {
      return isMegaEth
        ? "border-red-500 bg-black text-red-500"
        : "border-[#ef4444] bg-[rgba(239,68,68,0.15)] text-[#ef4444]"
    }
    return isMegaEth
      ? "border-white/5 bg-black opacity-30 text-white"
      : isBase
        ? "border-black/5 bg-black/5 opacity-40 text-black"
        : "border-border bg-card/30 opacity-40 text-foreground"
  }

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center px-4 py-12 ${isMegaEth ? 'font-mono' : ''}`}>
      {/* Background decoration removed - handled by ThemeBackground */}

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium ${isMegaEth ? 'text-white/40 uppercase' : isBase ? 'text-black/40' : 'text-muted-foreground'}`}>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            {isAnswered && (
              <span className={`text-sm font-medium ${isMegaEth ? 'text-[#00ff88] uppercase' : isBase ? 'text-[#0052FF]' : 'text-primary'}`}>
                Answer recorded
              </span>
            )}
          </div>
          <Progress 
            value={progress} 
            className={`h-1 ${isMegaEth ? 'bg-white/10 rounded-none' : isInk || isUnichain ? 'bg-white/5 h-2 rounded-full' : isBase ? 'h-2 bg-black/5 rounded-full' : isSoneium ? 'h-2 bg-white/10 rounded-full' : 'h-2 bg-card'}`} 
            style={isMegaEth ? { '--progress-fill': '#00ff88' } as any : isInk ? { '--progress-fill': '#7B61FF' } as any : isUnichain ? { '--progress-fill': '#FF007A' } as any : isBase ? { '--progress-fill': '#0052FF' } as any : isSoneium ? { '--progress-fill': '#0047FF' } as any : undefined}
          />
        </div>

        {/* Question card */}
        <div className={`p-6 md:p-8 mb-6 border ${
          isMegaEth 
            ? 'border-white/15 bg-black rounded-none' 
            : isInk
              ? 'rounded-3xl border-white/10 bg-white/5 backdrop-blur-lg'
            : isUnichain
              ? 'rounded-2xl border-white/10 bg-white/5 backdrop-blur-lg'
            : isBase
              ? 'rounded-2xl border-black/5 bg-[#f4f5f7] shadow-sm'
            : isSoneium
              ? 'rounded-2xl border-[#0047FF]/20 bg-white/[0.03] backdrop-blur-xl shadow-[0_0_50px_rgba(0,71,255,0.05)]'
              : 'rounded-2xl border-border bg-card/50 backdrop-blur-lg'
        }`}>
          <h2 className={`text-xl md:text-2xl font-semibold text-balance ${isMegaEth ? 'uppercase text-white' : isUnichain ? 'font-serif italic text-white' : isInk ? 'tracking-tight text-white' : isBase ? 'tracking-tighter text-black' : isSoneium ? 'tracking-tight text-white' : 'text-white'}`}>
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
                  "w-full text-left px-5 py-4 transition-all duration-200 flex items-center justify-between gap-4",
                  isMegaEth ? "rounded-none border border-white/15" : isInk ? "rounded-full border-2 backdrop-blur-md" : isUnichain ? "rounded-2xl border-2 backdrop-blur-md" : isSoneium ? "rounded-xl border border-[#0047FF]/20 backdrop-blur-md" : "rounded-xl border-2 backdrop-blur-md",
                  getOptionStyles(index)
                )}
              >
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "flex items-center justify-center size-8 text-sm font-medium border",
                    isMegaEth ? "rounded-none" : isInk ? "rounded-full" : isUnichain ? "rounded-xl" : "rounded-lg",
                    isAnswered && isCorrect ? (isMegaEth ? "bg-[#00ff88] text-black border-[#00ff88]" : isSoneium ? "bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]" : "bg-[#22c55e]/20 border-[#22c55e]/50 text-[#22c55e]") :
                    isAnswered && isSelected && !isCorrect ? (isMegaEth ? "bg-red-500 text-black border-red-500" : "bg-[#ef4444]/20 border-[#ef4444]/50 text-[#ef4444]") :
                    (isMegaEth ? "bg-black text-white/50 border-white/10" : isBase ? "bg-white text-black/40 border-black/5" : isSoneium ? "bg-white/[0.05] text-white/50 border-[#0047FF]/20" : "bg-white/5 text-white/50 border-white/10")
                  )}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={`font-medium ${isMegaEth ? 'uppercase' : isBase ? 'text-black' : isSoneium ? 'text-white' : ''}`}>{option}</span>
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
            "mb-8 p-4 border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300",
            isMegaEth ? "rounded-none uppercase text-xs tracking-wider" : isInk ? "rounded-full px-6" : isSoneium ? "rounded-xl border-[#0047FF]/30 bg-[#0047FF]/10 text-white" : "rounded-xl",
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
              className={`transition-all duration-200 ${
                isMegaEth 
                  ? 'rounded-none border border-[#00ff88] bg-black text-[#00ff88] hover:bg-[#00ff88] hover:text-black font-mono uppercase' 
                : isInk
                  ? 'rounded-full bg-[#7B61FF] hover:bg-[#6c54e6] text-white font-bold px-8 shadow-[0_0_20px_rgba(123,97,255,0.4)]'
                : isUnichain
                  ? 'rounded-2xl bg-[#FF007A] hover:bg-[#d60066] text-white font-bold px-8 shadow-[0_0_20px_rgba(255,0,122,0.4)]'
                : isBase
                  ? 'rounded-full bg-[#0052FF] hover:bg-[#0047FF] text-white font-bold px-8 shadow-lg shadow-[#0052FF]/20'
                : isSoneium
                  ? 'rounded-xl bg-[#0047FF] hover:bg-[#003bd9] text-white font-bold px-8 shadow-[0_0_20px_rgba(0,71,255,0.3)]'
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
