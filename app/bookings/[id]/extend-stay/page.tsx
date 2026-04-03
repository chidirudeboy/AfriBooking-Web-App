'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import {
  ViewUserBookingHistory,
  getAvailableDates,
  extendBookingPreview,
  requestExtension,
  getExtensionRequest,
  extendBooking,
  verifyPaymentByReference,
} from '@/lib/endpoints';
import { numberWithCommas } from '@/lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface BookingDetails {
  _id: string;
  id?: string;
  status: string;
  checkInDate?: string;
  checkOutDate?: string;
  start_date?: string;
  end_date?: string;
  extendEligible?: boolean;
  propertyId?: string;
  propertyDetails?: {
    _id?: string;
    name?: string;
  };
  property?: {
    _id?: string;
    name?: string;
  };
  apartment?: {
    _id?: string;
    name?: string;
  };
  propertyName?: string;
  apartmentName?: string;
}

interface ExtensionRequest {
  _id: string;
  status: 'pending' | 'approved' | 'declined' | 'expired' | string;
  amountInNaira?: number;
  extraNights?: number;
  requestedCheckOutDate?: string;
  expiresAt?: string;
}

export default function ExtendStayPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDates, setLoadingDates] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [newCheckOutDate, setNewCheckOutDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [extensionRequest, setExtensionRequest] = useState<ExtensionRequest | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);

  const bookingId = (booking?._id || booking?.id || params.id) as string;
  const propertyId =
    booking?.propertyId ||
    booking?.propertyDetails?._id ||
    booking?.property?._id ||
    booking?.apartment?._id;

  const currentCheckOut = useMemo(() => {
    const dateStr = booking?.checkOutDate || booking?.end_date;
    return dateStr ? new Date(dateStr) : null;
  }, [booking]);

  const minDate = useMemo(() => {
    if (!currentCheckOut) return null;
    return addDays(new Date(currentCheckOut), 1);
  }, [currentCheckOut]);

  const maxMonth = useMemo(() => {
    if (!currentCheckOut) return null;
    return startOfMonth(addMonths(new Date(currentCheckOut), 6));
  }, [currentCheckOut]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchBookingDetails();
  }, [user, router, params.id]);

  useEffect(() => {
    if (propertyId && minDate) {
      fetchAvailableDates();
    }
  }, [propertyId, minDate]);

  useEffect(() => {
    if (bookingId) {
      fetchExtensionRequest();
    }
  }, [bookingId]);

  useEffect(() => {
    if (!extensionRequest?.expiresAt || extensionRequest.status !== 'approved') {
      setCountdown(null);
      return;
    }
    const update = () => {
      const diffMs = new Date(extensionRequest.expiresAt as string).getTime() - Date.now();
      if (diffMs <= 0) {
        setCountdown('Expired');
        return;
      }
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setCountdown(`${hours}h ${minutes}m left`);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [extensionRequest?.expiresAt, extensionRequest?.status]);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      const userObj = JSON.parse(userData);
      return userObj?.accessToken || userObj?.token;
    } catch {
      return null;
    }
  };

  const fetchBookingDetails = async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      const authToken = getAuthToken();
      const response = await axios.get(ViewUserBookingHistory(params.id as string), {
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : '',
          'Content-Type': 'application/json',
        },
      });
      if (response.data?.success && response.data?.data) {
        setBooking(response.data.data);
        const checkOut = response.data.data?.checkOutDate || response.data.data?.end_date;
        if (checkOut) {
          setCurrentMonth(startOfMonth(addDays(new Date(checkOut), 1)));
        }
      } else {
        toast.error('Failed to load booking details');
        router.push('/bookings');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error('Failed to load booking details');
      router.push('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDates = async () => {
    if (!propertyId || !minDate) return;
    try {
      setLoadingDates(true);
      const authToken = getAuthToken();
      const startDate = format(minDate, 'yyyy-MM-dd');
      const endDate = format(addMonths(minDate, 6), 'yyyy-MM-dd');
      const response = await fetch(getAvailableDates(propertyId, startDate, endDate), {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data?.success) return;

      const rawUnavailable = data?.data?.unavailableDates || [];
      const booked = rawUnavailable.flatMap((range: any) =>
        eachDayOfInterval({
          start: new Date(range.start),
          end: new Date(range.end),
        }).map((d) => format(d, 'yyyy-MM-dd'))
      );
      const allDates = eachDayOfInterval({
        start: new Date(data.data.dateRange.start),
        end: new Date(data.data.dateRange.end),
      }).map((d) => format(d, 'yyyy-MM-dd'));

      const bookedSet = new Set(booked);
      const available = allDates.filter((d) => !bookedSet.has(d));
      setAvailableDates(available);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoadingDates(false);
    }
  };

  const fetchExtensionRequest = async () => {
    if (!bookingId) return;
    try {
      const authToken = getAuthToken();
      const response = await axios.get(getExtensionRequest(bookingId), {
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : '',
          'Content-Type': 'application/json',
        },
      });
      if (response.data?.success) {
        setExtensionRequest(response.data.data);
      }
    } catch {
      // ignore
    }
  };

  const isDateDisabled = (date: Date) => {
    if (!minDate) return true;
    const dateStr = format(date, 'yyyy-MM-dd');
    if (!isSameMonth(date, currentMonth)) return true;
    if (isBefore(date, minDate)) return true;
    if (availableDates.length && !availableDates.includes(dateStr)) return true;
    if (extensionRequest?.status === 'pending' || extensionRequest?.status === 'approved') return true;
    if (booking?.extendEligible === false) return true;
    return false;
  };

  const handleSelectDate = (date: Date) => {
    if (isDateDisabled(date)) return;
    setNewCheckOutDate(date);
    setPreview(null);
  };

  const handlePreview = async () => {
    if (!bookingId || !newCheckOutDate) {
      toast.error('Please select a new check-out date.');
      return;
    }
    setPreviewLoading(true);
    setPreview(null);
    try {
      const authToken = getAuthToken();
      const url = extendBookingPreview(bookingId, format(newCheckOutDate, 'yyyy-MM-dd'));
      const response = await axios.get(url, {
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : '',
          'Content-Type': 'application/json',
        },
      });
      if (response.data?.success) {
        setPreview(response.data.data);
      } else {
        toast.error(response.data?.message || 'Failed to get extension preview.');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to get extension preview.';
      toast.error(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRequestExtension = async () => {
    if (!bookingId || !newCheckOutDate) {
      toast.error('Please select a new check-out date.');
      return;
    }
    if (booking?.extendEligible === false) {
      toast.error('This booking is no longer eligible for extension.');
      return;
    }
    if (extensionRequest?.status === 'pending' || extensionRequest?.status === 'approved') {
      toast.error('You already have an active extension request.');
      return;
    }
    try {
      const authToken = getAuthToken();
      const response = await axios.post(
        requestExtension(bookingId),
        { newCheckOutDate: format(newCheckOutDate, 'yyyy-MM-dd') },
        {
          headers: {
            Authorization: authToken ? `Bearer ${authToken}` : '',
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data?.success) {
        setExtensionRequest(response.data.data);
        toast.success('Extension request sent for approval.');
      } else {
        toast.error(response.data?.message || 'Failed to request extension.');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to request extension.';
      toast.error(message);
    }
  };

  const handleInitiatePayment = async () => {
    if (!bookingId || !extensionRequest?._id) {
      toast.error('No approved extension request found.');
      return;
    }
    if (extensionRequest.status !== 'approved') {
      toast.error('Extension request is not approved yet.');
      return;
    }
    try {
      const authToken = getAuthToken();
      const response = await axios.post(
        extendBooking(bookingId),
        { requestId: extensionRequest._id, expectedAmountNaira: extensionRequest.amountInNaira },
        {
          headers: {
            Authorization: authToken ? `Bearer ${authToken}` : '',
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data?.success && response.data?.data?.authorizationUrl) {
        setPaymentUrl(response.data.data.authorizationUrl);
        setPaymentReference(response.data.data.reference);
        setShowPaymentModal(true);
      } else {
        toast.error(response.data?.message || 'Failed to initiate extension payment.');
      }
    } catch (error: any) {
      if (error?.response?.status === 409 && error?.response?.data?.data?.amount) {
        const updated = error.response.data.data;
        setExtensionRequest((prev) => ({
          ...(prev || ({} as ExtensionRequest)),
          amountInNaira: updated.amount,
          extraNights: updated.extraNights,
          requestedCheckOutDate: updated.newCheckOutDate,
        }));
        toast.error('Pricing updated. Please review the new amount.');
        return;
      }
      const message = error?.response?.data?.message || 'Failed to initiate extension payment.';
      toast.error(message);
    }
  };

  const handleVerifyPayment = async () => {
    if (!paymentReference) {
      toast.error('Missing payment reference. Please contact support.');
      return;
    }
    setVerifyingPayment(true);
    try {
      const authToken = getAuthToken();
      const response = await axios.post(
        verifyPaymentByReference(paymentReference),
        {},
        {
          headers: {
            Authorization: authToken ? `Bearer ${authToken}` : '',
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data?.success) {
        toast.success('Payment verified. Updating your booking.');
        setShowPaymentModal(false);
        router.push(`/bookings/${bookingId}`);
      } else {
        toast.error(response.data?.message || 'Payment verification failed.');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Payment verification failed.';
      toast.error(message);
    } finally {
      setVerifyingPayment(false);
    }
  };

  const monthDays = useMemo(() => {
    if (!currentMonth) return [];
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

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

  if (!booking || !currentCheckOut || !minDate) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} p-6`}>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300">Missing booking information. Please return to your booking.</p>
          </div>
        </div>
      </div>
    );
  }

  const requestStatus = extensionRequest?.status;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className="p-3 sm:p-4 lg:p-8">
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft size={20} />
              <span className="text-sm sm:text-base">Back</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Extend Stay</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {booking.propertyDetails?.name || booking.propertyName || booking.apartmentName || 'Your booking'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={18} className="text-primary" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select New Check-out</h2>
                </div>

                {booking.extendEligible === false && (
                  <div className="mb-3 text-sm text-red-600">
                    This booking is no longer eligible for extension. Please create a new booking.
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      const prev = addMonths(currentMonth, -1);
                      if (minDate && isBefore(prev, startOfMonth(minDate))) return;
                      setCurrentMonth(prev);
                    }}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    disabled={minDate ? isBefore(addMonths(currentMonth, -1), startOfMonth(minDate)) : false}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                  </div>
                  <button
                    onClick={() => {
                      const next = addMonths(currentMonth, 1);
                      if (maxMonth && isBefore(maxMonth, next)) return;
                      setCurrentMonth(next);
                    }}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    disabled={maxMonth ? isBefore(maxMonth, addMonths(currentMonth, 1)) : false}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-xs mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center font-medium text-gray-600 dark:text-gray-400 py-1">
                      {day}
                    </div>
                  ))}
                  {monthDays.map((date) => {
                    const disabled = isDateDisabled(date);
                    const isSelected = newCheckOutDate && isSameDay(date, newCheckOutDate);
                    const isCurrent = isSameMonth(date, currentMonth);
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleSelectDate(date)}
                        disabled={disabled}
                        className={`aspect-square rounded-lg text-sm flex items-center justify-center transition-colors
                          ${!isCurrent ? 'text-gray-300 dark:text-gray-600' : ''}
                          ${isSelected ? 'bg-primary text-black font-semibold' : ''}
                          ${disabled && !isSelected ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                        `}
                      >
                        {format(date, 'd')}
                      </button>
                    );
                  })}
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Selected: {newCheckOutDate ? format(newCheckOutDate, 'MMM dd, yyyy') : 'None'}
                </div>

                <button
                  onClick={handlePreview}
                  disabled={previewLoading || !newCheckOutDate || booking.extendEligible === false || requestStatus === 'pending' || requestStatus === 'approved'}
                  className="w-full bg-primary text-black py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {previewLoading ? 'Loading preview...' : 'Get Extension Preview'}
                </button>

                {loadingDates && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Checking availability...</div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Caution fee will not be charged again for extension.
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Booking</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Current check-out</span>
                    <span className="font-medium text-gray-900 dark:text-white">{format(new Date(currentCheckOut), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>

              {(preview || extensionRequest) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Extension Summary</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Extra nights</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {extensionRequest?.extraNights ?? preview?.extraNights ?? '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">New check-out</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {format(
                          new Date(extensionRequest?.requestedCheckOutDate || preview?.newCheckOutDate || new Date()),
                          'MMM dd, yyyy'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount to pay</span>
                      <span className="font-semibold text-primary">
                        ₦{numberWithCommas(extensionRequest?.amountInNaira || preview?.amountInNaira || 0)}
                      </span>
                    </div>
                  </div>

                  {requestStatus === 'pending' && (
                    <div className="mt-3 text-sm text-yellow-600">Waiting for agent approval.</div>
                  )}
                  {requestStatus === 'declined' && (
                    <div className="mt-3 text-sm text-red-600">Extension request declined. Please try new dates.</div>
                  )}
                  {requestStatus === 'expired' && (
                    <div className="mt-3 text-sm text-red-600">Extension approval expired. Please submit a new request.</div>
                  )}
                  {requestStatus === 'approved' && (
                    <>
                      <button
                        onClick={handleInitiatePayment}
                        className="w-full mt-4 bg-primary text-black py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                      >
                        Pay to Extend
                      </button>
                      {countdown && (
                        <div className="mt-2 text-xs text-yellow-600">Approval expires in {countdown}.</div>
                      )}
                    </>
                  )}
                  {!requestStatus && preview && (
                    <button
                      onClick={handleRequestExtension}
                      className="w-full mt-4 bg-primary text-black py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                      Request Extension
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showPaymentModal && paymentUrl && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowPaymentModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] max-w-3xl h-[80vh] sm:h-[75vh] md:h-[70vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col">
            <div className="flex justify-between items-center p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Complete Payment</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleVerifyPayment}
                  className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium px-2 py-1 flex items-center gap-1"
                  disabled={verifyingPayment}
                >
                  {verifyingPayment ? <Loader2 size={14} className="animate-spin" /> : 'Payment Done?'}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <iframe src={paymentUrl} className="w-full h-full border-0" title="Payment" allow="payment" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
