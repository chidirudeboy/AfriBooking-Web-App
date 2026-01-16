'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Home, 
  Menu, 
  X, 
  LogOut, 
  User, 
  Bell,
  Calendar,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Smartphone,
  ExternalLink,
  FileText
} from 'lucide-react';

const navigation = [
  { name: 'Apartments', href: '/apartments', icon: Home },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Requests', href: '/requests', icon: FileText },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Mobile menu state
  const [mounted, setMounted] = useState(false); // Prevent hydration mismatch
  const { isCollapsed, toggleCollapse } = useSidebar(); // Desktop collapse state from context
  const { theme, toggleTheme } = useTheme(); // Theme context
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, profile } = useAuth();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} className="text-gray-900 dark:text-white" /> : <Menu size={24} className="text-gray-900 dark:text-white" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-gray-900 shadow-lg dark:shadow-gray-950 z-40 transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          w-64 ${mounted ? (isCollapsed ? 'lg:w-20' : 'lg:w-64') : 'lg:w-64'}
        `}
        suppressHydrationWarning
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className={`p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 relative ${isCollapsed ? 'px-2' : ''}`}>
            {!isCollapsed ? (
              <>
                <h1 className="text-xl sm:text-2xl font-bold text-primary">AfriBooking</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Find & Book</p>
              </>
            ) : (
              <div className="flex items-center justify-center">
                <h1 className="text-lg font-bold text-primary">A</h1>
              </div>
            )}
            {/* Collapse Toggle Button - Desktop only */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-50"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              suppressHydrationWarning
            >
              {mounted && isCollapsed ? (
                <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
              ) : (
                <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>

          {/* User Info */}
          {user ? (
            <div className={`p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 ${isCollapsed ? 'px-2' : ''}`}>
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {profile?.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {profile?.firstName && profile?.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : user.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 ${isCollapsed ? 'px-2' : ''}`}>
              {isCollapsed ? (
                <div className="flex justify-center">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    title="Sign In"
                  >
                    <User size={20} />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Not signed in</p>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-2'}`}>
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center rounded-lg transition-colors
                        ${isCollapsed 
                          ? 'justify-center px-3 py-3' 
                          : 'space-x-3 px-4 py-3'
                        }
                        ${isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon size={20} className="flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mobile App Promotion */}
          <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${isCollapsed ? 'px-2' : ''}`}>
            <a
              href="https://apps.apple.com/ng/app/afribooking-find-book/id6476979170"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className={`
                w-full flex items-center rounded-lg transition-colors
                ${isCollapsed 
                  ? 'justify-center px-3 py-3' 
                  : 'space-x-3 px-4 py-3'
                }
                bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10
                border border-primary/20 dark:border-primary/30
                text-primary hover:from-primary/20 hover:to-primary/10 dark:hover:from-primary/30 dark:hover:to-primary/20
              `}
              title={isCollapsed ? 'Download Mobile App' : undefined}
            >
              <Smartphone size={20} className="flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-xs">Mobile App</span>
                    <ExternalLink size={14} className="flex-shrink-0" />
                  </div>
                  <span className="text-xs text-primary/80 dark:text-primary/70">Download now</span>
                </div>
              )}
            </a>
          </div>

          {/* Theme Toggle */}
          <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${isCollapsed ? 'px-2' : ''}`}>
            <button
              onClick={toggleTheme}
              className={`
                w-full flex items-center rounded-lg transition-colors
                ${isCollapsed 
                  ? 'justify-center px-3 py-3' 
                  : 'space-x-3 px-4 py-3'
                }
                text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
              `}
              title={isCollapsed ? (mounted && theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
              suppressHydrationWarning
            >
              {mounted && theme === 'dark' ? (
                <Sun size={20} className="flex-shrink-0" />
              ) : (
                <Moon size={20} className="flex-shrink-0" />
              )}
              {!isCollapsed && (
                <span className="font-medium" suppressHydrationWarning>
                  {mounted ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : 'Dark Mode'}
                </span>
              )}
            </button>
          </div>

          {/* Logout Button - Only show if user is logged in */}
          {user && (
            <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${isCollapsed ? 'px-2' : ''}`}>
              <button
                onClick={handleLogout}
                className={`
                  w-full flex items-center rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
                  ${isCollapsed 
                    ? 'justify-center px-3 py-3' 
                    : 'space-x-3 px-4 py-3'
                  }
                `}
                title={isCollapsed ? 'Logout' : undefined}
              >
                <LogOut size={20} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">Logout</span>
                )}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

