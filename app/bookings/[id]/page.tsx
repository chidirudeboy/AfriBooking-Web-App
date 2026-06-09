'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { ViewUserBookingHistory, getChatByBooking, createChatForBooking, getAllNotification } from '@/lib/endpoints';
import { numberWithCommas } from '@/lib/utils';
import axios from 'axios';
import { ArrowLeft, Home, Calendar, Home as HomeIcon, DollarSign, Info, History, MessageSquare, Eye, EyeOff, Copy, Key, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';

interface BookingDetails {
  _id: string;
  id?: string;
  status: string;
  amount?: number;
  totalAmount?: number;
  pricing?: {
    sellingPrice?: number;
  };
  created_at?: string;
  createdAt?: string;
  checkInDate: string;
  checkOutDate: string;
  start_date?: string;
  end_date?: string;
  propertyDetails?: {
    name?: string;
    address?: string;
  };
  apartment?: {
    name?: string;
  };
  propertyName?: string;
  apartmentName?: string;
  cautionFee?: number;
  guests?: number;
  reservationType?: string;
  customerInfo?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export default function BookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [releaseCode, setReleaseCode] = useState<string | null>(null);
  const [showReleaseCode, setShowReleaseCode] = useState(false);
  const [releaseCodeModalOpen, setReleaseCodeModalOpen] = useState(false);
  const [releaseCodeAcknowledged, setReleaseCodeAcknowledged] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchBookingDetails();
  }, [user, router, params.id]);

  const extractReleaseCode = (notification: any): string | null => {
    if (notification.releaseCode) return notification.releaseCode;
    if (notification.metadata?.releaseCode) return notification.metadata.releaseCode;
    try {
      const parsed = typeof notification.data === 'string'
        ? JSON.parse(notification.data)
        : (notification.data || {});
      if (parsed.releaseCode) return parsed.releaseCode;
      if (parsed.release_code) return parsed.release_code;
      if (parsed.code) return parsed.code;
    } catch { /* ignore */ }
    const body = notification.body || notification.message || '';
    const match = body.match(/release code(?: is|:)\s*([A-Za-z0-9-]+)/i);
    return match ? match[1] : null;
  };

  const fetchReleaseCodeFromNotifications = async (bookingId: string) => {
    try {
      let authToken = null;
      let userId = null;
      if (typeof window !== 'undefined') {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const userObj = JSON.parse(userData);
            authToken = userObj?.accessToken || userObj?.token;
            userId = userObj?.user?._id || userObj?._id || userObj?.id;
          }
        } catch { /* ignore */ }
      }
      if (!userId) return;
      const response = await axios.get(getAllNotification(userId), {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      });
      const notifications: any[] = response.data?.data || response.data?.notifications || [];
      for (const n of notifications) {
        try {
          const parsed = typeof n.data === 'string' ? JSON.parse(n.data) : (n.data || {});
          const nBookingId = parsed.bookingId || parsed.booking_id;
          if (nBookingId && nBookingId !== bookingId) continue;
        } catch { /* ignore */ }
        const code = extractReleaseCode(n);
        if (code) { setReleaseCode(code); break; }
      }
    } catch { /* ignore */ }
  };

  const fetchBookingDetails = async () => {
    if (!params.id) return;

    try {
      setLoading(true);

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

      const response = await axios.get(ViewUserBookingHistory(params.id as string), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data?.success && response.data?.data) {
        const bookingData = response.data.data;
        setBooking(bookingData);
        const statusesToCheck = ['booked', 'check-in', 'completed'];
        if (statusesToCheck.includes(bookingData.status?.toLowerCase())) {
          fetchReleaseCodeFromNotifications(bookingData._id || bookingData.id || params.id as string);
        }
      } else {
        toast.error('Failed to load booking details');
        router.push('/bookings');
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      toast.error('Failed to load booking details');
      router.push('/bookings');
    } finally {
      setLoading(false);
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

  const getPropertyName = (): string => {
    if (!booking) return 'Apartment Booking';
    return booking.propertyDetails?.name || 
           booking.apartment?.name || 
           booking.propertyName || 
           booking.apartmentName || 
           'Apartment Booking';
  };

  const getPropertyAddress = (): string => {
    if (!booking) return 'Address not available';
    return booking.propertyDetails?.address || 'Address not available';
  };

  const handleChatClick = async () => {
    const bookingId = booking?._id || booking?.id;
    if (!bookingId) return;

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

      // Try to get existing chat first
      try {
        const chatResponse = await axios.get(getChatByBooking(bookingId), {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (chatResponse.data?.success && chatResponse.data?.data?._id) {
          router.push(`/messages/${chatResponse.data.data._id}`);
          return;
        }
      } catch (error: any) {
        // Chat doesn't exist, create one
        if (error.response?.status === 404) {
          try {
            const createResponse = await axios.post(
              createChatForBooking,
              { bookingId },
              {
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (createResponse.data?.success && createResponse.data?.data?._id) {
              router.push(`/messages/${createResponse.data.data._id}`);
            } else {
              toast.error('Failed to create chat');
            }
          } catch (createError: any) {
            console.error('Error creating chat:', createError);
            toast.error(createError.response?.data?.message || 'Failed to create chat');
          }
        } else {
          console.error('Error fetching chat:', error);
          toast.error('Failed to access chat');
        }
      }
    } catch (error: any) {
      console.error('Error handling chat:', error);
      toast.error('Failed to access chat');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex items-center justify-center`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const checkInDate = booking.checkInDate || booking.start_date;
  const checkOutDate = booking.checkOutDate || booking.end_date;
  const duration = checkInDate && checkOutDate 
    ? differenceInDays(new Date(checkOutDate), new Date(checkInDate))
    : 0;
  const totalAmount = booking.amount || booking.pricing?.sellingPrice || booking.totalAmount || 0;
  const bookingId = booking._id || booking.id || '';
  const createdDate = booking.created_at || booking.createdAt;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className="p-3 sm:p-4 lg:p-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft size={20} />
              <span className="text-sm sm:text-base">Back</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Booking Receipt</h1>
          </div>

          {/* Receipt Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {/* Status Badge */}
            <div className="bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${getStatusColor(booking.status)}`}>
                  <span className="text-white text-sm font-semibold uppercase">
                    {booking.status}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Booking ID: {bookingId.slice(-8)}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              {/* Title */}
              <div className="text-center mb-6 sm:mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmation</h2>
                {createdDate && (
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Booked on {format(new Date(createdDate), 'MMM dd, yyyy')}
                  </p>
                )}
              </div>

              {/* Property Information */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <HomeIcon size={20} className="text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Property Information</h3>
                </div>
                <div className="pl-8 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <span className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Property:</span>
                    <span className="text-sm sm:text-base text-gray-900 dark:text-white">{getPropertyName()}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <span className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Address:</span>
                    <span className="text-sm sm:text-base text-gray-900 dark:text-white text-right">{getPropertyAddress()}</span>
                  </div>
                </div>
              </div>

              {/* Stay Details */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={20} className="text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stay Details</h3>
                </div>
                <div className="pl-8 space-y-3">
                  {checkInDate && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                      <span className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Check-in:</span>
                      <span className="text-sm sm:text-base text-gray-900 dark:text-white">
                        {format(new Date(checkInDate), 'EEE, MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  {checkOutDate && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                      <span className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Check-out:</span>
                      <span className="text-sm sm:text-base text-gray-900 dark:text-white">
                        {format(new Date(checkOutDate), 'EEE, MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  {duration > 0 && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                      <span className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className="text-sm sm:text-base text-gray-900 dark:text-white">
                        {duration} {duration === 1 ? 'night' : 'nights'}
                      </span>
                    </div>
                  )}
                  {booking.guests && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                      <span className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Guests:</span>
                      <span className="text-sm sm:text-base text-gray-900 dark:text-white">
                        {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              {totalAmount > 0 && (
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={20} className="text-primary" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Summary</h3>
                </div>
                <div className="pl-8 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <span className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <span className="text-lg sm:text-xl font-bold text-primary">
                      ₦{numberWithCommas(totalAmount)}
                    </span>
                  </div>
                  {booking.cautionFee && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                      <span className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Caution Fee:</span>
                      <span className="text-sm sm:text-base text-gray-900 dark:text-white">
                        ₦{numberWithCommas(booking.cautionFee)}
                      </span>
                    </div>
                  )}
                  </div>
                </div>
              )}

              {/* Important Note */}
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg mb-6 sm:mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={18} className="text-red-600" />
                  <h4 className="text-sm sm:text-base font-semibold text-red-900">Important Note</h4>
                </div>
                <p className="text-xs sm:text-sm text-red-700">
                  Please keep this receipt for your records. Contact support for any inquiries regarding your booking.
                </p>
              </div>

              {/* Release Code Section */}
              {['booked', 'check-in', 'completed'].includes(booking.status?.toLowerCase()) && (
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Key size={20} className="text-primary" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Release Code</h3>
                    <span className={`ml-auto px-2 py-1 rounded-full text-xs font-semibold ${
                      releaseCode
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {releaseCode ? 'Available' : 'Not sent yet'}
                    </span>
                  </div>
                  {releaseCode ? (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                      <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                        Share this code with the property agent to confirm your check-out and release your payout.
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-600 rounded-lg px-4 py-3 font-mono text-base text-gray-900 dark:text-white tracking-widest text-center">
                          {showReleaseCode ? releaseCode : '••••••••'}
                        </div>
                        <button
                          onClick={() => {
                            if (!releaseCodeAcknowledged) {
                              setReleaseCodeModalOpen(true);
                            } else {
                              setShowReleaseCode(prev => !prev);
                            }
                          }}
                          className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                          title={showReleaseCode ? 'Hide code' : 'Reveal code'}
                        >
                          {showReleaseCode
                            ? <EyeOff size={18} className="text-amber-700 dark:text-amber-400" />
                            : <Eye size={18} className="text-amber-700 dark:text-amber-400" />
                          }
                        </button>
                        {showReleaseCode && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(releaseCode);
                              toast.success('Release code copied!');
                            }}
                            className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                            title="Copy code"
                          >
                            <Copy size={18} className="text-green-700 dark:text-green-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 pl-1">
                      Your release code will appear here once the property agent sends it.
                    </p>
                  )}
                </div>
              )}

              {/* Release Code Acknowledgment Modal */}
              {releaseCodeModalOpen && (
                <>
                  <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setReleaseCodeModalOpen(false)} />
                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Important Notice</h3>
                      <button onClick={() => setReleaseCodeModalOpen(false)}>
                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        <strong>Warning:</strong> Only share this release code with the property agent at the time of check-out. Do not share it before your check-out date or with anyone else. Sharing it early may result in your payout being released before you leave the property.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setReleaseCodeAcknowledged(true);
                        setShowReleaseCode(true);
                        setReleaseCodeModalOpen(false);
                      }}
                      className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
                    >
                      I Understand, Show Code
                    </button>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleChatClick}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare size={20} />
                  <span>Message Owner</span>
                </button>
                <button
                  onClick={() => router.push(`/bookings/${bookingId}/extend-stay`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-black py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  <Calendar size={20} />
                  <span>Extend Stay</span>
                </button>
                <button
                  onClick={() => router.push('/apartments')}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-black py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  <Home size={20} />
                  <span>Back to Home</span>
                </button>
                <button
                  onClick={() => router.push('/bookings')}
                  className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <History size={20} />
                  <span>View All Bookings</span>
                </button>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Thank you for choosing Africartz!
                </p>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  We hope you have a wonderful stay.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
