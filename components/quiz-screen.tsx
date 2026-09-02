"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { Question } from "@/lib/quiz-data"
import { cn } from "@/lib/utils"
import { ChevronRight, CheckCircle, XCircle } from "lucide-react"
import { useChainUI } from "@/hooks/use-chain-ui"

interface QuizScreenProps {
  questions: Question[]
  onComplete: (answers: number[]) => void
}

export function QuizScreen({ questions, onComplete }: QuizScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const answersRef = useRef<number[]>(Array(questions.length).fill(-1))

  const ui = useChainUI()
  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

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
      return cn(
        'border-2 transition-all duration-300 hover:scale-[1.01] hover:shadow-md',
        ui.radiusSm,
        ui.isLight
          ? 'border-black/5 bg-black/5 hover:border-[#0052FF]/40 text-black hover:bg-black/10'
          : 'border-white/10 bg-white/5 hover:border-[var(--chain-accent)] hover:bg-white/[0.08] text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]',
      )
    }

    const isCorrect = index === question.correctIndex
    const isSelected = selectedAnswer === index

    if (isCorrect) {
      return cn(
        'border-2 transition-all duration-300 scale-[1.01] shadow-[0_0_15px_rgba(34,197,94,0.2)]', 
        ui.radiusSm, 
        'border-[#22c55e] bg-[rgba(34,197,94,0.15)] text-[#22c55e]'
      )
    }
    if (isSelected && !isCorrect) {
      return cn(
        'border-2 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]', 
        ui.radiusSm, 
        'border-[#ef4444] bg-[rgba(239,68,68,0.15)] text-[#ef4444]'
      )
    }
    return cn(
      ui.radiusSm,
      'transition-all duration-300 opacity-30 scale-[0.99]',
      ui.isLight
        ? 'border-2 border-black/5 bg-black/5 text-black'
        : 'border-2 border-white/10 bg-white/5 text-white',
    )
  }

  return (
    <div className={cn('flex min-h-dvh flex-col items-center justify-center px-4 py-6 pt-16 sm:py-12 sm:pt-28', ui.page)}>
      <div
        className="relative z-10 w-full max-w-2xl"
        style={{ '--chain-accent': ui.accent } as React.CSSProperties}
      >
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 sm:mb-3 flex-wrap gap-1">
            <span className={cn('text-xs sm:text-sm font-medium', ui.bodyMuted)}>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            {isAnswered && (
              <span className={cn('text-xs sm:text-sm font-medium', ui.accentClass)}>
                Answer recorded
              </span>
            )}
          </div>
          <div className={cn("relative overflow-hidden h-3 sm:h-2", ui.progressTrack)}>
            <div
              className={cn('h-full transition-all duration-500 ease-out relative overflow-hidden', ui.radiusSm === 'rounded-none' ? 'rounded-none' : 'rounded-full')}
              style={{
                width: `${progress}%`,
                backgroundColor: ui.accent,
                boxShadow: `0 0 16px ${ui.accent}`,
              }}
            >
              {/* Subtle shimmer over the progress bar */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[progressShimmer_2s_infinite]"
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
          </div>
        </div>

        {/* Question card */}
        <div 
          className={cn('p-6 md:p-8 mb-6 border transition-all duration-300 relative overflow-hidden', ui.cardStrong)}
          style={{ borderTop: `3px solid ${ui.accent}` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-white/[0.03] pointer-events-none" />
          <h2 className={cn(
            'text-lg md:text-2xl font-bold text-balance relative z-10 leading-snug',
            ui.isLight ? 'text-black' : 'text-white',
            ui.fontSerif && 'font-serif italic',
            ui.key === 'litvm' && 'text-[#00F2FE]',
          )}>
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
                  'w-full text-left px-3 md:px-5 py-4 md:py-4 min-h-[48px] transition-all duration-300 flex items-center justify-between gap-2 md:gap-4 cursor-pointer group',
                  ui.radiusSm,
                  getOptionStyles(index),
                )}
              >
                <div className="flex items-center gap-4">
                  <span className={cn(
                    'flex items-center justify-center size-10 md:size-8 text-sm font-bold border transition-all duration-300 shrink-0',
                    ui.radiusSm === 'rounded-full' ? 'rounded-full' : ui.radiusSm,
                    isAnswered && isCorrect && 'bg-[#22c55e]/20 border-[#22c55e]/50 text-[#22c55e]',
                    isAnswered && isSelected && !isCorrect && 'bg-[#ef4444]/20 border-[#ef4444]/50 text-[#ef4444]',
                    !isAnswered && (
                      ui.isLight 
                        ? 'bg-white text-black/40 border-black/5 group-hover:border-[#0052FF]/30 group-hover:text-[#0052FF]' 
                        : 'bg-white/5 text-white/50 border-white/10 group-hover:border-[var(--chain-accent)] group-hover:text-white'
                    ),
                  )}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={cn('font-semibold transition-all duration-300', ui.isLight ? 'text-black' : 'text-white/90 group-hover:text-white')}>{option}</span>
                </div>
                {isAnswered && isCorrect && <CheckCircle className="size-5 shrink-0 text-[#22c55e] animate-scale-in" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="size-5 shrink-0 text-[#ef4444] animate-scale-in" />}
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {isAnswered && question.correctIndex !== undefined && (
          <div className={cn(
            'mb-8 p-3 sm:p-4 border flex items-center gap-2 sm:gap-3 animate-slide-up',
            ui.radiusSm,
            selectedAnswer === question.correctIndex
              ? 'bg-[rgba(34,197,94,0.15)] border-[#22c55e] text-[#22c55e]'
              : 'bg-[rgba(239,68,68,0.15)] border-[#ef4444] text-[#ef4444]',
          )}>
            {selectedAnswer === question.correctIndex ? (
              <>
                <CheckCircle className="size-5 shrink-0" />
                <span className="font-bold text-sm sm:text-base">Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="size-5 shrink-0" />
                <div className="text-xs sm:text-sm leading-snug">
                  <span className="font-bold">Incorrect.</span>{' '}
                  <span className="opacity-90">The correct answer was{' '}</span>
                  <span className="font-bold underline">{question.options[question.correctIndex]}</span>
                </div>
              </>
            )}
          </div>
        )}

        {isAnswered && (
          <div className="flex justify-end">
            <Button size="lg" onClick={handleNext} className={cn('px-6 md:px-8 h-12', ui.btnPrimary)}>
              {currentQuestion < questions.length - 1 ? (
                <>
                  <span className="hidden sm:inline">Next Question</span><span className="sm:hidden">Next</span>
                  <ChevronRight className="size-4 md:size-5" />
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
