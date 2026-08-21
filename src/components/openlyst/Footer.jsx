import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Openlysts" className="w-7 h-7 rounded-lg object-contain bg-bg-card border border-border/50 p-0.5" />
            <span className="font-bold text-text">Openlysts</span>
            <span className="text-text-muted text-sm ml-1">— Discover. Filter. Build.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-5 text-sm text-text-muted">
            <Link to="/about" className="hover:text-text touch-target inline-flex">About</Link>
            <Link to="/contact" className="hover:text-text touch-target inline-flex">Contact</Link>
            <Link to="/trending" className="hover:text-text touch-target inline-flex">Trending</Link>
            <Link to="/privacy-policy" className="hover:text-text touch-target inline-flex">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-text touch-target inline-flex">Terms of Service</Link>
          </div>
          <p className="text-xs text-text-muted flex items-center gap-1.5">
            Built with <Heart className="w-3 h-3 text-accent" /> for open source
          </p>
        </div>
      </div>
    </footer>
  );
}