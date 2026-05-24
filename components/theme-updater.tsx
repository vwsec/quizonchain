'use client'

import { useEffect } from 'react'
import { useActiveChain } from '@/hooks/use-active-chain'
import { getThemeClass } from '@/lib/active-chain-config'

export function ThemeUpdater() {
  const { chainConfig, isConnected } = useActiveChain()
  const themeClass = isConnected ? getThemeClass(chainConfig ?? undefined) : ''

  useEffect(() => {
    document.documentElement.className = themeClass
  }, [themeClass])

  return null
}
