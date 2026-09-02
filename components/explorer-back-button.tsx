"use client"

import { useRouter } from "next/navigation"

interface ExplorerBackButtonProps {
  fallbackHref: string;
  label: string;
}

export function ExplorerBackButton({ fallbackHref, label }: ExplorerBackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <div className="absolute top-24 left-6 z-50">
      <button 
        onClick={handleBack}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all text-gray-300 hover:text-white backdrop-blur-md"
      >
        <span>←</span> {label}
      </button>
    </div>
  )
}
