import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';
import CommandPalette from './CommandPalette';
import CompareDock from './CompareDock';
import ThreeBackground from './ThreeBackground';
import { useMobileLayout } from '@/lib/MobileLayoutContext';

export default function OpenlystLayout() {
  const { isMobileLayout } = useMobileLayout();
  const [showScroll, setShowScroll] = useState(false);
  const glowRef = useRef(null);
  const posRef = useRef({ x: 50, y: 50 });
  const currentRef = useRef({ x: 50, y: 50 });

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
    const checkScroll = () => {
      if (window.scrollY > 400) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="min-h-screen flex flex-col theme-transition relative">
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
        <Header />
        <main id="main-content" role="main" className={`flex-1 transition-all duration-300 ease-in-out pb-16 sm:pb-0 ${isMobileLayout ? 'max-w-md w-full mx-auto shadow-2xl border-x border-border bg-bg/50' : ''}`}>
          <Outlet />
        </main>
        <footer role="contentinfo" className={`${isMobileLayout ? 'max-w-md w-full mx-auto' : ''}`}>
          <Footer />
        </footer>
      </div>

      <CommandPalette />
      <CompareDock />
      <BottomNav />

      {/* Floating Scroll to Top */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 p-3 rounded-full bg-accent text-accent-fg shadow-xl z-30 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent touch-target ${showScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}