import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { Coffee, Sparkles, Heart } from 'lucide-react';

export default function ReactiveAvatar() {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  // Mouse vector tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for smooth 60fps tracking
  const eyeSpringConfig = { stiffness: 260, damping: 20, mass: 0.6 };
  const cardSpringConfig = { stiffness: 160, damping: 18, mass: 0.8 };

  const smoothMouseX = useSpring(mouseX, eyeSpringConfig);
  const smoothMouseY = useSpring(mouseY, eyeSpringConfig);
  const cardSmoothX = useSpring(mouseX, cardSpringConfig);
  const cardSmoothY = useSpring(mouseY, cardSpringConfig);

  // Pupil movement (subtle & natural travel within almond eye sockets)
  const pupilX = useTransform(smoothMouseX, [-400, 400], [-3.8, 3.8]);
  const pupilY = useTransform(smoothMouseY, [-400, 400], [-2.8, 2.8]);

  // 3D Card tilt
  const rotateX = useTransform(cardSmoothY, [-350, 350], [10, -10]);
  const rotateY = useTransform(cardSmoothX, [-350, 350], [-10, 10]);
  const glareX = useTransform(cardSmoothX, [-350, 350], ['10%', '90%']);
  const glareY = useTransform(cardSmoothY, [-350, 350], ['10%', '90%']);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      mouseX.set(dx);
      mouseY.set(dy);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Natural organic human blinking cycle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
    }, 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  const handleAvatarClick = () => {
    setIsBlinking(true);
    setShowHeart(true);
    setTimeout(() => setIsBlinking(false), 220);
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
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl p-1.5 cursor-pointer bg-gradient-to-br from-accent/90 via-purple-500/50 to-pink-500/90 shadow-2xl shadow-accent/25 group transition-shadow duration-300"
      >
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent via-purple-500 to-pink-500 blur-2xl opacity-45 group-hover:opacity-85 transition-opacity duration-500 -z-10" />

        {/* Card Face */}
        <div className="relative w-full h-full rounded-[22px] bg-slate-950 border border-white/20 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden">
          
          {/* Ambient Lighting */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/25 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent/25 rounded-full blur-2xl pointer-events-none" />

          {/* Breathing Motion Container */}
          <motion.div
            animate={{
              y: [0, -2, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 4.2,
              ease: 'easeInOut',
            }}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
          >
            {/* Master 3D Portrait Base */}
            <img
              src="/avatar-ard.jpg"
              alt="Adil Rafiq Dar (ARD)"
              className="w-full h-full object-cover object-top filter contrast-[1.03] brightness-[1.01] pointer-events-none"
            />

            {/* ================= LEFT EYE TRACKING RIG (NATURAL ALMOND SHAPE) ================= */}
            <div
              className="absolute pointer-events-none overflow-hidden flex items-center justify-center"
              style={{
                top: '47.8%',
                left: '36.2%',
                width: '8.8%',
                height: '3.8%',
                borderRadius: '50% 50% 40% 40% / 60% 60% 30% 30%',
              }}
            >
              {/* Sclera White Background with Natural Corner Shading */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#e2e8f0] via-[#f8fafc] to-[#e2e8f0] rounded-full" />

              {/* Moving Natural Iris & Pupil */}
              <motion.div
                style={{ x: pupilX, y: pupilY }}
                className="relative w-4.5 h-4.5 rounded-full bg-gradient-to-br from-[#381a08] via-[#1f0d04] to-[#09090b] flex items-center justify-center shadow-sm"
              >
                {/* Pupil Center */}
                <div className="w-2 h-2 rounded-full bg-[#050507]" />
                {/* Crisp Natural Catchlight */}
                <div className="absolute top-0.5 left-0.5 w-0.9 h-0.9 rounded-full bg-white opacity-95" />
              </motion.div>

              {/* Natural Upper Eyelid Hood Shadow */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-transparent pointer-events-none" />

              {/* Organic Eyelid Blink Layer */}
              <motion.div
                initial={false}
                animate={{ height: isBlinking ? '100%' : '0%' }}
                transition={{ duration: 0.07, ease: 'easeInOut' }}
                className="absolute top-0 left-0 right-0 bg-[#c99569] z-10 origin-top shadow-sm"
              />
            </div>

            {/* ================= RIGHT EYE TRACKING RIG (NATURAL ALMOND SHAPE) ================= */}
            <div
              className="absolute pointer-events-none overflow-hidden flex items-center justify-center"
              style={{
                top: '47.8%',
                left: '55.6%',
                width: '8.8%',
                height: '3.8%',
                borderRadius: '50% 50% 40% 40% / 60% 60% 30% 30%',
              }}
            >
              {/* Sclera White Background with Natural Corner Shading */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#e2e8f0] via-[#f8fafc] to-[#e2e8f0] rounded-full" />

              {/* Moving Natural Iris & Pupil */}
              <motion.div
                style={{ x: pupilX, y: pupilY }}
                className="relative w-4.5 h-4.5 rounded-full bg-gradient-to-br from-[#381a08] via-[#1f0d04] to-[#09090b] flex items-center justify-center shadow-sm"
              >
                {/* Pupil Center */}
                <div className="w-2 h-2 rounded-full bg-[#050507]" />
                {/* Crisp Natural Catchlight */}
                <div className="absolute top-0.5 left-0.5 w-0.9 h-0.9 rounded-full bg-white opacity-95" />
              </motion.div>

              {/* Natural Upper Eyelid Hood Shadow */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-transparent pointer-events-none" />

              {/* Organic Eyelid Blink Layer */}
              <motion.div
                initial={false}
                animate={{ height: isBlinking ? '100%' : '0%' }}
                transition={{ duration: 0.07, ease: 'easeInOut' }}
                className="absolute top-0 left-0 right-0 bg-[#c99569] z-10 origin-top shadow-sm"
              />
            </div>

          </motion.div>

          {/* Dynamic Specular Sheen Glare across card */}
          <motion.div
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 65%)`,
            }}
            className="absolute inset-0 pointer-events-none"
          />

          {/* Holographic ARD Monogram Pill */}
          <div className="absolute bottom-2 left-2 right-2 py-1 px-2.5 rounded-xl bg-slate-950/85 border border-white/15 backdrop-blur-md flex items-center justify-between shadow-lg z-10">
            <span className="text-[11px] font-black tracking-widest bg-gradient-to-r from-accent via-purple-300 to-pink-400 bg-clip-text text-transparent">
              ARD
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-emerald-400">FOUNDER</span>
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
          <span>Alive & Building v1.3</span>
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

      {/* Interactive Micro Tip */}
      <span className="text-[11px] text-text-secondary/70 mt-5 tracking-tight flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-accent" />
        Natural almond gaze • Pupils track cursor
      </span>
    </div>
  );
}
