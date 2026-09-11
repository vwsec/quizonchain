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
  startIndex?: number
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
  const [startIndex, setStartIndex] = useState<number | null>(null)
  const [ecosystem, setEcosystem] = useState<string | null>(null)
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
      const params = new URLSearchParams({ chainId: String(chainId) })
      if (address) params.set("address", address.toLowerCase())
      const res = await fetch(`/api/generate-quiz?${params}`, {
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
        chainId === 4326 ? "MegaETH" :
        chainId === 4441 ? "LitVM" :
        chainId === 5042002 ? "Arc Testnet" :
        chainId === 2741 ? "Abstract" :
        chainId === 11155111 ? "Sepolia" :
        [57073].includes(chainId) ? "Ink" : null;

      if (expectedEcosystem && data.ecosystem && data.ecosystem !== expectedEcosystem) {
        console.warn(`[QuizApp] Ecosystem mismatch: expected ${expectedEcosystem}, got ${data.ecosystem}. Retrying...`)
        return void fetchQuiz();
      }

      setQuestions(normalizeQuestions(data.questions))
      setQuizToken(data.quizToken)
      if (data.ecosystem) setEcosystem(data.ecosystem)

      // Store the start index
      if (address && data.startIndex != null) {
        setStartIndex(data.startIndex)
      } else {
        setStartIndex(null)
      }
    } catch (e) {
      if (chainIdRef.current !== chainId) return;
      if (e instanceof Error && e.name === "AbortError") {
        setQuizError("Request timed out. Please try again.")
      } else {
        setQuizError(e instanceof Error ? e.message : "Something went wrong loading the quiz. Please try again.")
      }
      setQuestions([])
      setQuizToken(null)
      setStartIndex(null)
    } finally {
      clearTimeout(timeout)
      setQuizLoading(false)
    }
  }, [chainId, address])

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
    setStartIndex(null)
    setEcosystem(null)
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

  // Re-sync cooldown from chain when tab becomes visible (fixes background tab timer drift)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isConnected && address) {
        setGlobalRefreshKey(k => k + 1)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isConnected, address])

  // Timer for cooldown
  useEffect(() => {
    if (cooldownRemaining <= 0) return
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownRemaining])

  // Auto-fetch quiz when connected and cooldown is done
  useEffect(() => {
    if (isConnected && questions.length === 0 && !quizLoading && !quizError && cooldownRemaining === 0 && !isCheckingCooldown) {
      void fetchQuiz()
    }
  }, [isConnected, fetchQuiz, questions.length, quizLoading, quizError, cooldownRemaining, isCheckingCooldown])

  const handleStartQuiz = () => {
    setScreen("quiz")
  }

  const handleQuizComplete = (answers: number[]) => {
    if (!quizToken) {
      setQuizError("Quiz session expired. Please shuffle and try again.")
      setScreen("home")
      return
    }
    // correctIndex is exposed in the questions payload and sign-score re-verifies
    // server-side at submission — so score locally (no extra serverless round trip).
    const score = answers.reduce(
      (acc, ans, i) => acc + (ans === questions[i]?.correctIndex ? 1 : 0),
      0,
    )
    setFinalScore(score)
    setUserAnswers(answers)
    setScreen("results")
  }

  const handleRestart = () => {
    setFinalScore(0)
    setUserAnswers([])
    setQuestions([])
    setQuizToken(null)
    setStartIndex(null)
    setEcosystem(null)
    setScreen("home")
    setGlobalRefreshKey((k) => k + 1)
  }

  if (!mounted) return null

  return (
    <>
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
            ecosystem={ecosystem || undefined}
            startIndex={startIndex ?? undefined}
            onRestart={handleRestart}
            onScoreSubmitted={() => setGlobalRefreshKey(k => k + 1)}
          />
        )}
      </main>
    </>
  )
}

export default function HomeContent() {
  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-md arc-card rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
            <p className="mt-2 text-sm text-white/60">
              An unexpected error occurred while loading the quiz.
            </p>
            <button
              type="button"
              onClick={resetErrorBoundary}
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-bold text-black hover:bg-white/90 transition-colors duration-200 cursor-pointer"
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
