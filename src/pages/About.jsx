import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Linkedin, 
  Mail, 
  Github, 
  Coffee, 
  Compass, 
  Zap, 
  Layers, 
  ChevronDown, 
  ExternalLink,
  Code2,
  Terminal,
  Flame,
  ArrowRight,
  Cpu,
  Workflow,
  Star,
  X,
  Database,
  Server,
  Palette,
  Box,
  ShieldCheck,
  GitPullRequest,
  HeartHandshake
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import ReactiveAvatar from '@/components/openlyst/ReactiveAvatar';
import AnimateDigits from '@/components/openlyst/AnimateDigits';
import { usePlatformStats } from '@/hooks/usePlatformStats';

export default function About() {
  usePageTitle('About — Why Openlysts');
  const { totalRepositories, totalAlternatives, totalAlternativesFormatted } = usePlatformStats();
  const [openFaq, setOpenFaq] = useState(0);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isCreatorModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCreatorModalOpen]);

  const founderChips = [
    { label: 'Tech BA & Project Manager', icon: Workflow, color: 'from-blue-500/15 to-cyan-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 dark:border-blue-500/40' },
    { label: 'AI Enthusiast & Systems Architect', icon: Cpu, color: 'from-purple-500/15 to-pink-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 dark:border-purple-500/40' },
    { label: 'Relentless OSS Hobbyist & Builder', icon: Code2, color: 'from-amber-500/15 to-orange-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/40' },
    { label: 'Fuelled by High-Roast Coffee ☕', icon: Coffee, color: 'from-emerald-500/15 to-teal-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40' },
  ];

  const corePillars = [
    {
      icon: Compass,
      title: 'The Signal Engine',
      badge: 'Algorithmic Merit',
      desc: 'GitHub star counts have become vanity metrics susceptible to hype cycles and bot farming. Our multi-vector engine weights active commit frequency, PR turnaround, issue resolution, and permissive licensing to surface real, living software.',
      gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent'
    },
    {
      icon: Layers,
      title: 'Zero-BS SaaS Alternatives',
      badge: '876+ Curated Mappings',
      desc: 'Why pay $200/mo per seat when battle-tested open-source alternatives exist? We provide honest feature parity scores, deployment guides, and community health benchmarks for tools like Supabase, PostHog, and Ollama.',
      gradient: 'from-purple-500/10 via-pink-500/5 to-transparent'
    },
    {
      icon: Zap,
      title: 'Sub-50ms Craft & Speed',
      badge: 'Zero-Bloat Architecture',
      desc: 'Built with an in-memory LRU/TTL edge cache, lean SQL list projections, and an optimistic 0ms client outbox sync. No 30-second polling thrash, no laggy loaders, no intrusive tracking scripts.',
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent'
    }
  ];

  const techStack = [
    { name: 'React & Vite', icon: Box, desc: 'Lightning-fast HMR and optimized production builds.', color: 'text-cyan-400' },
    { name: 'Node.js & Express', icon: Server, desc: 'Lean backend API with strict rate limiting and fast response times.', color: 'text-green-500' },
    { name: 'Neon PostgreSQL', icon: Database, desc: 'Serverless scaling, robust relational data, and JSONB flexibility.', color: 'text-blue-500' },
    { name: 'Tailwind & Framer Motion', icon: Palette, desc: 'Utility-first styling with hardware-accelerated fluid animations.', color: 'text-purple-400' }
  ];

  const faqs = [
    {
      q: 'Why did you build Openlysts instead of just using GitHub Search?',
      a: 'GitHub search is great for exact keyword lookups, but terrible for discovery. It cannot tell you if a repo is maintained, lacks SaaS alternative mapping, and buries incredible indie developer projects under massive corporate monorepos. Openlysts acts as a curated telescope for the open-source universe.'
    },
    {
      q: 'How are trending scores and quality ratings calculated?',
      a: 'We evaluate multi-dimensional velocity: recent commit velocity (7d/30d), release cadences, issue closure rates, license permissiveness (MIT, Apache 2.0, BSD), and developer engagement. Vanity star spikes without code activity are automatically de-weighted.'
    },
    {
      q: 'Is Openlysts free and independent?',
      a: 'Yes, 100% free and completely independent. There are no paywalled features, no VC investor mandates, and no locked comparison tiers. Built by a passionate builder for the global developer community.'
    },
    {
      q: 'How can I connect, give feedback, or suggest a project?',
      a: 'You can reach out directly via LinkedIn (Adil Rafiq Dar), reach the Openlysts Support Desk, or submit repositories and feedback via the in-app forms!'
    }
  ];

  const missionPoints = [
    { label: 'Signal-to-Noise Ratio', val: '99.4%', desc: 'Strict filtering against abandoned repos, spam, and toy projects.' },
    { label: 'Evaluation Velocity', val: '< 50ms', desc: 'Instant search, category filters, and live preview benchmarks.' },
    { label: 'Community Sourced', val: '100% Free', desc: 'No paywalls, sponsored rankings, or hidden vendor endorsements.' }
  ];

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16">
      
      {/* 1. HERO SECTION & MANIFESTO */}
      <div className="text-center space-y-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent/30 text-accent text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          The Open-Source Telescope
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-black text-text tracking-tight leading-[1.15]"
        >
          The best software in the world isn't behind a paywall. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-purple-400 to-pink-400">
            It's hiding on GitHub.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg text-text-secondary leading-relaxed"
        >
          Over 300 million repositories exist today; 90% of them are abandoned experiments, tutorials, or star-farmed hype. <strong className="text-text font-semibold">Openlysts</strong> is the high-velocity telescope engineered to cut through the noise, surfacing living code, verified alternatives, and pure engineering craft in milliseconds.
        </motion.p>

        {/* Dynamic Live Rolling Stat Badges */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-4 grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 max-w-2xl mx-auto"
        >
          <div className="p-4 rounded-2xl bg-bg-card/70 border border-border/60 backdrop-blur-md text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-black text-text flex items-center justify-center gap-0.5">
              <AnimateDigits value={totalRepositories} />
              <span className="text-accent">+</span>
            </div>
            <div className="text-xs text-text-secondary font-medium mt-1">Repositories Scanned</div>
          </div>

          <div className="p-4 rounded-2xl bg-bg-card/70 border border-border/60 backdrop-blur-md text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-black text-text flex items-center justify-center gap-0.5">
              <AnimateDigits value={totalAlternatives} />
              <span className="text-purple-600 dark:text-purple-400">+</span>
            </div>
            <div className="text-xs text-text-secondary font-medium mt-1">Free Alternatives</div>
          </div>

          <div className="p-4 rounded-2xl bg-bg-card/70 border border-border/60 backdrop-blur-md text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-black text-text flex items-center justify-center gap-0.5">
              <AnimateDigits value={100} />
              <span className="text-emerald-600 dark:text-emerald-400">%</span>
            </div>
            <div className="text-xs text-text-secondary font-medium mt-1">Free & Open Access</div>
          </div>
        </motion.div>
      </div>

      {/* 2. PROJECT CTAs & CREATOR BUTTON */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 py-4">
        <a
          href="https://github.com/openlysts/Openlysts"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-text text-bg font-bold text-sm sm:text-base hover:-translate-y-0.5 active:scale-95 transition-all shadow-lg hover:shadow-text/20"
        >
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span>Star on Git</span>
        </a>
        <button
          onClick={() => setIsCreatorModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-bg-card border border-border text-text font-bold text-sm sm:text-base hover:bg-bg-hover hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
        >
          <Coffee className="w-5 h-5 text-accent" />
          <span>About Creator & Architect</span>
        </button>
      </div>

      {/* 3. CORE ARCHITECTURAL PILLARS */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wider">
            <Flame className="w-4 h-4" />
            <span>Why Openlysts Exists</span>
          </div>
          <h2 className="text-3xl font-extrabold text-text tracking-tight">
            Engineered for Signal, Not Hype
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {corePillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-6 bg-gradient-to-b ${pillar.gradient} bg-bg-card/70 border border-border/70 shadow-lg hover:shadow-xl hover:border-accent/40 transition-all group flex flex-col justify-between`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-accent-soft text-accent flex items-center justify-center shadow-inner group-hover:-translate-y-0.5 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-bg-hover border border-border/60 text-text-secondary">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-text">{pillar.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{pillar.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 4. CONVERSATIONAL FAQ ACCORDION */}
      <div className="max-w-3xl mx-auto space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text">Frequently Asked Questions</h2>
          <p className="text-text-secondary text-sm">Everything you need to know about the engine and mission.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="rounded-2xl bg-bg-card/80 border border-border/70 overflow-hidden shadow-sm transition-colors hover:border-border"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-semibold text-text hover:text-accent transition-colors"
                >
                  <span className="text-base sm:text-lg">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 text-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 text-text-secondary text-sm sm:text-base leading-relaxed border-t border-border/40">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. TECH STACK */}
      <div className="space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text">The Engine Behind Openlysts</h2>
          <p className="text-text-secondary text-sm">Built entirely on open-source and modern web standards.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {techStack.map((tech, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 rounded-2xl bg-bg-card border border-border hover:border-border-hover transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-bg-hover flex items-center justify-center mb-4 group-hover:-translate-y-0.5 transition-transform">
                <tech.icon className={`w-5 h-5 ${tech.color}`} />
              </div>
              <h3 className="text-text font-bold text-base mb-1">{tech.name}</h3>
              <p className="text-text-secondary text-xs leading-relaxed">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 6. CONTRIBUTION & LICENSE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-3xl bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="space-y-4 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center justify-center md:justify-start gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold border border-accent/20 mx-auto md:mx-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            Business Source License 1.1
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text">Join the Movement</h2>
          <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
            Openlysts thrives on community contributions. Whether it's adding a new repository, mapping an open-source alternative, or submitting code improvements—your PRs are welcome.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
          <a href="https://github.com/openlysts/Openlysts/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-text text-bg font-bold text-sm hover:-translate-y-0.5 active:scale-95 transition-all shadow-md">
            <GitPullRequest className="w-4 h-4" />
            <span>Read Contribution Guide</span>
          </a>
          <a href="https://github.com/openlysts/Openlysts/blob/main/CODE_OF_CONDUCT.md" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-bg-card border border-border text-text font-bold text-sm hover:bg-bg-hover transition-all">
            <HeartHandshake className="w-4 h-4 text-text-secondary" />
            <span>Code of Conduct</span>
          </a>
        </div>
      </motion.div>

      {/* 7. CALL TO ACTION */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="rounded-3xl p-8 sm:p-12 text-center bg-gradient-to-r from-accent/20 via-purple-500/20 to-pink-500/20 border border-accent/40 shadow-2xl relative overflow-hidden space-y-6"
      >
        <div className="absolute inset-0 bg-bg-card/40 backdrop-blur-sm -z-10" />
        
        <h2 className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
          Ready to Explore the Open Universe?
        </h2>
        <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto">
          Start searching thousands of curated repositories or generate your personalized 3D Developer Pass in seconds.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-accent text-accent-fg font-bold text-base hover:bg-accent-hover transition-all shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Compass className="w-5 h-5" />
            <span>Start Exploring</span>
            <ArrowRight className="w-4 h-4 text-accent-fg" />
          </Link>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-bg-card/90 hover:bg-bg-hover text-text font-bold text-base border border-border transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md"
          >
            <Sparkles className="w-5 h-5 text-accent" />
            <span>Claim Your Dev Pass</span>
            <ArrowRight className="w-4 h-4 text-text-secondary" />
          </Link>
        </div>
      </motion.div>

    </div>

    {/* CREATOR MODAL */}
    <AnimatePresence>
      {isCreatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setIsCreatorModalOpen(false)}
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-bg-card/95 via-bg-card/90 to-bg border border-border/80 shadow-2xl p-6 sm:p-10 lg:p-12 z-10"
          >
            <button 
              onClick={() => setIsCreatorModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-bg-hover text-text-secondary hover:text-text hover:bg-border transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Ambient glow mesh */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start pt-4">
              
              {/* Interactive Mouse-Reactive 3D Avatar */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <ReactiveAvatar />
              </div>

              {/* Bio & High-Energy Narrative */}
              <div className="flex-1 space-y-6 text-center lg:text-left">
                <div>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-2">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
                      Adil Rafiq Dar
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-bold border border-accent/20">
                      Creator & Architect
                    </span>
                  </div>
                  <p className="text-accent dark:text-purple-400 font-semibold text-sm sm:text-base flex items-center justify-center lg:justify-start gap-1.5">
                    <Terminal className="w-4 h-4" />
                    <span>Tech BA & Project Manager • Systems Architect • AI Craftsman</span>
                  </p>
                </div>

                {/* High-Energy Story Narrative */}
                <div className="space-y-4 text-text-secondary text-base sm:text-lg leading-relaxed">
                  <p>
                    By day, I analyze enterprise systems, orchestrate complex initiatives, and align product architectures as a <strong className="text-text font-semibold">Tech Business Analyst & Project Manager</strong>. By night, I channel relentless curiosity and late-night coffee into building ambitious software that developers actually enjoy using.
                  </p>
                  <p>
                    I am an engineer and hobbyist at core. I started <strong className="text-text font-semibold">Openlysts</strong> because I wanted a lightning-fast, zero-fluff discovery engine that cuts through marketing noise and highlights truly great open-source craftsmanship. No corporate boardrooms, no paywalled bait-and-switch—just genuine passion for open code and high-performance engineering.
                  </p>
                </div>

                {/* Interactive Track Badges */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
                  {founderChips.map((chip, idx) => {
                    const Icon = chip.icon;
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r ${chip.color} border shadow-sm`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{chip.label}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Direct Connect & Social Links */}
                <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <a
                    href="https://www.linkedin.com/in/adil-rafiq-dar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold text-sm border border-blue-500/30 dark:border-blue-500/40 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>Connect on LinkedIn</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>

                  <Link
                    to="/contact"
                    onClick={() => setIsCreatorModalOpen(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-hover hover:bg-bg-hover/80 text-text font-semibold text-sm border border-border/80 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm"
                  >
                    <Mail className="w-4 h-4 text-accent" />
                    <span>Openlysts Support Desk</span>
                  </Link>

                  <a
                    href="https://github.com/openlysts/Openlysts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-hover hover:bg-bg-hover/80 text-text font-semibold text-sm border border-border/80 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm"
                  >
                    <Github className="w-4 h-4" />
                    <span>Openlysts OSS Repo</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}