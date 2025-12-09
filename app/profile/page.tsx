'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Settings as SettingsIcon, User, Mail, Phone, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, updateProfile, getProfile } = useAuth();
  const { isCollapsed } = useSidebar();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (profile) {
      setFormData({
        first_name: profile.first_name || profile.firstName || '',
        last_name: profile.last_name || profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    } else {
      getProfile();
    }
  }, [user, profile, router, getProfile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('All fields are required');
      return;
    }

    try {
      await updateProfile(
        formData.first_name.trim(),
        formData.last_name.trim(),
        formData.email.trim(),
        formData.phone.trim()
      );
      setIsEditing(false);
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || profile.firstName || '',
        last_name: profile.last_name || profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
    setIsEditing(false);
  };

  const getInitials = () => {
    const firstName = formData.first_name || profile?.first_name || profile?.firstName || '';
    const lastName = formData.last_name || profile?.last_name || profile?.lastName || '';
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name} ${formData.last_name}`;
    }
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return profile?.email || user?.email || 'User';
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Manage your personal information</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Settings"
            >
              <SettingsIcon size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-6 sm:mb-8">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-primary flex items-center justify-center text-white text-4xl sm:text-5xl font-bold mb-4 border-4 border-primary-light">
                {getInitials()}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {getDisplayName()}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {formData.email || profile?.email || user?.email}
              </p>
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4 sm:space-y-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter first name"
                    disabled={loading}
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <User size={20} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-900 dark:text-white">
                      {formData.first_name || profile?.first_name || profile?.firstName || 'Not set'}
                    </span>
                  </div>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter last name"
                    disabled={loading}
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <User size={20} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-900 dark:text-white">
                      {formData.last_name || profile?.last_name || profile?.lastName || 'Not set'}
                    </span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter email address"
                    disabled={loading}
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Mail size={20} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-900 dark:text-white">
                      {formData.email || profile?.email || user?.email || 'Not set'}
                    </span>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter phone number"
                    disabled={loading}
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Phone size={20} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-900 dark:text-white">
                      {formData.phone || profile?.phone || 'Not set'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 mt-6 sm:mt-8">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

