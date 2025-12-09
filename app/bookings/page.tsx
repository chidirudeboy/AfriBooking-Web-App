'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { userBookingHistory, ViewUserBookingHistory } from '@/lib/endpoints';
import { numberWithCommas } from '@/lib/utils';
import axios from 'axios';
import { Calendar, ChevronRight, RefreshCw, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Booking {
  _id: string;
  status: string;
  amount?: number;
  pricing?: {
    sellingPrice?: number;
  };
  created_at?: string;
  createdAt?: string;
  checkInDate: string;
  checkOutDate: string;
  propertyDetails?: {
    name?: string;
    address?: string;
  };
  apartment?: {
    name?: string;
  };
  propertyName?: string;
  apartmentName?: string;
  customerInfo?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchBookings();
  }, [user, router]);

  const fetchBookings = useCallback(async () => {
    if (!user) return;

    try {
      setRefreshing(true);
      setLoading(true);

      const userId = user.user?._id || user._id || user.id;
      if (!userId) {
        toast.error('User ID not found');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let authToken = null;
      if (typeof window !== 'undefined') {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const userObj = JSON.parse(userData);
            authToken = userObj?.accessToken || userObj?.token;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }

      const endDate = '2030-12-31';
      const startDate = '2020-01-01';
      const endpoint = userBookingHistory(1, 50, '', startDate, endDate);

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 15000
      });

      let bookingsData: Booking[] = [];
      if (response.data?.success || response.data?.status === 'success') {
        bookingsData = response.data?.data?.bookings || response.data?.bookings || [];
      }

      setBookings(bookingsData);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      if (error.response?.status === 404) {
        setBookings([]);
      } else if (error.response?.status >= 500 || !error.response) {
        toast.error('Unable to load booking history. Please check your connection and try again.');
      } else {
        setBookings([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const handleBookingClick = async (booking: Booking) => {
    try {
      let authToken = null;
      if (typeof window !== 'undefined') {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const userObj = JSON.parse(userData);
            authToken = userObj?.accessToken || userObj?.token;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }

      const response = await axios.get(ViewUserBookingHistory(booking._id), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data?.success && response.data?.data) {
        // Navigate to booking details page (to be created)
        router.push(`/bookings/${booking._id}`);
      } else {
        // Fallback: navigate with basic booking data
        router.push(`/bookings/${booking._id}`);
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      // Still navigate to details page with available data
      router.push(`/bookings/${booking._id}`);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'booked': return 'bg-green-500';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getApartmentName = (booking: Booking): string => {
    return booking.propertyDetails?.name || 
           booking.apartment?.name || 
           booking.propertyName || 
           booking.apartmentName || 
           'Apartment Booking';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex items-center justify-center`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className="p-3 sm:p-4 lg:p-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Booking History</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">View all your past and upcoming bookings</p>
            </div>
            <button
              onClick={fetchBookings}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={`text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Bookings List */}
          {bookings.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
                <Calendar size={32} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-2">No Bookings Yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-8 max-w-md mx-auto">
                Start exploring apartments and make your first booking to see your history here.
              </p>
              <button
                onClick={() => router.push('/apartments')}
                className="px-6 py-3 bg-primary text-black rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg"
              >
                Explore Apartments
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {bookings.map((booking) => {
                const amount = booking.amount || booking.pricing?.sellingPrice || 0;
                const created_at = booking.created_at || booking.createdAt;
                const apartmentName = getApartmentName(booking);

                return (
                  <button
                    key={booking._id}
                    onClick={() => handleBookingClick(booking)}
                    className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow text-left p-4 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Left side - Apartment details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 truncate">
                          {apartmentName}
                        </h3>
                        
                        <div className="flex items-center text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">
                          <Calendar size={16} className="mr-2 flex-shrink-0" />
                          <span>
                            {format(new Date(booking.checkInDate), 'MMM dd')} - {format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        
                        {created_at && (
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
                            Booked on {format(new Date(created_at), 'MMM dd, yyyy')}
                          </p>
                        )}
                        
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${getStatusColor(booking.status)}`}>
                          <span className="text-white text-xs sm:text-sm font-semibold capitalize">
                            {booking.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Right side - Price and arrow */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start gap-2 sm:gap-0">
                        <div className="text-right">
                          <p className="text-xl sm:text-2xl font-bold text-primary">
                            ₦{numberWithCommas(amount)}
                          </p>
                        </div>
                        <ChevronRight size={20} className="text-gray-400 dark:text-gray-500 sm:mt-2" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

