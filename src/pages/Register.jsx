import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { User, Mail, Lock, AlertCircle, Github, Eye, EyeOff, ArrowRight, ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import SocialHoverCards from '@/components/openlyst/SocialHoverCards';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const redirect = queryParams.get('redirect') || '/discover';

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

  // Password Strength Check
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent(redirect)}`;
  };
  
  const handleGithubLogin = () => {
    window.location.href = `/api/auth/github?redirect=${encodeURIComponent(redirect)}`;
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-bg">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between z-20">
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-bg-card/80 hover:bg-bg-card border border-border/80 text-xs font-bold text-text-secondary hover:text-text transition-all group"
          >
            <ArrowLeft className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:-translate-x-1 transition-transform" />
            <span>Back to Discover</span>
          </Link>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-bg-card/90 backdrop-blur-2xl py-10 px-6 sm:px-10 shadow-2xl rounded-3xl border border-border text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-oss-soft border border-oss/30 flex items-center justify-center mx-auto mb-4 text-oss">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-text mb-2">Check your email</h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              We've dispatched a confirmation link to <strong className="text-text">{email}</strong>. Click the link inside to activate your Openlysts account.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 px-4 bg-accent hover:bg-accent/90 text-accent-fg font-bold text-sm rounded-xl shadow-lg shadow-accent/25 transition-all"
            >
              Return to Login
            </Link>
          </motion.div>
        </div>

        <div className="w-full flex justify-center py-2 z-20">
          <SocialHoverCards />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-bg">
      {/* Dynamic Background Mesh & Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -right-32 w-[32rem] h-[32rem] bg-accent/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -left-32 w-[30rem] h-[30rem] bg-oss/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 right-1/3 w-[28rem] h-[28rem] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      </div>

      {/* Top Header Navigation */}
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

      {/* Main Form Area */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto py-6 z-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-text tracking-tight">
            Join Openlysts
          </h1>
          <p className="text-sm text-text-muted mt-1.5">
            Curate collections, bookmark top OSS, and join the developer community
          </p>
        </div>

        {/* 3D Interactive Card Container */}
        <div 
          className="[perspective:1200px]"
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

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Full Name
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-bg/80 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    placeholder="Ada Lovelace"
                  />
                </div>
              </div>

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
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-bg/80 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-bg/80 border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-text-muted">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-oss font-semibold' : ''}`}>
                      <Check className={`w-3 h-3 ${hasMinLength ? 'opacity-100' : 'opacity-30'}`} />
                      <span>8+ chars</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-oss font-semibold' : ''}`}>
                      <Check className={`w-3 h-3 ${hasUppercase ? 'opacity-100' : 'opacity-30'}`} />
                      <span>Uppercase</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-oss font-semibold' : ''}`}>
                      <Check className={`w-3 h-3 ${hasLowercase ? 'opacity-100' : 'opacity-30'}`} />
                      <span>Lowercase</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? 'text-oss font-semibold' : ''}`}>
                      <Check className={`w-3 h-3 ${hasNumberOrSymbol ? 'opacity-100' : 'opacity-30'}`} />
                      <span>Number / symbol</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-accent-fg font-bold text-sm shadow-lg hover:shadow-accent/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all duration-200 mt-3"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-accent-fg border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
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
                  Or join with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
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
                onClick={handleGithubLogin}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border bg-bg/60 hover:bg-bg hover:border-accent/40 text-xs font-bold text-text transition-all duration-200"
              >
                <Github className="w-4 h-4 text-text" />
                <span>GitHub</span>
              </button>
            </div>

            <div className="mt-6 text-center text-xs text-text-secondary">
              Already have an account?{' '}
              <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-bold text-accent hover:underline">
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full flex justify-center py-2 z-20">
        <SocialHoverCards />
      </div>
    </div>
  );
}
