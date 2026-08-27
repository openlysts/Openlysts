import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import throttle from 'lodash/throttle';
import { ArrowUp, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';
import CommandPalette from './CommandPalette';
import CompareDock from './CompareDock';
import ThreeBackground from './ThreeBackground';
import ProductTour from './ProductTour';
import { useMobileLayout } from '@/lib/MobileLayoutContext';

export default function OpenlystLayout() {
  const { isMobileLayout } = useMobileLayout();
  const location = useLocation();
  const [showScroll, setShowScroll] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const glowRef = useRef(null);
  const posRef = useRef({ x: 50, y: 50 });
  const currentRef = useRef({ x: 50, y: 50 });

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      posRef.current = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      };
    };

    let rafId;
    const animate = () => {
      const target = posRef.current;
      const curr = currentRef.current;
      curr.x += (target.x - curr.x) * 0.05;
      curr.y += (target.y - curr.y) * 0.05;
      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(750px circle at ${curr.x}% ${curr.y}%, hsl(var(--accent) / 0.16) 0%, transparent 65%)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const checkScroll = throttle(() => {
      if (window.scrollY > 400) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    }, 100);
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => {
      checkScroll.cancel();
      window.removeEventListener('scroll', checkScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="min-h-screen flex flex-col theme-transition relative">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-bg focus:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        Skip to main content
      </a>
      <ThreeBackground />
      {/* Interactive Cursor Spotlight Glow */}
      <div 
        ref={glowRef} 
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
        style={{ background: 'radial-gradient(750px circle at 50% 50%, hsl(var(--accent) / 0.16) 0%, transparent 65%)' }}
      />
      {/* Ambient top hero glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/12 via-transparent to-transparent pointer-events-none z-0" />
      <div className="relative z-10 flex flex-col flex-1">
        {isOffline && (
          <div className="bg-red-500/90 text-white text-center py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2 backdrop-blur-md border-b border-red-500/20 z-50 sticky top-0 animate-in slide-in-from-top duration-300">
            <WifiOff className="w-3.5 h-3.5" />
            You are currently offline. Some features may be unavailable.
          </div>
        )}
        <Header />
        
        {/* Main Content */}
        <main id="main-content" role="main" tabIndex="-1" className={`flex-1 transition-all duration-300 ease-in-out pb-16 sm:pb-0 ${isMobileLayout ? 'max-w-md w-full mx-auto shadow-2xl border-x border-border bg-bg/50' : ''}`}>
          <Outlet />
        </main>

        <footer role="contentinfo" className={`${isMobileLayout ? 'max-w-md w-full mx-auto' : ''}`}>
          <Footer />
        </footer>
      </div>

      <CommandPalette />
      <CompareDock />
      <BottomNav />
      
      <ProductTour />

      {/* Floating Spring Bounce Scroll to Top Button */}
      <motion.button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        initial={false}
        animate={{
          scale: showScroll ? 1 : 0,
          opacity: showScroll ? 1 : 0,
          y: showScroll ? 0 : 20,
        }}
        whileHover={{ scale: 1.15, y: -4 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 p-3 rounded-full bg-accent text-accent-fg shadow-2xl shadow-accent/40 z-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent touch-target border border-white/20"
      >
        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
      </motion.button>
    </div>
  );
}