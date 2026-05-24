'use client'
import { useAccount } from 'wagmi'
import { useChainId } from 'wagmi'
import { getChainConfig, activeChainConfig } from '@/lib/active-chain-config'

const NEUTRAL_DEFAULTS = {
  color: '#ffffff',
  name: 'Quiz On Chain',
  heroTitle: 'The Knowledge of Web3',
  heroSubtitle: 'Test your blockchain knowledge across the ecosystem',
  heroLabel: 'WEB3',
}

export function useActiveChain() {
  const { isConnected } = useAccount()
  const chainId = useChainId()

  if (!isConnected) {
    return {
      chainConfig: null,
      color: NEUTRAL_DEFAULTS.color,
      name: NEUTRAL_DEFAULTS.name,
      heroTitle: NEUTRAL_DEFAULTS.heroTitle,
      heroSubtitle: NEUTRAL_DEFAULTS.heroSubtitle,
      heroLabel: NEUTRAL_DEFAULTS.heroLabel,
      isConnected: false,
    }
  }

  const config = getChainConfig(chainId) ?? activeChainConfig

  return {
    chainConfig: config,
    color: config?.color ?? NEUTRAL_DEFAULTS.color,
    name: config?.name ?? NEUTRAL_DEFAULTS.name,
    heroTitle: config?.heroTitle ?? NEUTRAL_DEFAULTS.heroTitle,
    heroSubtitle: config?.heroSubtitle ?? NEUTRAL_DEFAULTS.heroSubtitle,
    heroLabel: config?.heroLabel ?? NEUTRAL_DEFAULTS.heroLabel,
    isConnected: true,
  }
}
