'use client';

import { useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { getChainConfig } from '@/lib/active-chain-config';

export function ThemeBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chainId = useChainId();
  const cfg = getChainConfig(chainId);

  const isMegaEth = cfg?.name === 'MegaETH';
  const isInk = cfg?.name === 'Ink';
  const isUnichain = cfg?.name === 'Unichain';
  const isBase = cfg?.name === 'Base';
  const isSoneium = cfg?.name === 'Soneium';
  const isLitvm = cfg?.name === 'LitVM';
  const isArc = cfg?.name === 'Arc Testnet';

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 z-[-1] pointer-events-none ${isMegaEth ? 'bg-black' : isInk ? 'bg-[#0a0a0f]' : isUnichain ? 'bg-[#0d0014]' : isBase ? 'bg-white' : isSoneium ? 'bg-[#00040F]' : isLitvm ? 'bg-[#080F1A]' : isArc ? 'bg-[#000B24]' : ''}`}>
      {/* MegaEth / Ink / Base / Soneium Noise Overlay */}
      {(isMegaEth || isInk || isBase || isSoneium) && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.4,
          zIndex: 0,
          pointerEvents: 'none',
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
          left: `${(i * 17 + 7) % 100}%`,
          top: `${(i * 13 + 11) % 100}%`,
          color: 'rgba(255,255,255,0.15)',
          fontSize: 12,
        }}>×</span>
      ))}

      {/* Ink Drops */}
      {isInk && Array.from({ length: 20 }).map((_, i) => (
        <span key={`ink-${i}`} style={{
          position: 'absolute',
          left: `${(i * 17 + 7) % 100}%`,
          top: `${(i * 13 + 11) % 100}%`,
          color: 'rgba(108,92,231,0.2)',
          fontSize: 16,
        }}>•</span>
      ))}

      {/* Unichain Sparkles */}
      {isUnichain && Array.from({ length: 20 }).map((_, i) => (
        <span key={`uni-${i}`} style={{
          position: 'absolute',
          left: `${(i * 17 + 7) % 100}%`,
          top: `${(i * 13 + 11) % 100}%`,
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
              left: `${(i * 17 + 7) % 100}%`,
              top: `${(i * 13 + 11) % 100}%`,
              color: 'rgba(0,82,255,0.15)',
              fontSize: 14,
            }}>○</span>
          ))}
        </>
      )}
      
      {/* LitVM Deep Navy Background + Animated Glow Orbs */}
      {isLitvm && (
        <>
          {/* Base gradient matching litvm.com */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(160deg, #0B192C 0%, #080F1A 40%, #0F1923 70%, #0B192C 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          {/* Top-left cyan glow orb */}
          <div style={{
            position: 'absolute',
            left: '-5%',
            top: '-10%',
            width: '50vw',
            height: '50vh',
            background: 'radial-gradient(circle, rgba(0,242,254,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
            filter: 'blur(60px)',
          }} />
          {/* Bottom-right warm glow orb */}
          <div style={{
            position: 'absolute',
            right: '-10%',
            bottom: '-5%',
            width: '40vw',
            height: '40vh',
            background: 'radial-gradient(circle, rgba(161,140,209,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
            filter: 'blur(80px)',
          }} />
          {/* Subtle grid lines */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,242,254,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,242,254,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        </>
      )}

      {/* Arc Deep Navy Background + Blue Glow Orbs */}
      {isArc && (
        <>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(160deg, #000B24 0%, #010D28 40%, #000920 70%, #000B24 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          <div style={{
            position: 'absolute',
            left: '-5%',
            top: '-10%',
            width: '50vw',
            height: '50vh',
            background: 'radial-gradient(circle, rgba(77,142,233,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
            filter: 'blur(60px)',
          }} />
          <div style={{
            position: 'absolute',
            right: '-10%',
            bottom: '-5%',
            width: '40vw',
            height: '40vh',
            background: 'radial-gradient(circle, rgba(172,198,233,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
            filter: 'blur(80px)',
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(77,142,233,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(77,142,233,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        </>
      )}

      {/* Soneium Stars */}
      {isSoneium && Array.from({ length: 20 }).map((_, i) => (
        <span key={`soneium-${i}`} style={{
          position: 'absolute',
          left: `${(i * 17 + 7) % 100}%`,
          top: `${(i * 13 + 11) % 100}%`,
          color: 'rgba(0,71,255,0.2)',
          fontSize: 18,
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0,
        }}>·</span>
      ))}

      {/* Default Base Blue Glow */}
      {!isMegaEth && !isInk && !isUnichain && !isBase && !isSoneium && !isLitvm && !isArc && (
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(0,71,255,0.08)] blur-3xl animate-pulse" />
        </div>
      )}
    </div>
  );
}
