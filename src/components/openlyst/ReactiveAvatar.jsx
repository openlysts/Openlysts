import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { Coffee, Sparkles, Heart } from 'lucide-react';

export default function ReactiveAvatar() {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showHeart, setShowHeart] = useState(false);

  // Mouse vector tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for smooth 60fps tracking
  const springConfig = { stiffness: 180, damping: 18, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // 3D Rotations & Parallax Shifts
  const rotateX = useTransform(smoothY, [-300, 300], [14, -14]);
  const rotateY = useTransform(smoothX, [-300, 300], [-14, 14]);
  const imageShiftX = useTransform(smoothX, [-300, 300], [-6, 6]);
  const imageShiftY = useTransform(smoothY, [-300, 300], [-6, 6]);
  const glareX = useTransform(smoothX, [-300, 300], ['0%', '100%']);
  const glareY = useTransform(smoothY, [-300, 300], ['0%', '100%']);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance from center
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      mouseX.set(dx);
      mouseY.set(dy);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleAvatarClick = () => {
    setClickCount((prev) => prev + 1);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 900);
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none" ref={containerRef}>
      
      {/* 3D Perspective Card Container */}
      <motion.div
        onClick={handleAvatarClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-3xl p-1.5 cursor-pointer bg-gradient-to-br from-accent/90 via-purple-500/50 to-pink-500/90 shadow-2xl shadow-accent/25 group transition-shadow duration-300"
      >
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent via-purple-500 to-pink-500 blur-2xl opacity-40 group-hover:opacity-75 transition-opacity duration-500 -z-10" />

        {/* Inner Card Face with Parallax 3D Render */}
        <div className="relative w-full h-full rounded-[22px] bg-slate-950 border border-white/20 backdrop-blur-xl flex items-center justify-center overflow-hidden">
          
          {/* Avatar Image with Mouse Parallax Depth */}
          <motion.img
            src="/avatar-ard.jpg"
            alt="Adil Rafiq Dar (ARD)"
            style={{
              x: imageShiftX,
              y: imageShiftY,
              scale: 1.08,
            }}
            className="w-full h-full object-cover object-top filter contrast-[1.03] brightness-[1.02] drop-shadow-md pointer-events-none transition-transform duration-75 ease-out"
          />

          {/* Dynamic Specular Sheen Glare */}
          <motion.div
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 65%)`,
            }}
            className="absolute inset-0 pointer-events-none"
          />

          {/* Holographic ARD Monogram Pill */}
          <div className="absolute bottom-2 left-2 right-2 py-1 px-2.5 rounded-xl bg-slate-950/80 border border-white/15 backdrop-blur-md flex items-center justify-between shadow-lg">
            <span className="text-[11px] font-black tracking-widest bg-gradient-to-r from-accent via-purple-300 to-pink-400 bg-clip-text text-transparent">
              ARD
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-emerald-400">BUILDER</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Floating Coffee Perk Badge */}
        <motion.div
          animate={{ y: [-3, 3, -3], rotate: [-4, 4, -4] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          className="absolute -top-3 -right-3 px-2.5 py-1 rounded-xl bg-amber-500/95 text-white text-[11px] font-bold shadow-xl border border-amber-300/40 flex items-center gap-1.5 backdrop-blur-md z-20"
        >
          <Coffee className="w-3.5 h-3.5 fill-white" />
          <span>Coffee Powered</span>
        </motion.div>

        {/* Live Status Pill at bottom */}
        <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-slate-900/95 border border-emerald-500/40 shadow-2xl flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 z-20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Shipping v1.3</span>
        </div>

        {/* Click Heart Burst Particle */}
        {showHeart && (
          <motion.div
            initial={{ opacity: 1, scale: 0.5, y: 0 }}
            animate={{ opacity: 0, scale: 2.2, y: -45 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-pink-500 z-30 pointer-events-none"
          >
            <Heart className="w-10 h-10 fill-pink-500 drop-shadow-lg" />
          </motion.div>
        )}
      </motion.div>

      {/* Interactive Hint */}
      <span className="text-[11px] text-text-secondary/70 mt-5 tracking-tight flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-accent" />
        Mouse-reactive 3D gaze • Click to interact
      </span>
    </div>
  );
}
