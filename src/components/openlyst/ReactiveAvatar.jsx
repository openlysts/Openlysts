import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { Coffee, Sparkles } from 'lucide-react';

export default function ReactiveAvatar() {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isWinking, setIsWinking] = useState(false);

  // Motion values for smooth eye tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Springs for buttery 60fps tracking
  const eyeX = useSpring(mouseX, { stiffness: 180, damping: 20 });
  const eyeY = useSpring(mouseY, { stiffness: 180, damping: 20 });
  const cardRotateX = useSpring(0, { stiffness: 150, damping: 15 });
  const cardRotateY = useSpring(0, { stiffness: 150, damping: 15 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance vector from avatar center to cursor
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Max eye travel in pixels
      const maxEyeTravel = 8;
      const clampedX = Math.max(-maxEyeTravel, Math.min(maxEyeTravel, (dx / 30)));
      const clampedY = Math.max(-maxEyeTravel, Math.min(maxEyeTravel, (dy / 30)));

      mouseX.set(clampedX);
      mouseY.set(clampedY);

      // Subtle 3D tilt for avatar container
      const maxTilt = 12;
      const tiltX = Math.max(-maxTilt, Math.min(maxTilt, -(dy / 35)));
      const tiltY = Math.max(-maxTilt, Math.min(maxTilt, (dx / 35)));
      cardRotateX.set(tiltX);
      cardRotateY.set(tiltY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, cardRotateX, cardRotateY]);

  const handleAvatarClick = () => {
    setIsWinking(true);
    setTimeout(() => setIsWinking(false), 800);
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none" ref={containerRef}>
      {/* 3D Reactive Holographic Avatar Base */}
      <motion.div
        onClick={handleAvatarClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          rotateX: cardRotateX,
          rotateY: cardRotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl p-1.5 cursor-pointer bg-gradient-to-br from-accent/80 via-purple-500/50 to-pink-500/80 shadow-2xl shadow-accent/20 group"
      >
        {/* Glow halo behind avatar */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent via-purple-500 to-pink-500 blur-xl opacity-40 group-hover:opacity-75 transition-opacity duration-500 -z-10" />

        {/* Inner Card Face */}
        <div className="relative w-full h-full rounded-[22px] bg-slate-900/90 border border-white/20 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden">
          
          {/* Specular sheen overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

          {/* SVG Mouse-Reactive Animated Character */}
          <svg viewBox="0 0 160 160" className="w-28 h-28 sm:w-36 sm:h-36 drop-shadow-lg">
            <defs>
              <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fed7aa" />
                <stop offset="100%" stopColor="#fdba74" />
              </linearGradient>
              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* Hair Back */}
            <path d="M 38 75 C 35 30, 125 30, 122 75 Z" fill="url(#hairGrad)" />

            {/* Ears */}
            <circle cx="42" cy="85" r="10" fill="url(#skinGrad)" />
            <circle cx="118" cy="85" r="10" fill="url(#skinGrad)" />

            {/* Head Face Base */}
            <rect x="46" y="48" width="68" height="74" rx="28" fill="url(#skinGrad)" />

            {/* Modern Stylish Hair Front */}
            <path d="M 44 65 C 44 40, 116 38, 116 65 C 104 52, 94 56, 80 50 C 66 56, 54 52, 44 65 Z" fill="url(#hairGrad)" />

            {/* Glasses Frame (Modern Sleek Developer Frames) */}
            <rect x="49" y="69" width="28" height="22" rx="7" fill="none" stroke="#e0e7ff" strokeWidth="2.5" />
            <rect x="83" y="69" width="28" height="22" rx="7" fill="none" stroke="#e0e7ff" strokeWidth="2.5" />
            <path d="M 77 79 L 83 79" stroke="#e0e7ff" strokeWidth="2.5" strokeLinecap="round" />

            {/* Eyebrows */}
            <path d="M 52 64 Q 63 60 74 64" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 86 64 Q 97 60 108 64" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />

            {/* Left Eye White & Reactive Pupil */}
            <g transform="translate(63, 80)">
              <ellipse cx="0" cy="0" rx="8" ry="6" fill="#ffffff" />
              <motion.circle
                style={{ x: eyeX, y: eyeY }}
                cx="0"
                cy="0"
                r="3.5"
                fill="#0f172a"
              />
              <motion.circle
                style={{ x: eyeX, y: eyeY }}
                cx="-1"
                cy="-1"
                r="1"
                fill="#ffffff"
              />
            </g>

            {/* Right Eye White & Reactive Pupil (or Wink) */}
            <g transform="translate(97, 80)">
              {isWinking ? (
                <path d="M -7 1 Q 0 7 7 1" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              ) : (
                <>
                  <ellipse cx="0" cy="0" rx="8" ry="6" fill="#ffffff" />
                  <motion.circle
                    style={{ x: eyeX, y: eyeY }}
                    cx="0"
                    cy="0"
                    r="3.5"
                    fill="#0f172a"
                  />
                  <motion.circle
                    style={{ x: eyeX, y: eyeY }}
                    cx="-1"
                    cy="-1"
                    r="1"
                    fill="#ffffff"
                  />
                </>
              )}
            </g>

            {/* Nose */}
            <path d="M 80 84 L 78 92 L 83 92" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

            {/* Friendly Smile */}
            <path d="M 68 102 Q 80 114 92 102" fill="none" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" />

            {/* Blush cheeks */}
            <ellipse cx="53" cy="94" rx="4" ry="2" fill="#f87171" opacity="0.5" />
            <ellipse cx="107" cy="94" rx="4" ry="2" fill="#f87171" opacity="0.5" />
          </svg>

          {/* ARD Monogram Badge Pill */}
          <div className="absolute bottom-2 left-2 right-2 py-0.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md flex items-center justify-center gap-1">
            <span className="text-[10px] font-black tracking-widest bg-gradient-to-r from-accent via-purple-300 to-pink-400 bg-clip-text text-transparent">
              ARD
            </span>
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Floating Coffee Perk Badge */}
        <motion.div
          animate={{ y: [-3, 3, -3], rotate: [-4, 4, -4] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          className="absolute -top-2.5 -right-2.5 px-2 py-1 rounded-xl bg-amber-500/90 text-white text-[10px] font-bold shadow-lg border border-amber-300/40 flex items-center gap-1 backdrop-blur-md"
        >
          <Coffee className="w-3 h-3 fill-white" />
          <span>Fuelled</span>
        </motion.div>

        {/* Live Status Pill at bottom */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-900/95 border border-emerald-500/40 shadow-xl flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Building v1.3</span>
        </div>
      </motion.div>

      {/* Interactive Micro Tip */}
      <span className="text-[11px] text-text-secondary/70 mt-4 tracking-tight flex items-center gap-1">
        <Sparkles className="w-2.5 h-2.5 text-accent" />
        Interactive gaze • Click to wink
      </span>
    </div>
  );
}
