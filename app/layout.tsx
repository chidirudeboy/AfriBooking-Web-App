import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { ThemeWrapper } from '@/components/ThemeWrapper'
import SessionWarning from '@/components/SessionWarning'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AfriBooking: Find & Book',
  description: 'Find and book apartments with AfriBooking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeWrapper>
          <AuthProvider>
            <SidebarProvider>
              {children}
              <SessionWarning />
              <Toaster 
                position="top-right"
                toastOptions={{
                  className: 'dark:bg-gray-800 dark:text-white',
                }}
              />
            </SidebarProvider>
          </AuthProvider>
        </ThemeWrapper>
      </body>
    </html>
  )
}

