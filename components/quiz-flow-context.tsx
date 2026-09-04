"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface QuizFlowContextValue {
  isActive: boolean
  setActive: (active: boolean) => void
}

const QuizFlowContext = createContext<QuizFlowContextValue | null>(null)

export function QuizFlowProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  return (
    <QuizFlowContext.Provider value={{ isActive, setActive: setIsActive }}>
      {children}
    </QuizFlowContext.Provider>
  )
}

export function useQuizFlow(): QuizFlowContextValue {
  const ctx = useContext(QuizFlowContext)
  if (!ctx) {
    throw new Error("useQuizFlow must be used within QuizFlowProvider")
  }
  return ctx
}

export function useQuizFlowActive(): boolean {
  return useQuizFlow().isActive
}
