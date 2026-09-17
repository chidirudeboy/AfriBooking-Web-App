'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquareText, Star } from 'lucide-react';
import AppShell from '@/components/AppShell';
import RatingStars from '@/components/RatingStars';
import { getApartmentReviews, getApartmentReviewStats } from '@/lib/endpoints';
import api from '@/lib/utils/api';
import toast from 'react-hot-toast';

export default function ApartmentReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (nextPage = 1) => {
    nextPage === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const [reviewResponse, statsResponse] = await Promise.all([api.get(getApartmentReviews(id, nextPage, 10)), nextPage === 1 ? api.get(getApartmentReviewStats(id)) : Promise.resolve(null)]);
      const payload = reviewResponse.data?.data;
      setReviews((current) => nextPage === 1 ? payload?.reviews || [] : [...current, ...(payload?.reviews || [])]);
      setPage(payload?.pagination?.currentPage || nextPage);
      setHasNext(Boolean(payload?.pagination?.hasNextPage));
      if (statsResponse) setStats(statsResponse.data?.data || null);
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to load reviews.'); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return (
    <AppShell width="max-w-4xl">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"><ArrowLeft size={18} /> Apartment</button>
      <div className="mt-6 flex flex-col gap-5 rounded-3xl bg-gradient-to-br from-gray-950 to-gray-800 p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9"><div><p className="text-sm font-bold text-amber-300">VERIFIED GUEST FEEDBACK</p><h1 className="mt-2 text-3xl font-bold">Guest reviews</h1><p className="mt-2 text-gray-300">Real experiences from completed AfriBooking stays.</p></div><div className="rounded-2xl bg-white/10 p-5 text-center backdrop-blur"><p className="flex items-center justify-center gap-2 text-4xl font-black"><Star className="fill-amber-400 text-amber-400" /> {Number(stats?.averageRating || 0).toFixed(1)}</p><p className="mt-1 text-sm text-gray-300">{stats?.totalReviews || 0} reviews</p></div></div>
      {loading ? <div className="grid min-h-[40vh] place-items-center"><Loader2 size={34} className="animate-spin text-primary" /></div> : reviews.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2">{reviews.map((review, index) => <article key={review?._id || index} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-gray-950 dark:text-white">{[review?.userId?.first_name || review?.userId?.firstName, review?.userId?.last_name || review?.userId?.lastName].filter(Boolean).join(' ') || 'Guest'}</p>{review?.createdAt && <p className="mt-1 text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}</div><RatingStars rating={Number(review.rating || 0)} size={15} /></div><p className="mt-4 leading-7 text-gray-600 dark:text-gray-300">{review.comment || 'No written comment.'}</p></article>)}</div> : <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-white p-14 text-center dark:border-gray-700 dark:bg-gray-900"><MessageSquareText className="mx-auto text-gray-400" size={40} /><h2 className="mt-4 text-xl font-bold dark:text-white">No reviews yet</h2><p className="mt-2 text-gray-500">The first completed-stay review will appear here.</p></div>}
      {hasNext && <button onClick={() => load(page + 1)} disabled={loadingMore} className="mx-auto mt-7 flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-bold text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white">{loadingMore && <Loader2 size={17} className="animate-spin" />} Load more reviews</button>}
    </AppShell>
  );
}
