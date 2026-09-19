'use client';

import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';

export default function AppShell({
  children,
  width = 'max-w-[1320px]',
  showFooter = true,
}: {
  children: ReactNode;
  width?: string;
  showFooter?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#141922] text-[#17191b] dark:text-[#f0f2f6] transition-colors">
      <Navbar />
      <main className={`flex-1 w-full ${width} mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8`}>
        {children}
      </main>
      {showFooter && <Footer />}
      <BottomNav />
    </div>
  );
}
