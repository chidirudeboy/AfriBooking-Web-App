'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Phone } from 'lucide-react';
import { requestPhoneVerification, verifyPhoneVerification } from '@/lib/endpoints';
import api from '@/lib/utils/api';
import toast from 'react-hot-toast';

function VerifyPhoneContent() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get('email') || '';
  const phone = params.get('phone') || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const requested = useRef(false);

  const sendCode = useCallback(async () => {
    if (!phone) return toast.error('A phone number is required.');
    setResending(true);
    try {
      const { data } = await api.post(requestPhoneVerification, { phone, email });
      toast.success(data?.message || 'Verification code sent.');
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to send the verification code.'); }
    finally { setResending(false); }
  }, [email, phone]);

  useEffect(() => {
    if (!phone || requested.current) return;
    requested.current = true;
    sendCode();
  }, [phone, sendCode]);

  const verify = async () => {
    if (otp.trim().length < 4) return toast.error('Enter the code sent to your phone.');
    setLoading(true);
    try {
      const { data } = await api.post(verifyPhoneVerification, { phone, email, otp: otp.trim() });
      if (data?.success === false) throw new Error(data?.message || 'Verification failed.');
      toast.success('Phone number verified. Welcome to AfriBooking!');
      router.replace('/apartments');
    } catch (error: any) { toast.error(error?.response?.data?.message || error?.message || 'Verification failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="mx-auto max-w-md">
        <button onClick={() => router.back()} className="grid h-11 w-11 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"><ArrowLeft size={20} /></button>
        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-7 shadow-xl shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/20">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><Phone size={26} /></div>
          <h1 className="mt-6 text-3xl font-bold text-gray-950 dark:text-white">Verify your phone</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Enter the one-time code sent to <strong className="text-gray-900 dark:text-gray-100">{phone || 'your phone'}</strong>. This helps owners trust every booking.</p>
          <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="mt-7 w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-4 text-center text-3xl font-extrabold tracking-[0.35em] text-gray-950 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
          <button onClick={verify} disabled={loading || !otp} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-extrabold text-gray-950 disabled:opacity-50"><CheckCircle2 size={18} /> {loading ? 'Verifying…' : 'Verify phone'}</button>
          <button onClick={sendCode} disabled={resending} className="mt-3 w-full py-2 text-sm font-bold text-amber-700 disabled:opacity-50 dark:text-amber-300">{resending ? 'Sending…' : 'Resend code'}</button>
          <button onClick={() => router.replace('/apartments')} className="mt-2 w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">Verify later</button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPhonePage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}><VerifyPhoneContent /></Suspense>;
}
