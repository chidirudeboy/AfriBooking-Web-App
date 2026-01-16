'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { getRequestResponses, getSingleApartmentUserDetails } from '@/lib/endpoints';
import api from '@/lib/utils/api';
import axios from 'axios';
import { 
  ArrowLeft, MessageSquare, Bed, Bath, MapPin, 
  FileText, Eye, CreditCard, User, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, differenceInDays, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';

interface ApartmentData {
  id?: string;
  _id?: string;
  apartmentName?: string;
  name?: string;
  webLink?: string;
  web_url?: string;
  weblink?: string;
  address?: string;
  city?: string;
  state?: string;
  bedrooms?: number;
  num_of_bedrooms?: number;
  bathrooms?: number;
  num_of_bathrooms?: number;
  guests?: number;
  num_of_guests?: number;
  defaultStayFee?: number;
  price?: number;
  cautionFee?: number;
  caution_fee?: number;
  description?: string;
  amenities?: string;
  apartmentType?: string;
  propertyType?: string;
  media?: {
    images?: string[];
  };
  pictures?: { fullPath: string }[];
}

interface Response {
  id: string;
  _id: string;
  apartmentId: ApartmentData | string;
  agentId: {
    id: string;
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  message?: string;
  createdAt: string;
  bookingLink?: string;
}

interface RequestData {
  id: string;
  _id: string;
  bedrooms: number;
  location: string;
  city?: string;
  state?: string;
  additionalNotes?: string;
  status: string;
  checkInDate?: string | Date;
  checkOutDate?: string | Date;
}

export default function RequestResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const requestId = params?.id as string;
  
  const [request, setRequest] = useState<RequestData | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [apartmentCache, setApartmentCache] = useState<Record<string, ApartmentData>>({});

  const fetchResponses = useCallback(async () => {
    if (!user || !requestId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const endpoint = getRequestResponses(requestId);
      const response = await api.get(endpoint);

      const responseData: any = response.data;
      if (responseData?.success) {
        setRequest(responseData.request);
        setResponses(responseData.responses || []);
      }
    } catch (error: any) {
      console.error('Error fetching responses:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load responses');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, requestId]);

  useEffect(() => {
    if (user) {
      fetchResponses();
    } else {
      router.push('/login');
    }
  }, [user, fetchResponses, router]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResponses();
  };

  // Fetch full apartment details for apartments missing name/location data
  useEffect(() => {
    const fetchMissingApartmentDetails = async () => {
      if (!responses.length) return;
      
      const apartmentIdsToFetch: string[] = [];
      
      // Collect apartment IDs that don't have complete data
      responses.forEach((response) => {
        let apartmentsList: any[] = [];
        if (typeof response.apartmentId === 'object') {
          if (Array.isArray(response.apartmentId)) {
            apartmentsList = response.apartmentId;
          } else {
            apartmentsList = [response.apartmentId];
          }
        }
        
        apartmentsList.forEach((apt) => {
          // Extract apartment ID - handle both string IDs and object IDs
          let aptId: string | null = null;
          if (typeof apt === 'string') {
            aptId = apt;
          } else if (apt && typeof apt === 'object') {
            aptId = (apt as any)?._id || (apt as any)?.id || null;
          }
          
          if (!aptId) return;
          
          // Check if already cached
          if (apartmentCache[aptId]) return;
          
          // For string IDs, we need to fetch (no name/location data in string)
          // For object IDs, check if name and location are missing
          const hasName = apt && typeof apt === 'object' 
            ? ((apt as any)?.apartmentName || (apt as any)?.name)
            : false;
          const hasLocation = apt && typeof apt === 'object'
            ? ((apt as any)?.address || (apt as any)?.city || (apt as any)?.state)
            : false;
          
          if ((!hasName || !hasLocation) && !apartmentIdsToFetch.includes(aptId)) {
            apartmentIdsToFetch.push(aptId);
          }
        });
      });
      
      // Fetch apartment details for those missing data
      if (apartmentIdsToFetch.length > 0) {
        console.log('📡 Fetching apartment details for', apartmentIdsToFetch.length, 'apartments');
        
        for (const apartmentId of apartmentIdsToFetch) {
          try {
            const apartmentEndpoint = `${getSingleApartmentUserDetails}/${apartmentId}`;
            const apartmentResponse = await axios.get(apartmentEndpoint, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if ((apartmentResponse.data as any)?.apartment) {
              const fullApartment = (apartmentResponse.data as any).apartment;
              setApartmentCache((prev) => ({
                ...prev,
                [apartmentId]: fullApartment,
              }));
              console.log('✅ Cached apartment details for', apartmentId);
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch apartment details for', apartmentId, error);
          }
        }
      }
    };
    
    fetchMissingApartmentDetails();
  }, [responses]); // Remove apartmentCache from dependencies to avoid infinite loop

  const handleOpenLink = (e: React.MouseEvent, url: string | undefined) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔗 View button clicked:', { url, hasUrl: !!url });
    
    if (!url || url.trim() === '') {
      console.warn('⚠️ No URL provided');
      toast.error('Property link not available');
      return;
    }

    let finalUrl = url.trim();
    const urlPattern = /^(https?:\/\/|www\.)/i;
    
    if (!urlPattern.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    console.log('🔗 Opening URL:', finalUrl);

    try {
      const newWindow = window.open(finalUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup blocked - try alternative method
        console.warn('⚠️ Popup blocked, trying alternative method');
        window.location.href = finalUrl;
      }
    } catch (error) {
      console.error('❌ Error opening link:', error);
      toast.error('Failed to open link');
    }
  };

  const formatPrice = (price: number) => {
    return `₦${(price || 0).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      const now = new Date();
      const diffMins = differenceInMinutes(now, date);
      const diffHours = differenceInHours(now, date);
      const diffDays = differenceInDays(now, date);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return format(date, 'MMM d');
    } catch {
      return dateString;
    }
  };

  const handleProceedToPayment = async (e: React.MouseEvent, response: Response, apt: ApartmentData | string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('💰 Book This Property clicked:', { response, apt });
    
    // Extract IDs from multiple possible locations - match mobile app logic
    let apartmentId: string | null = null;
    let apartmentData: ApartmentData | null = null;
    
    if (typeof apt === 'string') {
      // If apartmentId is a string, use it directly
      apartmentId = apt;
    } else if (apt) {
      // If it's an object, extract the ID (already a single apartment object from the map)
      apartmentId = apt._id || (apt as any).id || null;
      apartmentData = apt;
    }
    
    const responseId = response._id || response.id;

    if (!apartmentId || !responseId || !requestId) {
      const missingFields = [];
      if (!requestId) missingFields.push('Request ID');
      if (!responseId) missingFields.push('Response ID');
      if (!apartmentId) missingFields.push('Apartment ID');
      
      toast.error(`Missing booking information: ${missingFields.join(', ')}. Please try refreshing the page.`);
      return;
    }

    // Create unique identifier for this apartment (apartmentId should always exist at this point)
    const processingKey = `${responseId}-${apartmentId}`;
    
    console.log('🔍 Payment Debug:', {
      requestId,
      responseId,
      apartmentId,
      apartmentIdType: typeof apt,
      hasBookingLink: !!response.bookingLink,
      apartmentIdData: apt,
      processingKey,
      requestDates: {
        checkInDate: request?.checkInDate,
        checkOutDate: request?.checkOutDate,
      }
    });

    setProcessingPayment(processingKey);

    try {
      // Get dates from request - match mobile app format (ISO strings with time)
      const checkInDate = request?.checkInDate ? new Date(request.checkInDate).toISOString() : null;
      const checkOutDate = request?.checkOutDate ? new Date(request.checkOutDate).toISOString() : null;
      
      // Calculate numberOfNights - match mobile app logic
      let numberOfNights = 1;
      if (checkInDate && checkOutDate) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const diffTime = checkOut.getTime() - checkIn.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        numberOfNights = diffDays > 0 ? diffDays : 1;
      }
      
      // Get selectedBedrooms from request or apartment
      const selectedBedrooms = request?.bedrooms || apartmentData?.bedrooms || apartmentData?.num_of_bedrooms || null;
      
      // Prepare apartment data - use populated data if available, otherwise fetch full details
      // This matches the mobile app behavior
      let fullApartment = apartmentData;
      
      // If we don't have complete apartment data, fetch it
      if (!fullApartment || !(fullApartment as any).defaultStayFee) {
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

          const apartmentEndpoint = `${getSingleApartmentUserDetails}/${apartmentId}`;
          const apartmentResponse = await axios.get(apartmentEndpoint, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            },
          });
          
          if ((apartmentResponse.data as any)?.apartment) {
            fullApartment = (apartmentResponse.data as any).apartment;
          } else if ((apartmentResponse.data as any)?.data) {
            fullApartment = (apartmentResponse.data as any).data;
          }
        } catch (error) {
          console.warn('Could not fetch full apartment details, using partial data:', error);
          // Continue with partial data
        }
      }

      // Validate required data for PaymentSummary - match mobile app validation
      if (!checkInDate || !checkOutDate) {
        toast.error('Check-in and check-out dates are required. Please create a new request with dates.');
        setProcessingPayment(null);
        return;
      }

      // Ensure apartmentId is a string
      const apartmentIdStr = String(apartmentId);

      console.log('💰 Payment navigation params:', {
        apartmentId: apartmentIdStr,
        apartmentIdType: typeof apartmentId,
        reservationId: responseId,
        selectedBedrooms,
        checkInDate,
        checkOutDate,
        numberOfNights,
        apartmentData: fullApartment ? {
          _id: fullApartment._id,
          id: fullApartment.id,
          name: (fullApartment as any).name || (fullApartment as any).apartmentName,
        } : null,
      });

      // Navigate to PaymentSummary - convert ISO strings to date strings for URL params
      // For request response bookings, pass request response parameters
      const searchParams = new URLSearchParams({
        fromRequestResponse: 'true',
        requestId: requestId.toString(),
        requestResponseId: responseId.toString(), // responseId is the requestResponseId
        checkInDate: checkInDate.split('T')[0], // Convert ISO to date string for URL
        checkOutDate: checkOutDate.split('T')[0], // Convert ISO to date string for URL
        numberOfNights: numberOfNights.toString(),
      });
      
      if (selectedBedrooms) {
        searchParams.set('selectedBedrooms', selectedBedrooms.toString());
      }

      // Pass bookingLink if available (match mobile app)
      if (response.bookingLink) {
        searchParams.set('bookingLink', response.bookingLink);
      }

      const url = `/apartments/${apartmentIdStr}/payment-summary?${searchParams.toString()}`;
      console.log('💰 Navigating to Payment Summary:', url);
      console.log('💰 Request Response params:', {
        fromRequestResponse: true,
        requestId: requestId.toString(),
        requestResponseId: responseId.toString(),
        apartmentId: apartmentIdStr,
        bookingLink: response.bookingLink,
      });
      
      router.push(url);
    } catch (error: any) {
      console.error('❌ Error navigating to payment:', error);
      toast.error(error.message || 'Failed to proceed to payment. Please try again.');
      setProcessingPayment(null);
    }
  };

  if (!user) {
    return null;
  }

  if (loading && !request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0`}>
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Loading responses...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0`}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            <div className="flex items-center gap-3 flex-1">
              <div className="w-11 h-11 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Agent Responses
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {responses.length} response{responses.length !== 1 ? 's' : ''} to your request
                </p>
              </div>
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-700 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Request Summary Card */}
          {request && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    Your Request
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold capitalize ${
                  request.status === 'active'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {request.status}
                </span>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex flex-col items-center">
                  <Bed className="w-5 h-5 text-amber-600 dark:text-amber-500 mb-1" />
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    {request.bedrooms}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Bedroom{request.bedrooms > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="w-px h-12 bg-gray-200 dark:bg-gray-600" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {request.city && request.state ? `${request.city}, ${request.state}` : request.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Responses List */}
          {responses.length > 0 ? (
            <div className="space-y-4">
              {responses.map((response) => {
                let apartmentsList: ApartmentData[] = [];
                if (typeof response.apartmentId === 'object') {
                  if (Array.isArray(response.apartmentId)) {
                    apartmentsList = response.apartmentId;
                  } else {
                    apartmentsList = [response.apartmentId];
                  }
                }

                return (
                  <div
                    key={response.id || response._id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                  >
                    <div className="p-3">
                      {/* Agent Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {response.agentId?.firstName?.charAt(0) || 'A'}{response.agentId?.lastName?.charAt(0) || ''}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {response.agentId?.firstName || 'Agent'} {response.agentId?.lastName || ''}
                          </p>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Verified</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(response.createdAt)}
                        </p>
                      </div>

                      {/* Agent Message */}
                      {response.message && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 mb-3 border-l-2 border-blue-500">
                          <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
                            &quot;{response.message}&quot;
                          </p>
                        </div>
                      )}

                      {/* Multiple Apartments Header */}
                      {apartmentsList.length > 1 && (
                        <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {apartmentsList.length} Properties Shared
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Select a property to proceed with booking
                          </p>
                        </div>
                      )}

                      {/* Apartments List */}
                      <div className="space-y-3">
                        {apartmentsList.map((apt, aptIndex) => {
                          const bedrooms = apt && typeof apt === 'object' 
                            ? ((apt as any).bedrooms ?? (apt as any).num_of_bedrooms ?? null)
                            : null;
                          const finalBedrooms = bedrooms !== null && bedrooms !== undefined 
                            ? Number(bedrooms) 
                            : (request?.bedrooms && request.bedrooms > 0 ? request.bedrooms : 0);
                          
                          const bathrooms = apt && typeof apt === 'object'
                            ? ((apt as any).bathrooms ?? (apt as any).num_of_bathrooms ?? null)
                            : null;
                          const finalBathrooms = bathrooms !== null && bathrooms !== undefined 
                            ? Number(bathrooms) 
                            : 0;
                          
                          // Extract apartmentId first - needed for cache lookup
                          let apartmentId: string | null = null;
                          if (apt && typeof apt === 'object') {
                            const rawId = (apt as any)._id || (apt as any).id || (apt as any).apartmentId || null;
                            if (rawId) {
                              if (typeof rawId === 'object' && rawId.toString) {
                                apartmentId = rawId.toString();
                              } else {
                                apartmentId = String(rawId);
                              }
                            }
                          } else if (typeof apt === 'string') {
                            apartmentId = apt;
                          }
                          
                          // Check cache first, then the apartment object
                          const cachedApt = apartmentId ? apartmentCache[apartmentId] : null;
                          const aptToCheck = cachedApt || apt;
                          
                          // Extract name - use cached apartment data if available
                          const name = (aptToCheck && typeof aptToCheck === 'object')
                            ? ((aptToCheck as any).apartmentName 
                              || (aptToCheck as any).name 
                              || (aptToCheck as any).title
                              || (aptToCheck as any).propertyName
                              || 'Property')
                            : 'Property';
                          
                          const apartmentType = (aptToCheck && typeof aptToCheck === 'object') 
                            ? ((aptToCheck as any).apartmentType || '') 
                            : '';
                          const propertyType = (aptToCheck && typeof aptToCheck === 'object') 
                            ? ((aptToCheck as any).propertyType || '') 
                            : '';
                          
                          // Extract location - use cached apartment data if available
                          const location = (aptToCheck && typeof aptToCheck === 'object')
                            ? ((aptToCheck as any).address 
                              ? `${(aptToCheck as any).address}${(aptToCheck as any).city || (aptToCheck as any).state ? ', ' : ''}${(aptToCheck as any).city || ''}${(aptToCheck as any).city && (aptToCheck as any).state ? ', ' : ''}${(aptToCheck as any).state || ''}`
                              : ((aptToCheck as any).city && (aptToCheck as any).state
                                ? `${(aptToCheck as any).city}, ${(aptToCheck as any).state}`
                                : (aptToCheck as any).city || (aptToCheck as any).state || ''))
                            : '';
                          
                          // Extract price - use cached apartment data if available
                          const price = (aptToCheck && typeof aptToCheck === 'object')
                            ? ((aptToCheck as any).defaultStayFee ?? (aptToCheck as any).price ?? (aptToCheck as any).stayFee ?? null)
                            : null;
                          const finalPrice = price !== null && price !== undefined 
                            ? Number(price) 
                            : 0;
                          
                          let webUrl = (aptToCheck && typeof aptToCheck === 'object')
                            ? ((aptToCheck as any).webLink || (aptToCheck as any).web_url || null)
                            : null;
                          
                          if (!webUrl && apartmentId) {
                            const frontendUrl = 'https://weblinkview.vercel.app';
                            webUrl = `${frontendUrl}/apartment/${apartmentId}`;
                            console.log('🔗 Constructed webUrl from apartmentId:', webUrl);
                          }
                          
                          // Debug log for first apartment
                          if (aptIndex === 0) {
                            console.log('🔗 WebUrl Debug:', {
                              apartmentId: apartmentId,
                              webUrl: webUrl,
                              hasWebLink: !!(aptToCheck as any)?.webLink,
                              webLink: (aptToCheck as any)?.webLink,
                              hasCache: !!cachedApt,
                              name,
                              location,
                            });
                          }

                          const responseId = response._id || response.id;
                          const processingKey = apartmentId ? `${responseId}-${apartmentId}` : null;
                          const isProcessing = processingKey ? processingPayment === processingKey : false;

                          return (
                            <div
                              key={apartmentId || aptIndex}
                              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700"
                            >
                              {/* Apartment Image */}
                              {apt?.media?.images?.[0] && (
                                <div className="relative w-full h-48 rounded-lg overflow-hidden mb-3 bg-gray-200 dark:bg-gray-600">
                                  <Image
                                    src={apt.media.images[0]}
                                    alt={name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}

                              {/* Property Name & Type */}
                              <div className="mb-3">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                  {name}
                                </h3>
                                {(apartmentType || propertyType) && (
                                  <div className="flex gap-2">
                                    {apartmentType && (
                                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-semibold capitalize">
                                        {apartmentType}
                                      </span>
                                    )}
                                    {propertyType && (
                                      <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded text-xs font-semibold capitalize">
                                        {propertyType}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Property Details */}
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-4 mb-2">
                                  {finalBedrooms > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <Bed className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {finalBedrooms} Bed{finalBedrooms !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}
                                  {finalBathrooms > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <Bath className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {finalBathrooms} Bath{finalBathrooms !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}
                                  {finalPrice > 0 && (
                                    <div className="ml-auto">
                                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                        {formatPrice(finalPrice)}/night
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Address/Location */}
                                {location && (
                                  <div className="flex items-start gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5" />
                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                      {location}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                {/* Book This Property Button */}
                                <button
                                  type="button"
                                  onClick={(e) => handleProceedToPayment(e, response, apt)}
                                  disabled={isProcessing}
                                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white transition-all ${
                                    isProcessing
                                      ? 'bg-gray-400 cursor-not-allowed'
                                      : 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 cursor-pointer'
                                  }`}
                                >
                                  {isProcessing ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <CreditCard className="w-4 h-4" />
                                  )}
                                  <span className="text-sm">
                                    {isProcessing ? 'Processing...' : 'Book This Property'}
                                  </span>
                                </button>

                                {/* View Property Button */}
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenLink(e, webUrl || undefined)}
                                  disabled={!webUrl}
                                  className={`px-4 py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-1.5 ${
                                    webUrl
                                      ? 'bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20 cursor-pointer'
                                      : 'bg-gray-400 cursor-not-allowed opacity-50'
                                  }`}
                                  title={webUrl ? `View property: ${webUrl}` : 'Property link not available'}
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="text-sm">View</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-10">
              <div className="w-30 h-30 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-7">
                <MessageSquare className="w-14 h-14 text-green-600 dark:text-green-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
                No Responses Yet
              </h2>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 max-w-md">
                Agents are reviewing your request. When they find matching properties, they'll respond here.
              </p>

              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-5 py-3.5 rounded-full shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  You'll be notified when agents respond
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
