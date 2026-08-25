import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { APP_VERSION } from '@/config/version';

export default function Footer() {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const links = [
    { to: '/guide', label: 'Platform Guide' },
    { to: '/about', label: 'About & Manifesto' },
    { to: '/contact', label: 'Contact' },
    { to: '/trending', label: 'Trending' },
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/terms-of-service', label: 'Terms of Service' },
  ];

  return (
    <footer className="border-t border-border/70 bg-bg-card/40 backdrop-blur-xl mt-24 transition-colors relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Main Footer Row: Brand Info & Navigation */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Brand & Version Badge */}
          <div className="flex items-center gap-3">
            <motion.img 
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.08 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              src="/logo.png" 
              alt="Openlysts" 
              className="w-8 h-8 rounded-xl object-contain bg-bg-card border border-border/60 p-0.5 shadow-sm cursor-pointer" 
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-text tracking-tight">Openlysts</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent shadow-sm">
                {APP_VERSION}
              </span>
            </div>
            <span className="text-text-secondary text-xs hidden sm:inline">
              — The Open Source Telescope
            </span>
          </div>

          {/* Navigation Links with React Bits Spring Hover Pill */}
          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-sm font-medium text-text-secondary">
            {links.map((link, idx) => (
              <motion.div
                key={link.to}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative px-3 py-1.5 rounded-xl cursor-pointer"
                whileHover={{ y: -2, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              >
                {/* Floating Spring Pill Aura */}
                {hoveredIdx === idx && (
                  <motion.div
                    layoutId="footer-hover-pill"
                    className="absolute inset-0 bg-accent/10 border border-accent/30 rounded-xl shadow-sm -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
                <Link
                  to={link.to}
                  className="hover:text-accent whitespace-nowrap transition-colors duration-150 inline-flex items-center touch-target"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* Subtle Divider Line */}
        <div className="w-full h-px bg-border/50 my-6" />

        {/* Bottom Sub-Bar: Copyright & Community Craft */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <p className="flex items-center gap-1.5">
            <span>© 2026 Openlysts. 100% Free & Open Source.</span>
          </p>

          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="flex items-center gap-1.5 cursor-default font-medium"
          >
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 fill-accent text-accent animate-pulse" />
            <span>for developers & OSS builders worldwide</span>
          </motion.div>
        </div>

      </div>
    </footer>
  );
}