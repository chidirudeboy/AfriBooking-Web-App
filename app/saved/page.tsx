'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Search } from 'lucide-react';
import AppShell from '@/components/AppShell';
import ApartmentCard from '@/components/ApartmentCard';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { getEveryApartments } from '@/lib/endpoints';
import { TApartments } from '@/lib/types/airbnb';
import api from '@/lib/utils/api';

export default function SavedStaysPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { favoriteIds, pendingIds, loadingFavorites, toggleFavorite } = useFavorites();
  const [apartments, setApartments] = useState<TApartments[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?returnTo=%2Fsaved');
  }, [authLoading, router, user]);

  useEffect(() => {
    api.get(getEveryApartments)
      .then(({ data }) => setApartments(data?.apartments || data?.data || (Array.isArray(data) ? data : [])))
      .finally(() => setLoading(false));
  }, []);

  const saved = useMemo(() => apartments.filter((apartment) => favoriteIds.has(String(apartment._id))), [apartments, favoriteIds]);
  const isLoading = loading || loadingFavorites || authLoading;

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="block text-xs font-bold tracking-[1.7px] text-[#896300] dark:text-[#ffbf00] uppercase mb-2">
            YOUR SHORTLIST
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#17191b] dark:text-[#f0f2f6] tracking-tight">
            Places you’re keeping an eye on.
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-[#6c7075] dark:text-[#acb4c0]">
            Keep your favorites close while you decide where to stay.
          </p>
        </div>
        {!isLoading && saved.length > 0 && (
          <p className="text-xs font-semibold text-[#6c7075] dark:text-[#acb4c0]">
            {saved.length} saved {saved.length === 1 ? 'place' : 'places'}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-[380px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : saved.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((apartment) => (
            <ApartmentCard
              key={apartment._id}
              apartment={apartment}
              isFavorite
              favoritePending={pendingIds.has(apartment._id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-[#e7e8eb] dark:border-[#353c47] bg-white dark:bg-[#1c222c] px-6 py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#fff9e9] text-[#c58d00] dark:bg-[#302916] mb-4">
            <Heart size={30} className="fill-current" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#17191b] dark:text-white">No saved places yet</h2>
          <p className="mt-2 max-w-sm text-sm text-[#6c7075] dark:text-[#acb4c0]">
            Tap the heart on any listing to keep it here for easy comparison.
          </p>
          <button
            onClick={() => router.push('/apartments')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ffbf00] hover:bg-[#eeb200] px-5 py-3 text-sm font-bold text-[#17191b] transition-colors shadow-sm"
          >
            <Search size={16} /> Explore stays
          </button>
        </div>
      )}
    </AppShell>
  );
}
