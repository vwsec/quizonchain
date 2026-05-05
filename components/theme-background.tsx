'use client';

import { useEffect, useState } from 'react';
import { activeChainConfig } from '@/lib/active-chain-config';

export function ThemeBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isMegaEth = activeChainConfig.name === 'MegaETH';
  const isInk = activeChainConfig.name === 'Ink';
  const isUnichain = activeChainConfig.name === 'Unichain';
  const isBase = activeChainConfig.name === 'Base';

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 z-[-1] pointer-events-none ${isMegaEth ? 'bg-black' : isInk ? 'bg-[#0a0a0f]' : isUnichain ? 'bg-[#0d0014]' : isBase ? 'bg-white' : ''}`}>
      {/* MegaEth / Ink / Base Noise Overlay */}
      {(isMegaEth || isInk || isBase) && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }} />
      )}

      {/* Unichain Grid Overlay */}
      {isUnichain && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(rgba(255, 0, 122, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 122, 0.07) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      )}

      {/* MegaEth Crosses */}
      {isMegaEth && Array.from({ length: 20 }).map((_, i) => (
        <span key={`mega-${i}`} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          color: 'rgba(255,255,255,0.15)',
          fontSize: 12,
        }}>×</span>
      ))}

      {/* Ink Drops */}
      {isInk && Array.from({ length: 20 }).map((_, i) => (
        <span key={`ink-${i}`} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          color: 'rgba(108,92,231,0.2)',
          fontSize: 16,
        }}>•</span>
      ))}

      {/* Unichain Sparkles */}
      {isUnichain && Array.from({ length: 20 }).map((_, i) => (
        <span key={`uni-${i}`} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          color: 'rgba(255,0,122,0.2)',
          fontSize: 14,
        }}>✦</span>
      ))}

      {/* Base Pattern (Vertical Bars) */}
      {isBase && (
        <>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
            backgroundSize: '10vw 100%',
          }} />
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={`base-${i}`} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              color: 'rgba(0,82,255,0.15)',
              fontSize: 14,
            }}>○</span>
          ))}
        </>
      )}

      {/* Default Base Blue Glow */}
      {!isMegaEth && !isInk && !isUnichain && !isBase && (
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(0,71,255,0.08)] blur-3xl animate-pulse" />
        </div>
      )}
    </div>
  );
}
