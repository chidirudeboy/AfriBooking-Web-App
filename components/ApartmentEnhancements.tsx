'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Heart, Loader2, MapPin, MessageCircle, Navigation, Share2, Star, Tags } from 'lucide-react';
import { TApartments } from '@/lib/types/airbnb';
import { createInquiryChat, getApartmentReviews, getApartmentReviewStats, getNearbyPlaces } from '@/lib/endpoints';
import api from '@/lib/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import RatingStars from '@/components/RatingStars';
import toast from 'react-hot-toast';

export default function ApartmentEnhancements({ apartment, reservationType, selectedBedrooms, price }: { apartment: TApartments; reservationType: string; selectedBedrooms: number | null; price: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const { favoriteIds, pendingIds, toggleFavorite } = useFavorites();
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [nearby, setNearby] = useState<any[]>([]);
  const [openingChat, setOpeningChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dates, setDates] = useState<{ checkInDate?: string; checkOutDate?: string }>({});
  const apartmentId = apartment._id;
  const latitude = Number(apartment.location?.lat ?? apartment.lat);
  const longitude = Number(apartment.location?.lng ?? apartment.lng);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  useEffect(() => {
    const raw = localStorage.getItem(`reservation_${apartmentId}`);
    if (raw) {
      try { setDates(JSON.parse(raw)); } catch { /* ignore invalid cache */ }
    }
    Promise.allSettled([api.get(getApartmentReviews(apartmentId, 1, 3)), api.get(getApartmentReviewStats(apartmentId))]).then(([reviewResponse, statsResponse]) => {
      if (reviewResponse.status === 'fulfilled') setReviews(reviewResponse.value.data?.data?.reviews || []);
      if (statsResponse.status === 'fulfilled') setStats(statsResponse.value.data?.data || null);
    });
    if (hasCoordinates) api.get(getNearbyPlaces(latitude, longitude)).then(({ data }) => setNearby(data?.data?.places || [])).catch(() => undefined);
  }, [apartmentId, hasCoordinates, latitude, longitude]);

  const bookingUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://afribooking.app';
    const url = new URL(`/apartments/${apartmentId}`, origin);
    url.searchParams.set('reservationType', reservationType);
    if (selectedBedrooms !== null) url.searchParams.set('bedrooms', String(selectedBedrooms));
    if (dates.checkInDate) url.searchParams.set('checkInDate', dates.checkInDate);
    if (dates.checkOutDate) url.searchParams.set('checkOutDate', dates.checkOutDate);
    return url.toString();
  }, [apartmentId, dates.checkInDate, dates.checkOutDate, reservationType, selectedBedrooms]);

  const share = async () => {
    const shareData = { title: apartment.apartmentName, text: `Take a look at ${apartment.apartmentName} on AfriBooking`, url: bookingUrl };
    if (navigator.share) await navigator.share(shareData);
    else { await navigator.clipboard.writeText(bookingUrl); setCopied(true); toast.success('Booking link copied.'); setTimeout(() => setCopied(false), 1600); }
  };

  const chat = async () => {
    if (!user) return router.push(`/login?returnTo=${encodeURIComponent(`/apartments/${apartmentId}`)}`);
    setOpeningChat(true);
    try {
      const { data } = await api.post(createInquiryChat, { apartmentId, checkInDate: dates.checkInDate, checkOutDate: dates.checkOutDate });
      const chatId = data?.data?.chat?._id || data?.data?.chat?.id;
      if (!chatId) throw new Error('Conversation could not be opened.');
      router.push(`/messages/${chatId}`);
    } catch (error: any) { toast.error(error?.response?.data?.message || error?.message || 'Unable to contact the owner.'); }
    finally { setOpeningChat(false); }
  };

  const offer = () => {
    if (!user) return router.push(`/login?returnTo=${encodeURIComponent(`/apartments/${apartmentId}`)}`);
    const query = new URLSearchParams({ apartmentId, name: apartment.apartmentName, reservationType, price: String(price) });
    if (dates.checkInDate) query.set('checkInDate', dates.checkInDate);
    if (dates.checkOutDate) query.set('checkOutDate', dates.checkOutDate);
    if (selectedBedrooms !== null) query.set('selectedBedrooms', String(selectedBedrooms));
    router.push(`/bargains/new?${query}`);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => toggleFavorite(apartmentId)} disabled={pendingIds.has(apartmentId)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 font-bold text-gray-800 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-60 dark:border-gray-700 dark:text-white dark:hover:bg-rose-950/20"><Heart size={19} className={favoriteIds.has(apartmentId) ? 'fill-rose-500 text-rose-500' : ''} /> {favoriteIds.has(apartmentId) ? 'Saved' : 'Save'}</button>
          <button onClick={share} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 font-bold text-gray-800 transition hover:border-primary dark:border-gray-700 dark:text-white">{copied ? <Check size={19} /> : <Share2 size={19} />} Share</button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button onClick={chat} disabled={openingChat} className="flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 font-bold text-white disabled:opacity-60 dark:bg-white dark:text-gray-950">{openingChat ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />} Ask the owner</button>
          <button onClick={offer} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-extrabold text-gray-950"><Tags size={18} /> Make an offer</button>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-gray-900/50 dark:text-gray-300"><Copy size={15} /><span className="truncate">Booking link includes your selected stay type, room, and saved dates.</span></div>
      </section>

      {hasCoordinates && <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"><div className="p-5"><div className="flex items-center gap-2"><MapPin className="text-amber-500" /><h2 className="text-lg font-bold text-gray-950 dark:text-white">Location and nearby places</h2></div><p className="mt-1 text-sm text-gray-500">Explore the neighbourhood before you book.</p></div><iframe title={`Map of ${apartment.apartmentName}`} className="h-72 w-full border-0" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.015}%2C${latitude - 0.012}%2C${longitude + 0.015}%2C${latitude + 0.012}&layer=mapnik&marker=${latitude}%2C${longitude}`} />{nearby.length > 0 && <div className="grid gap-2 p-4 sm:grid-cols-2">{nearby.slice(0, 6).map((place, index) => <div key={place.placeId || place.name || index} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-900/60"><div className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><Navigation size={16} /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-gray-900 dark:text-white">{place.name || 'Nearby place'}</p><p className="truncate text-xs text-gray-500">{place.address || place.vicinity || 'Close to this stay'}</p></div></div>)}</div>}</section>}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-gray-950 dark:text-white">Guest reviews</h2><p className="mt-1 text-sm text-gray-500">Feedback from verified stays.</p></div><div className="text-right"><div className="flex items-center gap-1 text-xl font-extrabold text-gray-950 dark:text-white"><Star size={19} className="fill-amber-400 text-amber-400" /> {Number(stats?.averageRating || apartment.averageRating || 0).toFixed(1)}</div><p className="text-xs text-gray-500">{stats?.totalReviews || apartment.totalReviews || 0} reviews</p></div></div>
        <div className="mt-5 space-y-3">{reviews.length ? reviews.map((review, index) => <article key={review?._id || index} className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900/60"><div className="flex items-center justify-between gap-3"><p className="font-bold text-gray-900 dark:text-white">{[review?.userId?.first_name || review?.userId?.firstName, review?.userId?.last_name || review?.userId?.lastName].filter(Boolean).join(' ') || 'Guest'}</p><RatingStars rating={Number(review.rating || 0)} size={15} /></div><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{review.comment || 'No written comment.'}</p></article>) : <p className="rounded-2xl bg-gray-50 p-5 text-center text-sm text-gray-500 dark:bg-gray-900/60">No reviews yet. Be the first guest to share your experience.</p>}</div>
        <button onClick={() => router.push(`/apartments/${apartmentId}/reviews`)} className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-800 hover:border-primary dark:border-gray-700 dark:text-white">See all reviews</button>
      </section>
    </div>
  );
}
