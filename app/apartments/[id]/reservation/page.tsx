'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { TApartments } from '@/lib/types/airbnb';
import { getSingleApartmentUserDetails, getEveryApartments, sendReservation, getAvailableDates, sendInspection } from '@/lib/endpoints';
import { numberWithCommas } from '@/lib/utils';
import { usePrice } from '@/lib/utils/price';
import axios from 'axios';
import { 
  ArrowLeft, Calendar, MapPin, Bed, Bath, Users, Building2,
  CheckCircle, X, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, isAfter, addDays } from 'date-fns';

function ReservationRequestContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const apartmentId = params?.id as string;
  const reservationType = searchParams?.get('type') || 'normal';
  const selectedBedroomsParam = searchParams?.get('bedrooms');

  const [apartment, setApartment] = useState<TApartments | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDates, setLoadingDates] = useState(true);
  const [apartmentLoading, setApartmentLoading] = useState(true);
  
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(
    selectedBedroomsParam ? parseInt(selectedBedroomsParam) : null
  );
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionDate, setInspectionDate] = useState<Date>(new Date());
  const [showInspectionDatePicker, setShowInspectionDatePicker] = useState(false);
  const [inspectionLoading, setInspectionLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (apartmentId) {
      fetchApartmentDetails();
      fetchAvailableDates();
    }
  }, [user, router, apartmentId]);

  const fetchApartmentDetails = async () => {
    try {
      setApartmentLoading(true);
      
      let authToken = null;
      if (typeof window !== 'undefined') {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            authToken = user?.accessToken || user?.token;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }

      try {
        const response = await axios.get(`${getSingleApartmentUserDetails}?apartmentId=${apartmentId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          },
          timeout: 15000
        });

        if (response.data?.data || response.data?.apartment) {
          const apt = response.data?.data || response.data?.apartment;
          setApartment(apt);
          setApartmentLoading(false);
          return;
        }
      } catch (error) {
        console.log('Single apartment fetch failed, trying all apartments...');
      }

      const response = await axios.get(getEveryApartments, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        timeout: 15000
      });

      let apartments: TApartments[] = [];
      if (response.data?.apartments && Array.isArray(response.data.apartments)) {
        apartments = response.data.apartments;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        apartments = response.data.data;
      } else if (Array.isArray(response.data)) {
        apartments = response.data;
      }

      const foundApartment = apartments.find(apt => apt._id === apartmentId);
      if (foundApartment) {
        setApartment(foundApartment);
      } else {
        toast.error('Apartment not found');
        router.push('/apartments');
      }
    } catch (error: any) {
      console.error('Error fetching apartment details:', error);
      toast.error(error.response?.data?.message || 'Failed to load apartment details');
    } finally {
      setApartmentLoading(false);
      setLoading(false);
    }
  };

  const fetchAvailableDates = async () => {
    if (!apartmentId || !user) return;

    try {
      setLoadingDates(true);
      let authToken = null;
      if (typeof window !== 'undefined') {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            authToken = user?.accessToken || user?.token;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }

      const startDate = format(new Date(), 'yyyy-MM-dd');
      const endDate = format(addMonths(new Date(), 4), 'yyyy-MM-dd');
      const url = getAvailableDates(apartmentId, startDate, endDate);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const rawUnavailable = data?.data?.unavailableDates || [];
          const booked = rawUnavailable.flatMap((range: any) =>
            eachDayOfInterval({
              start: new Date(range.start),
              end: new Date(range.end),
            }).map((d) => format(d, 'yyyy-MM-dd'))
          );
          setBookedDates(booked);

          const allDates = eachDayOfInterval({
            start: new Date(data.data.dateRange.start),
            end: new Date(data.data.dateRange.end),
          }).map((d) => format(d, 'yyyy-MM-dd'));

          const bookedSet = new Set(booked);
          const available = allDates.filter((d) => !bookedSet.has(d));
          setAvailableDates(available);
        }
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
    } finally {
      setLoadingDates(false);
    }
  };

  const isDateAvailable = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableDates.includes(dateStr);
  };

  const isDateBooked = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookedDates.includes(dateStr);
  };

  const handleCheckInSelect = (date: Date) => {
    setCheckInDate(date);
    setShowCheckInPicker(false);
    
    // Reset check-out if it's before new check-in
    if (checkOutDate && isBefore(checkOutDate, date)) {
      setCheckOutDate(null);
    }
  };

  const handleCheckOutSelect = (date: Date) => {
    if (checkInDate && isBefore(date, checkInDate)) {
      toast.error('Check-out date must be after check-in date');
      return;
    }
    setCheckOutDate(date);
    setShowCheckOutPicker(false);
  };

  const calculateNights = (): number => {
    if (!checkInDate || !checkOutDate) return 0;
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotalPrice = (): number => {
    if (!apartment) return 0;
    const nights = calculateNights();
    const pricePerNight = usePrice(apartment, reservationType as any, selectedBedrooms);
    return pricePerNight * nights;
  };

  const scheduleInspection = async () => {
    if (inspectionLoading) return;

    setInspectionLoading(true);

    try {
      let authToken = null;
      if (typeof window !== 'undefined') {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            authToken = user?.accessToken || user?.token;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }

      const requestBody: any = {
        propertyId: apartmentId,
        inspectionDate: inspectionDate.toISOString(),
      };

      // Add selectedBedrooms if provided
      if (selectedBedrooms !== null && selectedBedrooms !== undefined) {
        requestBody.selectedBedrooms = selectedBedrooms;
      }

      console.log('Sending inspection request:', requestBody);

      const response = await axios.post(sendInspection, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
      });

      console.log('Inspection response:', response.data);

      if (response.data?.success) {
        toast.success('Inspection request sent successfully! You will get a call from us shortly.');
        setShowInspectionModal(false);
        
        // Navigate back to apartment details after inspection request
        router.push(`/apartments/${apartmentId}`);
      } else {
        toast.error(response.data?.message || 'Failed to request inspection');
      }
    } catch (error: any) {
      console.error('Inspection request error:', error);

      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(error.response.data?.message || 'Failed to request inspection');
      } else {
        toast.error('Network error occurred');
      }
    } finally {
      setInspectionLoading(false);
    }
  };

  const handleSkipInspection = () => {
    setShowInspectionModal(false);
    router.push(`/apartments/${apartmentId}`);
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!checkInDate || !checkOutDate) {
      toast.error('Please select both check-in and check-out dates');
      return;
    }

    if (isBefore(checkOutDate, checkInDate)) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    // Validate dates are available
    const checkInStr = format(checkInDate, 'yyyy-MM-dd');
    const checkOutStr = format(checkOutDate, 'yyyy-MM-dd');
    
    if (!availableDates.includes(checkInStr) || !availableDates.includes(checkOutStr)) {
      toast.error('Selected dates are not available');
      return;
    }

    try {
      setSubmitting(true);
      
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

      const requestBody: any = {
        userId: user.user?._id || user._id,
        apartmentId: apartmentId,
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        reservationType: reservationType,
      };

      if (selectedBedrooms !== null && selectedBedrooms !== undefined) {
        requestBody.selectedBedrooms = selectedBedrooms;
      }

      const response = await axios.post(sendReservation, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
      });

      if (response.data?.success) {
        // Extract reservationId from the nested response (matching mobile app structure)
        const reservationId = response.data?.data?.data?.reservationId || 
                             response.data?.data?.reservationId || 
                             response.data?.data?._id || 
                             response.data?.reservationId;
        
        console.log('Reservation response:', JSON.stringify(response.data, null, 2));
        console.log('Extracted reservationId:', reservationId);
        
        // Check if reservationId is present in the response
        if (!reservationId) {
          console.error('Reservation ID is missing in the response.');
          toast.error('Reservation created but ID not found. Please contact support.');
          return;
        }
        
        // Store reservation details in localStorage (matching mobile app behavior)
        const reservationDetails = {
          reservationId: reservationId,
          apartmentId: apartmentId,
          status: 'pending',
          checkInDate: checkInStr,
          checkOutDate: checkOutStr,
          reservationType: reservationType,
          ...(selectedBedrooms !== null && { selectedBedrooms })
        };

        console.log('Storing reservation details:', reservationDetails);
        localStorage.setItem(`reservation_${apartmentId}`, JSON.stringify(reservationDetails));

        toast.success('You will receive a notification with the reservation status shortly.');
        
        // Show inspection modal after successful reservation
        setShowInspectionModal(true);
      } else {
        toast.error(response.data?.message || 'Failed to submit reservation request');
      }
    } catch (error: any) {
      console.error('Error submitting reservation:', error);
      toast.error(error.response?.data?.message || 'Failed to submit reservation request');
    } finally {
      setSubmitting(false);
    }
  };

  const { isCollapsed } = useSidebar();

  if (loading || apartmentLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex items-center justify-center`}>
          <div className="text-center">
            <p className="text-gray-500 text-lg">Apartment not found</p>
            <button
              onClick={() => router.push('/apartments')}
              className="mt-4 text-primary hover:underline"
            >
              Back to Apartments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nights = calculateNights();
  const totalPrice = calculateTotalPrice();
  const pricePerNight = usePrice(apartment, reservationType as any, selectedBedrooms);
  const imageUrl = apartment.media?.images?.[0] 
    ? (typeof apartment.media.images[0] === 'string' 
        ? apartment.media.images[0] 
        : apartment.media.images[0]?.uri || apartment.media.images[0]?.url || '')
    : 'https://via.placeholder.com/500x380';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-3 sm:mb-4 flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5 mr-2" />
            Back
          </button>

          {/* Apartment Summary Card */}
          <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-32 h-48 sm:h-32 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={imageUrl}
                  alt={apartment.apartmentName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {apartment.apartmentName}
                </h1>
                <div className="flex items-center text-sm sm:text-base text-gray-600 mb-3">
                  <MapPin size={16} className="mr-1 flex-shrink-0" />
                  <span className="break-words">{apartment.address}, {apartment.city}, {apartment.state}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Bed size={16} className="mr-1" />
                    <span>{apartment.bedrooms} Bed</span>
                  </div>
                  <div className="flex items-center">
                    <Bath size={16} className="mr-1" />
                    <span>{apartment.bathrooms} Bath</span>
                  </div>
                  <div className="flex items-center">
                    <Users size={16} className="mr-1" />
                    <span>{apartment.guests} Guests</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reservation Form */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Request Reservation</h2>

            {/* Date Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Check-in Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCheckInPicker(true)}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-left flex items-center justify-between ${
                      checkInDate
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <Calendar size={20} className="mr-2 text-gray-500" />
                      <span className={checkInDate ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                        {checkInDate ? format(checkInDate, 'MMM dd, yyyy') : 'Select check-in date'}
                      </span>
                    </div>
                  </button>
                  {showCheckInPicker && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowCheckInPicker(false)}
                      />
                      <div className="absolute z-50 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 w-full sm:w-auto min-w-[300px] max-w-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-gray-900">Select Check-in</h3>
                          <button
                            onClick={() => setShowCheckInPicker(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <div className="grid grid-cols-7 gap-1 text-xs min-w-[280px]">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <div key={day} className="text-center font-medium text-gray-600 py-2">
                                {day}
                              </div>
                            ))}
                            {eachDayOfInterval({
                              start: startOfMonth(new Date()),
                              end: endOfMonth(addMonths(new Date(), 3))
                            }).map((date) => {
                              const dateStr = format(date, 'yyyy-MM-dd');
                              const isAvailable = availableDates.includes(dateStr);
                              const isBooked = bookedDates.includes(dateStr);
                              const isPast = isBefore(date, new Date());
                              const isSelected = checkInDate && isSameDay(date, checkInDate);
                              const isDisabled = !isAvailable || isBooked || isPast;

                              return (
                                <button
                                  key={dateStr}
                                  onClick={() => !isDisabled && handleCheckInSelect(date)}
                                  disabled={isDisabled}
                                  className={`
                                    aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                                    ${isSelected
                                      ? 'bg-primary text-white font-semibold'
                                      : isDisabled
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }
                                  `}
                                >
                                  {format(date, 'd')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Check-out Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (!checkInDate) {
                        toast.error('Please select check-in date first');
                        return;
                      }
                      setShowCheckOutPicker(true);
                    }}
                    disabled={!checkInDate}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-left flex items-center justify-between ${
                      checkOutDate
                        ? 'border-primary bg-primary/5'
                        : checkInDate
                          ? 'border-gray-300 bg-white'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center">
                      <Calendar size={20} className="mr-2 text-gray-500" />
                      <span className={checkOutDate ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                        {checkOutDate ? format(checkOutDate, 'MMM dd, yyyy') : 'Select check-out date'}
                      </span>
                    </div>
                  </button>
                  {showCheckOutPicker && checkInDate && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowCheckOutPicker(false)}
                      />
                      <div className="absolute z-50 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 w-full sm:w-auto min-w-[300px] max-w-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-gray-900">Select Check-out</h3>
                          <button
                            onClick={() => setShowCheckOutPicker(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <div className="grid grid-cols-7 gap-1 text-xs min-w-[280px]">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <div key={day} className="text-center font-medium text-gray-600 py-2">
                                {day}
                              </div>
                            ))}
                            {eachDayOfInterval({
                              start: startOfMonth(new Date()),
                              end: endOfMonth(addMonths(new Date(), 3))
                            }).map((date) => {
                              const dateStr = format(date, 'yyyy-MM-dd');
                              const isAvailable = availableDates.includes(dateStr);
                              const isBooked = bookedDates.includes(dateStr);
                              const isPast = isBefore(date, new Date());
                              const isBeforeCheckIn = checkInDate && isBefore(date, addDays(checkInDate, 1));
                              const isSelected = checkOutDate && isSameDay(date, checkOutDate);
                              const isDisabled = !isAvailable || isBooked || isPast || isBeforeCheckIn;

                              return (
                                <button
                                  key={dateStr}
                                  onClick={() => !isDisabled && handleCheckOutSelect(date)}
                                  disabled={isDisabled}
                                  className={`
                                    aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                                    ${isSelected
                                      ? 'bg-primary text-white font-semibold'
                                      : isDisabled
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }
                                  `}
                                >
                                  {format(date, 'd')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Price Summary */}
            {checkInDate && checkOutDate && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Price Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per night</span>
                    <span className="font-medium text-gray-900">₦{numberWithCommas(pricePerNight)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of nights</span>
                    <span className="font-medium text-gray-900">{nights}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-lg text-primary">₦{numberWithCommas(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!checkInDate || !checkOutDate || submitting}
              className="w-full bg-gradient-to-r from-primary-light to-primary-dark text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Reservation Request'}
            </button>

            {loadingDates && (
              <p className="text-xs text-gray-500 mt-2 text-center">Loading available dates...</p>
            )}
          </div>
        </main>
      </div>

      {/* Inspection Modal */}
      {showInspectionModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={handleSkipInspection}
          />
          <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Request Inspection</h2>
                <button
                  onClick={handleSkipInspection}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-gray-600 mb-6 text-base">
                Would you like to schedule an inspection for this apartment?
              </p>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Inspection Date
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowInspectionDatePicker(!showInspectionDatePicker)}
                    disabled={inspectionLoading}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-left flex items-center justify-between bg-white hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center">
                      <Calendar size={20} className="mr-2 text-gray-500" />
                      <span className="text-gray-900 font-medium">
                        {format(inspectionDate, 'EEEE, MMMM dd, yyyy')}
                      </span>
                    </div>
                  </button>
                  
                  {showInspectionDatePicker && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowInspectionDatePicker(false)}
                      />
                      <div className="absolute z-50 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 w-full sm:w-auto min-w-[300px]">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-gray-900">Select Date</h3>
                          <button
                            onClick={() => setShowInspectionDatePicker(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <div className="grid grid-cols-7 gap-1 text-xs min-w-[280px]">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <div key={day} className="text-center font-medium text-gray-600 py-2">
                                {day}
                              </div>
                            ))}
                            {eachDayOfInterval({
                              start: startOfMonth(new Date()),
                              end: endOfMonth(addMonths(new Date(), 3))
                            }).map((date) => {
                              const dateStr = format(date, 'yyyy-MM-dd');
                              const isPast = isBefore(date, new Date());
                              const isSelected = isSameDay(date, inspectionDate);
                              const isDisabled = isPast;

                              return (
                                <button
                                  key={dateStr}
                                  onClick={() => {
                                    if (!isDisabled) {
                                      setInspectionDate(date);
                                      setShowInspectionDatePicker(false);
                                    }
                                  }}
                                  disabled={isDisabled}
                                  className={`
                                    aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                                    ${isSelected
                                      ? 'bg-primary text-white font-semibold'
                                      : isDisabled
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }
                                  `}
                                >
                                  {format(date, 'd')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSkipInspection}
                  disabled={inspectionLoading}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skip
                </button>
                <button
                  onClick={scheduleInspection}
                  disabled={inspectionLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-light to-primary-dark text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {inspectionLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Scheduling...</span>
                    </div>
                  ) : (
                    'Schedule'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ReservationRequestPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    }>
      <ReservationRequestContent />
    </Suspense>
  );
}

