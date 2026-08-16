import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PILL_CATEGORIES = [
{ slug: '', label: 'All' },
{ slug: 'ai', label: 'AI' },
{ slug: 'llms', label: 'LLMs' },
{ slug: 'local-ai', label: 'Local AI' },
{ slug: 'ai-agents', label: 'AI Agents' },
{ slug: 'rag', label: 'RAG' },
{ slug: 'web-applications', label: 'Web Apps' },
{ slug: 'developer-tools', label: 'Developer Tools' },
{ slug: 'self-hosted', label: 'Self-Hosted' },
{ slug: 'machine-learning', label: 'ML' },
{ slug: 'databases', label: 'Databases' },
{ slug: 'automation', label: 'Automation' },
{ slug: 'libraries-frameworks', label: 'Libraries' }];


export default function CategoryPills({ active = '' }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
      {PILL_CATEGORIES.map((cat, i) => {
        const isActive = active === cat.slug;
        const to = cat.slug === '' ? '/' : `/category/${cat.slug}`;
        return (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
            className="flex-shrink-0">
            
            <Link
              to={to}
              className={`inline-block text-sm font-medium whitespace-nowrap border transition-colors opacity-100 px-1 py-1 [font-family:'Inter',_system-ui,_sans-serif] rounded-full ${
              isActive ?
              'bg-accent text-accent-fg border-accent' :
              'bg-bg-card text-text-secondary border-border hover:border-border-strong hover:bg-bg-hover'}`
              }>
              
              {cat.label}
            </Link>
          </motion.div>);

      })}
    </div>);

}