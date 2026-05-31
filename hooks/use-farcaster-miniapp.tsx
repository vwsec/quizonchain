"use client"

import { sdk } from "@farcaster/miniapp-sdk"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface NotificationDetails {
  url: string
  token: string
}

interface FarcasterMiniAppState {
  isMiniApp: boolean
  loaded: boolean
  capabilities: string[]
  notificationDetails: NotificationDetails | null
  hostSupportsNotifications: boolean
  user: { fid: number; username?: string; displayName?: string; pfpUrl?: string } | null
  clientContext: { clientFid: number; added: boolean; safeAreaInsets?: { top: number; bottom: number; left: number; right: number } } | null
  startale: { starPoints?: number; eoaWallets?: string[] } | null
  addMiniApp: () => Promise<unknown>
}

const FarcasterMiniAppContext = createContext<FarcasterMiniAppState>({
  isMiniApp: false,
  loaded: false,
  capabilities: [],
  notificationDetails: null,
  hostSupportsNotifications: false,
  user: null,
  clientContext: null,
  startale: null,
  addMiniApp: async () => {},
})

export function useFarcasterMiniApp() {
  return useContext(FarcasterMiniAppContext)
}

export function FarcasterMiniAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FarcasterMiniAppState>({
    isMiniApp: false,
    loaded: false,
    capabilities: [],
    notificationDetails: null,
    hostSupportsNotifications: false,
    user: null,
    clientContext: null,
    startale: null,
    addMiniApp: async () => {},
  })

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const isMiniApp = await sdk.isInMiniApp()
        if (!mounted || !isMiniApp) {
          if (mounted) setState(prev => ({ ...prev, loaded: true }))
          return
        }

        const [context, capabilities] = await Promise.all([
          sdk.context as Promise<any>,
          sdk.getCapabilities(),
        ])

        if (!mounted) return

        const notificationDetails = context?.client?.notificationDetails ?? null

        setState({
          isMiniApp: true,
          loaded: true,
          capabilities,
          notificationDetails,
          hostSupportsNotifications: !!notificationDetails?.url,
          user: context?.user ?? null,
          clientContext: context?.client
            ? { clientFid: context.client.clientFid, added: !!context.client.added, safeAreaInsets: context.client.safeAreaInsets }
            : null,
          startale: context?.startale ?? null,
          addMiniApp: () => sdk.actions.addMiniApp(),
        })

        try {
          await sdk.back.enableWebNavigation()
        } catch {}
      } catch {
        if (mounted) setState(prev => ({ ...prev, loaded: true }))
      }
    }

    init()

    const onAdded = (data: { notificationDetails?: { url: string; token: string } }) => {
      if (data?.notificationDetails) {
        const nd = data.notificationDetails
        setState(prev => ({
          ...prev,
          clientContext: prev.clientContext ? { ...prev.clientContext, added: true } : null,
          notificationDetails: { url: nd.url, token: nd.token },
          hostSupportsNotifications: true,
        }))
      }
    }

    const onRemoved = () => {
      setState(prev => ({
        ...prev,
        clientContext: prev.clientContext ? { ...prev.clientContext, added: false } : null,
      }))
    }

    const onNotificationsEnabled = (data: { notificationDetails?: { url: string; token: string } }) => {
      if (data?.notificationDetails) {
        const nd = data.notificationDetails
        setState(prev => ({
          ...prev,
          notificationDetails: { url: nd.url, token: nd.token },
          hostSupportsNotifications: true,
        }))
      }
    }

    const onNotificationsDisabled = () => {
      setState(prev => ({ ...prev, notificationDetails: null }))
    }

    sdk.on('miniAppAdded', onAdded)
    sdk.on('miniAppRemoved', onRemoved)
    sdk.on('notificationsEnabled', onNotificationsEnabled)
    sdk.on('notificationsDisabled', onNotificationsDisabled)

    return () => {
      mounted = false
      sdk.off('miniAppAdded', onAdded)
      sdk.off('miniAppRemoved', onRemoved)
      sdk.off('notificationsEnabled', onNotificationsEnabled)
      sdk.off('notificationsDisabled', onNotificationsDisabled)
    }
  }, [])

  return (
    <FarcasterMiniAppContext.Provider value={state}>
      {children}
    </FarcasterMiniAppContext.Provider>
  )
}
