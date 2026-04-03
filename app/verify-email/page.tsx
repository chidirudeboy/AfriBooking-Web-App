'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { requestEmailVerification, verifyEmailVerification } from '@/lib/endpoints';
import api from '@/lib/utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const autoRequestedRef = useRef(false);

  const handleVerify = async () => {
    if (!email) {
      toast.error('Missing email address.');
      return;
    }
    if (!otp || otp.trim().length < 4) {
      toast.error('Please enter the OTP sent to your email.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post(verifyEmailVerification, { email, otp });
      if (res.data?.success) {
        toast.success('Email verified. Please log in.');
        router.push('/login');
      } else {
        toast.error(res.data?.message || 'Verification failed.');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Verification failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Missing email address.');
      return;
    }
    try {
      setResending(true);
      const res = await api.post(requestEmailVerification, { email });
      toast.success(res.data?.message || 'Verification code sent.');
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to resend.';
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!email || autoRequestedRef.current) return;
    autoRequestedRef.current = true;
    handleResend();
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.back()}
          className="mb-4 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Mail className="w-6 h-6 text-amber-600 dark:text-amber-500" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Verify Your Email
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {email ? `We sent a verification code to ${email}.` : 'Enter the code sent to your email.'}
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full px-3 py-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-light to-primary-dark text-white py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full text-primary font-semibold text-sm hover:opacity-90 disabled:opacity-50"
          >
            {resending ? 'Resending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
