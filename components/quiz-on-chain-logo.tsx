"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";

export default function QuizOnChainLogo() {
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

    window.addEventListener("mousemove", handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="flex items-center justify-center w-full py-8">
      <div
        ref={logoRef}
        style={{
          transformStyle: "preserve-3d",
          transition: "none",
          willChange: "transform",
          filter: "drop-shadow(0 0 40px rgba(255,255,255,0.15))",
        }}
      >
        <Image
          src="/chains/quizonchain_logo.png"
          alt="Quiz On Chain"
          width={200}
          height={200}
          priority
          style={{ borderRadius: "50%" }}
        />
      </div>
    </div>
  );
}
