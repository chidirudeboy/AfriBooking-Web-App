'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  // Prevent flash of unstyled content by applying theme before rendering
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const theme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, []);

  // Always render ThemeProvider so context is available immediately
  return <ThemeProvider>{children}</ThemeProvider>;
}

