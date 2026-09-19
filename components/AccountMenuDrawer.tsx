'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Home,
  Sparkles,
  Calendar,
  FileText,
  MessageSquare,
  Bell,
  User,
  Settings,
  BookOpen,
  Heart,
  Tags,
  Gift,
  Clapperboard,
  Smartphone,
  Moon,
  Sun,
  LogOut,
  X,
} from 'lucide-react';

interface AccountMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountMenuDrawer({ isOpen, onClose }: AccountMenuDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Close on route change or ESC
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const menuLinks = [
    { name: 'Apartments', href: '/apartments', icon: Home },
    { name: 'Plan a trip', href: '/planner', icon: Sparkles, badge: 'AI' },
    { name: 'Saved stays', href: '/saved', icon: Heart },
    { name: 'My offers', href: '/bargains', icon: Tags },
    { name: 'Reels', href: '/reels', icon: Clapperboard },
    { name: 'Blog', href: '/blog', icon: BookOpen },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Requests', href: '/requests', icon: FileText },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Referrals', href: '/referrals', icon: Gift },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="relative z-50 flex h-full w-[min(360px,88vw)] flex-col bg-white dark:bg-[#1c222c] text-[#17191b] dark:text-[#f0f2f6] shadow-2xl transition-transform duration-300 ease-in-out border-r border-[#e7e8eb] dark:border-[#353c47] overflow-y-auto"
        aria-label="Account menu"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e7e8eb] dark:border-[#353c47]">
          <Link href="/apartments" className="font-display font-extrabold text-2xl tracking-tight">
            Afri<span className="text-[#ffbf00]">Booking</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* User Account Card */}
        <div className="p-5 border-b border-[#e7e8eb] dark:border-[#353c47] bg-[#fff9e9]/50 dark:bg-[#302916]/30">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#ffbf00] text-[#17191b] font-bold flex items-center justify-center text-lg shadow-sm">
                {profile?.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {profile?.firstName && profile?.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : user.email}
                </p>
                <p className="text-xs text-[#6c7075] dark:text-[#acb4c0] truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm font-medium mb-3 text-[#6c7075] dark:text-[#acb4c0]">Not signed in</p>
              <Link
                href="/login"
                className="block w-full py-2.5 px-4 bg-[#ffbf00] hover:bg-[#eeb200] text-[#17191b] font-bold rounded-lg text-sm transition-colors text-center shadow-sm"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1">
          {menuLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#ffbf00] text-[#17191b] font-semibold'
                    : 'text-[#17191b] dark:text-[#f0f2f6] hover:bg-gray-100 dark:hover:bg-gray-800/60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon size={19} className={isActive ? 'text-[#17191b]' : 'text-[#6c7075] dark:text-[#acb4c0]'} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#fff9e9] dark:bg-[#302916] text-[#866000] dark:text-[#ffbf00]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#e7e8eb] dark:border-[#353c47] space-y-3">
          {/* Mobile App Callout */}
          <a
            href="https://www.afribooking.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl border border-[#e7e8eb] dark:border-[#353c47] hover:border-[#ffbf00] dark:hover:border-[#ffbf00] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Smartphone size={18} className="text-[#ffbf00]" />
              <div>
                <p className="text-xs font-bold text-[#17191b] dark:text-[#f0f2f6]">Mobile App ↗</p>
                <p className="text-[11px] text-[#6c7075] dark:text-[#acb4c0]">Download now</p>
              </div>
            </div>
          </a>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Sun size={18} className="text-[#ffbf00]" /> : <Moon size={18} className="text-gray-500" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[#6c7075] dark:text-[#acb4c0]">
              {theme === 'dark' ? 'On' : 'Off'}
            </span>
          </button>

          {/* Sign Out */}
          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-sm font-medium transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
