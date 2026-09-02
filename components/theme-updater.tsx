'use client'

import { useEffect } from 'react'
import { useActiveChain } from '@/hooks/use-active-chain'
import { getThemeClass } from '@/lib/active-chain-config'

export function ThemeUpdater() {
  const { chainConfig, isConnected } = useActiveChain()
  const themeClass = isConnected
    ? getThemeClass(chainConfig ?? undefined)
    : 'theme-default'

  useEffect(() => {
    // Preserve next/font __variable_* classes — overwriting className wipes
    // the font CSS variables and drops the whole site to system fonts.
    const root = document.documentElement
    const fontVars = Array.from(root.classList).filter((c) => c.startsWith('__variable'))
    root.className = [...fontVars, themeClass].filter(Boolean).join(' ')
  }, [themeClass])

  return null
}
