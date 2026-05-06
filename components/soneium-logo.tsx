'use client';
import { useEffect, useRef } from 'react';

export default function SoneiumLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const targetX = useRef(0);
  const currentX = useRef(0);
  const rafRef = useRef<number>();

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
        <div className="relative group">
          <div className="absolute inset-0 bg-[#0047FF] rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
          <img 
            src="/chains/soneium.png" 
            alt="Soneium" 
            className="w-[340px] h-[340px] object-contain relative z-10 drop-shadow-[0_0_30px_rgba(0,71,255,0.3)]"
          />
        </div>
      </div>
    </div>
  );
}
