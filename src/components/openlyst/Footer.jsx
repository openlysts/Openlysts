import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';
import { APP_VERSION } from '@/config/version';

export default function Footer() {
  const links = [
    { to: '/guide', label: 'Platform Guide' },
    { to: '/about', label: 'About & Manifesto' },
    { to: '/contact', label: 'Contact' },
    { to: '/trending', label: 'Trending' },
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/terms-of-service', label: 'Terms of Service' },
  ];

  return (
    <footer className="border-t border-border/80 bg-bg/60 backdrop-blur-md mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo & Brand Mission */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Openlysts" 
              className="w-8 h-8 rounded-xl object-contain bg-bg-card border border-border/60 p-0.5 shadow-sm" 
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-text tracking-tight">Openlysts</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                {APP_VERSION}
              </span>
            </div>
            <span className="hidden sm:inline text-text-secondary text-xs">— Discover. Filter. Build.</span>
          </div>

          {/* Navigation Links with Smooth Interaction */}
          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-medium text-text-secondary">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="hover:text-accent hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 py-1 px-1 touch-target inline-flex items-center"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Open Source Craft Badge */}
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 fill-accent text-accent animate-pulse" />
            <span>for the open source community</span>
          </div>
        </div>
      </div>
    </footer>
  );
}