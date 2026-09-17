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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
            <Heart size={15} className="fill-current" /> Your shortlist
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">Saved stays</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Keep your favourites close while you decide where to stay.</p>
        </div>
        {!isLoading && saved.length > 0 && <p className="text-sm font-medium text-gray-500">{saved.length} saved {saved.length === 1 ? 'stay' : 'stays'}</p>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-[460px] animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />)}
        </div>
      ) : saved.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40"><Heart size={34} /></div>
          <h2 className="mt-6 text-2xl font-bold text-gray-950 dark:text-white">No saved stays yet</h2>
          <p className="mt-2 max-w-sm text-gray-600 dark:text-gray-400">Tap the heart on any apartment and it will appear here for easy comparison.</p>
          <button onClick={() => router.push('/apartments')} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-gray-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Search size={18} /> Explore apartments
          </button>
        </div>
      )}
    </AppShell>
  );
}
