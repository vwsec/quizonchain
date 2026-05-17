'use client'

import '@rainbow-me/rainbowkit/styles.css'

import { useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import { activeChainConfig, isMultiChain } from '@/lib/active-chain-config'
import { inkMainnet, soneiumMainnet, base, unichain, megaEth, litvmTestnet } from '@/lib/chains'
import { validateContractAddressEnv } from '@/lib/env-validation'

// Some runtimes expose a `localStorage` global that is not a real `Storage`
// instance (e.g. missing `getItem`). WalletConnect/RainbowKit may call
// `localStorage.getItem` during SSR too; this guard prevents hard crashes.
{
  const maybeLocalStorage = (globalThis as unknown as { localStorage?: unknown })
    .localStorage as
    | { getItem?: unknown; setItem?: unknown; removeItem?: unknown; clear?: unknown }
    | undefined

  const hasStorageShape =
    !!maybeLocalStorage &&
    typeof maybeLocalStorage.getItem === 'function' &&
    typeof maybeLocalStorage.setItem === 'function' &&
    typeof maybeLocalStorage.removeItem === 'function' &&
    typeof maybeLocalStorage.clear === 'function'

  if (!hasStorageShape) {
    const mem = new Map<string, string>()
    ;(globalThis as unknown as { localStorage: Storage }).localStorage = {
      get length() {
        return mem.size
      },
      clear() {
        mem.clear()
      },
      key(index: number) {
        return Array.from(mem.keys())[index] ?? null
      },
      getItem(key: string) {
        return mem.has(key) ? mem.get(key)! : null
      },
      setItem(key: string, value: string) {
        mem.set(String(key), String(value))
      },
      removeItem(key: string) {
        mem.delete(key)
      },
    } as Storage
  }
}

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set.')
}

const allChains = [inkMainnet, soneiumMainnet, base, unichain, megaEth, litvmTestnet]
const singleChain = allChains.find(c => c.id === activeChainConfig.chainId)
const chains = isMultiChain ? allChains : [singleChain!]

const config = getDefaultConfig({
  appName: 'Quiz On Chain',
  projectId,
  chains: chains as any,
})

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  useEffect(() => {
    validateContractAddressEnv()
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: activeChainConfig.name === 'MegaETH' ? '#00ff88' : activeChainConfig.name === 'LitVM' ? '#00F2FE' : activeChainConfig.color,
            accentColorForeground: activeChainConfig.name === 'MegaETH' ? '#000000' : activeChainConfig.name === 'LitVM' ? '#000000' : 'white',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
