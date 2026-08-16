import { Github, Search, ShieldCheck, TrendingUp, Database, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft text-accent text-xs font-medium mb-4">
          <Sparkles className="w-3 h-3" />
          Discover. Filter. Build.
        </div>
        <h1 className="text-3xl font-bold text-text mb-4">About Openlyst</h1>
        <div className="text-text-secondary text-lg leading-relaxed space-y-4 text-left">
          <p>
            Openlyst is a discovery engine for open-source software. It continuously scans GitHub, indexes high-quality repositories, verifies their licenses against OSI-recognized standards, and organizes them into intuitive categories — so you can find the right project in seconds instead of scrolling endlessly through search results.
          </p>
          <p>
            Built for developers, technical leads, and open-source enthusiasts, Openlyst helps you cut through the noise of GitHub's massive catalog. Whether you are looking for a local LLM to run privately, a self-hosted alternative to a SaaS tool, a developer productivity booster, or a framework for your next project, Openlyst surfaces repositories that are actively maintained, genuinely useful, and properly licensed.
          </p>
          <p>The platform is built and maintained by the Openlyst team, with data ingested and refreshed from GitHub every few hours. Trending scores highlight projects gaining momentum right now, while quality scores factor in documentation, community engagement, and maintenance activity — so you can trust that what you find is worth your time. Created with ❤ by ARD

          </p>
        </div>
      </div>

      <div className="space-y-4 mb-10">
        {[
        { icon: Search, title: 'Search Less, Find More', desc: 'Stop scrolling through GitHub. Search and filter across curated, categorized repositories in seconds.' },
        { icon: ShieldCheck, title: 'Verified Open Source', desc: 'Every repository is checked against OSI-recognized licenses. No more guessing if a project is truly open source.' },
        { icon: TrendingUp, title: 'Trending, Not Just Popular', desc: 'Discover projects gaining momentum right now — not just the ones with the most total stars.' },
        { icon: Database, title: 'Automatically Updated', desc: 'Data is ingested from GitHub every few hours, so you always see fresh, accurate repository information.' }].
        map(({ icon: Icon, title, desc }) =>
        <div key={title} className="card p-5 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-text mb-1">{title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card p-6 text-center">
        <Github className="w-8 h-8 text-accent mx-auto mb-3" />
        <h3 className="font-semibold text-text mb-1">Ready to explore?</h3>
        <p className="text-text-muted text-sm mb-4">Start discovering open-source projects worth knowing.</p>
        <Link to="/" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-accent-fg font-medium text-sm hover:opacity-90">
          Browse Repositories
        </Link>
      </div>
    </div>);

}