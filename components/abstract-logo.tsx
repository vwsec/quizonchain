'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function AbstractLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const targetX = useRef(0);
  const currentX = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      targetX.current = ((e.clientX - centerX) / centerX) * 20;
    };

    const animate = () => {
      currentX.current += (targetX.current - currentX.current) * 0.08;
      if (logoRef.current) {
        logoRef.current.style.transform = `
          perspective(800px)
          rotateY(${currentX.current}deg)
          scale3d(1, 1, 1)
        `;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className='flex items-center justify-center w-full py-8'>
      <div
        ref={logoRef}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'none',
          willChange: 'transform',
        }}
      >
        <div style={{
          position: 'relative',
          width: 280,
          height: 280,
          boxShadow: '0 0 60px rgba(0,179,15,0.2), 0 0 120px rgba(0,179,15,0.08), 0 0 200px rgba(0,179,15,0.03)',
          borderRadius: 16,
          overflow: 'hidden',
          filter: 'drop-shadow(0 0 25px rgba(0,179,15,0.15))',
          border: '1px solid rgba(0,179,15,0.12)',
        }}>
          <Image
            src="/chains/abstract.png"
            alt="Abstract Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
