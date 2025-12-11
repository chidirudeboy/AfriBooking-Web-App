'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { TApartments } from '@/lib/types/airbnb';
import { getSingleApartmentUserDetails, getEveryApartments, paymentHistory } from '@/lib/endpoints';
import { numberWithCommas } from '@/lib/utils';
import { usePrice } from '@/lib/utils/price';
import axios from 'axios';
import { 
  ArrowLeft, Calendar, MapPin, Bed, Bath, Users, Building2,
  CheckCircle, X, AlertCircle, DollarSign, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function PaymentSummaryContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const apartmentId = params?.id as string;
  const reservationId = searchParams?.get('reservationId') || '';
  const selectedBedroomsParam = searchParams?.get('selectedBedrooms');
  const checkInDate = searchParams?.get('checkInDate') || '';
  const checkOutDate = searchParams?.get('checkOutDate') || '';
  const numberOfNightsParam = searchParams?.get('numberOfNights');

  const [apartment, setApartment] = useState<TApartments | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservationData, setReservationData] = useState<any>(null);
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(
    selectedBedroomsParam ? parseInt(selectedBedroomsParam) : null
  );

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (apartmentId) {
      fetchApartmentDetails();
    }
    if (reservationId) {
      fetchReservationData();
    }
  }, [user, router, apartmentId, reservationId]);

  const fetchApartmentDetails = async () => {
    try {
      setLoading(true);
      
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
          setLoading(false);
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
      setLoading(false);
    }
  };

  const fetchReservationData = async () => {
    if (!reservationId || !user) return;

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

      const response = await fetch(paymentHistory(reservationId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data) {
          setReservationData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching reservation data:', error);
    }
  };

  // Get dates - prioritize route params, fallback to reservation data
  const finalCheckInDate = useMemo(() => {
    return checkInDate || reservationData?.checkInDate || reservationData?.priceBreakdown?.checkInDate;
  }, [checkInDate, reservationData?.checkInDate, reservationData?.priceBreakdown?.checkInDate]);

  const finalCheckOutDate = useMemo(() => {
    return checkOutDate || reservationData?.checkOutDate || reservationData?.priceBreakdown?.checkOutDate;
  }, [checkOutDate, reservationData?.checkOutDate, reservationData?.priceBreakdown?.checkOutDate]);

  const nights = useMemo(() => {
    if (numberOfNightsParam) {
      return parseInt(numberOfNightsParam);
    }
    if (finalCheckInDate && finalCheckOutDate) {
      const checkIn = new Date(finalCheckInDate);
      const checkOut = new Date(finalCheckOutDate);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 1;
  }, [numberOfNightsParam, finalCheckInDate, finalCheckOutDate]);

  // Calculate prices
  const basePrice = useMemo(() => {
    if (!apartment) return 0;
    // Use reservation type from reservation data or default to 'normal'
    const reservationType = reservationData?.reservationType || 'normal';
    return usePrice(apartment, reservationType as any, selectedBedrooms);
  }, [apartment, reservationData?.reservationType, selectedBedrooms]);

  // Get seasonal pricing from API response
  const seasonalPricingInfo = useMemo(() => {
    if (reservationData?.priceBreakdown?.seasonalPricing?.applied) {
      const apiSeasonal = reservationData.priceBreakdown.seasonalPricing;
      if (apiSeasonal.nightsWithSeasonal > 0 && apiSeasonal.additionalFeePerNight > 0) {
        const totalFee = apiSeasonal.nightsWithSeasonal * apiSeasonal.additionalFeePerNight;
        return {
          totalAdditionalFee: totalFee,
          applicablePricing: [{
            name: apiSeasonal.name || 'Seasonal Pricing',
            additionalFee: apiSeasonal.additionalFeePerNight,
            nightsAffected: apiSeasonal.nightsWithSeasonal,
            totalFee: totalFee
          }]
        };
      }
    }
    return { totalAdditionalFee: 0, applicablePricing: [] };
  }, [reservationData?.priceBreakdown?.seasonalPricing]);

  // Get discount info from API response
  const discountInfo = useMemo(() => {
    if (reservationData?.priceBreakdown?.discount) {
      const apiDiscount = reservationData.priceBreakdown.discount;
      if (apiDiscount.percent > 0) {
        return {
          percent: apiDiscount.percent,
          amount: apiDiscount.amount || 0,
          source: apiDiscount.source
        };
      }
    }
    return null;
  }, [reservationData?.priceBreakdown?.discount]);

  const cautionFee = apartment?.cautionFee || 0;
  const subtotalBeforeDiscount = (basePrice * nights) + seasonalPricingInfo.totalAdditionalFee;
  const discountAmount = discountInfo?.amount || (discountInfo ? (subtotalBeforeDiscount * discountInfo.percent) / 100 : 0);
  const baseSubtotalAfterDiscount = (basePrice * nights) - discountAmount;
  const subtotal = baseSubtotalAfterDiscount + seasonalPricingInfo.totalAdditionalFee;
  const total = subtotal + cautionFee;

  // Get bedroom configuration name
  const bedroomConfigName = useMemo(() => {
    if (!selectedBedrooms || !apartment) {
      return `${apartment?.bedrooms || 0} Bedrooms (Full Apartment)`;
    }
    
    if (selectedBedrooms === apartment.bedrooms) {
      return `${selectedBedrooms} Bedrooms (Full Apartment)`;
    }
    
    return `${selectedBedrooms} Bedroom${selectedBedrooms > 1 ? 's' : ''}`;
  }, [selectedBedrooms, apartment]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'EEE, MMM dd, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  const handleProceedToPayment = () => {
    if (!apartment || !reservationId) {
      toast.error('Missing required information');
      return;
    }

    const params = new URLSearchParams();
    params.set('reservationId', reservationId);
    if (selectedBedrooms !== null) {
      params.set('selectedBedrooms', selectedBedrooms.toString());
    }
    if (finalCheckInDate) {
      params.set('checkInDate', finalCheckInDate);
    }
    if (finalCheckOutDate) {
      params.set('checkOutDate', finalCheckOutDate);
    }
    params.set('numberOfNights', nights.toString());
    
    router.push(`/apartments/${apartmentId}/book?${params.toString()}`);
  };

  const { isCollapsed } = useSidebar();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex items-center justify-center`}>
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">Apartment not found</p>
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

  const imageUrl = apartment.media?.images?.[0] 
    ? (typeof apartment.media.images[0] === 'string' 
        ? apartment.media.images[0] 
        : apartment.media.images[0]?.uri || apartment.media.images[0]?.url || '')
    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM4MCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-3 sm:mb-4 flex items-center text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5 mr-2" />
            Back
          </button>

          {/* Apartment Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {apartment.apartmentName}
                </h1>
                <div className="flex items-center text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3">
                  <MapPin size={16} className="mr-1 flex-shrink-0" />
                  <span className="break-words">{apartment.address}, {apartment.city}, {apartment.state}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
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

          {/* Payment Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Payment Summary</h2>

            {/* Booking Details */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar size={16} className="mr-2" />
                <span className="font-medium">Check-in:</span>
                <span className="ml-2">{formatDate(finalCheckInDate)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar size={16} className="mr-2" />
                <span className="font-medium">Check-out:</span>
                <span className="ml-2">{formatDate(finalCheckOutDate)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Building2 size={16} className="mr-2" />
                <span className="font-medium">Configuration:</span>
                <span className="ml-2">{bedroomConfigName}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar size={16} className="mr-2" />
                <span className="font-medium">Duration:</span>
                <span className="ml-2">{nights} {nights === 1 ? 'night' : 'nights'}</span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Price per night</span>
                <span className="font-medium text-gray-900 dark:text-white">₦{numberWithCommas(basePrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Number of nights</span>
                <span className="font-medium text-gray-900 dark:text-white">{nights}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">₦{numberWithCommas(basePrice * nights)}</span>
              </div>

              {/* Seasonal Pricing */}
              {seasonalPricingInfo.applicablePricing.length > 0 && (
                <>
                  {seasonalPricingInfo.applicablePricing.map((sp, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {sp.name} ({sp.nightsAffected} {sp.nightsAffected === 1 ? 'night' : 'nights'})
                      </span>
                      <span className="font-medium text-orange-600 dark:text-orange-400">+₦{numberWithCommas(sp.totalFee)}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Discount */}
              {discountInfo && discountInfo.percent > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Discount ({discountInfo.percent}%)
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">-₦{numberWithCommas(discountAmount)}</span>
                </div>
              )}

              {/* Caution Fee */}
              {cautionFee > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center">
                    <Shield size={14} className="mr-1" />
                    Caution Fee
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">₦{numberWithCommas(cautionFee)}</span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between pt-3 border-t-2 border-gray-300 dark:border-gray-600">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-primary">₦{numberWithCommas(total)}</span>
              </div>
            </div>
          </div>

          {/* Proceed Button */}
          <button
            onClick={handleProceedToPayment}
            className="w-full bg-gradient-to-r from-primary-light to-primary-dark text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:opacity-90 transition-opacity"
          >
            Proceed to Payment
          </button>
        </main>
      </div>
    </div>
  );
}

export default function PaymentSummaryPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    }>
      <PaymentSummaryContent />
    </Suspense>
  );
}

