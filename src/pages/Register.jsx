import React, { useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { User, Mail, Lock, AlertCircle, Github, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const redirect = queryParams.get('redirect') || '/discover';

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
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-bg-card/90 backdrop-blur-xl py-10 px-6 sm:px-10 shadow-2xl rounded-3xl border border-border text-center"
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
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Mesh & Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 -left-32 w-96 h-96 bg-oss/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 right-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/discover" className="inline-flex items-center gap-2.5 group mb-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-md flex items-center justify-center backdrop-blur-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <img src="/logo.png" alt="Openlysts" className="w-9 h-9 object-contain drop-shadow" />
          </div>
        </Link>
        <h1 className="text-3xl font-black text-text tracking-tight">
          Join Openlysts
        </h1>
        <p className="text-sm text-text-muted mt-1.5">
          Curate collections, bookmark top OSS, and join the developer community
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
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
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
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
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

              {/* Password Checklist */}
              <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px] font-medium text-text-muted bg-bg/50 p-2.5 rounded-xl border border-border/50">
                <div className={`flex items-center gap-1.5 transition-colors ${hasMinLength ? 'text-oss font-bold' : 'text-text-muted'}`}>
                  {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-block" />}
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${hasUppercase ? 'text-oss font-bold' : 'text-text-muted'}`}>
                  {hasUppercase ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-block" />}
                  <span>Uppercase</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${hasLowercase ? 'text-oss font-bold' : 'text-text-muted'}`}>
                  {hasLowercase ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-block" />}
                  <span>Lowercase</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${hasNumberOrSymbol ? 'text-oss font-bold' : 'text-text-muted'}`}>
                  {hasNumberOrSymbol ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-block" />}
                  <span>Number/Symbol</span>
                </div>
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
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Free Account</span>
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
              onClick={handleGoogleLogin}
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
              onClick={handleGithubLogin}
              className="flex justify-center items-center py-2.5 px-4 rounded-xl border border-border bg-bg/60 hover:bg-bg-hover hover:border-accent/40 text-xs font-semibold text-text shadow-sm transition-all"
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </motion.button>
          </div>

          <p className="mt-6 text-center text-xs text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
