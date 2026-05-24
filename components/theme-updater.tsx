'use client'

import { useEffect } from 'react'
import { useChainId } from 'wagmi'
import { getChainConfig, getThemeClass } from '@/lib/active-chain-config'

export function ThemeUpdater() {
  const chainId = useChainId()
  const config = getChainConfig(chainId)
  const themeClass = getThemeClass(config)

  useEffect(() => {
    document.documentElement.className = themeClass
  }, [themeClass])

  return null
}
