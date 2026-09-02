'use client';

import { useEffect, useState } from 'react';
import { useActiveChain } from '@/hooks/use-active-chain';
import { getChainThemeKey } from '@/lib/chain-ui';

const NOISE_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
  opacity: 0.4,
  zIndex: 0,
  pointerEvents: 'none',
};

export function ThemeBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { chainConfig: cfg, isConnected } = useActiveChain();
  const themeKey = getChainThemeKey(cfg?.name, isConnected);

  if (!mounted) return null;

  const bgClass: Record<string, string> = {
    default: 'bg-[#0F0F23]',
    megaeth: 'bg-black',
    ink: 'bg-[#0a0a0f]',
    unichain: 'bg-[#0d0014]',
    base: 'bg-white',
    soneium: 'bg-[#00040F]',
    litvm: 'bg-[#080F1A]',
    arc: 'bg-[#000B24]',
  };

  return (
    <div className={`fixed inset-0 z-[-1] pointer-events-none ${bgClass[themeKey] ?? bgClass.default}`}>
      {themeKey === 'default' && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(ellipse at 20% 0%, rgba(124, 58, 237, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 100%, rgba(244, 63, 94, 0.06) 0%, transparent 50%),
                linear-gradient(160deg, #0F0F23 0%, #0a0a18 50%, #0F0F23 100%)
              `,
            }}
          />
          <div className="absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7C3AED]/10 blur-3xl" />
        </>
      )}

      {['megaeth', 'ink', 'base', 'soneium'].includes(themeKey) && (
        <div style={NOISE_STYLE} />
      )}

      {themeKey === 'unichain' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(rgba(255, 0, 122, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 122, 0.07) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      )}

      {themeKey === 'litvm' && (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #0B192C 0%, #080F1A 40%, #0F1923 70%, #0B192C 100%)',
            pointerEvents: 'none',
          }} />
          <div className="absolute -left-[5%] -top-[10%] w-[50vw] h-[50vh] rounded-full bg-[#00F2FE]/6 blur-[60px] pointer-events-none" />
          <div className="absolute -right-[10%] -bottom-[5%] w-[40vw] h-[40vh] rounded-full bg-[#A18CD1]/4 blur-[80px] pointer-events-none" />
        </>
      )}

      {themeKey === 'arc' && (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #000B24 0%, #010D28 40%, #000920 70%, #000B24 100%)',
            pointerEvents: 'none',
          }} />
          <div className="absolute -left-[5%] -top-[10%] w-[50vw] h-[50vh] rounded-full bg-[#4D8EE9]/6 blur-[60px] pointer-events-none" />
        </>
      )}
    </div>
  );
}
