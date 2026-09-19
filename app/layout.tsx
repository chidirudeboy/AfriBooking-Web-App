import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { ThemeWrapper } from '@/components/ThemeWrapper'
import SessionWarning from '@/components/SessionWarning'
import AppUpdateBanner from '@/components/AppUpdateBanner'
import { Toaster } from 'react-hot-toast'
import { GoogleTagManagerHead, GoogleTagManagerBody } from '@/components/GoogleTagManager'
import Analytics from '@/components/Analytics'
import OnboardingExperience from '@/components/OnboardingExperience'
import BrowserNotificationBridge from '@/components/BrowserNotificationBridge'

export const metadata: Metadata = {
  title: 'AfriBooking — Discover your next destination',
  description: 'Find your stay. Make room for experiences. Apartments, Spaces, Experiences, and Transport across Nigeria.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  // Prevent zoom on input focus (iOS Safari)
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
        />
        <GoogleTagManagerHead />
      </head>
      <body className="font-sans bg-white dark:bg-[#141922] text-[#17191b] dark:text-[#f0f2f6] min-h-screen antialiased">
        <GoogleTagManagerBody />
        <ThemeWrapper>
          <AuthProvider>
            <SidebarProvider>
              <AppUpdateBanner />
              <Analytics />
              <OnboardingExperience />
              <BrowserNotificationBridge />
              {children}
              <SessionWarning />
              <Toaster 
                position="top-center"
                containerClassName="!top-16 sm:!top-4"
                toastOptions={{
                  className: 'dark:bg-gray-800 dark:text-white text-sm sm:text-base',
                  duration: 4000,
                }}
              />
            </SidebarProvider>
          </AuthProvider>
        </ThemeWrapper>
      </body>
    </html>
  )
}
