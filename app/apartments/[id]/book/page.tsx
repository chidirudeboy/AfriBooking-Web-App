'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { TApartments } from '@/lib/types/airbnb';
import { getSingleApartmentUserDetails, getEveryApartments, bookAndPay, paymentHistory, bookFromRequestResponse } from '@/lib/endpoints';
import axios from 'axios';
import { 
  ArrowLeft, User, Mail, Phone, Shield, AlertCircle, 
  Upload, X, CheckCircle, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

function BookApartmentContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const apartmentId = params?.id as string;
  const reservationId = searchParams?.get('reservationId') || '';
  const selectedBedroomsParam = searchParams?.get('selectedBedrooms');
  const checkInDateParam = searchParams?.get('checkInDate') || '';
  const checkOutDateParam = searchParams?.get('checkOutDate') || '';
  const fromRequestResponse = searchParams?.get('fromRequestResponse') === 'true';
  const requestId = searchParams?.get('requestId') || '';
  const requestResponseId = searchParams?.get('requestResponseId') || '';

  const [apartment, setApartment] = useState<TApartments | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [reservationData, setReservationData] = useState<any>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [meansOfId, setMeansOfId] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [uploadedIDDisplay, setUploadedIDDisplay] = useState<File | null>(null);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedBedrooms = selectedBedroomsParam ? parseInt(selectedBedroomsParam) : null;

  const idOptions = [
    { value: "Driver's License", label: "Driver's License" },
    { value: "Voter's ID", label: "Voter's ID" },
    { value: "National Passport", label: "National Passport" },
  ];

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (apartmentId) {
      fetchApartmentDetails();
    }
    // Only fetch reservation data if it's NOT a request response booking
    if (reservationId && !fromRequestResponse) {
      fetchReservationData();
    }
    // Pre-fill email from user if available
    if (user?.email || user?.user?.email) {
      setEmail(user.email || user.user.email);
    }
  }, [user, router, apartmentId, reservationId, fromRequestResponse]);

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
        // Backend uses path parameter: /api/apartment/getSingleApartmentUser/:apartmentId
        const endpointUrl = `${getSingleApartmentUserDetails}/${apartmentId}`;
        console.log('📡 Fetching apartment from URL:', endpointUrl);
        
        const response = await axios.get(endpointUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          },
          timeout: 15000
        });

        console.log('📡 Apartment fetch response:', response.data);

        // Backend returns: { apartment: {...} } or { data: {...} }
        if (response.data?.apartment) {
          setApartment(response.data.apartment);
          setLoading(false);
          return;
        } else if (response.data?.data) {
          setApartment(response.data.data);
          setLoading(false);
          return;
        }
      } catch (error: any) {
        console.log('⚠️ Single apartment fetch failed, trying all apartments...', error.response?.data || error.message);
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

      // Try to find apartment by matching _id or id (handle both string and ObjectId formats)
      const foundApartment = apartments.find(apt => {
        const aptId = apt._id || (apt as any).id;
        if (!aptId) return false;
        // Convert both to strings for comparison
        return String(aptId) === String(apartmentId);
      });
      
      if (foundApartment) {
        console.log('✅ Found apartment in list:', foundApartment._id || (foundApartment as any).id);
        setApartment(foundApartment);
      } else {
        console.error('❌ Apartment not found. Looking for:', apartmentId);
        console.error('Available apartment IDs:', apartments.map(apt => apt._id || (apt as any).id).slice(0, 5));
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setUploadedIDDisplay(file);
    }
  };

  const removeFile = () => {
    setUploadedIDDisplay(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    // For request response bookings, we need requestId, requestResponseId, and apartmentId
    if (fromRequestResponse) {
      if (!requestId || !requestResponseId || !apartmentId) {
        const missing = [];
        if (!requestId) missing.push('Request ID');
        if (!requestResponseId) missing.push('Response ID');
        if (!apartmentId) missing.push('Apartment ID');
        toast.error(`Missing booking information: ${missing.join(', ')}. Please go back and try again.`);
        return false;
      }
    } else {
      // For regular reservations, we need reservationId
      if (!reservationId) {
        toast.error('Reservation ID is missing. Please go back and make a new reservation request.');
        return false;
      }
    }

    if (!firstName.trim()) {
      toast.error('Please enter your first name');
      return false;
    }
    if (!lastName.trim()) {
      toast.error('Please enter your last name');
      return false;
    }
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return false;
    }
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    if (!meansOfId) {
      toast.error('Please select a means of identification');
      return false;
    }
    if (!idNumber.trim()) {
      toast.error('Please enter your ID number');
      return false;
    }
    if (!uploadedIDDisplay) {
      toast.error('Please upload a valid means of identification');
      return false;
    }
    if (!emergencyName.trim()) {
      toast.error('Please enter emergency contact name');
      return false;
    }
    if (!emergencyPhone.trim()) {
      toast.error('Please enter emergency contact phone');
      return false;
    }
    if (!policyAccepted) {
      toast.error('Please accept the refund policy to proceed');
      return false;
    }

    return true;
  };

  const initiateBookingPayment = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

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

      console.log('🔍 Booking Payment Debug:', {
        fromRequestResponse,
        requestId,
        requestResponseId,
        apartmentId,
        reservationId,
        hasRequestId: !!requestId,
        hasRequestResponseId: !!requestResponseId,
        hasApartmentId: !!apartmentId,
        hasReservationId: !!reservationId,
      });

      // Handle request response flow (bypasses reservation)
      if (fromRequestResponse) {
        // If fromRequestResponse is true, we MUST use request response flow
        // Don't fall through to regular reservation flow
        if (!requestId || !requestResponseId || !apartmentId || !checkInDateParam || !checkOutDateParam) {
          const missing = [];
          if (!requestId) missing.push('Request ID');
          if (!requestResponseId) missing.push('Response ID');
          if (!apartmentId) missing.push('Apartment ID');
          if (!checkInDateParam) missing.push('Check-in Date');
          if (!checkOutDateParam) missing.push('Check-out Date');
          toast.error(`Missing booking information: ${missing.join(', ')}. Please go back and try again.`);
          setSubmitting(false);
          return;
        }

        try {
          console.log('🔍 Request Response Payment Debug:', {
            fromRequestResponse,
            requestId,
            requestResponseId,
            apartmentId,
          });

          // Create FormData for file upload
        const formData = new FormData();
        
        // Add customer info
        formData.append('customerInfo[firstName]', firstName.trim());
        formData.append('customerInfo[lastName]', lastName.trim());
        formData.append('customerInfo[email]', email.trim());
        formData.append('customerInfo[phone]', phone.trim());
        
        // Add identification details
        formData.append('meansOfIdentification', meansOfId);
        formData.append('identificationNumber', idNumber.trim());
        
        // Add emergency contact
        formData.append('emergencyContact[name]', emergencyName.trim());
        formData.append('emergencyContact[phone]', emergencyPhone.trim());
        
        // Add other fields
        formData.append('acceptRefundPolicy', 'true');
        formData.append('specialRequests', '');
        
        // Add selectedBedrooms if provided
        if (selectedBedrooms !== null && selectedBedrooms !== undefined) {
          formData.append('selectedBedrooms', selectedBedrooms.toString());
        }
        
        // Add dates - required by backend API for request response bookings
        // Convert to ISO string format to match mobile app and backend expectations
        if (checkInDateParam) {
          // If it's already an ISO string, use it; otherwise convert date string to ISO
          const checkInDateValue = checkInDateParam.includes('T') 
            ? checkInDateParam 
            : new Date(checkInDateParam).toISOString();
          formData.append('checkInDate', checkInDateValue);
        }
        if (checkOutDateParam) {
          // If it's already an ISO string, use it; otherwise convert date string to ISO
          const checkOutDateValue = checkOutDateParam.includes('T') 
            ? checkOutDateParam 
            : new Date(checkOutDateParam).toISOString();
          formData.append('checkOutDate', checkOutDateValue);
        }
        
        // Add apartmentId explicitly (though it's in the URL path, backend may require it in FormData)
        if (apartmentId) {
          formData.append('apartmentId', apartmentId);
        }
        
        // Add identification image if available
        if (uploadedIDDisplay) {
          formData.append('identificationImage', uploadedIDDisplay);
        }

        console.log('📄 Calling bookFromRequestResponse API', {
          requestId,
          requestResponseId,
          apartmentId,
          checkInDate: checkInDateParam,
          checkOutDate: checkOutDateParam,
          selectedBedrooms,
        });
        
        const response = await fetch(bookFromRequestResponse(requestId, requestResponseId, apartmentId), {
          method: 'POST',
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          },
          body: formData
        });

        const data = await response.json();
        console.log('📄 bookFromRequestResponse response:', JSON.stringify(data, null, 2));

        if (data.status === 'success' && data.data?.payment?.authorizationUrl) {
          console.log('✅ Payment URL received, opening payment modal');
          const paymentUrl = data.data.payment.authorizationUrl;
          setPaymentUrl(paymentUrl);
          setShowPaymentModal(true);
          
          // Set up payment callback listener (same as below)
          const handlePaymentCallback = (event: MessageEvent) => {
            console.log('📨 Received message event:', event);
            if (event.data && typeof event.data === 'object') {
              if (event.data.status === 'success' || event.data.reference) {
                console.log('✅ Payment success detected via postMessage:', event.data);
                const reference = event.data.reference || event.data.trxref;
                handlePaymentSuccess(reference);
                window.removeEventListener('message', handlePaymentCallback);
              }
            } else if (typeof event.data === 'string') {
              try {
                const parsed = JSON.parse(event.data);
                if (parsed.status === 'success' || parsed.reference) {
                  console.log('✅ Payment success detected via postMessage (string):', parsed);
                  const reference = parsed.reference || parsed.trxref;
                  handlePaymentSuccess(reference);
                  window.removeEventListener('message', handlePaymentCallback);
                }
              } catch (e) {
                // Not JSON, ignore
              }
            }
          };
          
          window.addEventListener('message', handlePaymentCallback);
          
          // Also check for URL changes in the iframe
          let checkInterval: NodeJS.Timeout | null = null;
          const startUrlChecking = () => {
            checkInterval = setInterval(() => {
              const iframe = document.querySelector('iframe[title="Payment"]') as HTMLIFrameElement;
              if (iframe?.contentWindow) {
                try {
                  const iframeUrl = iframe.contentWindow.location.href;
                  console.log('🔍 Checking iframe URL:', iframeUrl);
                  
                  if (iframeUrl.includes('success') || iframeUrl.includes('callback') || iframeUrl.includes('reference=')) {
                    console.log('✅ Payment success detected from iframe URL');
                    if (checkInterval) clearInterval(checkInterval);
                    
                    const urlParams = new URLSearchParams(iframeUrl.split('?')[1] || '');
                    const reference = urlParams.get('reference') || urlParams.get('trxref');
                    handlePaymentSuccess(reference || undefined);
                  } else if (iframeUrl.includes('cancel') || iframeUrl.includes('close') || iframeUrl.includes('standard.paystack.co/close')) {
                    console.log('❌ Payment cancelled');
                    if (checkInterval) clearInterval(checkInterval);
                    setShowPaymentModal(false);
                    toast.error('Payment was cancelled');
                  }
                } catch (e) {
                  // Cross-origin error is expected, ignore
                }
              }
            }, 1000);
          };
          
          setTimeout(startUrlChecking, 2000);
          
          const cleanup = () => {
            window.removeEventListener('message', handlePaymentCallback);
            if (checkInterval) {
              clearInterval(checkInterval);
              checkInterval = null;
            }
          };
          
          (window as any).__paymentCleanup = cleanup;
          return; // Exit early for request response flow
        } else {
          const errorMsg = data.message || data.error || 'Failed to initiate payment';
          console.error('❌ bookFromRequestResponse failed:', errorMsg, data);
          throw new Error(errorMsg);
        }
        } catch (requestResponseError: any) {
        // Handle errors specifically for request response flow
        console.error('❌ Error in request response booking flow:', requestResponseError);
        let errorMessage = 'Failed to initiate payment. Please try again.';
        
        if (requestResponseError instanceof Error) {
          errorMessage = requestResponseError.message;
        } else if (requestResponseError.response) {
          try {
            const errorData = await requestResponseError.response.json().catch(() => ({}));
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            errorMessage = requestResponseError.response.statusText || errorMessage;
          }
        }
        
        toast.error(errorMessage, {
          duration: 6000,
          style: {
            maxWidth: '500px',
          },
        });
        setSubmitting(false);
        return; // Exit - don't fall through to regular reservation flow
      }
    }

    // Regular reservation flow (only runs if NOT fromRequestResponse)
    // Safety check: if fromRequestResponse is true, we should never reach here
    if (fromRequestResponse) {
      console.error('❌ ERROR: fromRequestResponse is true but reached regular reservation flow!');
      toast.error('Invalid booking flow. Please go back and try again.');
      setSubmitting(false);
      return;
    }
      // Verify reservation status before attempting payment
      if (!fromRequestResponse && reservationId && !reservationData) {
        await fetchReservationData();
      }

      // Check if reservation is still valid (only for regular reservations)
      if (!fromRequestResponse && reservationData && reservationData.status !== 'accepted') {
        toast.error('Your reservation is not accepted. Please wait for approval before booking.', {
          duration: 5000,
        });
        setSubmitting(false);
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // Add customer info
      formData.append('customerInfo[firstName]', firstName.trim());
      formData.append('customerInfo[lastName]', lastName.trim());
      formData.append('customerInfo[email]', email.trim());
      formData.append('customerInfo[phone]', phone.trim());
      
      // Add identification details
      formData.append('meansOfIdentification', meansOfId);
      formData.append('identificationNumber', idNumber.trim());
      
      // Add emergency contact
      formData.append('emergencyContact[name]', emergencyName.trim());
      formData.append('emergencyContact[phone]', emergencyPhone.trim());
      
      // Add other fields
      formData.append('acceptRefundPolicy', 'true');
      formData.append('specialRequests', '');
      
      // Add selectedBedrooms if provided
      if (selectedBedrooms !== null && selectedBedrooms !== undefined) {
        formData.append('selectedBedrooms', selectedBedrooms.toString());
      }
      
      // Add identification image if available
      if (uploadedIDDisplay) {
        formData.append('identificationImage', uploadedIDDisplay);
      }

      console.log('📄 Calling bookAndPay API with FormData...');
      console.log('📄 ReservationId:', reservationId);
      
      const response = await fetch(bookAndPay(reservationId), {
        method: 'POST',
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: formData
      });

      const data = await response.json();
      console.log('📄 bookAndPay response:', JSON.stringify(data, null, 2));

      if (data.status === 'success' && data.data?.payment?.authorizationUrl) {
        console.log('✅ Payment URL received, opening payment modal');
        const paymentUrl = data.data.payment.authorizationUrl;
        setPaymentUrl(paymentUrl);
        setShowPaymentModal(true);
        
        // Set up payment callback listener for postMessage
        const handlePaymentCallback = (event: MessageEvent) => {
          // Paystack sends postMessage on payment completion
          console.log('📨 Received message event:', event);
          if (event.data && typeof event.data === 'object') {
            if (event.data.status === 'success' || event.data.reference) {
              console.log('✅ Payment success detected via postMessage:', event.data);
              const reference = event.data.reference || event.data.trxref;
              handlePaymentSuccess(reference);
              window.removeEventListener('message', handlePaymentCallback);
            }
          } else if (typeof event.data === 'string') {
            // Sometimes Paystack sends string messages
            try {
              const parsed = JSON.parse(event.data);
              if (parsed.status === 'success' || parsed.reference) {
                console.log('✅ Payment success detected via postMessage (string):', parsed);
                const reference = parsed.reference || parsed.trxref;
                handlePaymentSuccess(reference);
                window.removeEventListener('message', handlePaymentCallback);
              }
            } catch (e) {
              // Not JSON, ignore
            }
          }
        };
        
        window.addEventListener('message', handlePaymentCallback);
        
        // Also check for URL changes in the iframe (for redirect-based callbacks)
        let checkInterval: NodeJS.Timeout | null = null;
        const startUrlChecking = () => {
          checkInterval = setInterval(() => {
            const iframe = document.querySelector('iframe[title="Payment"]') as HTMLIFrameElement;
            if (iframe?.contentWindow) {
              try {
                const iframeUrl = iframe.contentWindow.location.href;
                console.log('🔍 Checking iframe URL:', iframeUrl);
                
                // Check for success indicators in URL
                if (iframeUrl.includes('success') || iframeUrl.includes('callback') || iframeUrl.includes('reference=')) {
                  console.log('✅ Payment success detected from iframe URL');
                  if (checkInterval) clearInterval(checkInterval);
                  
                  // Extract reference from URL
                  const urlParams = new URLSearchParams(iframeUrl.split('?')[1] || '');
                  const reference = urlParams.get('reference') || urlParams.get('trxref');
                  handlePaymentSuccess(reference || undefined);
                } else if (iframeUrl.includes('cancel') || iframeUrl.includes('close') || iframeUrl.includes('standard.paystack.co/close')) {
                  console.log('❌ Payment cancelled');
                  if (checkInterval) clearInterval(checkInterval);
                  setShowPaymentModal(false);
                  toast.error('Payment was cancelled');
                }
              } catch (e) {
                // Cross-origin error is expected, ignore
              }
            }
          }, 1000);
        };
        
        // Start checking after a short delay to allow iframe to load
        setTimeout(startUrlChecking, 2000);
        
        // Cleanup function
        const cleanup = () => {
          window.removeEventListener('message', handlePaymentCallback);
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }
        };
        
        // Store cleanup function to call when modal closes
        (window as any).__paymentCleanup = cleanup;
      } else {
        throw new Error(data.message || 'Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Error calling bookAndPay:', error);
      let errorMessage = 'Failed to initiate payment. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Reservation must be accepted')) {
          errorMessage = 'Your reservation is not yet accepted. Please wait for approval before booking.';
        } else if (error.message.includes('already booked') || error.message.includes('dates are already booked')) {
          // Get dates from reservation data if available
          const checkInDate = reservationData?.checkInDate || reservationData?.priceBreakdown?.checkInDate;
          const checkOutDate = reservationData?.checkOutDate || reservationData?.priceBreakdown?.checkOutDate;
          
          if (checkInDate && checkOutDate) {
            errorMessage = `The dates ${checkInDate} to ${checkOutDate} are no longer available. The apartment may have been booked by another guest. Please go back and check your reservation status, or contact support for assistance.`;
          } else {
            errorMessage = 'The selected dates are no longer available. The apartment may have been booked by another guest. Please go back and check your reservation status, or contact support for assistance.';
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage, {
        duration: 6000,
        style: {
          maxWidth: '500px',
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentReference?: string) => {
    setPaymentSuccessful(true);
    setShowPaymentModal(false);
    
    // Store payment completion status
    if (apartmentId) {
      localStorage.setItem(`payment_completed_${apartmentId}`, 'true');
    }
    
    // Notify backend of successful payment (matching mobile app behavior)
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

      // For request response bookings, payment is already confirmed via bookFromRequestResponse
      // Only need to confirm for regular reservations
      if (authToken && !fromRequestResponse && reservationId) {
        // Create FormData for payment confirmation
        const confirmationFormData = new FormData();
        
        // Add payment status
        confirmationFormData.append('paymentStatus', 'success');
        confirmationFormData.append('paymentReference', paymentReference || 'payment_completed');
        
        // Add customer info
        confirmationFormData.append('customerInfo[firstName]', firstName.trim());
        confirmationFormData.append('customerInfo[lastName]', lastName.trim());
        confirmationFormData.append('customerInfo[email]', email.trim());
        confirmationFormData.append('customerInfo[phone]', phone.trim());
        
        // Add identification details
        confirmationFormData.append('meansOfIdentification', meansOfId);
        confirmationFormData.append('identificationNumber', idNumber.trim());
        
        // Add emergency contact
        confirmationFormData.append('emergencyContact[name]', emergencyName.trim());
        confirmationFormData.append('emergencyContact[phone]', emergencyPhone.trim());
        
        // Add other fields
        confirmationFormData.append('acceptRefundPolicy', 'true');
        
        // Add selectedBedrooms if provided
        if (selectedBedrooms !== null && selectedBedrooms !== undefined) {
          confirmationFormData.append('selectedBedrooms', selectedBedrooms.toString());
        }
        
        // Add identification image if available
        if (uploadedIDDisplay) {
          confirmationFormData.append('identificationImage', uploadedIDDisplay);
        }

        // Call bookAndPay endpoint to confirm payment
        const response = await fetch(bookAndPay(reservationId), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: confirmationFormData
        });

        if (response.ok) {
          console.log('✅ Payment confirmation sent to backend');
        } else {
          console.warn('⚠️ Payment confirmation failed, but payment was successful');
        }
      } else if (fromRequestResponse) {
        console.log('✅ Request response booking - payment already confirmed via bookFromRequestResponse');
      }
    } catch (error) {
      console.error('⚠️ Error confirming payment with backend:', error);
      // Don't show error to user since payment was successful
    }
    
    toast.success('Payment and booking successful!');
    
    // Navigate back to apartment details after a delay
    setTimeout(() => {
      router.push(`/apartments/${apartmentId}`);
    }, 2000);
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

  if (paymentSuccessful) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex items-center justify-center`}>
          <div className="text-center">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-600 dark:text-gray-400">Your booking has been confirmed.</p>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Book Apartment
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Complete your booking details to secure your reservation
            </p>
          </div>

          {/* Customer Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full mr-3">
                <User size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Customer Information</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Details of the person checking in</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Identification Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-full mr-3">
                <Shield size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Identification</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upload a valid means of identification</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Means of Identification *
                </label>
                <select
                  value={meansOfId}
                  onChange={(e) => setMeansOfId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select identification type</option>
                  {idOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Number *
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter ID number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload ID Photo *
                </label>
                {uploadedIDDisplay ? (
                  <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText size={20} className="text-gray-600 dark:text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{uploadedIDDisplay.name}</span>
                      </div>
                      <button
                        onClick={removeFile}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors bg-white dark:bg-gray-700"
                  >
                    <Upload size={32} className="text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload ID photo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Max size: 5MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-full mr-3">
                <AlertCircle size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Emergency Contact</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Contact person in case of emergency</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter contact phone"
                />
              </div>
            </div>
          </div>

          {/* Refund Policy */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="policy"
                checked={policyAccepted}
                onChange={(e) => setPolicyAccepted(e.target.checked)}
                className="mt-1 mr-3 w-5 h-5 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary bg-white dark:bg-gray-700"
              />
              <label htmlFor="policy" className="text-sm text-gray-700 dark:text-gray-300">
                I accept the refund policy and terms of service *
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={initiateBookingPayment}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-primary-light to-primary-dark text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Processing...' : 'Proceed to Payment'}
          </button>

          {/* Payment Modal */}
          {showPaymentModal && paymentUrl && (
            <>
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-50"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel payment?')) {
                    setShowPaymentModal(false);
                  }
                }}
              />
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] max-w-3xl h-[80vh] sm:h-[75vh] md:h-[70vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col">
                <div className="flex justify-between items-center p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Complete Payment</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // Allow user to manually verify payment if automatic detection didn't work
                        if (confirm('Did you complete the payment? If yes, we will verify and process your booking.')) {
                          handlePaymentSuccess();
                        }
                      }}
                      className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium px-2 py-1"
                    >
                      Payment Done?
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel payment?')) {
                          // Cleanup payment listeners
                          if ((window as any).__paymentCleanup) {
                            (window as any).__paymentCleanup();
                            delete (window as any).__paymentCleanup;
                          }
                          setShowPaymentModal(false);
                        }
                      }}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <X size={20} className="sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden min-h-0">
                  <iframe
                    src={paymentUrl}
                    className="w-full h-full border-0"
                    title="Payment"
                    allow="payment"
                    onLoad={() => {
                      console.log('💳 Payment iframe loaded');
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function BookApartmentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    }>
      <BookApartmentContent />
    </Suspense>
  );
}

