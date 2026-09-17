'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, CheckCircle2, Info, Send, Tags } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { createBargain, createInquiryChat, getBargainConfig } from '@/lib/endpoints';
import api from '@/lib/utils/api';
import { formatDateRange, formatNaira, reservationLabel } from '@/lib/utils/bargain';
import toast from 'react-hot-toast';

function NewBargainContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const apartmentId = params.get('apartmentId') || '';
  const apartmentName = params.get('name') || 'Apartment';
  const [checkInDate, setCheckInDate] = useState(params.get('checkInDate') || '');
  const [checkOutDate, setCheckOutDate] = useState(params.get('checkOutDate') || '');
  const reservationType = params.get('reservationType') || 'normal';
  const selectedBedrooms = params.get('selectedBedrooms');
  const listedNightly = Number(params.get('price') || 0);
  const [offer, setOffer] = useState(listedNightly ? String(Math.round(listedNightly * 0.9)) : '');
  const [message, setMessage] = useState('');
  const [minimumNights, setMinimumNights] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const nights = useMemo(() => Math.max(0, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000)), [checkInDate, checkOutDate]);
  const offerNightly = Number(offer.replace(/[^\d.]/g, '')) || 0;
  const offerTotal = offerNightly * nights;

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    api.get(getBargainConfig).then(({ data }) => setMinimumNights(Number(data?.data?.minimumNights || 5))).catch(() => undefined);
  }, [authLoading, router, user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!apartmentId || !checkInDate || !checkOutDate) return toast.error('Select your check-in and check-out dates.');
    if (nights < minimumNights) return toast.error(`Offers require a stay of at least ${minimumNights} nights.`);
    if (!offerNightly) return toast.error('Enter a valid nightly offer.');
    setSubmitting(true);
    try {
      const { data } = await api.post(createBargain, {
        propertyId: apartmentId,
        checkInDate,
        checkOutDate,
        reservationType,
        selectedBedrooms: selectedBedrooms ? Number(selectedBedrooms) : undefined,
        offeredTotalPrice: offerTotal,
        message: message.trim() || undefined,
      });
      const bargainId = data?.data?.id || data?.data?._id;
      try {
        const chatResponse = await api.post(createInquiryChat, { apartmentId, checkInDate, checkOutDate, message: message.trim() || `Offer submitted: ${formatNaira(offerTotal)}` });
        const chatId = chatResponse.data?.data?.chat?._id || chatResponse.data?.data?.chat?.id;
        if (chatId) {
          toast.success('Offer sent. Continue the conversation with the owner.');
          router.replace(`/messages/${chatId}`);
          return;
        }
      } catch { /* the bargain remains valid even when chat sync is unavailable */ }
      toast.success('Your offer has been sent.');
      router.replace(bargainId ? `/bargains/${bargainId}` : '/bargains');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to send your offer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell width="max-w-4xl">
      <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"><ArrowLeft size={18} /> Back</button>
      <div className="mb-8"><span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"><Tags size={15} /> Make an offer</span><h1 className="mt-4 text-3xl font-bold text-gray-950 dark:text-white">Negotiate your stay</h1><p className="mt-2 text-gray-600 dark:text-gray-400">No payment is taken until the owner accepts and you confirm.</p></div>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">{apartmentName}</h2>
            <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium dark:bg-gray-800 dark:text-gray-200">{reservationLabel(reservationType)}</span>{checkInDate && checkOutDate && <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium dark:bg-gray-800 dark:text-gray-200"><CalendarDays size={14} /> {formatDateRange(checkInDate, checkOutDate)}</span>}</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-gray-800 dark:text-gray-100">Check in<input type="date" min={new Date().toISOString().split('T')[0]} value={checkInDate} onChange={(event) => { setCheckInDate(event.target.value); if (checkOutDate && event.target.value >= checkOutDate) setCheckOutDate(''); }} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white" /></label>
              <label className="text-sm font-bold text-gray-800 dark:text-gray-100">Check out<input type="date" min={checkInDate || new Date().toISOString().split('T')[0]} value={checkOutDate} onChange={(event) => setCheckOutDate(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white" /></label>
            </div>
          </section>
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <label className="text-sm font-bold text-gray-800 dark:text-gray-100">Your offer per night</label>
            <div className="mt-3 flex items-center rounded-2xl border-2 border-amber-300 bg-amber-50/50 px-4 focus-within:border-amber-500 dark:border-amber-800 dark:bg-amber-950/10"><span className="text-2xl font-extrabold text-gray-900 dark:text-white">₦</span><input value={offer} onChange={(e) => setOffer(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" className="w-full bg-transparent px-3 py-4 text-2xl font-extrabold text-gray-950 outline-none dark:text-white" placeholder="100000" /></div>
            {listedNightly > 0 && <p className="mt-2 text-sm text-gray-500">Listed rate: {formatNaira(listedNightly)} per night</p>}
            <label className="mt-6 block text-sm font-bold text-gray-800 dark:text-gray-100">Message to the owner <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={500} className="mt-3 w-full resize-none rounded-2xl border border-gray-300 bg-white p-4 text-gray-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder="Introduce yourself or explain your offer…" />
          </section>
        </div>
        <aside className="h-fit rounded-3xl bg-gray-950 p-6 text-white shadow-xl dark:bg-white dark:text-gray-950 lg:sticky lg:top-6">
          <p className="text-sm font-semibold text-gray-400 dark:text-gray-600">Offer breakdown</p><p className="mt-2 text-3xl font-extrabold">{formatNaira(offerTotal)}</p>
          <div className="my-5 h-px bg-white/10 dark:bg-gray-200" />
          <div className="space-y-3 text-sm"><div className="flex justify-between"><span>{nights} nights</span><span>{formatNaira(offerNightly)} / night</span></div><div className="flex justify-between"><span>Minimum stay</span><span>{minimumNights} nights</span></div></div>
          <div className={`mt-5 flex gap-3 rounded-2xl p-3 text-sm ${nights >= minimumNights ? 'bg-emerald-500/15 text-emerald-300 dark:text-emerald-700' : 'bg-amber-500/15 text-amber-200 dark:text-amber-700'}`}>{nights >= minimumNights ? <CheckCircle2 className="shrink-0" size={18} /> : <Info className="shrink-0" size={18} />}<span>{nights >= minimumNights ? 'This stay is eligible for an offer.' : `Add ${minimumNights - nights} more night(s) to make an offer.`}</span></div>
          <button disabled={submitting || nights < minimumNights || !offerNightly} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-extrabold text-gray-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"><Send size={18} /> {submitting ? 'Sending…' : 'Send offer'}</button>
        </aside>
      </form>
    </AppShell>
  );
}

export default function NewBargainPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}><NewBargainContent /></Suspense>;
}
