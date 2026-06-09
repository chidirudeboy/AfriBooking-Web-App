'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA4_ID || typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: pathname,
      send_to: GA4_ID,
    });
  }, [pathname]);

  return null;
}
