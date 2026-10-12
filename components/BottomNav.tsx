'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Sparkles, FileText, MessageSquare, Heart } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Discover', href: '/apartments', icon: Building2 },
    { name: 'Plan a trip', href: '/planner', icon: Sparkles, isSpark: true },
    { name: 'Requests', href: '/requests', icon: FileText },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Saved', href: '/saved', icon: Heart },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1c222c]/95 backdrop-blur-md border-t border-[#e7e8eb] dark:border-[#353c47] px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-around"
      aria-label="Mobile bottom navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/apartments'
            ? pathname === '/apartments' || pathname.startsWith('/apartments/')
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors text-xs font-semibold ${
              isActive
                ? 'text-[#17191b] dark:text-[#ffbf00]'
                : 'text-[#6c7075] dark:text-[#acb4c0] hover:text-[#17191b]'
            }`}
          >
            {item.isSpark ? (
              <span className={`text-xl leading-none mb-0.5 ${isActive ? 'text-[#ffbf00]' : 'text-[#6c7075] dark:text-[#acb4c0]'}`}>
                ✦
              </span>
            ) : (
              <Icon
                size={20}
                className={`mb-0.5 ${isActive ? 'text-[#ffbf00]' : 'stroke-[1.8]'}`}
              />
            )}
            <span className="text-[11px] font-medium leading-none">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
