'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, CreditCard, History, Loader2, MapPin, MessageSquare, RotateCcw, Tags, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { cancelBargain, getBargainById, payForBargain, respondToBargain } from '@/lib/endpoints';
import api from '@/lib/utils/api';
import { bargainStatus, formatDateRange, formatNaira, reservationLabel } from '@/lib/utils/bargain';
import toast from 'react-hot-toast';

const ID_OPTIONS = ["Driver's License", "Voter's ID", 'National Passport', 'National ID'];

export default function BargainDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bargain, setBargain] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [idType, setIdType] = useState('National ID');
  const [idNumber, setIdNumber] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(getBargainById(id));
      const next = data?.data || null;
      setBargain(next);
      const booking = next?.acceptedBookingId;
      if (booking?.meansOfIdentification) setIdType(booking.meansOfIdentification);
      if (booking?.identificationNumber) setIdNumber(booking.identificationNumber);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load this offer.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?returnTo=${encodeURIComponent(`/bargains/${id}`)}`);
    if (user && id) load();
  }, [authLoading, id, load, router, user]);

  const submitCounter = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(counterAmount.replace(/[^\d]/g, ''));
    if (!amount) return toast.error('Enter a valid counteroffer.');
    setWorking(true);
    try {
      await api.post(respondToBargain(id), { offeredTotalPrice: amount, message: counterMessage.trim() || undefined });
      toast.success('Counteroffer sent.');
      setShowCounter(false);
      setCounterAmount('');
      setCounterMessage('');
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to send your counteroffer.');
    } finally { setWorking(false); }
  };

  const cancel = async () => {
    if (!confirm('Cancel this offer? The negotiation will be closed.')) return;
    setWorking(true);
    try {
      await api.post(cancelBargain(id), {});
      toast.success('Offer cancelled.');
      load();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to cancel this offer.'); }
    finally { setWorking(false); }
  };

  const pay = async (event: FormEvent) => {
    event.preventDefault();
    if (!idNumber.trim()) return toast.error('Enter your identification number.');
    const existingImage = bargain?.acceptedBookingId?.identificationImageUrl;
    if (!idFile && !existingImage) return toast.error('Upload a clear image of your ID.');
    setWorking(true);
    try {
      const form = new FormData();
      form.append('meansOfIdentification', idType);
      form.append('identificationNumber', idNumber.trim());
      if (idFile) form.append('identificationImage', idFile);
      else form.append('identificationImageUrl', existingImage);
      const { data } = await api.post(payForBargain(id), form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = data?.data?.payment?.data?.authorization_url || data?.data?.payment?.authorization_url || data?.data?.payment?.authorizationUrl;
      if (!url) throw new Error(data?.message || 'Payment link unavailable.');
      window.location.assign(url);
    } catch (error: any) { toast.error(error?.response?.data?.message || error?.message || 'Unable to start payment.'); }
    finally { setWorking(false); }
  };

  if (loading || authLoading) return <AppShell width="max-w-5xl"><div className="grid min-h-[60vh] place-items-center"><Loader2 className="animate-spin text-primary" size={36} /></div></AppShell>;
  if (!bargain) return <AppShell width="max-w-5xl"><div className="rounded-3xl bg-white p-12 text-center dark:bg-gray-900"><h1 className="text-2xl font-bold dark:text-white">Offer not found</h1><button onClick={() => router.push('/bargains')} className="mt-5 rounded-xl bg-primary px-5 py-3 font-bold">Back to offers</button></div></AppShell>;

  const property = bargain.propertyId || {};
  const status = bargainStatus(bargain.status);
  const canCounter = bargain.status === 'countered' && bargain.lastOfferedBy === 'agent';
  const canCancel = ['pending', 'countered'].includes(bargain.status);
  const canPay = bargain.status === 'accepted';
  const history = Array.isArray(bargain.history) ? bargain.history : Array.isArray(bargain.negotiationHistory) ? bargain.negotiationHistory : [];

  return (
    <AppShell width="max-w-5xl">
      <button onClick={() => router.push('/bargains')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"><ArrowLeft size={18} /> All offers</button>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="bg-gradient-to-br from-gray-950 to-gray-800 p-6 text-white sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-amber-300">Offer for</p><h1 className="mt-2 text-3xl font-bold">{property.apartmentName || 'Apartment'}</h1><p className="mt-2 flex items-center gap-2 text-sm text-gray-300"><MapPin size={15} /> {[property.city, property.state].filter(Boolean).join(', ') || property.address || 'Location unavailable'}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${status.className}`}>{status.label}</span></div>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-wide text-gray-400">Stay type</p><p className="mt-1 font-semibold text-gray-900 dark:text-white">{reservationLabel(bargain.reservationType)}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-gray-400">Dates</p><p className="mt-1 font-semibold text-gray-900 dark:text-white">{formatDateRange(bargain.checkInDate, bargain.checkOutDate)}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-gray-400">Current amount</p><p className="mt-1 text-xl font-extrabold text-amber-600">{formatNaira(bargain.finalAgreedPrice || bargain.offeredTotalPrice)}</p></div></div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3"><History className="text-amber-500" /><div><h2 className="text-xl font-bold text-gray-950 dark:text-white">Negotiation history</h2><p className="text-sm text-gray-500">A transparent record of every offer.</p></div></div>
            <div className="mt-6 space-y-4">
              {(history.length ? history : [{ offeredTotalPrice: bargain.offeredTotalPrice, message: bargain.message, offeredBy: 'user', createdAt: bargain.createdAt }]).map((entry: any, index: number) => (
                <div key={entry?._id || index} className="relative rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-gray-800 dark:text-gray-100">{entry.offeredBy === 'agent' || entry.sender === 'agent' ? 'Owner' : 'You'}</p>{entry.message && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{entry.message}</p>}</div><div className="text-right"><p className="font-extrabold text-gray-950 dark:text-white">{formatNaira(entry.offeredTotalPrice || entry.amount)}</p>{entry.createdAt && <p className="mt-1 text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</p>}</div></div></div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h2 className="font-bold text-gray-950 dark:text-white">What happens next?</h2><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">The owner can accept, decline, or send a counteroffer. You only pay after an offer is accepted.</p></section>
          {canCounter && <button onClick={() => setShowCounter(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-extrabold text-gray-950"><RotateCcw size={18} /> Send counteroffer</button>}
          {canPay && <button onClick={() => setShowPayment(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 font-extrabold text-white shadow-lg shadow-emerald-600/20"><CreditCard size={18} /> Pay accepted offer</button>}
          {bargain.chatId && <button onClick={() => router.push(`/messages/${bargain.chatId?._id || bargain.chatId}`)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 font-bold text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"><MessageSquare size={18} /> Open conversation</button>}
          {canCancel && <button onClick={cancel} disabled={working} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"><Trash2 size={18} /> Cancel offer</button>}
        </aside>
      </div>

      {showCounter && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"><form onSubmit={submitCounter} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900"><h2 className="text-2xl font-bold text-gray-950 dark:text-white">Your counteroffer</h2><p className="mt-1 text-sm text-gray-500">Enter the total amount for the complete stay.</p><div className="mt-5 flex items-center rounded-2xl border-2 border-amber-300 px-4"><span className="text-2xl font-bold">₦</span><input value={counterAmount} onChange={(e) => setCounterAmount(e.target.value.replace(/[^\d]/g, ''))} className="w-full bg-transparent p-4 text-2xl font-bold outline-none dark:text-white" autoFocus /></div><textarea value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)} rows={3} className="mt-4 w-full rounded-2xl border border-gray-300 bg-transparent p-4 outline-none focus:border-primary dark:border-gray-700 dark:text-white" placeholder="Add a note (optional)" /><div className="mt-6 flex gap-3"><button type="button" onClick={() => setShowCounter(false)} className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-bold dark:border-gray-700 dark:text-white">Not now</button><button disabled={working} className="flex-1 rounded-xl bg-primary px-4 py-3 font-extrabold text-gray-950">{working ? 'Sending…' : 'Send counter'}</button></div></form></div>}

      {showPayment && <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"><form onSubmit={pay} className="my-6 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900"><h2 className="text-2xl font-bold text-gray-950 dark:text-white">Confirm your identity</h2><p className="mt-1 text-sm text-gray-500">Identification is securely required before payment.</p><label className="mt-5 block text-sm font-bold dark:text-gray-100">ID type</label><select value={idType} onChange={(e) => setIdType(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 bg-transparent p-3.5 dark:border-gray-700 dark:text-white">{ID_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select><label className="mt-4 block text-sm font-bold dark:text-gray-100">Identification number</label><input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 bg-transparent p-3.5 dark:border-gray-700 dark:text-white" /><label className="mt-4 block text-sm font-bold dark:text-gray-100">ID image</label><input type="file" accept="image/*" onChange={(e) => setIdFile(e.target.files?.[0] || null)} className="mt-2 block w-full rounded-xl border border-dashed border-gray-300 p-4 text-sm dark:border-gray-700 dark:text-gray-300" />{bargain?.acceptedBookingId?.identificationImageUrl && !idFile && <p className="mt-2 text-xs text-emerald-600">Your previously uploaded ID will be reused.</p>}<div className="mt-6 flex gap-3"><button type="button" onClick={() => setShowPayment(false)} className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-bold dark:border-gray-700 dark:text-white">Cancel</button><button disabled={working} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-extrabold text-white">{working && <Loader2 size={17} className="animate-spin" />} Continue</button></div></form></div>}
    </AppShell>
  );
}
