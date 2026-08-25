import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  Mail, Lock, AlertCircle, ArrowRight, ArrowLeft, Github, Eye, EyeOff, 
  Sparkles, Bookmark, Zap, Scale
} from 'lucide-react';
import AnimateDigits from '@/components/openlyst/AnimateDigits';
import SocialHoverCards from '@/components/openlyst/SocialHoverCards';
import { usePlatformStats } from '@/hooks/usePlatformStats';

export default function Login() {
  usePageTitle('Login');
  const { totalRepositoriesFormatted, totalAlternativesFormatted } = usePlatformStats();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { checkUserAuth } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const redirect = queryParams.get('redirect') || '/discover';
  const urlError = queryParams.get('error');

  // Keyboard shortcut Esc to navigate back to Discover
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate('/discover');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // 3D Card Physics
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password.');
      }
      
      // Update global context
      await checkUserAuth();
      navigate(redirect);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `/api/auth/${provider}?redirect=${encodeURIComponent(redirect)}`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-bg">
      {/* Dynamic Background Mesh & Glowing Radial Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-accent/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] bg-trending/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/4 w-[28rem] h-[28rem] bg-blue-500/10 rounded-full blur-[120px]" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      </div>

      {/* Top Header Navigation with prominent Back Button */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between z-20">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-bg-card/80 hover:bg-bg-card border border-border/80 hover:border-accent/40 shadow-sm text-xs font-bold text-text-secondary hover:text-text transition-all duration-200 group"
          title="Return to Discovery (Esc)"
        >
          <ArrowLeft className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:-translate-x-1 transition-transform" />
          <span>Back to Discover</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-bg-subtle text-[10px] text-text-muted font-mono border border-border/50">
            Esc
          </kbd>
        </Link>

        <Link to="/discover" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-center backdrop-blur-md group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="Openlysts" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-black text-sm tracking-tight text-text">Openlysts</span>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-5xl mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center z-10">
        
        {/* Left Column: Psychological Value Props & Live Metrics (Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 pr-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Open-Source Discovery Engine</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-text tracking-tight leading-[1.15]">
            Supercharge your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-emerald-400 to-trending">
              development stack.
            </span>
          </h1>

          <p className="text-sm text-text-secondary leading-relaxed max-w-md">
            Sign in to unlock personalized bookmark synchronization, star-growth momentum tracking, and automated open-source SaaS replacements.
          </p>

          {/* Live Rolling Numbers */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-bg-card/70 border border-border/70 backdrop-blur-md">
              <div className="text-xl font-black text-text">
                <AnimateDigits value={totalRepositoriesFormatted} />
              </div>
              <div className="text-[11px] font-semibold text-text-muted mt-0.5">Projects Rated</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-bg-card/70 border border-border/70 backdrop-blur-md">
              <div className="text-xl font-black text-accent">
                <AnimateDigits value={totalAlternativesFormatted} />+
              </div>
              <div className="text-[11px] font-semibold text-text-muted mt-0.5">Free Alternatives</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-bg-card/70 border border-border/70 backdrop-blur-md">
              <div className="text-xl font-black text-trending">100%</div>
              <div className="text-[11px] font-semibold text-text-muted mt-0.5">Verified OSS</div>
            </div>
          </div>

          {/* Value Highlights */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs font-medium text-text-secondary">
              <div className="w-6 h-6 rounded-lg bg-oss-soft text-oss flex items-center justify-center flex-shrink-0">
                <Bookmark className="w-3.5 h-3.5" />
              </div>
              <span>Sync bookmarks and star-rated tool stacks across any device</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-text-secondary">
              <div className="w-6 h-6 rounded-lg bg-trending-soft text-trending flex items-center justify-center flex-shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span>Real-time GitHub star spikes & breakneck momentum alerts</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-text-secondary">
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Scale className="w-3.5 h-3.5" />
              </div>
              <span>Side-by-side comparison dock with 1-click Docker exports</span>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Interactive Login Card */}
        <div 
          className="lg:col-span-6 [perspective:1200px] w-full max-w-md mx-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            ref={cardRef}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="relative bg-bg-card/90 backdrop-blur-2xl p-7 sm:p-9 rounded-3xl border border-border/80 shadow-2xl transition-shadow duration-300"
          >
            {/* Subtle Specular Sheen */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/[0.04] to-transparent pointer-events-none" />

            <div className="mb-6">
              <h2 className="text-2xl font-black text-text tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Enter your credentials to access your Openlysts workspace
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 bg-nonoss-soft border border-nonoss/30 rounded-xl p-3 flex items-start text-xs font-medium text-nonoss"
              >
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {urlError === 'account_inactive' && (
              <div className="mb-5 bg-nonoss-soft border border-nonoss/30 rounded-xl p-3 flex items-start text-xs font-medium text-nonoss">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <span>This account has been deactivated by moderation.</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-bg/80 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-bg/80 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-accent-fg font-bold text-sm shadow-lg hover:shadow-accent/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all duration-200 mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-accent-fg border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign in to Openlysts</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-bg-card px-3 text-text-muted font-bold tracking-widest text-[10px]">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border bg-bg/60 hover:bg-bg hover:border-accent/40 text-xs font-bold text-text transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.1 8.9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.6 6.4C.6 8.4 0 10.6 0 13s.6 4.6 1.6 6.6l3.7-2.8z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.1L1.6 16C3.5 19.8 7.4 23 12 23z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border bg-bg/60 hover:bg-bg hover:border-accent/40 text-xs font-bold text-text transition-all duration-200"
              >
                <Github className="w-4 h-4 text-text" />
                <span>GitHub</span>
              </button>
            </div>

            <div className="mt-6 text-center text-xs text-text-secondary">
              Don't have an account yet?{' '}
              <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="font-bold text-accent hover:underline">
                Create an account
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Interactive Social Hover Cards Bar */}
      <div className="w-full flex justify-center py-2 z-20">
        <SocialHoverCards />
      </div>
    </div>
  );
}
