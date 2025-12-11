'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { TApartments, TOptionalFees } from '@/lib/types/airbnb';
import { getEveryApartments, getSingleApartmentUserDetails, paymentHistory, cancelReservation } from '@/lib/endpoints';
import { numberWithCommas } from '@/lib/utils';
import { usePrice } from '@/lib/utils/price';
import axios from 'axios';
import { 
  MapPin, Bed, Bath, Users, ChevronLeft, ChevronRight, 
  CheckCircle, Copy, ArrowLeft, Calendar, Shield, Building2, Play
} from 'lucide-react';
import MediaModal from '@/components/MediaModal';
import toast from 'react-hot-toast';

export default function ApartmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const apartmentId = params?.id as string;

  const [apartment, setApartment] = useState<TApartments | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reservationType, setReservationType] = useState<string>('normal');
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showBedroomDropdown, setShowBedroomDropdown] = useState(false);
  const [reservationStatus, setReservationStatus] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [hasCheckedReservation, setHasCheckedReservation] = useState(false);
  const [acceptedReservationBedrooms, setAcceptedReservationBedrooms] = useState<number | null>(null);
  const [paymentHistoryData, setPaymentHistoryData] = useState<any>(null);
  const [isReservationPending, setIsReservationPending] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  useEffect(() => {
    // Allow viewing apartment details without login (matching mobile app behavior)
    if (apartmentId) {
      fetchApartmentDetails();
    }
  }, [apartmentId]);

  // Check reservation status
  useEffect(() => {
    if (apartmentId) {
      checkReservationStatus();
    }
  }, [apartmentId]);

  // Refetch reservation status when user logs in or reservationId is found
  useEffect(() => {
    if (user && reservationId && apartmentId) {
      console.log('🔄 User logged in, fetching current reservation status...');
      fetchCurrentReservationStatus(reservationId);
    } else if (user && !reservationId && apartmentId) {
      // Try to find reservationId if user is logged in but reservationId is missing
      const reservationKey = `reservation_${apartmentId}`;
      const reservationDetails = localStorage.getItem(reservationKey);
      if (reservationDetails) {
        const parsed = JSON.parse(reservationDetails);
        if (parsed.checkInDate && !parsed.reservationId) {
          console.log('🔄 Attempting to find missing reservationId...');
          findReservationIdFromAPI(apartmentId, parsed.checkInDate).then((foundId) => {
            if (foundId) {
              parsed.reservationId = foundId;
              localStorage.setItem(reservationKey, JSON.stringify(parsed));
              setReservationId(foundId);
              fetchCurrentReservationStatus(foundId);
            }
          });
        }
      }
    }
  }, [user, reservationId, apartmentId]);

  // Poll for status updates (similar to mobile app)
  useEffect(() => {
    if (!reservationId || !user) return;

    // Only poll if status is not stable
    const stableStates = ['declined', 'completed', 'cancelled'];
    if (reservationStatus && stableStates.includes(reservationStatus)) {
      return; // Don't poll for stable states
    }

    // Poll every 15 seconds (matching mobile app)
    const pollInterval = setInterval(() => {
      if (reservationId) {
        console.log('🔄 Polling for reservation status update...');
        fetchCurrentReservationStatus(reservationId);
      }
    }, 15000); // 15 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [reservationId, user, reservationStatus, apartmentId]);

  const checkReservationStatus = async () => {
    try {
      const reservationKey = `reservation_${apartmentId}`;
      const paymentKey = `payment_completed_${apartmentId}`;
      
      // Check if payment has been completed for this apartment
      const paymentCompleted = localStorage.getItem(paymentKey);
      
      if (paymentCompleted === 'true') {
        // Clear payment status and reservation data to allow new reservations
        localStorage.removeItem(paymentKey);
        localStorage.removeItem(reservationKey);
        
        // Reset all states
        setReservationStatus(null);
        setReservationId(null);
        setPaymentHistoryData(null);
        setIsReservationPending(false);
        setAcceptedReservationBedrooms(null);
        setHasCheckedReservation(true);
        return;
      }

      const reservationDetails = localStorage.getItem(reservationKey);
      
      if (reservationDetails) {
        const parsed = JSON.parse(reservationDetails);
        console.log('Retrieved reservation details:', parsed);
        
        // Store reservation status regardless of status
        setReservationStatus(parsed.status);
        updateReservationPendingState(parsed.status);
        console.log('Set reservation status to:', parsed.status);
        
        // If reservationId is missing, try to find it from user's reservations
        if (!parsed.reservationId && user && parsed.checkInDate) {
          console.log('⚠️ ReservationId missing, attempting to find it from API...');
          const foundReservationId = await findReservationIdFromAPI(apartmentId, parsed.checkInDate);
          if (foundReservationId) {
            parsed.reservationId = foundReservationId;
            // Update localStorage with the found reservationId
            localStorage.setItem(reservationKey, JSON.stringify(parsed));
            console.log('✅ Found and updated reservationId:', foundReservationId);
            setReservationId(foundReservationId);
            // Fetch status immediately after finding reservationId
            await fetchCurrentReservationStatus(foundReservationId);
          } else {
            console.warn('❌ Could not find reservationId from API');
          }
        } else {
          // Set reservationId
          setReservationId(parsed.reservationId);
          console.log('Set reservation ID to:', parsed.reservationId);
        }
        
        // If reservation is accepted, lock selectedBedrooms
        if (parsed.status === 'accepted' && parsed.selectedBedrooms !== undefined) {
          setAcceptedReservationBedrooms(parsed.selectedBedrooms);
          setSelectedBedrooms(parsed.selectedBedrooms);
          console.log('Locked selectedBedrooms to:', parsed.selectedBedrooms);
        }
        
        // Fetch current status from API to get the latest status (if reservationId exists)
        if (parsed.reservationId) {
          // Try to fetch even without user - will fail gracefully if no auth token
          await fetchCurrentReservationStatus(parsed.reservationId);
        } else {
          console.warn('⚠️ ReservationId is missing. Cannot fetch current status from API.');
        }
      } else {
        console.log('No reservation found in localStorage');
      }
      
      setHasCheckedReservation(true);
    } catch (error) {
      console.error('Error checking reservation status:', error);
      setHasCheckedReservation(true);
    }
  };

  const findReservationIdFromAPI = async (apartmentId: string, checkInDate: string): Promise<string | null> => {
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

      if (!authToken) {
        console.log('No auth token for finding reservationId');
        return null;
      }

      // Try to get user's booking history and find matching reservation
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      const futureDate = endDate.toISOString().split('T')[0];

      console.log('🔍 Searching for reservationId in booking history...');
      const response = await fetch(
        `https://api.africartz.com/api/bookings/user/history?page=1&limit=100&status=pending,accepted,declined&startDate=${today}&endDate=${futureDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Booking history response:', data);
        
        if (data?.data?.bookings && Array.isArray(data.data.bookings)) {
          // Find reservation matching apartmentId and checkInDate
          const matchingReservation = data.data.bookings.find((booking: any) => {
            const bookingApartmentId = booking.apartmentId?._id || booking.apartmentId || booking.apartment?._id;
            const bookingCheckIn = booking.checkInDate ? new Date(booking.checkInDate).toISOString().split('T')[0] : null;
            const matches = bookingApartmentId === apartmentId && bookingCheckIn === checkInDate;
            if (matches) {
              console.log('✅ Found matching reservation:', booking);
            }
            return matches;
          });

          if (matchingReservation?.reservationId) {
            console.log('✅ Found reservationId:', matchingReservation.reservationId);
            return matchingReservation.reservationId;
          } else if (matchingReservation?._id) {
            // Sometimes the reservationId might be in _id field
            console.log('✅ Found reservationId in _id field:', matchingReservation._id);
            return matchingReservation._id;
          }
        }
      } else {
        console.log('❌ Failed to fetch booking history:', response.status);
      }
    } catch (error) {
      console.error('❌ Error finding reservationId from API:', error);
    }
    return null;
  };

  // Update reservation pending state based on status (matching mobile app)
  const updateReservationPendingState = (status: string | null) => {
    const pendingStates = ['pending', 'accepted']; // Both pending and accepted should show cancel button
    setIsReservationPending(status ? pendingStates.includes(status) : false);
  };

  const fetchCurrentReservationStatus = async (reservationId: string) => {
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

      if (!authToken) {
        console.log('No auth token available for fetching reservation status');
        return;
      }

      const response = await fetch(paymentHistory(reservationId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.data) {
          setPaymentHistoryData(data);
          const backendStatus = data.data.status;
          
          console.log('🔄 Backend reservation status:', backendStatus);
          console.log('🔄 Current local status:', reservationStatus);
          
          // Always update status from backend (even if same, to ensure consistency)
          if (backendStatus) {
            const oldStatus = reservationStatus;
            setReservationStatus(backendStatus);
            updateReservationPendingState(backendStatus);
            
            // Update localStorage
            const reservationKey = `reservation_${apartmentId}`;
            const reservationDetails = localStorage.getItem(reservationKey);
            if (reservationDetails) {
              const parsed = JSON.parse(reservationDetails);
              parsed.status = backendStatus;
              localStorage.setItem(reservationKey, JSON.stringify(parsed));
            }
            
            console.log('✅ Updated reservation status from', oldStatus, 'to:', backendStatus);
            
            // If reservation is accepted, lock selectedBedrooms
            if (backendStatus === 'accepted') {
              if (data.data.selectedBedrooms !== undefined) {
                setAcceptedReservationBedrooms(data.data.selectedBedrooms);
                setSelectedBedrooms(data.data.selectedBedrooms);
                console.log('✅ Locked selectedBedrooms to accepted reservation:', data.data.selectedBedrooms);
              }
            }
          }
        }
      } else {
        console.log('Failed to fetch reservation status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching reservation status:', error);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservationId) {
      toast.error('Reservation ID not found');
      return;
    }

    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    setIsCancelling(true);
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

      if (!authToken) {
        toast.error('Please log in to cancel reservation');
        setIsCancelling(false);
        return;
      }

      const response = await axios.delete(cancelReservation(reservationId), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.data?.success || response.status === 200 || response.status === 204) {
        toast.success('Reservation cancelled successfully');
        
        // Clear reservation data
        const reservationKey = `reservation_${apartmentId}`;
        localStorage.removeItem(reservationKey);
        
        // Reset states
        setIsReservationPending(false);
        setReservationId(null);
        setReservationStatus(null);
        setPaymentHistoryData(null);
        setAcceptedReservationBedrooms(null);
        
        // Reset selectedBedrooms if it was locked
        if (apartment?.bedroomPricing && apartment.bedroomPricing.length > 0) {
          const firstBedroom = apartment.bedroomPricing[0];
          setSelectedBedrooms(firstBedroom.bedrooms);
        } else {
          setSelectedBedrooms(null);
        }
      } else {
        toast.error(response.data?.message || 'Failed to cancel reservation');
      }
    } catch (error: any) {
      console.error('Error cancelling reservation:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel reservation. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleBookNow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!reservationId) {
      toast.error('Reservation ID not found');
      return;
    }

    // Verify reservation is accepted before proceeding
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
        const backendStatus = data?.data?.status;
        
        if (backendStatus !== 'accepted') {
          toast.error(`Your reservation is ${backendStatus}. Please wait for it to be accepted before booking.`);
          setReservationStatus(backendStatus);
          return;
        }
      } else {
        toast.error('Unable to verify reservation status. Please try again.');
        return;
      }
    } catch (error) {
      toast.error('Network error. Please check your connection and try again.');
      return;
    }

    // Get reservation details for payment summary
    const reservationData = paymentHistoryData?.data;
    const checkInDate = reservationData?.checkInDate;
    const checkOutDate = reservationData?.checkOutDate;
    
    // Calculate number of nights
    let numberOfNights = 1;
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Use accepted reservation's selectedBedrooms if reservation is accepted
    const finalSelectedBedrooms = reservationStatus === 'accepted' && acceptedReservationBedrooms !== null
      ? acceptedReservationBedrooms
      : selectedBedrooms;
    
    // Navigate to PaymentSummary
    const params = new URLSearchParams();
    params.set('reservationId', reservationId);
    if (finalSelectedBedrooms !== null) {
      params.set('selectedBedrooms', finalSelectedBedrooms.toString());
    }
    if (checkInDate) {
      params.set('checkInDate', checkInDate);
    }
    if (checkOutDate) {
      params.set('checkOutDate', checkOutDate);
    }
    params.set('numberOfNights', numberOfNights.toString());
    
    router.push(`/apartments/${apartmentId}/payment-summary?${params.toString()}`);
  };

  const fetchApartmentDetails = async () => {
    try {
      setLoading(true);
      
      // Get auth token
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

      // Try to fetch single apartment details first
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

      // Fallback: fetch all apartments and find the one we need
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

  // Get available bedroom configurations
  const availableBedroomConfigs = useMemo(() => {
    if (!apartment?.bedroomPricing || apartment.bedroomPricing.length === 0) {
      return [];
    }
    return apartment.bedroomPricing
      .filter(bp => bp.isActive)
      .map(bp => ({
        bedrooms: bp.bedrooms,
        price: bp.price
      }))
      .sort((a, b) => a.bedrooms - b.bedrooms);
  }, [apartment?.bedroomPricing]);

  // Get bedroom options including full apartment
  const getBedroomOptions = useMemo(() => {
    if (!apartment) return [];
    
    const options: Array<{ bedrooms: number | null; label: string; price: number }> = [];
    
    // Add full apartment option
    options.push({
      bedrooms: null,
      label: `${apartment.bedrooms} Bedrooms (Full Apartment)`,
      price: usePrice(apartment, reservationType as any, null)
    });
    
    // Add bedroom pricing options
    availableBedroomConfigs.forEach(config => {
      const configPrice = usePrice(apartment, reservationType as any, config.bedrooms);
      options.push({
        bedrooms: config.bedrooms,
        label: `${config.bedrooms} ${config.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}`,
        price: configPrice
      });
    });
    
    return options;
  }, [apartment, reservationType, availableBedroomConfigs]);

  // Initialize selectedBedrooms
  useEffect(() => {
    if (apartment && selectedBedrooms === null && availableBedroomConfigs.length > 0) {
      const fullApartmentConfig = availableBedroomConfigs.find(
        config => config.bedrooms === apartment.bedrooms
      );
      if (fullApartmentConfig) {
        setSelectedBedrooms(fullApartmentConfig.bedrooms);
      }
    }
  }, [apartment?.bedrooms, availableBedroomConfigs]);

  // Calculate price
  const price = useMemo(() => {
    if (!apartment) return 0;
    return usePrice(apartment, reservationType as any, selectedBedrooms);
  }, [apartment, reservationType, selectedBedrooms]);

  // Parse amenities
  const amenities = useMemo(() => {
    if (!apartment?.amenities || !Array.isArray(apartment.amenities) || apartment.amenities.length === 0) {
      return [];
    }

    if (typeof apartment.amenities[0] === 'string' && !apartment.amenities[0].startsWith('[')) {
      return apartment.amenities;
    }

    try {
      const jsonString = apartment.amenities[0];
      if (typeof jsonString === 'string' && jsonString.startsWith('[')) {
        const cleanedJsonString = jsonString.trim().replace(/\]$/, '').replace(/^\[/, '');
        if (cleanedJsonString) {
          return JSON.parse(`[${cleanedJsonString}]`);
        }
      }
    } catch (error) {
      try {
        const jsonString = apartment.amenities[0];
        if (typeof jsonString === 'string') {
          const parsed = JSON.parse(jsonString);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (secondError) {
        console.log('Error parsing amenities:', secondError);
      }
    }
    
    return [];
  }, [apartment?.amenities]);

  // Get media items (images and videos) - matching mobile app structure
  const mediaItems = useMemo(() => {
    const items: Array<{ type: 'image' | 'video'; uri: string }> = [];
    
    // Add images
    if (apartment?.media?.images) {
      apartment.media.images.forEach((image: any) => {
        const imageUri = typeof image === 'string' ? image : (image?.uri || image?.url || '');
        if (imageUri) {
          items.push({ type: 'image', uri: imageUri });
        }
      });
    }
    
    // Add videos - matching mobile app structure
    if (apartment?.media?.videos) {
      apartment.media.videos.forEach((video: any) => {
        let videoUri = '';
        if (typeof video === 'string') {
          videoUri = video;
        } else if (video && typeof video === 'object') {
          videoUri = video.fullPath || video.url || video.uri || '';
        }
        if (videoUri) {
          items.push({ type: 'video', uri: videoUri });
        }
      });
    }
    
    // Also check for videos at root level (fallback)
    if (apartment?.videos && Array.isArray(apartment.videos)) {
      apartment.videos.forEach((video: any) => {
        const videoUri = typeof video === 'string' ? video : (video?.fullPath || video?.url || video?.uri || '');
        if (videoUri && !items.some(item => item.type === 'video' && item.uri === videoUri)) {
          items.push({ type: 'video', uri: videoUri });
        }
      });
    }
    
    return items;
  }, [apartment?.media?.images, apartment?.media?.videos, apartment?.videos]);

  const handlePreviousImage = () => {
    setIsVideoPlaying(false);
    setCurrentImageIndex((prev) => 
      prev === 0 ? mediaItems.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setIsVideoPlaying(false);
    setCurrentImageIndex((prev) => 
      prev === mediaItems.length - 1 ? 0 : prev + 1
    );
  };

  // Pause video when switching media
  useEffect(() => {
    setIsVideoPlaying(false);
  }, [currentImageIndex]);

  const handleCopyLink = async () => {
    if (apartment?.webLink) {
      try {
        await navigator.clipboard.writeText(apartment.webLink);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
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

  // Fallback image as data URI to avoid external network calls
  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  const currentMedia = mediaItems[currentImageIndex] || { type: 'image', uri: fallbackImage };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} w-0 min-w-0`}>
        <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 w-full overflow-x-hidden">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-3 sm:mb-4 flex items-center text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5 mr-2" />
            Back
          </button>

          {/* Media Carousel (Images and Videos) */}
          <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-lg overflow-hidden mb-4 sm:mb-6 bg-gray-200 dark:bg-gray-700">
            {mediaItems.length > 0 ? (
              <>
                <button
                  onClick={() => setIsMediaModalOpen(true)}
                  className="absolute inset-0 w-full h-full z-0 focus:outline-none"
                  aria-label="Open media in fullscreen"
                >
                  {currentMedia.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <video
                        ref={videoRef}
                        src={currentMedia.uri}
                        className="w-full h-full object-cover pointer-events-none"
                        controls={isVideoPlaying}
                        autoPlay={isVideoPlaying}
                        loop
                        playsInline
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMediaModalOpen(true);
                        }}
                      />
                      {!isVideoPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                          <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-4 sm:p-6 shadow-lg">
                            <Play className="w-12 h-12 sm:w-16 sm:h-16 text-gray-900 dark:text-white fill-current" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Image
                      src={currentMedia.uri}
                      alt={apartment.apartmentName}
                      fill
                      className="object-cover cursor-pointer"
                      priority
                    />
                  )}
                </button>
                {mediaItems.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviousImage();
                      }}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2.5 sm:p-2 shadow-lg z-20 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} className="sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2.5 sm:p-2 shadow-lg z-20 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} className="sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
                    </button>
                    <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 sm:space-x-2 z-20">
                      {mediaItems.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(index);
                          }}
                          className={`h-2 sm:h-2.5 rounded-full transition-all touch-manipulation min-w-[24px] ${
                            index === currentImageIndex
                              ? 'w-8 sm:w-10 bg-white'
                              : 'w-2 sm:w-2.5 bg-white/50'
                          }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No media available</p>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {mediaItems.length > 1 && (
            <div className="flex space-x-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
              {mediaItems.map((mediaItem, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex
                      ? 'border-primary'
                      : 'border-transparent'
                  }`}
                >
                  {mediaItem.type === 'video' ? (
                    <>
                      <video
                        src={mediaItem.uri}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <svg
                          className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <Image
                      src={mediaItem.uri}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
            {/* Main Content */}
            <div className="lg:col-span-2 w-full min-w-0">
              {/* Header */}
              <div className="mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {apartment.apartmentName}
                </h1>
                <div className="flex items-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  <MapPin size={16} className="sm:w-[18px] sm:h-[18px] mr-1 flex-shrink-0" />
                  <span className="break-words">{apartment.address}, {apartment.city}, {apartment.state}</span>
                </div>
              </div>

              {/* Property Details Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full inline-block mb-2">
                      <Users size={18} className="text-blue-600 dark:text-blue-400 mx-auto" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Guests</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{apartment.guests}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-full inline-block mb-2">
                      <Bed size={18} className="text-green-600 dark:text-green-400 mx-auto" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Beds</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{apartment.beds}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-full inline-block mb-2">
                      <Building2 size={18} className="text-purple-600 dark:text-purple-400 mx-auto" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Bedrooms</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{apartment.bedrooms}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-full inline-block mb-2">
                      <Bath size={18} className="text-orange-600 dark:text-orange-400 mx-auto" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Bathrooms</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{apartment.bathrooms}</p>
                  </div>
                </div>
              </div>

              {/* Bedroom Selection */}
              {(availableBedroomConfigs.length > 0 || apartment.bedrooms) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm border border-gray-200 dark:border-gray-700 w-full overflow-visible">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <Bed size={18} className="sm:w-5 sm:h-5 mr-2 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Select Bedroom Configuration
                    </h2>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choose how many bedrooms you'd like to book:
                  </p>

                  <div className="relative w-full">
                    <button
                      onClick={() => setShowBedroomDropdown(!showBedroomDropdown)}
                      className="w-full flex items-center justify-between p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary dark:hover:border-primary transition-colors bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <Bed size={20} className="mr-3 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                        <div className="text-left min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {selectedBedrooms !== null
                              ? getBedroomOptions.find(opt => opt.bedrooms === selectedBedrooms)?.label.replace(' (Full Apartment)', '') || 
                                `${selectedBedrooms} ${selectedBedrooms === 1 ? 'Bedroom' : 'Bedrooms'}`
                              : 'Select bedroom configuration'}
                          </p>
                          {selectedBedrooms !== null && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              ₦{numberWithCommas(price)} / night
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight 
                        size={24} 
                        className={`text-gray-600 dark:text-gray-400 transition-transform ${showBedroomDropdown ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {showBedroomDropdown && getBedroomOptions.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-gray-900 max-h-80 overflow-y-auto left-0 right-0 max-w-full">
                        {getBedroomOptions.map((option, index) => {
                          const isSelected = selectedBedrooms === option.bedrooms;
                          return (
                            <button
                              key={option.bedrooms !== null ? option.bedrooms : 'full'}
                              onClick={() => {
                                setSelectedBedrooms(option.bedrooms);
                                setShowBedroomDropdown(false);
                              }}
                              className={`w-full p-4 text-left border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <div className="flex items-center flex-1 min-w-0">
                                  <Building2 size={20} className="mr-3 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                                      {option.label.replace(' (Full Apartment)', '')}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                      {option.bedrooms !== null 
                                        ? `${option.bedrooms} ${option.bedrooms === 1 ? 'bedroom' : 'bedrooms'} available`
                                        : 'Complete apartment access'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    ₦{numberWithCommas(option.price)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">/night</p>
                                  {isSelected && (
                                    <CheckCircle size={20} className="text-primary mt-1 mx-auto" />
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-3 sm:mb-4">
                  <Shield size={18} className="sm:w-5 sm:h-5 mr-2 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">About this place</h2>
                </div>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  {apartment.description || 'No description available for this property.'}
                </p>
              </div>

              {/* Amenities */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  What this place offers
                </h2>
                {amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 bg-gray-50 dark:bg-gray-700"
                      >
                        <CheckCircle size={16} className="text-green-600 dark:text-green-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {amenity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No amenities information available</p>
                )}
              </div>

              {/* Share Link */}
              {apartment.webLink && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Share Link</h2>
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="flex-1 text-left min-w-0 w-full sm:w-auto overflow-hidden">
                      <p className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-200 mb-1">Share this apartment</p>
                      <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 break-all sm:truncate overflow-hidden">{apartment.webLink}</p>
                    </div>
                    <Copy size={18} className="sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 sm:ml-4 self-end sm:self-auto" />
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar - Price & Booking */}
            <div className="lg:col-span-1 w-full min-w-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg dark:shadow-gray-900 border border-gray-200 dark:border-gray-700 sticky top-4 sm:top-6 w-full">
                {/* Reservation Type Selector */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reservation Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Normal Stay', value: 'normal' },
                      { label: 'Party', value: 'party' },
                      { label: 'Movie Shoot', value: 'movie' },
                      { label: 'Photo Shoot', value: 'photo' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setReservationType(type.value)}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          reservationType === type.value
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      ₦{numberWithCommas(price)}
                    </span>
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">/ night</span>
                  </div>
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">
                    Caution fee: ₦{numberWithCommas(Math.round(apartment.cautionFee || 0))}
                  </p>
                </div>

                {/* Show Cancel Reservation button when reservation is pending (matching mobile app) */}
                {hasCheckedReservation && isReservationPending && (
                  <button
                    onClick={handleCancelReservation}
                    disabled={isCancelling}
                    className={`w-full py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-opacity mb-4 shadow-lg ${
                      reservationStatus === 'accepted'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:opacity-90'
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:opacity-90'
                    } ${isCancelling ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isCancelling ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cancelling...
                      </span>
                    ) : (
                      reservationStatus === 'accepted' ? 'Cancel Accepted Reservation' : 'Cancel Reservation Request'
                    )}
                  </button>
                )}

                {/* Show Book Now button if reservation is accepted (matching mobile app) */}
                {hasCheckedReservation && reservationStatus === 'accepted' && reservationId && (
                  <button
                    onClick={handleBookNow}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:opacity-90 transition-opacity mb-4 shadow-lg"
                  >
                    Book Now
                  </button>
                )}

                {/* Show Request Reservation button only when no pending reservation (matching mobile app) */}
                {hasCheckedReservation && !isReservationPending && (
                  <button
                    onClick={() => {
                      // Require login for reservation (matching mobile app behavior)
                      if (!user) {
                        router.push('/login');
                        return;
                      }
                      // Navigate to reservation request page
                      const params = new URLSearchParams();
                      params.set('type', reservationType);
                      if (selectedBedrooms !== null) {
                        params.set('bedrooms', selectedBedrooms.toString());
                      }
                      router.push(`/apartments/${apartmentId}/reservation?${params.toString()}`);
                    }}
                    className="w-full bg-gradient-to-r from-primary-light to-primary-dark text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:opacity-90 transition-opacity mb-4"
                  >
                    Request Reservation
                  </button>
                )}

                {/* Show status message when reservation exists but not accepted */}
                {hasCheckedReservation && reservationStatus && reservationStatus !== 'accepted' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 text-center">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                      Reservation Status: {reservationStatus.charAt(0).toUpperCase() + reservationStatus.slice(1)}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                      Booking is only available for accepted reservations
                    </p>
                    <button
                      onClick={async () => {
                        // Try to find reservationId if missing
                        if (!reservationId && user) {
                          const reservationKey = `reservation_${apartmentId}`;
                          const reservationDetails = localStorage.getItem(reservationKey);
                          if (reservationDetails) {
                            const parsed = JSON.parse(reservationDetails);
                            if (parsed.checkInDate) {
                              toast.loading('Finding reservation...');
                              const foundId = await findReservationIdFromAPI(apartmentId, parsed.checkInDate);
                              if (foundId) {
                                parsed.reservationId = foundId;
                                localStorage.setItem(reservationKey, JSON.stringify(parsed));
                                setReservationId(foundId);
                                await fetchCurrentReservationStatus(foundId);
                                toast.dismiss();
                                toast.success('Status updated!');
                                return;
                              }
                            }
                          }
                        }
                        
                        if (reservationId) {
                          toast.loading('Checking reservation status...');
                          await fetchCurrentReservationStatus(reservationId);
                          toast.dismiss();
                          toast.success('Status updated!');
                        } else {
                          toast.error('Reservation ID not found. Please make a new reservation.');
                        }
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Refresh Status
                    </button>
                  </div>
                )}

                {apartment.isBooked && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">This apartment is currently booked</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Media Modal */}
      <MediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        mediaItems={mediaItems}
        initialIndex={currentImageIndex}
      />
    </div>
  );
}

