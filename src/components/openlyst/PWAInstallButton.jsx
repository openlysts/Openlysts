import { useState, useEffect } from 'react';
import { Download, Share, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallButton({ className = '', variant = 'compact' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    // Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Direct user to browser install or show guide
      setShowIOSGuide(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {variant === 'drawer' ? (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-all touch-target ${className}`}
        >
          <div className="flex items-center gap-3">
            <Download className="w-4 h-4 text-accent animate-bounce" />
            <span>Install Openlysts App</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-fg">
            PWA
          </span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-all shadow-sm touch-target ${className}`}
          title="Install Openlysts App on your device"
          aria-label="Install App"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {/* iOS / General Install Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSGuide(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative z-10 w-full max-w-sm bg-bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text">Install Openlysts</h3>
                  <p className="text-xs text-text-muted">Fast, native open-source discovery</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-text-secondary">
                {isIOS ? (
                  <>
                    <p className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-bg-subtle border border-border flex items-center justify-center font-bold text-text">1</span>
                      Tap the <Share className="w-4 h-4 text-accent inline" /> <strong>Share</strong> button in Safari's toolbar.
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-bg-subtle border border-border flex items-center justify-center font-bold text-text">2</span>
                      Scroll down and tap <strong>"Add to Home Screen"</strong>.
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-bg-subtle border border-border flex items-center justify-center font-bold text-text">3</span>
                      Tap <strong>"Add"</strong> in top-right corner.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="flex items-start gap-2">
                      <span className="w-5 h-5 shrink-0 rounded-full bg-bg-subtle border border-border flex items-center justify-center font-bold text-text">1</span>
                      <span>Tap your browser's menu (three dots <strong>⋮</strong>) or the <strong>Install</strong> button.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="w-5 h-5 shrink-0 rounded-full bg-bg-subtle border border-border flex items-center justify-center font-bold text-text">2</span>
                      <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                    </p>
                    <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-[11px] text-text-secondary leading-relaxed">
                      💡 <strong>Note on Android:</strong> If Google Play Protect shows a verification prompt for direct WebAPK installation, tap <strong>More details ⌵ &rarr; Install anyway</strong>. Openlysts is 100% open-source and safe.
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-accent text-accent-fg font-bold text-sm hover:bg-accent/90 transition-colors shadow-sm"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
