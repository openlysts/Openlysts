import { Search, ShieldCheck, TrendingUp, Database, Sparkles, Heart, Code2, Cpu, Briefcase, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
      
      {/* Header Section */}
      <div className="text-center mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft text-accent text-xs font-medium mb-6">
          <Sparkles className="w-3 h-3" />
          The Discovery Engine
        </motion.div>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-bg-card border border-border/50 shadow-md overflow-hidden flex items-center justify-center [perspective:1000px]">
            <img src="/logo.png" alt="Openlysts" className="w-20 h-20 sm:w-28 sm:h-28 object-contain animate-logo-enter" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text to-text-secondary tracking-tight">About Openlysts</h1>
        </div>
        <div className="text-text-secondary text-lg md:text-xl leading-relaxed max-w-2xl mx-auto space-y-6">
          <p>
            Openlysts is a discovery engine for open-source software. It continuously scans GitHub, surfacing everything on Git — from high-quality curated repositories to vast unmapped projects — verifying licenses when applicable, and organizing them into intuitive categories so you can find the right project in seconds instead of scrolling endlessly through search results.
          </p>
          <p>
            Built for developers, technical leads, and open-source enthusiasts, Openlysts helps you cut through the noise of GitHub's massive catalog. Whether you are looking for a local LLM to run privately, a self-hosted alternative to a SaaS tool, a developer productivity booster, or a framework for your next project, Openlysts surfaces repositories that are actively maintained and genuinely useful.
          </p>
          <p>
            The platform is built and maintained by the Openlysts team, with data ingested and refreshed from GitHub every few hours. Trending scores highlight projects gaining momentum right now, while quality scores factor in documentation, community engagement, and maintenance activity — so you can trust that what you find is worth your time.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-20">
        {[
          { icon: Search, title: 'Search Less, Find More', desc: 'Stop scrolling through GitHub. Search and filter across curated, categorized repositories in seconds.' },
          { icon: ShieldCheck, title: 'Verified Open Source', desc: 'Every repository is checked against OSI-recognized licenses. No more guessing if a project is truly open source.' },
          { icon: TrendingUp, title: 'Trending, Not Just Popular', desc: 'Discover projects gaining momentum right now — not just the ones with the most total stars.' },
          { icon: Database, title: 'Automatically Updated', desc: 'Data is ingested from GitHub every few hours, so you always see fresh, accurate repository information.' }
        ].map(({ icon: Icon, title, desc }, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={title} 
            className="p-6 rounded-2xl bg-bg-card border border-border shadow-sm hover:shadow-md transition-shadow flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-text text-lg mb-2">{title}</h3>
              <p className="text-text-secondary leading-relaxed">{desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* About the Creator Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bg-card to-bg border border-border shadow-lg p-8 md:p-12 mb-16">
        
        {/* Decorative background blur */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            
            {/* Avatar / Initials */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-accent-hover text-accent-fg flex items-center justify-center text-4xl font-black shadow-xl flex-shrink-0 rotate-3">
              ARD
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl font-extrabold text-text mb-3">Adil Rafiq Dar</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-5">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary bg-bg-hover px-3 py-1.5 rounded-lg border border-border/50">
                  <Code2 className="w-4 h-4 text-accent" />
                  Technologist
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary bg-bg-hover px-3 py-1.5 rounded-lg border border-border/50">
                  <Cpu className="w-4 h-4 text-accent" />
                  AI Enthusiast
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary bg-bg-hover px-3 py-1.5 rounded-lg border border-border/50">
                  <Briefcase className="w-4 h-4 text-accent" />
                  Working Professional
                </span>
              </div>
              <p className="text-text-secondary leading-relaxed mb-6 max-w-2xl text-lg">
                I am a passionate technologist and AI enthusiast dedicated to building tools that empower the developer community. Balancing a full-time professional career with an unrelenting drive to innovate, I pour my hard work and late nights into projects like Openlysts. My goal is to make discovering and leveraging open-source software and AI models easier and more accessible for everyone.
              </p>
              
              <div className="inline-flex items-center gap-2 text-text font-medium bg-bg-hover/50 px-5 py-2.5 rounded-xl border border-border/50">
                Created with 
                <motion.div
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                >
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </motion.div>
                by ARD
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <div className="mb-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-text mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'How often is the data updated?', a: 'We sync with GitHub every few hours to ensure all repository metrics, trending scores, and metadata are fresh.' },
            { q: 'How are trending scores calculated?', a: 'Trending scores are based on a proprietary algorithm that weights recent stars, forks, issue activity, and commit velocity to surface projects gaining real momentum.' },
            { q: 'Is Openlysts free to use?', a: 'Yes! Openlysts is completely free for developers and open-source enthusiasts.' }
          ].map((faq, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-bg-card border border-border">
              <h3 className="font-semibold text-text mb-2">{faq.q}</h3>
              <p className="text-text-secondary">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-text text-bg font-bold text-lg hover:bg-text/90 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5">
          <Zap className="w-5 h-5" />
          Start Exploring
        </Link>
      </div>
    </div>
  );
}