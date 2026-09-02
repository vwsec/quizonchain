"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAccount, useDisconnect } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"

interface WalletContextType {
  address: string | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | null>(null)

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { openConnectModal } = useConnectModal()

  const connect = () => {
    openConnectModal?.()
  }

  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <WalletContext.Provider
      value={{
        address: address ?? null,
        isConnected,
        connect,
        disconnect: handleDisconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
