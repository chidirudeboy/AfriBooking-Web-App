'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[#e7e8eb] dark:border-[#353c47] bg-white dark:bg-[#141922] py-8 px-4 sm:px-6 lg:px-8 transition-colors mt-auto pb-24 md:pb-8">
      <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <Link href="/apartments" className="font-display font-extrabold text-xl tracking-tight text-[#17191b] dark:text-[#f0f2f6]">
            Afri<span className="text-[#ffbf00]">Booking</span>
          </Link>
          <span className="text-xs text-[#6c7075] dark:text-[#acb4c0]">
            Stays. Spaces. Experiences. Transport.
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs text-[#6c7075] dark:text-[#acb4c0]">
          <Link href="/blog" className="hover:text-[#17191b] dark:hover:text-white transition-colors">
            Blog
          </Link>
          <Link href="/planner" className="hover:text-[#17191b] dark:hover:text-white transition-colors">
            AI Planner
          </Link>
          <Link href="/support" className="hover:text-[#17191b] dark:hover:text-white transition-colors">
            Support
          </Link>
          <a
            href="https://www.afribooking.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#17191b] dark:hover:text-white transition-colors"
          >
            Mobile App ↗
          </a>
        </div>

        <div className="text-[11px] text-[#6c7075] dark:text-[#acb4c0]">
          © {new Date().getFullYear()} AfriBooking. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
