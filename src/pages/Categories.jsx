import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CATEGORIES } from '@/lib/categories';
import { ArrowRight } from 'lucide-react';

export default function Categories() {
  useEffect(() => {
    document.title = 'Openlyst — Categories | Open-Source Discovery';
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-text mb-1">Categories</h1>
      <p className="text-text-secondary text-sm mb-8">Browse open-source projects by category.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
          >
            <Link to={`/category/${cat.slug}`}>
              <div className="card card-hover p-5 h-full cursor-pointer">
                <h3 className="font-semibold text-text text-lg mb-1">{cat.label}</h3>
                <p className="text-text-muted text-sm leading-relaxed mb-3">{cat.description}</p>
                <span className="inline-flex items-center gap-1 text-accent text-sm font-medium">
                  Browse <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}