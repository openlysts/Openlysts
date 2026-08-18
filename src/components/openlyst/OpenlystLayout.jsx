import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import CommandPalette from './CommandPalette';
import CompareDock from './CompareDock';
import ThreeBackground from './ThreeBackground';
import { useMobileLayout } from '@/lib/MobileLayoutContext';

export default function OpenlystLayout() {
  const { isMobileLayout } = useMobileLayout();
  const [showScroll, setShowScroll] = useState(false);

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
    <div className="min-h-screen flex flex-col theme-transition">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-fg focus:rounded-lg font-medium">
        Skip to main content
      </a>
      
      <ThreeBackground />
      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        <main id="main-content" role="main" className={`flex-1 transition-all duration-300 ease-in-out ${isMobileLayout ? 'max-w-md w-full mx-auto shadow-2xl border-x border-border bg-bg/50' : ''}`}>
          <Outlet />
        </main>
        <footer role="contentinfo" className={`${isMobileLayout ? 'max-w-md w-full mx-auto' : ''}`}>
          <Footer />
        </footer>
      </div>

      <CommandPalette />
      <CompareDock />

      {/* Floating Scroll to Top */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-6 right-6 p-3 rounded-full bg-accent text-accent-fg shadow-lg z-50 transition-all duration-300 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent ${showScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}