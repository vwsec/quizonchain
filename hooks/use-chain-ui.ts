'use client'

import { useActiveChain } from '@/hooks/use-active-chain'
import {
  accentTextClass,
  getChainUI,
  type ChainUIProfile,
} from '@/lib/chain-ui'

export function useChainUI(): ChainUIProfile & {
  accentClass: string
  isConnected: boolean
  chainName: string | undefined
} {
  const { chainConfig, isConnected, name } = useActiveChain()
  const ui = getChainUI(chainConfig?.name ?? name, isConnected)

  return {
    ...ui,
    accentClass: accentTextClass(ui),
    isConnected,
    chainName: chainConfig?.name,
  }
}
