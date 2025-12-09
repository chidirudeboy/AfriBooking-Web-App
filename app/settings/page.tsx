'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { 
  ArrowLeft, 
  User, 
  BookOpen, 
  Headphones, 
  LogOut, 
  Trash2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingsItemProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isDanger?: boolean;
}

const SettingsItem = ({ label, icon, onClick, isDanger = false }: SettingsItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
        isDanger
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          isDanger
            ? 'bg-red-100 dark:bg-red-900/40'
            : 'bg-primary/10 dark:bg-primary/20'
        }`}>
          <div className={isDanger ? 'text-red-600 dark:text-red-400' : 'text-primary'}>
            {icon}
          </div>
        </div>
        <span className={`font-medium ${
          isDanger
            ? 'text-red-700 dark:text-red-400'
            : 'text-gray-900 dark:text-white'
        }`}>
          {label}
        </span>
      </div>
      <ChevronRight 
        size={20} 
        className={isDanger ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'} 
      />
    </button>
  );
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, deleteAccount, loading } = useAuth();
  const { isCollapsed } = useSidebar();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleDeleteAccount = () => {
    if (!deletePassword.trim()) {
      toast.error('Please enter your password to confirm');
      return;
    }

    if (confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
      deleteAccount(deletePassword.trim());
      setShowPasswordInput(false);
      setDeletePassword('');
    }
  };

  const handleEULA = () => {
    window.open('https://termify.io/terms-and-conditions/GuDn0fVx1P', '_blank');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft size={20} />
              <span className="text-sm sm:text-base">Back</span>
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Manage your account and preferences
              </p>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
              Account Settings
            </h2>
            <div className="space-y-3">
              <SettingsItem
                label="My Profile"
                icon={<User size={18} />}
                onClick={() => router.push('/profile')}
              />
              <SettingsItem
                label="EULA"
                icon={<BookOpen size={18} />}
                onClick={handleEULA}
              />
              <SettingsItem
                label="Support"
                icon={<Headphones size={18} />}
                onClick={() => router.push('/support')}
              />
              <SettingsItem
                label="Sign out"
                icon={<LogOut size={18} />}
                onClick={() => {
                  if (confirm('Are you sure you want to sign out?')) {
                    logout();
                  }
                }}
              />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-3 px-1">
              Danger Zone
            </h2>
            <div className="space-y-3">
              {!showPasswordInput ? (
                <SettingsItem
                  label="Delete my account"
                  icon={<Trash2 size={18} />}
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
                      setShowPasswordInput(true);
                    }
                  }}
                  isDanger
                />
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                        Delete Account
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                        This action cannot be undone. All your data will be permanently deleted.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-red-900 dark:text-red-300 mb-2">
                            Enter your password to confirm
                          </label>
                          <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 rounded-lg focus:border-red-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="Enter your password"
                            disabled={loading}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setShowPasswordInput(false);
                              setDeletePassword('');
                            }}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={loading || !deletePassword.trim()}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? (
                              <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Deleting...
                              </span>
                            ) : (
                              'Delete Account'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Version Info */}
          <div className="text-center py-6">
            <div className="inline-block bg-primary/10 dark:bg-primary/20 px-4 py-2 rounded-full mb-2">
              <span className="text-sm font-semibold text-primary">Africartz</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Version 1.0.0
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

