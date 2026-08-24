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

  // Buttery-smooth spring physics for eyes and head
  const eyeSpringConfig = { stiffness: 280, damping: 22, mass: 0.6 };
  const cardSpringConfig = { stiffness: 160, damping: 18, mass: 0.8 };

  const smoothMouseX = useSpring(mouseX, eyeSpringConfig);
  const smoothMouseY = useSpring(mouseY, eyeSpringConfig);
  const cardSmoothX = useSpring(mouseX, cardSpringConfig);
  const cardSmoothY = useSpring(mouseY, cardSpringConfig);

  // Pupil movement (precise range within eye sockets)
  const pupilX = useTransform(smoothMouseX, [-350, 350], [-7, 7]);
  const pupilY = useTransform(smoothMouseY, [-350, 350], [-5.5, 5.5]);

  // Eyebrows slight reaction to gaze
  const browY = useTransform(smoothMouseY, [-350, 350], [-2.5, 1.5]);

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
      setTimeout(() => setIsBlinking(false), 180);
    }, 3600);
    return () => clearInterval(blinkInterval);
  }, []);

  const handleAvatarClick = () => {
    setIsBlinking(true);
    setShowHeart(true);
    setTimeout(() => setIsBlinking(false), 240);
    setTimeout(() => setShowHeart(false), 900);
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none" ref={containerRef}>
      
      {/* 3D Perspective Card with Alive Character */}
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
        className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-3xl p-1.5 cursor-pointer bg-gradient-to-br from-accent/90 via-purple-500/50 to-pink-500/90 shadow-2xl shadow-accent/25 group transition-shadow duration-300"
      >
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent via-purple-500 to-pink-500 blur-2xl opacity-45 group-hover:opacity-80 transition-opacity duration-500 -z-10" />

        {/* Inner Card Face */}
        <div className="relative w-full h-full rounded-[22px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-white/20 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden">
          
          {/* Ambient Lighting */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent/20 rounded-full blur-2xl pointer-events-none" />

          {/* Breathing Animation Wrapper */}
          <motion.div
            animate={{
              y: [0, -2.5, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 4.2,
              ease: 'easeInOut',
            }}
            className="w-full h-full flex items-center justify-center"
          >
            {/* SVG Realistic Character Portrait of Adil Rafiq Dar */}
            <svg viewBox="0 0 220 220" className="w-36 h-36 sm:w-44 sm:h-44 drop-shadow-2xl">
              <defs>
                {/* Hair Gradient */}
                <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e1b29" />
                  <stop offset="35%" stopColor="#12131c" />
                  <stop offset="100%" stopColor="#050608" />
                </linearGradient>

                {/* Skin Base Gradient (Warm Tan / Olive Tone) */}
                <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ebd0b5" />
                  <stop offset="45%" stopColor="#dfbe9f" />
                  <stop offset="100%" stopColor="#cca17d" />
                </linearGradient>

                {/* Shading Gradient */}
                <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ba8f6d" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#9c6d49" stopOpacity="0.9" />
                </linearGradient>

                {/* Beard Gradient */}
                <linearGradient id="beardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1c1d24" />
                  <stop offset="100%" stopColor="#0a0b0e" />
                </linearGradient>

                {/* Navy Textured Sweater */}
                <linearGradient id="sweaterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>

                {/* Collar Gradient */}
                <linearGradient id="collarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="100%" stopColor="#172554" />
                </linearGradient>

                {/* Iris Rich Brown Gradient */}
                <radialGradient id="irisGrad" cx="40%" cy="40%" r="65%">
                  <stop offset="0%" stopColor="#78350f" />
                  <stop offset="45%" stopColor="#451a03" />
                  <stop offset="85%" stopColor="#1c0a00" />
                  <stop offset="100%" stopColor="#09090b" />
                </radialGradient>

                {/* Eye Socket Clip Paths */}
                <clipPath id="leftEyeClip">
                  <path d="M 72 98 C 76 90, 96 90, 100 98 C 96 106, 76 106, 72 98 Z" />
                </clipPath>
                <clipPath id="rightEyeClip">
                  <path d="M 120 98 C 124 90, 144 90, 148 98 C 144 106, 124 106, 120 98 Z" />
                </clipPath>
              </defs>

              {/* Shoulders & Navy Collared Shirt */}
              <path d="M 25 210 C 25 170, 55 158, 110 158 C 165 158, 195 170, 195 210 Z" fill="url(#sweaterGrad)" />
              
              {/* Sweater V-Neck & Diamond Micro-Pattern */}
              <path d="M 110 186 L 86 158 L 134 158 Z" fill="url(#collarGrad)" />
              <path d="M 110 190 L 96 158 L 124 158 Z" fill="#0f172a" />
              <circle cx="110" cy="178" r="2.5" fill="#38bdf8" opacity="0.6" />

              {/* Neck with anatomical shadow */}
              <rect x="92" y="132" width="36" height="34" rx="8" fill="url(#skinGrad)" />
              <path d="M 92 132 L 92 146 Q 110 156 128 146 L 128 132 Z" fill="url(#shadowGrad)" opacity="0.6" />

              {/* Ears */}
              <ellipse cx="58" cy="110" rx="9" ry="14" fill="url(#skinGrad)" />
              <ellipse cx="58" cy="110" rx="5" ry="8" fill="#cca17d" opacity="0.7" />
              <ellipse cx="162" cy="110" rx="9" ry="14" fill="url(#skinGrad)" />
              <ellipse cx="162" cy="110" rx="5" ry="8" fill="#cca17d" opacity="0.7" />

              {/* Head / Jaw Contour (Exact Likeness from Reference Photo) */}
              <path 
                d="M 64 85 C 62 48, 158 48, 156 85 C 156 120, 146 152, 110 155 C 74 152, 64 120, 64 85 Z" 
                fill="url(#skinGrad)" 
              />

              {/* Cheekbone & Jaw Definition Shadows */}
              <path d="M 70 102 Q 78 124 90 134" fill="none" stroke="#ba8f6d" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
              <path d="M 150 102 Q 142 124 130 134" fill="none" stroke="#ba8f6d" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />

              {/* Well-Groomed Trimmed Beard & Chin Strap (Matching Photo) */}
              <path 
                d="M 60 94 C 60 132, 78 156, 110 158 C 142 156, 160 132, 160 94 C 160 106, 150 144, 110 146 C 70 144, 60 106, 60 94 Z" 
                fill="url(#beardGrad)" 
              />
              {/* Soul Patch & Chin Center Beard */}
              <path d="M 104 130 L 116 130 L 112 142 L 108 142 Z" fill="url(#beardGrad)" />
              <circle cx="110" cy="151" r="5.5" fill="url(#beardGrad)" />

              {/* Trimmed Mustache */}
              <path 
                d="M 84 126 C 92 120, 104 120, 110 123 C 116 120, 128 120, 136 126 C 130 132, 118 131, 110 127 C 102 131, 90 132, 84 126 Z" 
                fill="url(#beardGrad)" 
              />

              {/* Natural Lips */}
              <path d="M 96 133 Q 110 137 124 133" fill="none" stroke="#b45353" strokeWidth="2.5" strokeLinecap="round" />

              {/* Nose Structure */}
              <path d="M 110 88 L 105 112 Q 110 116 115 112 Z" fill="#cca17d" opacity="0.7" />
              <path d="M 102 113 Q 110 117 118 113" fill="none" stroke="#9c6d49" strokeWidth="2" strokeLinecap="round" />

              {/* Responsive Eyebrows (Moves slightly with gaze) */}
              <motion.g style={{ y: browY }}>
                <path d="M 70 85 Q 86 78 99 84" fill="none" stroke="#0a0b0e" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M 121 84 Q 134 78 150 85" fill="none" stroke="#0a0b0e" strokeWidth="4.5" strokeLinecap="round" />
              </motion.g>

              {/* ================= LEFT EYE (ACTIVE TRACKING) ================= */}
              <g>
                {/* Sclera (Eye White) */}
                <path d="M 72 98 C 76 90, 96 90, 100 98 C 96 106, 76 106, 72 98 Z" fill="#f8fafc" />
                {/* Corner shadows */}
                <path d="M 72 98 C 74 94, 78 94, 80 98 C 78 102, 74 102, 72 98 Z" fill="#e2e8f0" opacity="0.6" />

                {/* Moving Iris & Pupil (Clipped to Eye Socket) */}
                <g clipPath="url(#leftEyeClip)">
                  <motion.g style={{ x: pupilX, y: pupilY }}>
                    {/* Dark Hazel/Brown Iris */}
                    <circle cx="86" cy="98" r="6" fill="url(#irisGrad)" />
                    {/* Black Pupil */}
                    <circle cx="86" cy="98" r="3.2" fill="#050507" />
                    {/* Specular Catchlight (Eye sparkle) */}
                    <circle cx="84.2" cy="96.2" r="1.5" fill="#ffffff" />
                    <circle cx="87.5" cy="99.5" r="0.7" fill="#ffffff" opacity="0.8" />
                  </motion.g>
                </g>

                {/* Upper & Lower Eyelid Liners */}
                <path d="M 71 98 C 76 89, 96 89, 101 98" fill="none" stroke="#0a0b0e" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 73 98 C 78 105, 94 105, 99 98" fill="none" stroke="#0a0b0e" strokeWidth="1" opacity="0.5" strokeLinecap="round" />

                {/* Eyelid Blink Cover */}
                {isBlinking && (
                  <path d="M 70 98 Q 86 104 102 98" fill="none" stroke="#0a0b0e" strokeWidth="3" strokeLinecap="round" />
                )}
              </g>

              {/* ================= RIGHT EYE (ACTIVE TRACKING) ================= */}
              <g>
                {/* Sclera (Eye White) */}
                <path d="M 120 98 C 124 90, 144 90, 148 98 C 144 106, 124 106, 120 98 Z" fill="#f8fafc" />
                {/* Corner shadows */}
                <path d="M 148 98 C 146 94, 142 94, 140 98 C 142 102, 146 102, 148 98 Z" fill="#e2e8f0" opacity="0.6" />

                {/* Moving Iris & Pupil (Clipped to Eye Socket) */}
                <g clipPath="url(#rightEyeClip)">
                  <motion.g style={{ x: pupilX, y: pupilY }}>
                    {/* Dark Hazel/Brown Iris */}
                    <circle cx="134" cy="98" r="6" fill="url(#irisGrad)" />
                    {/* Black Pupil */}
                    <circle cx="134" cy="98" r="3.2" fill="#050507" />
                    {/* Specular Catchlight (Eye sparkle) */}
                    <circle cx="132.2" cy="96.2" r="1.5" fill="#ffffff" />
                    <circle cx="135.5" cy="99.5" r="0.7" fill="#ffffff" opacity="0.8" />
                  </motion.g>
                </g>

                {/* Upper & Lower Eyelid Liners */}
                <path d="M 119 98 C 124 89, 144 89, 149 98" fill="none" stroke="#0a0b0e" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 121 98 C 126 105, 142 105, 147 98" fill="none" stroke="#0a0b0e" strokeWidth="1" opacity="0.5" strokeLinecap="round" />

                {/* Eyelid Blink Cover */}
                {isBlinking && (
                  <path d="M 118 98 Q 134 104 150 98" fill="none" stroke="#0a0b0e" strokeWidth="3" strokeLinecap="round" />
                )}
              </g>

              {/* ================= VOLUMINOUS BLACK QUIFF HAIR ================= */}
              {/* Main Hair Silhouette matching Adil's photo */}
              <path 
                d="M 58 84 C 54 38, 86 24, 110 22 C 138 20, 166 34, 162 84 C 158 66, 148 58, 134 62 C 120 50, 96 48, 84 60 C 70 56, 62 68, 58 84 Z" 
                fill="url(#hairGrad)" 
              />
              {/* Texture & Volume Quiff Highlights */}
              <path d="M 74 52 C 88 32, 126 28, 148 44" fill="none" stroke="#374151" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
              <path d="M 92 42 C 108 30, 136 34, 152 56" fill="none" stroke="#4b5563" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
              <path d="M 64 70 C 62 55, 76 44, 94 38" fill="none" stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round" />
            </svg>
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
        Pupils track cursor • Natural breathing & blinking
      </span>
    </div>
  );
}
