'use client';

import { useState } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { SignInWithBaseButton } from '@base-org/account-ui/react';

export function SignInWithBase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();

  const baseAccountConnector = connectors.find(
    (connector) => connector.id === 'baseAccount'
  );

  if (isConnected || !baseAccountConnector) return null;

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await connectAsync({ connector: baseAccountConnector });

      const provider = baseAccountConnector.provider;

      await (provider as any).request({
        method: 'wallet_connect',
        params: [
          {
            version: '1',
            capabilities: {
              signInWithEthereum: {
                nonce: window.crypto.randomUUID().replace(/-/g, ''),
                chainId: '0x2105',
              },
            },
          },
        ],
      });
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
