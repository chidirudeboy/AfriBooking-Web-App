'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, X } from 'lucide-react';

export default function SessionWarning() {
  const { showSessionWarning, extendSession, logout } = useAuth();

  if (!showSessionWarning) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-slide-up">
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle size={24} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              Session Expiring Soon
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              Your session will expire in 5 minutes due to inactivity. Click "Stay Logged In" to continue.
            </p>
            <div className="flex gap-2">
              <button
                onClick={extendSession}
                className="flex-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={logout}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-medium rounded transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

