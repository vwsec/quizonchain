'use client'

import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

import '@rainbow-me/rainbowkit/styles.css'

import { useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import {
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import { walletConnect, coinbaseWallet, baseAccount } from 'wagmi/connectors'
import { inkMainnet, soneiumMainnet, base, unichain, megaEth, litvmTestnet, arcTestnet, sepoliaTestnet } from '@/lib/chains'
import { startaleConnector } from '@startale/app-sdk'
import { FarcasterMiniAppProvider } from '@/hooks/use-farcaster-miniapp'
import { activeChainConfig, activeChainKey } from '@/lib/active-chain-config'
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

const connectors = [
  walletConnect({ projectId }),
  coinbaseWallet(),
  startaleConnector({ appName: 'Quiz On Chain', appLogoUrl: 'https://quizonchain.app/logo.png' }),
]

if (typeof window !== 'undefined') {
  connectors.push(baseAccount({ appName: 'Quiz On Chain' }))
}

const config = createConfig({
  chains: allChains as any,
  multiInjectedProviderDiscovery: true,
  transports: Object.fromEntries(allChains.map(c => [c.id, http()])),
  connectors,
})

function RainbowKitThemeWrapper({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])

  // ponytail: env-unset falls back to Ink config (purple); disconnected default must stay white
  const accentColor = activeChainKey ? activeChainConfig.color : '#ffffff'
  const accentColorForeground = activeChainKey ? '#ffffff' : '#000000'

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
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitThemeWrapper>
          <FarcasterMiniAppProvider>
            {children}
          </FarcasterMiniAppProvider>
        </RainbowKitThemeWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
