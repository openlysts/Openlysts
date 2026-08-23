import React, { useState, useEffect, useMemo } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'react-router-dom';
import { Lightbulb, Search, Filter, Activity, Bookmark, Info, Sparkles, Wand2, Layers, GitCompare } from 'lucide-react';

const CustomTooltip = ({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}) => {
  // Determine icon based on step title/content or a custom property if we added one
  // For simplicity, we'll try to match keywords in title
  const getIcon = () => {
    if (index === 0) return null; // Handled separately
    const t = (step.title || '').toLowerCase();
    if (t.includes('search')) return <Search size={18} className="text-accent" />;
    if (t.includes('filter')) return <Filter size={18} className="text-accent" />;
    if (t.includes('insight') || t.includes('stat')) return <Activity size={18} className="text-accent" />;
    if (t.includes('save') || t.includes('bookmark')) return <Bookmark size={18} className="text-accent" />;
    if (t.includes('easter') || t.includes('magic')) return <Sparkles size={18} className="text-accent" />;
    if (t.includes('compare')) return <GitCompare size={18} className="text-accent" />;
    if (t.includes('tag') || t.includes('categor')) return <Layers size={18} className="text-accent" />;
    if (t.includes('video') || t.includes('explain')) return <Wand2 size={18} className="text-accent" />;
    return <Info size={18} className="text-accent" />;
  };

  return (
    <div
      {...tooltipProps}
      className="w-[360px] sm:w-[400px] bg-bg-card dark:bg-[#1a1c23]/98 backdrop-blur-3xl border border-border/80 dark:border-white/10 rounded-[24px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5),_0_0_40px_rgba(var(--accent-rgb),0.15)] overflow-hidden relative font-sans"
    >
      {/* Vibrant top glow line */}
      <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-accent via-trending to-accent opacity-100" />

      <div className="p-6">
        {/* Step Indicator Header (Hide on step 0 if it's a welcome modal) */}
        {index > 0 && (
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-1.5 flex-wrap flex-1 mr-4">
              {Array.from({ length: size - 1 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                    i === index - 1 ? 'w-6 bg-accent' : 'w-2 bg-border-strong'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
              {index} of {size - 1}
            </span>
          </div>
        )}

        {/* Content Area */}
        <div className={`mb-8 ${index === 0 ? 'text-center flex flex-col items-center mt-4' : 'text-left'}`}>
          {index === 0 && (
            <div className="w-16 h-16 bg-gradient-to-br from-accent to-trending rounded-[20px] flex items-center justify-center mb-6 text-white shadow-lg shadow-accent/20 rotate-3 border border-white/20 relative overflow-hidden group hover:rotate-6 transition-all duration-300">
              <Lightbulb size={32} className="drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
            </div>
          )}
          
          {step.title && (
            <h3 className={`font-extrabold tracking-tight ${index === 0 ? 'text-2xl mb-3 bg-clip-text text-transparent bg-gradient-to-r from-text to-text-secondary' : 'text-lg mb-2 text-text flex items-center gap-2'}`}>
              {getIcon()}
              {step.title}
            </h3>
          )}
          <div className={`text-text-secondary leading-relaxed ${index === 0 ? 'text-base font-medium max-w-[90%]' : 'text-[15px]'}`}>
            {step.content}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between">
          {!isLastStep ? (
            <button
              {...skipProps}
              className="text-sm font-semibold text-text-muted hover:text-text transition-colors"
            >
              Skip tour
            </button>
          ) : (
            <div />
          )}
          
          <div className="flex gap-2">
            {index > 0 && (
              <button
                {...backProps}
                className="text-sm font-bold text-text hover:bg-bg-subtle px-4 py-2.5 rounded-xl transition-colors"
              >
                Back
              </button>
            )}
            <button
              {...primaryProps}
              className={`text-sm font-bold px-6 py-2.5 rounded-xl transition-all ${
                index === 0 
                  ? 'bg-gradient-to-r from-accent to-trending text-white shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:scale-105 active:scale-95' 
                  : 'bg-accent text-accent-fg shadow-md shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5'
              }`}
            >
              {isLastStep ? 'Finish' : (index === 0 ? 'Start Tour' : 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductTour = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [currentSteps, setCurrentSteps] = useState([]);
  const [tourKey, setTourKey] = useState('');

  // Define tours for different pages
  const tours = useMemo(() => {
    return {
      discover: [
        {
          target: 'body',
          title: 'Welcome to Openlysts',
          content: "Let's take a quick tour to show you what this magical tool has to offer! We'll make you an open-source discovery pro in no time.",
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '[data-tour="search-input"]',
          title: 'Semantic Search',
          content: 'Forget exact keywords. Search naturally! Try typing "tools for database migrations" or "React UI components for dashboards".',
          placement: 'bottom',
        },
        {
          target: '[data-tour="filter-bar"]',
          title: 'Smart Filters',
          content: 'Drill down by language, category, or sort by our proprietary Trending Score to find the hottest tools right now.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="repo-card"]',
          title: 'Repository Insights',
          content: 'Every card is packed with info. We track health, community engagement, and automatically categorize them.',
          placement: 'top',
        },
        {
          target: '[data-tour="repo-tags"]',
          title: 'Difficulty & Categories',
          content: 'Instantly know if a project is beginner-friendly or requires an expert, plus the exact tech categories it belongs to.',
          placement: 'top',
        },
        {
          target: '[data-tour="repo-stats"]',
          title: 'Vital Stats & License',
          content: 'Check the real-time stars, forks, primary language, and most importantly—the Open Source License—at a glance.',
          placement: 'top',
        },
        {
          target: '[data-tour="repo-video"]',
          title: 'Video Explanations',
          content: 'Don\'t want to read a huge README? We link curated YouTube tutorials and video explanations for top tools right here!',
          placement: 'top',
        },
        {
          target: '[data-tour="compare-dock"]',
          title: 'Compare Tools',
          content: 'Click the compare icon on any repo card to dock it here. Compare up to 4 tools side-by-side to make the right choice.',
          placement: 'top',
        },
        {
          target: '[data-tour="easter-eggs"]',
          title: 'Easter Eggs!',
          content: 'We love surprises! 1. Click this logo 5 times for confetti. 2. Type "matrix" anywhere. 3. Try the Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A!',
          placement: 'bottom',
        }
      ],
      repo: [
        {
          target: 'body',
          title: 'Repository Details',
          content: "Get an in-depth look at any open-source project. Here's what you can find on this page.",
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '[data-tour="repo-stats-bar"]',
          title: 'Key Metrics',
          content: 'See exactly how this project is performing: Stars, Forks, Issues, and our custom Engagement & Authority scores.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="repo-readme"]',
          title: 'Rendered README',
          content: 'Read the project\'s documentation directly inside Openlysts, rendered beautifully with syntax highlighting.',
          placement: 'top',
        },
        {
          target: '[data-tour="repo-links"]',
          title: 'Quick Actions',
          content: 'Jump straight to the GitHub repository, view the homepage, or report issues directly from here.',
          placement: 'bottom-end',
        }
      ],
      compare: [
        {
          target: 'body',
          title: 'Compare Mode',
          content: 'Welcome to the Comparison Arena! Put tools head-to-head to find the winner for your stack.',
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '[data-tour="compare-search"]',
          title: 'Add Competitors',
          content: 'Search and add more repositories to compare. You can compare up to 4 tools simultaneously.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="compare-table"]',
          title: 'Feature Matrix',
          content: 'We align stats, languages, licenses, and activity metrics side-by-side so you can spot the differences instantly.',
          placement: 'top',
        }
      ],
      alternatives: [
        {
          target: 'body',
          title: 'Find Alternatives',
          content: 'Locked into a proprietary tool? Looking for an open-source swap? This is the place.',
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '[data-tour="alts-search"]',
          title: 'Search Proprietary Tools',
          content: 'Type in a tool like "Vercel", "Datadog", or "Auth0" to see top open-source alternatives.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="alts-grid"]',
          title: 'Curated Alternatives',
          content: 'Browse our highly curated list of open-source replacements, ranked by popularity and community trust.',
          placement: 'top',
        }
      ],
      trending: [
        {
          target: 'body',
          title: 'Trending Projects',
          content: 'See what is catching the developer community\'s attention right now.',
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '[data-tour="trending-filters"]',
          title: 'Trend Filters',
          content: 'Filter trending projects by language, category, or time period to find exactly what you need.',
          placement: 'bottom',
        }
      ],
      bookmarks: [
        {
          target: 'body',
          title: 'Your Bookmarks',
          content: 'Never lose a great project again. All your saved repositories live here.',
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '[data-tour="bookmarks-list"]',
          title: 'Saved Projects',
          content: 'Access your saved projects instantly. They are stored locally in your browser.',
          placement: 'top',
        }
      ],
      about: [
        {
          target: 'body',
          title: 'About Openlysts',
          content: 'Learn more about the mission behind the discovery engine.',
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '[data-tour="about-features"]',
          title: 'Core Features',
          content: 'We focus on searchability, verified licenses, and fresh trending data.',
          placement: 'top',
        },
        {
          target: '[data-tour="about-creator"]',
          title: 'The Creator',
          content: 'Meet the technologist behind Openlysts and the passion driving it.',
          placement: 'top',
        }
      ],
      contact: [
        {
          target: 'body',
          title: 'Get in Touch',
          content: 'We love hearing from the community. Let us know what you think!',
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '[data-tour="contact-methods"]',
          title: 'Reach Out',
          content: 'Email us directly or check out the project on GitHub.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="contact-form"]',
          title: 'Send a Message',
          content: 'Fill out this form to send us a message via email or Telegram instantly.',
          placement: 'top',
        }
      ],
      search: [
        {
          target: 'body',
          title: 'Advanced Search',
          content: 'Find exactly what you need with our semantic search and advanced filters.',
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '[data-tour="search-input"]',
          title: 'Syntax Queries',
          content: 'Use advanced syntax like "language:python stars:>1000" to narrow down your search.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="search-filters"]',
          title: 'Search Filters',
          content: 'Further refine your search results by license, category, or update activity.',
          placement: 'bottom',
        }
      ]
    };
  }, []);

  useEffect(() => {
    // Determine which tour to show based on the route
    const path = location.pathname;
    let selectedTourKey = null;

    if (path === '/' || path === '/discover') {
      selectedTourKey = 'discover';
    } else if (path.startsWith('/repo/')) {
      selectedTourKey = 'repo';
    } else if (path.startsWith('/compare')) {
      selectedTourKey = 'compare';
    } else if (path.startsWith('/alternatives')) {
      selectedTourKey = 'alternatives';
    } else if (path.startsWith('/search')) {
      selectedTourKey = 'search';
    } else if (path.startsWith('/trending')) {
      selectedTourKey = 'trending';
    } else if (path.startsWith('/bookmarks')) {
      selectedTourKey = 'bookmarks';
    } else if (path.startsWith('/about')) {
      selectedTourKey = 'about';
    } else if (path.startsWith('/contact')) {
      selectedTourKey = 'contact';
    }

    if (selectedTourKey) {
      setTourKey(selectedTourKey);
      
      const localKey = `openlyst_has_seen_tour_${selectedTourKey}`;
      const hasSeenTourLocal = localStorage.getItem(localKey);
      
      // For discover tour, we also check DB status if logged in
      const isDiscover = selectedTourKey === 'discover';
      const hasSeenTourDB = isDiscover ? user?.has_seen_tour : false;

      if (!hasSeenTourLocal && !hasSeenTourDB) {
        setCurrentSteps(tours[selectedTourKey]);
        // Delay to allow DOM to render components before targeting them
        const timer = setTimeout(() => {
          setRun(true);
        }, 1500);
        return () => clearTimeout(timer);
      } else {
        setRun(false);
      }
    } else {
      setRun(false);
    }
  }, [location.pathname, user, tours]);

  const handleJoyrideCallback = async (data) => {
    const { status, action } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status) || action === 'close') {
      setRun(false);
      
      if (tourKey) {
        const localKey = `openlyst_has_seen_tour_${tourKey}`;
        localStorage.setItem(localKey, 'true');

        // Sync with DB only for the main discover tour if logged in
        if (tourKey === 'discover' && user && !user.has_seen_tour) {
          try {
            await fetch('/api/profile/settings', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ has_seen_tour: true })
            });
            user.has_seen_tour = 1;
          } catch (err) {
            console.error('Failed to sync tour status to DB', err);
          }
        }
      }
    }
  };

  if (!run || currentSteps.length === 0) return null;

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={currentSteps}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          arrowColor: 'hsl(var(--bg-card))',
          overlayColor: 'rgba(0, 0, 0, 0.65)',
          zIndex: 100000,
        },
      }}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  );
};

export default ProductTour;

