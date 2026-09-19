'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Gift, Loader2, Share2, Sparkles, Users } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { generateReferralCode, getMyAgentReferrals, getMyReferral } from '@/lib/endpoints';
import api from '@/lib/utils/api';
import toast from 'react-hot-toast';

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [code, setCode] = useState('');
  const [stats, setStats] = useState({ totalReferrals: 0, completedReferrals: 0, totalRewardsEarned: 0 });
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [codeResponse, referralResponse] = await Promise.allSettled([api.get(getMyReferral), api.get(getMyAgentReferrals)]);
      if (codeResponse.status === 'fulfilled') setCode(codeResponse.value.data?.data?.referralCode || '');
      if (referralResponse.status === 'fulfilled') {
        setStats(referralResponse.value.data?.data?.stats || { totalReferrals: 0, completedReferrals: 0, totalRewardsEarned: 0 });
        setReferrals(referralResponse.value.data?.data?.referrals || []);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?returnTo=%2Freferrals');
    if (user) load();
  }, [authLoading, load, router, user]);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post(generateReferralCode, {});
      setCode(data?.data?.referralCode || '');
      toast.success('Referral code created.');
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to generate a referral code.'); }
    finally { setGenerating(false); }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Referral code copied.');
    setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    const text = `Join AfriBooking as an agent using my referral code: ${code}`;
    if (navigator.share) await navigator.share({ title: 'Join AfriBooking', text });
    else { await navigator.clipboard.writeText(text); toast.success('Invitation copied.'); }
  };

  return (
    <AppShell width="max-w-5xl">
      <div className="mb-8"><span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"><Gift size={15} /> Referral programme</span><h1 className="mt-4 text-3xl font-bold text-gray-950 dark:text-white">Grow the AfriBooking community</h1><p className="mt-2 text-gray-600 dark:text-gray-400">Invite trusted property agents and follow every referral from one place.</p></div>
      {loading ? <div className="grid min-h-[50vh] place-items-center"><Loader2 size={36} className="animate-spin text-primary" /></div> : <>
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950 p-7 text-white shadow-2xl sm:p-10"><Sparkles className="absolute right-8 top-8 text-amber-300/40" size={80} /><p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Your referral code</p>{code ? <><div className="mt-5 flex max-w-xl items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur"><p className="min-w-0 flex-1 truncate px-2 text-2xl font-black tracking-[0.15em] sm:text-3xl">{code}</p><button onClick={copy} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-gray-950" aria-label="Copy referral code">{copied ? <Check size={20} /> : <Copy size={20} />}</button></div><button onClick={share} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-extrabold text-gray-950"><Share2 size={18} /> Share invitation</button></> : <button onClick={generate} disabled={generating} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-extrabold text-gray-950 disabled:opacity-60">{generating && <Loader2 size={17} className="animate-spin" />} Generate my code</button>}</section>
        <div className="mt-6 grid gap-4 sm:grid-cols-3"><Stat label="Total referrals" value={stats.totalReferrals} /><Stat label="Completed" value={stats.completedReferrals} /><Stat label="Rewards" value="Under review" /></div>
        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"><h2 className="text-xl font-bold text-gray-950 dark:text-white">How it works</h2><div className="mt-5 grid gap-4 sm:grid-cols-3">{['Share your unique code with a property agent.', 'They create an agent account using your code.', 'Our admin team reviews and confirms the referral.'].map((text, i) => <div key={text} className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary font-black text-gray-950">{i + 1}</span><p className="mt-3 text-sm leading-6 text-gray-700 dark:text-gray-300">{text}</p></div>)}</div></section>
        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"><div className="flex items-center gap-3"><Users className="text-amber-500" /><h2 className="text-xl font-bold text-gray-950 dark:text-white">Your referrals</h2></div>{referrals.length ? <div className="mt-5 divide-y divide-gray-100 dark:divide-gray-800">{referrals.map((referral, i) => <div key={referral?._id || i} className="flex items-center justify-between py-4"><div><p className="font-bold text-gray-900 dark:text-white">{[referral?.referredAgent?.firstName, referral?.referredAgent?.lastName].filter(Boolean).join(' ') || 'Invited agent'}</p><p className="text-sm text-gray-500">{referral?.referredAgent?.email || 'Details pending'}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold capitalize text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">{referral?.status || 'under review'}</span></div>)}</div> : <p className="mt-5 rounded-2xl bg-gray-50 p-6 text-center text-gray-500 dark:bg-gray-800">Your invited agents will appear here.</p>}</section>
      </>}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><p className="text-sm font-semibold text-gray-500">{label}</p><p className="mt-2 text-2xl font-extrabold text-gray-950 dark:text-white">{value}</p></div>;
}
