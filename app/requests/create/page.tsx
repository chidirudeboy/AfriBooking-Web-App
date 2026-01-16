'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { createUserRequest } from '@/lib/endpoints';
import api from '@/lib/utils/api';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [bedrooms, setBedrooms] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [apartmentType, setApartmentType] = useState<'private' | 'unit' | ''>('');
  const [propertyType, setPropertyType] = useState<'duplex' | 'flat' | ''>('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!bedrooms.trim()) {
      toast.error('Please enter number of bedrooms');
      return;
    }

    const bedroomsNum = parseInt(bedrooms);
    if (isNaN(bedroomsNum) || bedroomsNum < 1) {
      toast.error('Please enter a valid number of bedrooms (at least 1)');
      return;
    }

    if (!city.trim()) {
      toast.error('Please enter a city');
      return;
    }

    if (!state.trim()) {
      toast.error('Please enter a state');
      return;
    }

    // Validate dates if provided
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      if (checkOut <= checkIn) {
        toast.error('Check-out date must be after check-in date');
        return;
      }
    }

    // Validate budget range if provided
    if (minBudget.trim() || maxBudget.trim()) {
      const minBudgetNum = minBudget.trim() ? parseFloat(minBudget) : undefined;
      const maxBudgetNum = maxBudget.trim() ? parseFloat(maxBudget) : undefined;

      if (minBudgetNum !== undefined && (isNaN(minBudgetNum) || minBudgetNum < 0)) {
        toast.error('Minimum budget must be a valid non-negative number');
        return;
      }

      if (maxBudgetNum !== undefined && (isNaN(maxBudgetNum) || maxBudgetNum < 0)) {
        toast.error('Maximum budget must be a valid non-negative number');
        return;
      }

      if (minBudgetNum !== undefined && maxBudgetNum !== undefined && maxBudgetNum < minBudgetNum) {
        toast.error('Maximum budget must be greater than or equal to minimum budget');
        return;
      }
    }

    setLoading(true);
    try {
      const requestData: any = {
        bedrooms: bedroomsNum,
        city: city.trim(),
        state: state.trim(),
      };
      
      if (apartmentType) requestData.apartmentType = apartmentType;
      if (propertyType) requestData.propertyType = propertyType;
      if (minBudget.trim()) requestData.minBudget = parseFloat(minBudget);
      if (maxBudget.trim()) requestData.maxBudget = parseFloat(maxBudget);
      if (additionalNotes.trim()) requestData.additionalNotes = additionalNotes.trim();
      if (checkInDate) requestData.checkInDate = new Date(checkInDate).toISOString();
      if (checkOutDate) requestData.checkOutDate = new Date(checkOutDate).toISOString();

      const response = await api.post(createUserRequest, requestData);

      if ((response.data as any)?.success) {
        toast.success('Request created successfully! All agents have been notified of your request.');
        router.back();
      }
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast.error(error.response?.data?.error || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const getMinCheckOutDate = () => {
    if (checkInDate) {
      const checkIn = new Date(checkInDate);
      checkIn.setDate(checkIn.getDate() + 1);
      return checkIn.toISOString().split('T')[0];
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0`}>
        <div className="max-w-2xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-4 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create Request
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Tell agents what you need
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bedrooms Input */}
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Number of Bedrooms *
              </label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="e.g., 2"
                min="1"
                required
                className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* City and State Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Lagos"
                  required
                  className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g., Lagos State"
                  required
                  className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Apartment Type Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Apartment Type (Optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setApartmentType(apartmentType === 'private' ? '' : 'private')}
                  className={`px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                    apartmentType === 'private'
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-300'
                  }`}
                >
                  Private
                </button>
                <button
                  type="button"
                  onClick={() => setApartmentType(apartmentType === 'unit' ? '' : 'unit')}
                  className={`px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                    apartmentType === 'unit'
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-300'
                  }`}
                >
                  Unit
                </button>
              </div>
            </div>

            {/* Property Type Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Property Type (Optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPropertyType(propertyType === 'duplex' ? '' : 'duplex')}
                  className={`px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                    propertyType === 'duplex'
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-300'
                  }`}
                >
                  Duplex
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyType(propertyType === 'flat' ? '' : 'flat')}
                  className={`px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                    propertyType === 'flat'
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-300'
                  }`}
                >
                  Flat
                </button>
              </div>
            </div>

            {/* Budget Range */}
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Budget Range (Optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Minimum (₦)
                  </label>
                  <input
                    type="number"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Maximum (₦)
                  </label>
                  <input
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Check-in and Check-out Date Inputs */}
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Dates (Optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => {
                      setCheckInDate(e.target.value);
                      if (checkOutDate && new Date(e.target.value) >= new Date(checkOutDate)) {
                        setCheckOutDate('');
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={getMinCheckOutDate() || new Date().toISOString().split('T')[0]}
                    disabled={!checkInDate}
                    className={`w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                      !checkInDate ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes Input */}
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any additional requirements or preferences..."
                rows={4}
                className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Create Request</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
