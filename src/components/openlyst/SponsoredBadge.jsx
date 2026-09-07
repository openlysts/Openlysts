import { BadgeCheck } from 'lucide-react';

/**
 * SponsoredBadge — visible disclosure for paid placements.
 * Always rendered verbatim next to the sponsored item (trust rule), with
 * the sponsor name in the tooltip when known.
 */
export default function SponsoredBadge({ label = 'Sponsored', sponsorName = '', className = '' }) {
  const tip = sponsorName
    ? `Sponsored placement by ${sponsorName}`
    : 'Sponsored placement';
  return (
    <span
      title={tip}
      aria-label={tip}
      className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-300 flex-shrink-0 ${className}`}
    >
      <BadgeCheck className="w-3 h-3" aria-hidden="true" />
      {label}
    </span>
  );
}