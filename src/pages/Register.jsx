import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  User, Mail, Lock, AlertCircle, Github, Eye, EyeOff, ArrowRight, ArrowLeft, 
  Check, Sparkles, Zap, Terminal, Code, Cpu, Layers, Rocket
} from 'lucide-react';
import AnimateDigits from '@/components/openlyst/AnimateDigits';
import SocialHoverCards from '@/components/openlyst/SocialHoverCards';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { Turnstile } from '@marsidev/react-turnstile';

const DEVELOPER_ROLES = [
  { id: 'fullstack', label: 'Fullstack', icon: Layers, color: 'from-blue-500 to-cyan-400' },
  { id: 'ai', label: 'AI / ML', icon: Cpu, color: 'from-purple-500 to-pink-500' },
  { id: 'devops', label: 'DevOps / Cloud', icon: Terminal, color: 'from-emerald-500 to-teal-400' },
  { id: 'systems', label: 'Systems & Backend', icon: Code, color: 'from-amber-500 to-orange-400' },
  { id: 'creator', label: 'OSS Builder', icon: Rocket, color: 'from-accent to-trending' },
];

export default function Register() {
  usePageTitle('Register — Dev Pass');
  const { totalRepositoriesFormatted, totalAlternativesFormatted } = usePlatformStats();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('fullstack');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const redirect = queryParams.get('redirect') || '/discover';

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

  // 3D Card Physics for Register Card
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
  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumberOrSymbol].filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError('Please complete the security check.');
      return;
    }
    setError(null);
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, role: selectedRole, turnstileToken })
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

  const handleOAuthLogin = (provider) => {
    window.location.href = `/api/auth/${provider}?redirect=${encodeURIComponent(redirect)}`;
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
            className="bg-bg-card/95 backdrop-blur-2xl py-10 px-6 sm:px-10 shadow-2xl rounded-3xl border border-accent/30 text-center relative overflow-hidden"
          >
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-oss-soft border border-oss/30 flex items-center justify-center mx-auto mb-4 text-oss">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-text mb-2">Check your email</h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              We've dispatched a confirmation link to <strong className="text-text font-mono">{email}</strong>. Click the link inside to activate your Openlysts Pass.
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
      {/* Dynamic Ambient Background Mesh & Glowing Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] bg-accent/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-[34rem] h-[34rem] bg-purple-500/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[140px]" />
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

      {/* Main Content: 2-Column High-Converting Layout */}
      <div className="w-full max-w-6xl mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center z-10">
        
        {/* Left Column: Interactive Holographic Dev Pass & Unlocks (Psychological Hook) */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Genesis Member Access • Free Forever</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-text tracking-tight leading-[1.12]">
              Claim your <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-cyan-400 to-purple-400">
                Openlysts Dev Pass.
              </span>
            </h1>

            <p className="text-sm text-text-secondary leading-relaxed max-w-md">
              Join over 100,000+ developers discovering, comparing, and deploying cutting-edge open-source software before it hits mainstream.
            </p>
          </div>

          {/* Interactive 3D Holographic Member Pass */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative rounded-3xl p-6 bg-gradient-to-br from-bg-card/90 via-bg-card/70 to-bg-subtle/80 border border-border/80 shadow-2xl backdrop-blur-2xl overflow-hidden group max-w-md"
          >
            {/* Iridescent Ambient Gradient Flare */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-accent/20 rounded-full blur-3xl group-hover:bg-accent/30 transition-all" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />

            <div className="relative z-10 flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent to-cyan-400 p-[2px] shadow-lg">
                  <div className="w-full h-full bg-bg-card rounded-[14px] flex items-center justify-center font-black text-lg text-accent">
                    {name ? name.charAt(0).toUpperCase() : '⚡'}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-sm text-text flex items-center gap-1.5">
                    {name || 'Your Developer Name'}
                    <span className="inline-block w-2 h-2 rounded-full bg-oss animate-pulse" />
                  </div>
                  <div className="text-xs font-mono text-text-muted">
                    {email ? email : 'dev@openlysts.network'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent border border-accent/30">
                  Genesis Pioneer
                </span>
                <div className="text-[11px] font-mono text-text-muted mt-1">
                  Pass #35,477
                </div>
              </div>
            </div>

            {/* Selected Role Badge on Pass */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
              <span className="text-text-muted font-medium">Active Track:</span>
              <span className="font-bold text-text bg-bg-subtle px-2.5 py-1 rounded-lg border border-border/60 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-accent" />
                {DEVELOPER_ROLES.find(r => r.id === selectedRole)?.label || 'Fullstack'}
              </span>
            </div>

            {/* Instant Member Perks Preview */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-oss" />
                <span>Star Spike Alerts</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-oss" />
                <span>Unlimited Docks</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-oss" />
                <span>1-Click Docker JIT</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-oss" />
                <span>Cloud Sync Everywhere</span>
              </div>
            </div>
          </motion.div>

          {/* Live Platform Scale Counters */}
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div className="p-3 rounded-2xl bg-bg-card/70 border border-border/70 backdrop-blur-md">
              <div className="text-lg font-black text-text">
                <AnimateDigits value={totalRepositoriesFormatted} />
              </div>
              <div className="text-[10px] font-semibold text-text-muted mt-0.5">Projects Rated</div>
            </div>
            <div className="p-3 rounded-2xl bg-bg-card/70 border border-border/70 backdrop-blur-md">
              <div className="text-lg font-black text-accent">
                <AnimateDigits value={totalAlternativesFormatted} />+
              </div>
              <div className="text-[10px] font-semibold text-text-muted mt-0.5">Free Alternatives</div>
            </div>
            <div className="p-3 rounded-2xl bg-bg-card/70 border border-border/70 backdrop-blur-md">
              <div className="text-lg font-black text-trending">100%</div>
              <div className="text-[10px] font-semibold text-text-muted mt-0.5">Verified OSS</div>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Glassmorphic Signup Form */}
        <div 
          className="lg:col-span-6 [perspective:1200px] w-full max-w-md mx-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            ref={cardRef}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="relative bg-bg-card/95 backdrop-blur-2xl p-7 sm:p-9 rounded-3xl border border-border/80 shadow-2xl transition-shadow duration-300"
          >
            {/* Specular Light Sheen */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/[0.04] to-transparent pointer-events-none" />

            <div className="mb-5">
              <h2 className="text-2xl font-black text-text tracking-tight">
                Create your account
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Start discovering high-velocity open-source tools in seconds
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

            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {/* Primary Developer Role Track Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Select Primary Track
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DEVELOPER_ROLES.map((r) => {
                    const isSelected = selectedRole === r.id;
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                          isSelected
                            ? 'bg-accent text-accent-fg shadow-sm scale-[1.02]'
                            : 'bg-bg/70 hover:bg-bg border border-border/70 text-text-secondary hover:text-text'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-bg/80 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                    placeholder="Linus Torvalds"
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
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-bg/80 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                    placeholder="you@domain.com"
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

                {/* Progressive Strength Milestone Indicator */}
                {password.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex gap-1 h-1.5 w-full bg-bg/80 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${strengthScore >= 1 ? 'w-1/4 bg-red-500' : 'w-0'}`} />
                      <div className={`h-full transition-all duration-300 ${strengthScore >= 2 ? 'w-1/4 bg-amber-500' : 'w-0'}`} />
                      <div className={`h-full transition-all duration-300 ${strengthScore >= 3 ? 'w-1/4 bg-blue-500' : 'w-0'}`} />
                      <div className={`h-full transition-all duration-300 ${strengthScore >= 4 ? 'w-1/4 bg-oss' : 'w-0'}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-text-muted pt-0.5">
                      <div className={`flex items-center gap-1 ${hasMinLength ? 'text-oss font-bold' : ''}`}>
                        <Check className={`w-3 h-3 ${hasMinLength ? 'opacity-100' : 'opacity-30'}`} />
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center gap-1 ${hasUppercase ? 'text-oss font-bold' : ''}`}>
                        <Check className={`w-3 h-3 ${hasUppercase ? 'opacity-100' : 'opacity-30'}`} />
                        <span>Uppercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1 ${hasLowercase ? 'text-oss font-bold' : ''}`}>
                        <Check className={`w-3 h-3 ${hasLowercase ? 'opacity-100' : 'opacity-30'}`} />
                        <span>Lowercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1 ${hasNumberOrSymbol ? 'text-oss font-bold' : ''}`}>
                        <Check className={`w-3 h-3 ${hasNumberOrSymbol ? 'opacity-100' : 'opacity-30'}`} />
                        <span>Number / symbol</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-2">
                <Turnstile
                  siteKey="0x4AAAAAAEhvTMENfU1-v3c7"
                  onSuccess={(token) => setTurnstileToken(token)}
                  options={{ theme: 'dark' }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !turnstileToken}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-accent-fg font-bold text-sm shadow-lg hover:shadow-accent/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all duration-200 mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-accent-fg border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Claim Openlysts Pass</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-bg-card px-3 text-text-muted font-bold tracking-widest text-[10px]">
                  Or register with
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

            <div className="mt-5 text-center text-xs text-text-secondary">
              Already have an account?{' '}
              <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-bold text-accent hover:underline">
                Sign in
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
