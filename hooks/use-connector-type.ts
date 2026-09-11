'use client';

import { useAccount } from 'wagmi';

export function useConnectorType() {
  const { connector } = useAccount();

  const isBaseAccount = connector?.id === 'baseAccount';
  const isAbstractWallet = connector?.id === 'abstractWallet';
  const isStartale = connector?.id === 'startaleApp';

  const isChainLocked = isBaseAccount || isAbstractWallet || isStartale;

  return {
    connectorId: connector?.id,
    isBaseAccount,
    isAbstractWallet,
    isStartale,
    isChainLocked,
  };
}