'use client';

import { useEffect, useState } from 'react';
import { useActiveChain } from '@/hooks/use-active-chain';
import { getChainThemeKey } from '@/lib/chain-ui';

const CHAIN_ACCENT: Record<string, string> = {
  default: '#FFFFFF',
  megaeth: '#00ff88',
  ink: '#8b5cf6',
  unichain: '#ff007a',
  base: '#0000ff',
  soneium: '#45DCE8',
  litvm: '#00F2FE',
  arc: '#4D8EE9',
  abstract: '#00b30f',
  sepolia: '#cbaeff',
};

export function ThemeBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { chainConfig: cfg, isConnected } = useActiveChain();
  const themeKey = getChainThemeKey(cfg?.name, isConnected);

  if (!mounted) return null;

  const accent = CHAIN_ACCENT[themeKey] ?? CHAIN_ACCENT.default;

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-black">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 0%, ${accent}10 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, ${accent}08 0%, transparent 50%),
            linear-gradient(160deg, #000000 0%, #000000 50%, #000000 100%)
          `,
        }}
      />
      <div
        className="absolute -left-[5%] -top-[10%] w-[50vw] h-[50vh] rounded-full blur-[60px] pointer-events-none"
        style={{ backgroundColor: `${accent}0F` }}
      />
    </div>
  );
}
