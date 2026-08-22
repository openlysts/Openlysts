import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Mail, Lock, AlertCircle, ArrowRight, Github, Eye, EyeOff, Shield, Compass } from 'lucide-react';

export default function Login() {
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

  // 3D Card Physics
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

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
    e.preventDefault();
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Mesh & Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-trending/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Floating Badges */}
      <div className="hidden lg:block absolute top-24 left-[12%] animate-float">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-bg-card/80 backdrop-blur-md border border-border shadow-lg text-xs font-semibold text-text-secondary">
          <Compass className="w-4 h-4 text-accent" />
          <span>Explore 200+ Repos</span>
        </div>
      </div>
      <div className="hidden lg:block absolute bottom-28 right-[12%] animate-float" style={{ animationDelay: '1.5s' }}>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-bg-card/80 backdrop-blur-md border border-border shadow-lg text-xs font-semibold text-text-secondary">
          <Shield className="w-4 h-4 text-oss" />
          <span>Verified Open-Source</span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/discover" className="inline-flex items-center gap-2.5 group mb-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-md flex items-center justify-center backdrop-blur-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <img src="/logo.png" alt="Openlysts" className="w-9 h-9 object-contain drop-shadow" />
          </div>
        </Link>
        <h1 className="text-3xl font-black text-text tracking-tight">
          Welcome to Openlysts
        </h1>
        <p className="text-sm text-text-muted mt-1.5">
          Sign in to sync bookmarks, rate repositories & access the admin hub
        </p>
      </div>

      {/* 3D Interactive Card Container */}
      <div 
        className="sm:mx-auto sm:w-full sm:max-w-md [perspective:1000px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          ref={cardRef}
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          className="relative bg-bg-card/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-border/80 shadow-2xl transition-shadow duration-300"
        >
          {/* Subtle Specular Sheen */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/[0.04] to-transparent pointer-events-none" />

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
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl pl-10 pr-11 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
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

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-accent hover:bg-accent/90 text-accent-fg font-bold text-sm rounded-xl shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign in to Openlysts</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
              <span className="px-3 bg-bg-card text-text-muted">
                Or continue with
              </span>
            </div>
          </div>

          {/* Creative Social Buttons */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOAuthLogin('google')}
              className="flex justify-center items-center py-2.5 px-4 rounded-xl border border-border bg-bg/60 hover:bg-bg-hover hover:border-accent/40 text-xs font-semibold text-text shadow-sm transition-all"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOAuthLogin('github')}
              className="flex justify-center items-center py-2.5 px-4 rounded-xl border border-border bg-bg/60 hover:bg-bg-hover hover:border-accent/40 text-xs font-semibold text-text shadow-sm transition-all"
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </motion.button>
          </div>

          <p className="mt-6 text-center text-xs text-text-muted">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
