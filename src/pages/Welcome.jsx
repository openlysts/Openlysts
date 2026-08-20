import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
  const triggerConfetti = useLogoEasterEgg();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black selection:bg-accent/30 flex items-center justify-center">
      {/* Scanner Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Scanner
          color1="#8b5cf6" // accent purple
          color2="#3b82f6" // blue
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
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-white/90 tracking-wide uppercase">The Future of Discovery</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-[200px] md:h-[300px] lg:h-[400px] flex items-center justify-center -my-4 md:-my-8 cursor-pointer"
              onClick={triggerConfetti}
            >
              <ParticleText
                text="Openlysts"
                particleSize={2}
                density={4}
                color="#f8fafc"
                highlightColor="#8b5cf6"
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
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg md:text-2xl text-white/70 mb-12 max-w-2xl font-light leading-relaxed mt-4"
            >
              Explore, compare, and discover the highest-quality open-source software, all in one stunning ecosystem.
            </motion.p>

            <MagneticButton magneticPull={0.3}>
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
    </div>
  );
}
