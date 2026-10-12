'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Menu,
  Building2,
  FileText,
  MessageSquare,
  Heart,
  Bell,
  User,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import AccountMenuDrawer from './AccountMenuDrawer';

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleOpenDrawer = useCallback(() => setDrawerOpen(true), []);
  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const navLinks = [
    { name: 'Discover', href: '/apartments', icon: Building2 },
    { name: 'Plan a trip', href: '/planner', spark: true },
    { name: 'Requests', href: '/requests', icon: FileText },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Saved', href: '/saved', icon: Heart },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 h-[68px] sm:h-[76px] md:h-[94px] bg-white dark:bg-[#141922] border-b border-[#e7e8eb] dark:border-[#353c47] transition-colors">
        <div className="max-w-[1320px] h-full mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
          {/* Left: Menu button & Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-[#e7e8eb] dark:border-[#353c47] hover:border-[#ffbf00] dark:hover:border-[#ffbf00] bg-white dark:bg-[#1c222c] text-[#17191b] dark:text-[#f0f2f6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ffbf00] cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={19} className="sm:w-5 sm:h-5" />
            </button>

            <Link href="/apartments" className="flex flex-col select-none group">
              <span className="font-display font-extrabold text-xl sm:text-2xl md:text-[28px] tracking-tight leading-none text-[#17191b] dark:text-[#f0f2f6]">
                Afri<span className="text-[#ffbf00] group-hover:text-[#eeb200] transition-colors">Booking</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-semibold tracking-[1.8px] sm:tracking-[2px] text-[#6c7075] dark:text-[#acb4c0] uppercase mt-0.5 sm:mt-1">
                FIND & BOOK
              </span>
            </Link>
          </div>

          {/* Center Navigation: Desktop only */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 h-full" aria-label="Main navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/apartments'
                  ? pathname === '/apartments' || pathname.startsWith('/apartments/')
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`h-full flex items-center gap-2 text-sm font-semibold transition-all relative px-1 ${
                    isActive
                      ? 'text-[#17191b] dark:text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-[#ffbf00]'
                      : 'text-[#6c7075] dark:text-[#acb4c0] hover:text-[#17191b] dark:hover:text-white'
                  }`}
                >
                  {item.spark ? (
                    <span className="text-[#ffbf00] text-lg leading-none font-bold">✦</span>
                  ) : (
                    Icon && <Icon size={17} className="stroke-[2]" />
                  )}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Location selector */}
            <Link
              href="/apartments"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#e7e8eb] dark:border-[#353c47] hover:border-[#ffbf00] dark:hover:border-[#ffbf00] bg-white dark:bg-[#1c222c] text-[#17191b] dark:text-[#f0f2f6] transition-colors"
              title="Filter destination"
            >
              <MapPin size={14} className="text-[#ffbf00]" />
              <span>Nigeria</span>
              <ChevronDown size={14} className="text-[#6c7075] dark:text-[#acb4c0]" />
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="w-10 h-10 md:w-11 md:h-11 rounded-full border border-[#e7e8eb] dark:border-[#353c47] hover:border-[#ffbf00] dark:hover:border-[#ffbf00] hover:bg-[#fff9e9] dark:hover:bg-[#302916] flex items-center justify-center text-[#17191b] dark:text-[#f0f2f6] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </Link>

            {/* Avatar / Profile */}
            {user ? (
              <Link
                href="/profile"
                className="w-10 h-10 rounded-full bg-[#ffbf00] hover:bg-[#eeb200] text-[#17191b] font-bold flex items-center justify-center text-sm shadow-sm transition-transform hover:scale-105"
                aria-label="Your Profile"
              >
                {profile?.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-10 h-10 rounded-full bg-[#ffbf00] hover:bg-[#eeb200] text-[#17191b] flex items-center justify-center shadow-sm transition-transform hover:scale-105"
                aria-label="Sign In"
                title="Sign In"
              >
                <User size={18} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Account Menu Drawer */}
      <AccountMenuDrawer isOpen={drawerOpen} onClose={handleCloseDrawer} />
    </>
  );
}
