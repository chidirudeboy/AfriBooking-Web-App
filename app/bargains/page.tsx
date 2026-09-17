'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, HandCoins, RefreshCw, Tags } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getMyBargains } from '@/lib/endpoints';
import api from '@/lib/utils/api';
import { bargainStatus, formatDateRange, formatNaira, reservationLabel } from '@/lib/utils/bargain';
import toast from 'react-hot-toast';

export default function BargainsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(getMyBargains);
      setItems(data?.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load your offers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?returnTo=%2Fbargains');
    if (user) load();
  }, [authLoading, load, router, user]);

  return (
    <AppShell width="max-w-5xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"><Tags size={15} /> Price negotiation</span>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">My offers</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Track offers, owner counteroffers, accepted deals, and payment.</p>
        </div>
        <button onClick={load} disabled={loading} className="grid h-11 w-11 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" aria-label="Refresh offers"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800" />)}</div>
      ) : items.length ? (
        <div className="space-y-4">
          {items.map((item) => {
            const property = item?.propertyId || {};
            const status = bargainStatus(item?.status);
            const amount = ['accepted', 'paid'].includes(item?.status) ? item?.finalAgreedPrice || item?.offeredTotalPrice : item?.offeredTotalPrice;
            return (
              <button key={item?.id || item?._id} onClick={() => router.push(`/bargains/${item?.id || item?._id}`)} className="group w-full rounded-3xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-amber-700 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="truncate text-xl font-bold text-gray-950 dark:text-white">{property?.apartmentName || 'Apartment offer'}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${status.className}`}>{status.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{[property?.city, property?.state].filter(Boolean).join(', ') || property?.address || 'Location unavailable'}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">{reservationLabel(item?.reservationType)}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"><CalendarDays size={14} /> {formatDateRange(item?.checkInDate, item?.checkOutDate)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-6 sm:block sm:text-right">
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current offer</p><p className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{formatNaira(amount)}</p></div>
                    <ArrowRight className="mt-3 inline text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-amber-500" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><HandCoins size={36} /></div>
          <h2 className="mt-6 text-2xl font-bold text-gray-950 dark:text-white">No offers yet</h2>
          <p className="mx-auto mt-2 max-w-md text-gray-600 dark:text-gray-400">Choose dates on an apartment and use Make Offer to negotiate directly with its owner.</p>
          <button onClick={() => router.push('/apartments')} className="mt-7 rounded-xl bg-primary px-5 py-3 font-bold text-gray-950">Find a stay</button>
        </div>
      )}
    </AppShell>
  );
}
