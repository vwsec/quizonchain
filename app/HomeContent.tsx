"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { HomeScreen } from "@/components/home-screen"
import { QuizScreen } from "@/components/quiz-screen"
import { ResultsScreen } from "@/components/results-screen"
import type { Question } from "@/lib/quiz-data"
import { useChainId, useAccount, usePublicClient } from "wagmi"
import { getTimeUntilNextSubmissionSeconds } from "@/lib/submitScore"

type Screen = "home" | "quiz" | "results"

type GenerateQuizApiQuestion = {
  id?: number
  question: string
  options: string[]
  correctIndex?: number
}

type GenerateQuizApiResponse = {
  error?: string
  questions?: GenerateQuizApiQuestion[]
  quizToken?: string
  ecosystem?: string
}

function normalizeQuestions(raw: GenerateQuizApiQuestion[]): Question[] {
  return raw.map((q, i) => ({
    id: q.id ?? i + 1,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex ?? 0,
  }))
}

function QuizApp() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const chainId = useChainId()
  const chainIdRef = useRef(chainId)
  useEffect(() => {
    chainIdRef.current = chainId
  }, [chainId])

  const { isConnected } = useAccount()
  const [screen, setScreen] = useState<Screen>("home")
  const [finalScore, setFinalScore] = useState(0)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [quizToken, setQuizToken] = useState<string | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [globalRefreshKey, setGlobalRefreshKey] = useState(0)

  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [isCheckingCooldown, setIsCheckingCooldown] = useState(true)
  const publicClient = usePublicClient()
  const { address } = useAccount()

  const fetchQuiz = useCallback(async () => {
    setQuizLoading(true)
    setQuizError(null)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)
    try {
      const res = await fetch(`/api/generate-quiz?chainId=${chainId}`, {
        signal: controller.signal,
      })
      if (!res.ok) {
        const text = await res.text()
        if (res.status === 429) {
          throw new Error("Too many quizzes generated recently. Please wait a moment and try again.")
        }
        throw new Error("Couldn't load the quiz right now. Please try again.")
      }
      const data = (await res.json()) as GenerateQuizApiResponse
      if (!data.questions?.length) {
        throw new Error("Something went wrong loading the quiz. Please try again.")
      }
      if (!data.quizToken) {
        throw new Error("Something went wrong loading the quiz. Please try again.")
      }
      
      // Safety: Only update state if we are still on the same chain as when the request started
      if (chainIdRef.current !== chainId) {
        return;
      }

      // Final dynamic safety check: Verify the ecosystem returned by API matches our current chain
      const expectedEcosystem = 
        chainId === 8453 ? "Base" :
        chainId === 130 ? "Unichain" :
        chainId === 1868 ? "Soneium" :
        [57073].includes(chainId) ? "Ink" : null;

      if (expectedEcosystem && data.ecosystem && data.ecosystem !== expectedEcosystem) {
        console.warn(`[QuizApp] Ecosystem mismatch: expected ${expectedEcosystem}, got ${data.ecosystem}. Retrying...`)
        return void fetchQuiz();
      }

      setQuestions(normalizeQuestions(data.questions))
      setQuizToken(data.quizToken)
    } catch (e) {
      if (chainIdRef.current !== chainId) return;
      if (e instanceof Error && e.name === "AbortError") {
        setQuizError("Request timed out. Please try again.")
      } else {
        setQuizError(e instanceof Error ? e.message : "Something went wrong loading the quiz. Please try again.")
      }
      setQuestions([])
      setQuizToken(null)
    } finally {
      clearTimeout(timeout)
      setQuizLoading(false)
    }
  }, [chainId])

  // Automatically clear rate limit error after 60 seconds
  useEffect(() => {
    if (quizError?.includes("Too many quizzes")) {
      const timer = setTimeout(() => {
        setQuizError(null)
      }, 60000)
      return () => clearTimeout(timer)
    }
  }, [quizError])

  useEffect(() => {
    setQuestions([])
    setQuizToken(null)
    setQuizError(null)
    setFinalScore(0)
    setUserAnswers([])
    setScreen("home")
  }, [chainId])

  // Fetch cooldown status from on-chain
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
  }, [isConnected, address, chainId, publicClient, globalRefreshKey])

  // Cross-tab cooldown sync logic
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'quiz-cooldown-sync') {
        setGlobalRefreshKey(k => k + 1)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Timer for cooldown
  useEffect(() => {
    if (cooldownRemaining <= 0) return
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownRemaining])

  useEffect(() => {
    // ONLY fetch quiz if connected, no questions exist, and COOLDOWN is finished
    if (isConnected && questions.length === 0 && !quizLoading && !quizError && cooldownRemaining === 0 && !isCheckingCooldown) {
      void fetchQuiz()
    }
  }, [isConnected, fetchQuiz, questions.length, quizLoading, quizError, cooldownRemaining, isCheckingCooldown])

  const handleStartQuiz = () => {
    setScreen("quiz")
  }

  const handleQuizComplete = async (answers: number[]) => {
    if (!quizToken) {
      setQuizError("Quiz session expired. Please shuffle and try again.")
      setScreen("home")
      return
    }
    try {
      const res = await fetch("/api/verify-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizToken, answers }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Quiz API error ${res.status}: ${text.slice(0, 200)}`)
      }
      const data = (await res.json()) as { score?: number; error?: string }
      if (typeof data.score !== "number") {
        throw new Error(data.error ?? "Failed to verify quiz answers")
      }
      setFinalScore(data.score)
      setUserAnswers(answers)
      setScreen("results")
    } catch (e) {
      setQuizError(e instanceof Error ? e.message : "Failed to verify quiz answers")
      setScreen("home")
    }
  }

  const handleRestart = () => {
    setFinalScore(0)
    setUserAnswers([])
    setQuestions([])
    setQuizToken(null)
    setScreen("home")
    setGlobalRefreshKey((k) => k + 1)
  }

  if (!mounted) return null

  return (
    <main className="relative z-10 min-h-screen">
        {screen === "home" && (
          <HomeScreen
            onStartQuiz={handleStartQuiz}
            onShuffleQuiz={() => void fetchQuiz()}
            onRetryQuiz={() => void fetchQuiz()}
            quizLoading={quizLoading}
            quizError={quizError}
            hasQuiz={questions.length >= 5}
            nftRefreshKey={globalRefreshKey}
            cooldownRemaining={cooldownRemaining}
            isCheckingCooldown={isCheckingCooldown}
          />
        )}
        {screen === "quiz" && questions.length > 0 && (
          <QuizScreen questions={questions} onComplete={handleQuizComplete} />
        )}
        {screen === "results" && (
          <ResultsScreen
            score={finalScore}
            totalQuestions={questions.length || 5}
            quizToken={quizToken || undefined}
            userAnswers={userAnswers}
            onRestart={handleRestart}
            onScoreSubmitted={() => setGlobalRefreshKey(k => k + 1)}
          />
        )}
      </main>
    )
}

export default function HomeContent() {
  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card/50 p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              An unexpected error occurred while loading the quiz.
            </p>
            <button
              type="button"
              onClick={resetErrorBoundary}
              className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </main>
      )}
    >
      <QuizApp />
    </ErrorBoundary>
  )
}
