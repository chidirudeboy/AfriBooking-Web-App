'use client';

import { Download, LogIn, X } from 'lucide-react';

interface DownloadLoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export default function DownloadLoginPrompt({ isOpen, onClose, onLogin }: DownloadLoginPromptProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="download-login-title" className="relative w-full rounded-t-3xl bg-white px-6 pb-7 pt-8 text-center shadow-2xl dark:bg-gray-900 sm:max-w-md sm:rounded-3xl sm:px-8" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close sign-in prompt">
          <X size={21} />
        </button>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff5cc] text-[#896300] dark:bg-[#ffbf00]/15 dark:text-[#ffcf40]">
          <Download size={30} />
        </div>
        <h2 id="download-login-title" className="mt-5 text-xl font-bold text-gray-950 dark:text-white">Sign in to download media</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600 dark:text-gray-400">Create or sign in to your AfriBooking account to choose and download this property&apos;s photos and videos.</p>
        <button type="button" onClick={onLogin} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ffca1a] to-[#e4a700] px-5 py-3.5 font-bold text-gray-950 shadow-sm transition hover:brightness-95">
          <LogIn size={19} />
          Continue to sign in
        </button>
        <button type="button" onClick={onClose} className="mt-3 w-full rounded-xl px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Not now</button>
      </section>
    </div>
  );
}
