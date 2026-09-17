'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, Compass, Heart, ShieldCheck, X } from 'lucide-react';

const steps = [
  { icon: Compass, title: 'Find the right stay', copy: 'Search by location, dates, budget, and purpose—from a normal stay to a creative shoot.' },
  { icon: Heart, title: 'Shortlist and negotiate', copy: 'Save favourites, ask owners questions, and make an offer when you are ready.' },
  { icon: ShieldCheck, title: 'Book with confidence', copy: 'Verified listings, transparent reviews, secure payments, and support through your stay.' },
];

export default function OnboardingExperience() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!localStorage.getItem('afribooking_web_onboarded') && pathname === '/apartments') setOpen(true);
  }, [pathname]);
  const close = () => { localStorage.setItem('afribooking_web_onboarded', 'true'); setOpen(false); };
  if (!open) return null;
  const current = steps[step];
  const Icon = current.icon;
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-gray-950/70 p-4 backdrop-blur-md"><div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-gray-900"><button onClick={close} className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" aria-label="Skip onboarding"><X size={18} /></button><div className="bg-gradient-to-br from-amber-300 via-primary to-amber-500 px-7 pb-16 pt-12"><div className="grid h-20 w-20 place-items-center rounded-3xl bg-gray-950 text-white shadow-xl"><Icon size={36} /></div></div><div className="-mt-7 rounded-t-[2rem] bg-white px-7 pb-7 pt-10 dark:bg-gray-900"><p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-600">Welcome to AfriBooking</p><h2 className="mt-3 text-3xl font-black text-gray-950 dark:text-white">{current.title}</h2><p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">{current.copy}</p><div className="mt-8 flex items-center justify-between"><div className="flex gap-2">{steps.map((_, index) => <span key={index} className={`h-2 rounded-full transition-all ${index === step ? 'w-8 bg-primary' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />)}</div><button onClick={() => { if (step < steps.length - 1) setStep(step + 1); else { close(); router.push('/apartments'); } }} className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 font-extrabold text-white dark:bg-white dark:text-gray-950">{step === steps.length - 1 ? 'Explore stays' : 'Continue'} <ArrowRight size={18} /></button></div></div></div></div>;
}
