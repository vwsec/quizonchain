'use client'

import { useMutationState } from '@tanstack/react-query'

// Wagmi connector ids for the direct sign-in buttons on the disconnected hero.
export const DIRECT_CONNECTOR_IDS = {
  base: 'baseAccount',
  abstract: 'xyz.abs.privy',
  startale: 'startaleApp',
} as const

type PendingVariables = {
  variables?: { connector?: { id?: string } }
}

// Mutual exclusion for concurrent wallet connects, observed from TanStack's
// global mutation cache (wagmi runs every connect under mutationKey
// ['connect']). NOTE: separate useConnect()/useMutation instances do NOT
// share state — only useMutationState sees across components.
// - isActive: this button's own attempt is in flight → show "Connecting..."
// - isLocked: another button's attempt is in flight → disable, keep label
export function useConnectionLock(ownConnectorId?: string) {
  const pending = useMutationState({
    filters: { mutationKey: ['connect'], status: 'pending' },
  })
  const last = pending[pending.length - 1] as PendingVariables | undefined
  const pendingId = last?.variables?.connector?.id
  return {
    isActive: pendingId !== undefined && pendingId === ownConnectorId,
    isLocked: pendingId !== undefined && pendingId !== ownConnectorId,
    pendingConnectorId: pendingId,
  }
}
