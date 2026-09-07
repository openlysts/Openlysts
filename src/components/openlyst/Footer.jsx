import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, BadgeCheck, Coffee } from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import { fetchSponsorships } from '@/lib/sponsorships';

// Official Google Preferred Sources integration (advanced/IIFE mode):
// index.html loads https://news.google.com/swg/js/v1/publisher.js with
// preferred-sources-control="manual", which drains the PREFERRED_SOURCE
// callback queue on load. init() renders the flow; addPreferredSource() opens
// Google's source-preferences tool pre-selecting openlysts.dpdns.org and
// returns the reader to this page. If the library ever fails to load, the
// click falls back to the official deeplink (same destination, one extra tap).
const PREFERRED_SOURCES_DEEPLINK = 'https://www.google.com/preferences/source?q=openlysts.dpdns.org';

function PreferredSourceButton() {
  const btnRef = useRef(null);

  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    let openDeeplinkFallback = () => {
      window.open(PREFERRED_SOURCES_DEEPLINK, '_blank', 'noopener,noreferrer');
    };

    const queue = (self.PREFERRED_SOURCE = self.PREFERRED_SOURCE || []);
    queue.push((preferredSource) => {
      try {
        preferredSource.init({ theme: 'light' });
        openDeeplinkFallback = () => {
          try {
            preferredSource.addPreferredSource();
          } catch (e) {
            window.open(PREFERRED_SOURCES_DEEPLINK, '_blank', 'noopener,noreferrer');
          }
        };
      } catch (e) {
        console.warn('[PreferredSources] init failed, falling back to deeplink:', e);
      }
    });

    const onClick = (event) => {
      event.preventDefault();
      openDeeplinkFallback();
    };
    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <a
      ref={btnRef}
      href={PREFERRED_SOURCES_DEEPLINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Add Openlysts as a preferred source on Google"
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-bg-card text-sm font-semibold text-text-primary shadow-sm hover:border-accent/60 hover:text-accent hover:shadow-md transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95 touch-target"
    >
      <BadgeCheck className="w-4 h-4 text-accent" />
      Make Openlysts a Preferred Source on Google
    </a>
  );
}

export default function Footer() {
  const [donation, setDonation] = useState(null);

  // Donation config comes from the edge-cached public endpoint — hidden
  // entirely until the admin enables it from the Monetization panel.
  useEffect(() => {
    let alive = true;
    fetchSponsorships().then((data) => {
      if (!alive) return;
      const s = data?.settings || {};
      if (s.donation_enabled && s.donation_url) {
        setDonation({ label: s.donation_label || 'Support Openlysts', url: s.donation_url });
      }
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const links = [
    { to: '/guide', label: 'Platform Guide' },
    { to: '/about', label: 'Why Openlysts' },
    { to: '/contact', label: 'Contact' },
    { to: '/trending', label: 'Trending' },
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/terms-of-service', label: 'Terms of Service' },
    { to: '/cookie-policy', label: 'Cookie Policy' },
  ];

  return (
    <footer className="relative mt-32 border-t border-border/50 bg-bg-card/20 z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          {/* Brand Column */}
          <div className="col-span-1 lg:col-span-2 flex flex-col items-start">
            <Link to="/" className="flex items-center gap-3 mb-5 group outline-none">
              <img 
                src="/logo.png" 
                alt="Openlysts" 
                className="w-8 h-8 rounded-[10px] object-contain bg-black/[0.03] dark:bg-white/[0.03] border border-border p-1 shadow-sm transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-active:scale-95" 
              />
              <span className="font-semibold text-lg text-text-primary tracking-tight transition-colors duration-200">
                Openlysts
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-bg-element border border-border text-text-muted">
                V {APP_VERSION}
              </span>
            </Link>
            <p className="text-sm text-text-muted max-w-sm leading-relaxed">
              The definitive discovery engine for open-source. Uncover the highest-quality projects shaping the future of software.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="flex flex-col gap-5">
            <h3 className="text-xs font-semibold text-text-primary tracking-wider">Platform</h3>
            <ul className="flex flex-col gap-3.5">
              {links.slice(0, 3).map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-sm inline-block active:scale-95 transform origin-left"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="flex flex-col gap-5">
            <h3 className="text-xs font-semibold text-text-primary tracking-wider">Legal & Community</h3>
            <ul className="flex flex-col gap-3.5">
              {links.slice(3).map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-sm inline-block active:scale-95 transform origin-left"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Google Preferred Sources — readers who add us get a "preferred" badge on our content in Top Stories, AI Overviews and AI Mode */}
        <div className="flex flex-col items-center text-center gap-3 pt-8 pb-2 border-t border-border/50">
          <p className="text-sm font-medium text-text-primary">
            See Openlysts ranked higher in your Google AI answers?
          </p>
          <p className="text-xs text-text-muted max-w-md leading-relaxed">
            Adding Openlysts as a preferred source on Google highlights our content with a "preferred" badge in your Top Stories, AI Overviews and AI Mode — and it takes less than a minute.
          </p>
          <PreferredSourceButton />
          <a
            href={PREFERRED_SOURCES_DEEPLINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-text-muted hover:text-text-primary underline underline-offset-2 transition-colors"
          >
            Or add us manually on Google
          </a>
          {donation && (
            <a
              href={donation.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label={donation.label}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-sm font-semibold text-emerald-600 dark:text-emerald-300 shadow-sm hover:bg-emerald-500/20 hover:shadow-md transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:scale-95 touch-target"
            >
              <Coffee className="w-4 h-4" />
              {donation.label}
            </a>
          )}
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-border/50">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Openlysts. All Rights Reserved.
          </p>

          <p className="text-xs text-text-muted flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-emerald-500/80 fill-emerald-500/20" />
            <span>for developers & OSS builders worldwide -</span>
            <span className="text-text-primary font-medium">By ARD</span>
          </p>
        </div>

      </div>
    </footer>
  );
}