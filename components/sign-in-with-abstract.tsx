'use client';

import { useEffect, useState } from 'react';
import { useAccount, useConnect, useSwitchChain } from 'wagmi';
import { useChainUI } from '@/hooks/use-chain-ui';
import { useConnectionLock, DIRECT_CONNECTOR_IDS } from '@/hooks/use-connection-lock';
import { friendlyConnectError } from '@/lib/friendly-connect-error';
import { cn } from '@/lib/utils';

export function SignInWithAbstract() {
  const ui = useChainUI();
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { connectors, connectAsync, error: connectError, reset: resetConnect } = useConnect();
  // Loading is derived solely from wagmi's shared mutation status (isActive):
  // it always settles, so "Connecting..." can never get stuck on.
  const { isActive, isLocked } = useConnectionLock(DIRECT_CONNECTOR_IDS.abstract);

  // Drive the AGW (xyz.abs.privy) connector through wagmi's connectAsync
  // directly: it opens the same Abstract modal as AGW's login() but returns
  // a real promise, so rejections land in our catch below. AGW's login()
  // returns void, and shared mutation error state proved unreliable here.
  const handleSignIn = async () => {
    const connector = connectors.find((c) => c.id === 'xyz.abs.privy');
    if (!connector) {
      setError('Abstract connector not found');
      return;
    }
    resetConnect();
    setError(null);
    try {
      await connectAsync({ connector, chainId: 2741 });
    } catch (err) {
      setError(friendlyConnectError(err));
    }
  };

  // Connected → ensure Abstract chain
  useEffect(() => {
    if (!isConnected) return;
    if (switchChainAsync) {
      switchChainAsync({ chainId: 2741 }).catch(() => {});
    }
  }, [isConnected, switchChainAsync]);

  // Rejected / closed modal (surfaced via wagmi) → friendly message
  useEffect(() => {
    if (!connectError) return;
    setError(friendlyConnectError(connectError));
  }, [connectError]);

  if (isConnected) return null;

  return (
    <div className="flex w-full flex-col items-center gap-1 relative z-10">
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
          src="/chains/abstract.png"
          alt="Abstract"
          width={20}
          height={20}
          className="rounded-[5px]"
        />
        {isActive ? 'Connecting...' : 'Sign in with Abstract'}
      </button>
      {error && (
        <p className="text-sm text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
