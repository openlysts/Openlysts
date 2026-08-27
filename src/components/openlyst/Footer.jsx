import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
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
    <footer className="relative mt-32 border-t border-white/[0.04] bg-bg-card/20 z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          {/* Brand Column */}
          <div className="col-span-1 lg:col-span-2 flex flex-col items-start">
            <Link to="/" className="flex items-center gap-3 mb-5 group outline-none">
              <img 
                src="/logo.png" 
                alt="Openlysts" 
                className="w-8 h-8 rounded-[10px] object-contain bg-white/[0.03] border border-white/[0.08] p-1 shadow-sm transition-transform duration-300 ease-out group-hover:scale-105 group-active:scale-95" 
              />
              <span className="font-semibold text-lg text-white/90 tracking-tight transition-colors duration-200 group-hover:text-white">
                Openlysts
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.05] text-white/50">
                V 1.0
              </span>
            </Link>
            <p className="text-sm text-white/40 max-w-sm leading-relaxed">
              The definitive discovery engine for open-source. Uncover the highest-quality projects shaping the future of software.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="flex flex-col gap-5">
            <h3 className="text-xs font-semibold text-white/80 tracking-wider">Platform</h3>
            <ul className="flex flex-col gap-3.5">
              {links.slice(0, 3).map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-sm inline-block active:scale-95 transform origin-left"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="flex flex-col gap-5">
            <h3 className="text-xs font-semibold text-white/80 tracking-wider">Legal & Community</h3>
            <ul className="flex flex-col gap-3.5">
              {links.slice(3).map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-sm inline-block active:scale-95 transform origin-left"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/[0.04]">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Openlysts. 100% Free & Open Source.
          </p>

          <p className="text-xs text-white/40 flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-emerald-500/80 fill-emerald-500/20" />
            <span>for developers & OSS builders worldwide -</span>
            <span className="text-white/80 font-medium">By ARD</span>
          </p>
        </div>

      </div>
    </footer>
  );
}