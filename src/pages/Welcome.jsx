import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import ParticleText from '../components/reactbits/ParticleText';
import Scanner from '../components/reactbits/Scanner';
import SpecularButton from '@/components/reactbits/SpecularButton';
import MagneticButton from '@/components/reactbits/MagneticButton';
import { useLogoEasterEgg } from '@/hooks/useLogoEasterEgg';

export default function Welcome() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const triggerConfetti = useLogoEasterEgg();

  useEffect(() => {
    setMounted(true);
    // Auto-dismiss the hint after 20 seconds so it never permanently obstructs
    const timer = setTimeout(() => setShowHint(false), 20000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black selection:bg-accent/30 flex items-center justify-center">
      <a href="#main-content" className="absolute top-0 left-0 -translate-y-full focus:translate-y-0 z-[9999] p-4 bg-black text-white font-bold outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition-transform duration-200">
        Skip to main content
      </a>
      {/* Scanner Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Scanner
          color1="#10b981" // emerald
          color2="#0f172a" // deep slate
          color3="#ffffff" // white
          speed={0.3}
          sweepSpeed={0.2}
          sweepWidth={2.0}
          sweepFalloff={4}
          scale={1.2}
          frequency={1.5}
          ripple={0.3}
          bandDensity={8}
          lineSharpness={6.0}
          glow={0.3}
          scanDirection="horizontal"
          colorSpread={0.8}
          brightness={0.8}
          contrast={1.2}
          vignette={0.6}
          opacity={0.7}
          scanline={true}
          grain={true}
          grainIntensity={0.06}
          mouseInteraction={true}
        />
        {/* Subtle grid overlay for texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
      </div>

      {/* Content */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-8 left-8 md:top-12 md:left-12 z-20 pointer-events-none"
      >
        <img src="/logo.png" alt="Openlysts" className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] opacity-90" />
      </motion.header>

      <main id="main-content" role="main" className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto w-full">
        <h1 className="sr-only">Openlysts — Discover Open-Source Projects</h1>
        {mounted && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-white/90 tracking-wide uppercase">The Future of Discovery</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-[200px] md:h-[300px] lg:h-[400px] flex items-center justify-center -my-4 md:-my-8 cursor-pointer relative"
              onClick={triggerConfetti}
            >
              <ParticleText
                text="Openlysts"
                particleSize={2.5}
                density={4}
                color="#f8fafc"
                highlightColor="#10b981"
                scatter={190}
                gatherDuration={1500}
                stagger={570}
                pointerRepel={58}
                repelRadius={145}
                idleDrift={0.5}
                trigger="mount"
                fontSize="clamp(4rem, 15vw, 10rem)"
                fontWeight={900}
                fontFamily="'Inter', 'Roboto', 'Helvetica Neue', sans-serif"
                glow={true}
                className="w-full h-full"
                style={{}}
              />
            </motion.div>

            {/* Ephemeral micro-hint — fades away after 5s, never blocks the brand */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.6, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm pointer-events-none select-none"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400/70" />
                  <span className="text-[13px] text-white/40 tracking-wide">Every particle is a real open-source project — hover to explore</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl font-light leading-relaxed mt-4 tracking-wide text-center mx-auto"
            >
              The definitive discovery engine for open-source. Uncover the highest-quality projects shaping the future of software.
            </motion.p>

            <MagneticButton magneticPull={0.3} onClick={() => navigate('/discover')}>
              <SpecularButton
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.0, type: "spring", stiffness: 200 }}
                onClick={() => navigate('/discover')}
                highlight="#ffffff"
                edge="#525252"
                tint="#ffffff"
                textColor="#f5f5f5"
                radius="49px"
                tintOpacity={0}
                blur={0}
                intensity={1.55}
                thickness={1.8}
                proximity={400}
                className="mt-8 group relative"
              >
                <div className="absolute inset-0 bg-accent/20 rounded-[49px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 flex items-center gap-2">
                  Discover Open Source <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </SpecularButton>
            </MagneticButton>
          </>
        )}
      </main>
      
      {/* Surgical About & Manifesto Link (Now opens a modal overlay) */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 z-50">
        <button 
          onClick={() => setIsAboutOpen(true)}
          className="group relative inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium tracking-wide text-white/70 transition-all duration-300 hover:text-white cursor-pointer"
        >
          <span className="relative z-10">About & Manifesto</span>
          <div className="absolute inset-0 rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/20 group-hover:scale-105" />
        </button>
      </div>

      {/* About & Manifesto Modal Overlay */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsAboutOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-slate-950/80 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              <button 
                onClick={() => setIsAboutOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                The Open-Source Telescope
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-6">
                The best software in the world isn't behind a paywall. <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                  It's hiding on GitHub.
                </span>
              </h2>

              <div className="space-y-4 text-white/70 text-base leading-relaxed">
                <p>
                  Over 300 million repositories exist today; 90% of them are abandoned experiments, tutorials, or star-farmed hype. <strong className="text-white font-semibold">Openlysts</strong> is a high-velocity discovery engine built to cut through the noise, surfacing living code, verified alternatives, and pure engineering craft in milliseconds.
                </p>
                <p>
                  No corporate boardrooms, no paywalled bait-and-switch—just genuine passion for open code and high-performance engineering. Built by a passionate builder for the global developer community.
                </p>
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-slate-900 text-sm">
                    ARD
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Adil Rafiq Dar</div>
                    <div className="text-xs text-white/50">Creator & Architect</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAboutOpen(false)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
