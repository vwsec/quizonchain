'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function BaseLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const targetX = useRef(0);
  const currentX = useRef(0);
  const rafRef = useRef<number>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) return null;

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
        <div className="relative h-[280px] w-[280px]">
          {/* Subtle Glow Background */}
          <div className="absolute inset-0 rounded-full bg-[#0052FF]/10 blur-[60px]" />
          
          {/* The Actual Base Logo Image */}
          <div className="relative flex h-full w-full items-center justify-center">
            <Image 
              src="/chains/base.png"
              alt="Base Logo"
              width={280}
              height={280}
              className="object-contain drop-shadow-[0_0_30px_rgba(0,82,255,0.4)]"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
