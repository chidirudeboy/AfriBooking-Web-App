'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';

export default function AppShell({ children, width = 'max-w-7xl' }: { children: ReactNode; width?: string }) {
  const { isCollapsed } = useSidebar();
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className={`${width} mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-10`}>{children}</main>
      </div>
    </div>
  );
}
