'use client';

import { Star } from 'lucide-react';

export default function RatingStars({ rating, size = 17, interactive, onChange }: { rating: number; size?: number; interactive?: boolean; onChange?: (rating: number) => void }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(value)}
          className={interactive ? 'rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400' : 'cursor-default'}
          aria-label={interactive ? `Rate ${value} stars` : undefined}
        >
          <Star size={size} className={value <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'} />
        </button>
      ))}
    </div>
  );
}
