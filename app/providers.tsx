'use client'

import '@rainbow-me/rainbowkit/styles.css'

import { useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, useChainId } from 'wagmi'
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import { useActiveChain } from '@/hooks/use-active-chain'
import { inkMainnet, soneiumMainnet, base, unichain, megaEth, litvmTestnet, arcTestnet, sepoliaTestnet } from '@/lib/chains'
import { validateContractAddressEnv } from '@/lib/env-validation'

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

const allChains = [inkMainnet, soneiumMainnet, base, unichain, megaEth, litvmTestnet, arcTestnet, sepoliaTestnet]

const config = getDefaultConfig({
  appName: 'Quiz On Chain',
  projectId,
  chains: allChains as any,
})

function RainbowKitThemeWrapper({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])

  const { color, isConnected } = useActiveChain()

  const accentColor = ready ? color : '#ffffff'
  const accentColorForeground = ready ? (isConnected ? 'white' : '#111111') : 'white'

  return (
    <RainbowKitProvider
      theme={darkTheme({ accentColor, accentColorForeground })}
    >
      {children}
    </RainbowKitProvider>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  }))
  useEffect(() => {
    validateContractAddressEnv()
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitThemeWrapper>
          {children}
        </RainbowKitThemeWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
