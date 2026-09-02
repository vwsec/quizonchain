'use client';

import { useState } from 'react';
import { useConnect, useAccount, useSwitchChain } from 'wagmi';
import { SignInWithBaseButton } from '@base-org/account-ui/react';

export function SignInWithBase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { switchChainAsync } = useSwitchChain();

  const baseAccountConnector = connectors.find(
    (connector) => connector.id === 'baseAccount'
  );

  if (isConnected || !baseAccountConnector) return null;

  const handleSignIn = async () => {
    setIsLoading(true);
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
      console.error('Base sign-in error:', err);
      setError(err.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <SignInWithBaseButton
        onClick={handleSignIn}
        variant="solid"
        colorScheme="system"
        align="center"
      />
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
