import React, { useState } from 'react';
import { 
  Sparkles, 
  Linkedin, 
  Mail, 
  Github, 
  Coffee, 
  Compass, 
  ShieldCheck, 
  Zap, 
  Layers, 
  ChevronDown, 
  ExternalLink,
  Code2,
  Terminal,
  Flame,
  ArrowRight,
  Cpu,
  Workflow
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { APP_VERSION } from '@/config/version';
import ReactiveAvatar from '@/components/openlyst/ReactiveAvatar';
import AnimateDigits from '@/components/openlyst/AnimateDigits';

export default function About() {
  usePageTitle('About & Manifesto');
  const [openFaq, setOpenFaq] = useState(0);

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
      badge: '1,280+ Curated Mappings',
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
      a: 'You can reach out directly via LinkedIn (Adil Rafiq Dar), shoot an email to adilrafiqdar@gmail.com, or submit repositories and feedback via the in-app forms!'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-16">
      
      {/* 1. HERO SECTION & MANIFESTO */}
      <div className="text-center space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-bold tracking-wide uppercase shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          <span>The Open Source Telescope • {APP_VERSION}</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-text tracking-tight leading-[1.15]"
        >
          The best software in the world isn’t behind a paywall.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-purple-400 to-pink-500">
            It’s hiding on GitHub.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-text-secondary text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto"
        >
          Over 300 million repositories exist today. 99% of them are abandoned experiments, tutorials, or star-farmed hype. 
          <strong className="text-text font-semibold"> Openlysts</strong> is the high-velocity telescope engineered to cut through the noise, surfacing living code, verified alternatives, and pure engineering craft in milliseconds.
        </motion.p>

        {/* Rolling Telemetry Odometer */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-4 grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto"
        >
          <div className="p-4 rounded-2xl bg-bg-card/70 border border-border/60 backdrop-blur-md text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-black text-text flex items-center justify-center gap-0.5">
              <AnimateDigits value={35476} />
              <span className="text-accent">+</span>
            </div>
            <div className="text-xs text-text-secondary font-medium mt-1">Repositories Scored</div>
          </div>

          <div className="p-4 rounded-2xl bg-bg-card/70 border border-border/60 backdrop-blur-md text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-black text-text flex items-center justify-center gap-0.5">
              <AnimateDigits value={1280} />
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

      {/* 2. CREATOR SECTION: ADIL RAFIQ DAR (ARD) */}
      <motion.div
        data-tour="about-creator"
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-3xl bg-gradient-to-br from-bg-card/90 via-bg-card/50 to-bg border border-border/80 shadow-2xl p-6 sm:p-10 lg:p-12 overflow-hidden backdrop-blur-xl"
      >
        {/* Ambient glow mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
          
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold text-sm border border-blue-500/30 dark:border-blue-500/40 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <Linkedin className="w-4 h-4" />
                <span>Connect on LinkedIn</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>

              <a
                href="mailto:adilrafiqdar@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-hover hover:bg-bg-hover/80 text-text font-semibold text-sm border border-border/80 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <Mail className="w-4 h-4 text-accent" />
                <span>adilrafiqdar@gmail.com</span>
              </a>

              <a
                href="https://github.com/openlysts/Openlysts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-hover hover:bg-bg-hover/80 text-text font-semibold text-sm border border-border/80 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <Github className="w-4 h-4" />
                <span>Openlysts OSS Repo</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>

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
                    <div className="w-12 h-12 rounded-xl bg-accent-soft text-accent flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
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

      {/* 5. CALL TO ACTION */}
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
  );
}