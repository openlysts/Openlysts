import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import RepositoryCard from '@/components/openlyst/RepositoryCard';
import { Loader2 } from 'lucide-react';

async function fetchAlternatives() {
  const res = await fetch(import.meta.env.VITE_API_URL + '/api/functions/queryAlternatives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!res.ok) throw new Error('Failed to fetch alternatives');
  return res.json();
}

export default function Alternatives() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['alternatives'],
    queryFn: fetchAlternatives,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text mb-4">Paid vs Free Alternatives</h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Discover high-quality open-source alternatives to popular proprietary and paid tools.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      )}

      {error && (
        <div className="text-center py-20 text-text-muted">
          Failed to load alternatives. Please try again later.
        </div>
      )}

      {data?.alternatives && (
        <div className="space-y-12">
          {data.alternatives.map((alt, index) => (
            <motion.div
              key={alt.paidTool}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="bg-bg-card border border-border rounded-2xl p-6"
            >
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4">
                <h2 className="text-2xl font-bold text-text">
                  Alternatives to <span className="text-accent">{alt.paidTool}</span>
                </h2>
                <div className="text-sm font-medium px-3 py-1 bg-bg-subtle text-text-secondary rounded-full mt-2 md:mt-0 inline-block w-max">
                  {alt.repos.length} {alt.repos.length === 1 ? 'Alternative' : 'Alternatives'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {alt.repos.map(repo => (
                  <RepositoryCard key={repo.id} repo={repo} />
                ))}
              </div>
            </motion.div>
          ))}
          
          {data.alternatives.length === 0 && (
            <div className="text-center py-20 text-text-muted border border-dashed border-border rounded-xl">
              No alternatives found yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
