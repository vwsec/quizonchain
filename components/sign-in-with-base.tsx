'use client';

import { useState } from 'react';
import { useConnect, useAccount, useSwitchChain } from 'wagmi';
import { useChainUI } from '@/hooks/use-chain-ui';
import { useConnectionLock, DIRECT_CONNECTOR_IDS } from '@/hooks/use-connection-lock';
import { friendlyConnectError, isUserRejection } from '@/lib/friendly-connect-error';
import { cn } from '@/lib/utils';

export function SignInWithBase() {
  const ui = useChainUI();
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  // Loading is derived solely from wagmi's shared mutation status (isActive):
  // it always settles, so "Connecting..." can never get stuck on.
  const { isActive, isLocked } = useConnectionLock(DIRECT_CONNECTOR_IDS.base);

  const baseAccountConnector = connectors.find(
    (connector) => connector.id === 'baseAccount'
  );

  if (isConnected || !baseAccountConnector) return null;

  const handleSignIn = async () => {
    setError(null);

    try {
      await connectAsync({ connector: baseAccountConnector, chainId: 8453 });

      if (switchChainAsync) {
        try {
          await switchChainAsync({ chainId: 8453 });
        } catch (switchError) {
          console.warn('Failed to switch chain to Base automatically:', switchError);
        }
      }
    } catch (err: any) {
      // Expected rejections stay silent (Next dev turns console.error into an
      // overlay); only unexpected failures get logged.
      if (!isUserRejection(err)) console.error('Base sign-in error:', err);
      setError(friendlyConnectError(err));
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <button
        onClick={handleSignIn}
        disabled={isActive || isLocked}
        className={cn(
          'flex h-[56px] w-full items-center justify-center gap-2 disabled:opacity-50',
          ui.connectBtn,
          'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100',
        )}
      >
        <img
          src="/chains/base.png"
          alt="Base"
          width={20}
          height={20}
          className="rounded-[5px]"
        />
        {isActive ? 'Connecting...' : 'Sign in with Base'}
      </button>
      {error && (
        <p className="text-sm text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
