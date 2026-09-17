// Import environment configuration
import { baseUrl as envBaseUrl, paystackKey as envPaystackKey, paystackSecret as envPaystackSecret } from './config/environment';

// Use environment-based configuration
export const baseUrl2 = envBaseUrl;
export const paystack_key = envPaystackKey;
export const paystack_key_secret = envPaystackSecret;

// Legacy baseUrl (keeping for backward compatibility)
export const baseUrl = "https://africartz.xyz/api";
const endpoint = (path: string) => baseUrl + "/" + path;
const endpoint2 = (path: string) => baseUrl2 + "/" + path;

export const register = "register";
export const login = "login";
export const validateToken = "validate-token";
export const myProfile = "user";
export const updateProfile = endpoint2("user/update");
export const createAccount = endpoint2("auth/createAccount"); 
export const loginUser = endpoint2("auth/login"); 
export const userProfile = endpoint2("auth/user-profile"); 
export const forgotPassword = endpoint2("auth/user/forgot-password");
export const resetPassword = endpoint2("auth/user/reset-password-otp"); 
export const deleteAccount = endpoint2("auth/user/delete-account");
export const requestEmailVerification = endpoint2("auth/user/verify-email/request");
export const verifyEmailVerification = endpoint2("auth/user/verify-email");
export const requestPhoneVerification = endpoint2("auth/user/verify-phone/request");
export const verifyPhoneVerification = endpoint2("auth/user/verify-phone");

// Referral program
export const getMyReferral = endpoint2("referrals/my-referral");
export const getMyAgentReferrals = endpoint2("referrals/my-agent-referrals");
export const validateReferralCode = endpoint2("referrals/validate");
export const getReferralStats = endpoint2("referrals/stats");
export const getReferralList = endpoint2("referrals/list");
export const generateReferralCode = endpoint2("referrals/generate");

// Primary apartment endpoint
export const getEveryApartments = endpoint2("apartment/approved-apartments");

// Alternative apartment endpoints to try if primary fails
export const getApartmentsAlt1 = endpoint2("apartments");
export const getApartmentsAlt2 = endpoint2("apartment/list");
export const getApartmentsAlt3 = endpoint2("apartment/all");
export const getApartmentsPublic = endpoint("apartment/approved-apartments");
export const getSingleApartmentUserDetails = endpoint2("apartment/getSingleApartmentUser");
export const sendReservation = endpoint2("reservations/request"); 
export const sendInspection = endpoint2("inspections/request"); 
export const inspectionRequest = endpoint2("inspections/request"); 
export const postPayment = endpoint2("payments/initiate")
export const calculateReservationPrice = endpoint2("reservations/calculate-price");
export const cancelReservation = (reservationId: string) => endpoint2(`reservations/${reservationId}/cancel`);
export const createBookingReview = (bookingId: string) => endpoint2(`reviews/bookings/${bookingId}/review`);
export const getUserReviews = endpoint2("reviews/user/reviews");
export const getApartmentReviews = (apartmentId: string, page = 1, limit = 10, sortBy = "newest") =>
  endpoint2(`reviews/apartments/${apartmentId}/reviews?page=${page}&limit=${limit}&sortBy=${sortBy}`);
export const getApartmentReviewStats = (apartmentId: string) => endpoint2(`reviews/apartments/${apartmentId}/stats`);

// Saved apartments
export const getFavorites = endpoint2("favorites");
export const addFavorite = (apartmentId: string) => endpoint2(`favorites/${apartmentId}`);
export const removeFavorite = (apartmentId: string) => endpoint2(`favorites/${apartmentId}`);
export const bookingHistory = endpoint("apartment/booking/history");
export const userBookingHistory = (page = 1, limit = 10, status = "booked,completed", startDate = "2024-01-01", endDate = "2024-12-31") => 
  `${baseUrl2}/bookings/user/history?page=${page}&limit=${limit}&status=${status}&startDate=${startDate}&endDate=${endDate}`;
export const ViewUserBookingHistory = (bookingId: string) => endpoint2(`bookings/user/${bookingId}`);
export const bookAndPay = (reservationId: string) => endpoint2(`bookings/${reservationId}/book-and-pay`); 
export const extendBookingPreview = (bookingId: string, newCheckOutDate: string) =>
  endpoint2(`bookings/${bookingId}/extend/preview?newCheckOutDate=${encodeURIComponent(newCheckOutDate)}`);
export const extendBooking = (bookingId: string) => endpoint2(`bookings/${bookingId}/extend`);
export const requestExtension = (bookingId: string) => endpoint2(`bookings/${bookingId}/extend/request`);
export const getExtensionRequest = (bookingId: string) => endpoint2(`bookings/${bookingId}/extend/request`);
export const verifyPaymentByReference = (reference: string) => endpoint2(`payments/verify/${reference}`);

export const sentExpoToken = endpoint2("notifications/save-expo-token");
export const getAllNotification = (userId: string) => endpoint2(`notifications/all?userId=${userId}`);
export const unreadCount = (userId: string) => endpoint2(`notifications/unread-count?userId=${userId}`);
export const readNotification = endpoint2("notifications/mark-as-read");
export const markSingleNotificationRead = (notificationId: string) => endpoint2(`notifications/${notificationId}/read`);
export const deleteSingleNotification = (notificationId: string) => endpoint2(`notifications/${notificationId}`);
export const deleteSingleNotificationAlt = (notificationId: string) => endpoint2(`notifications/${notificationId}/delete`);
export const deleteSingleNotificationAlt2 = (notificationId: string) => endpoint2(`notifications/delete/${notificationId}`);
export const deleteSingleNotificationAlt3 = (notificationId: string) => endpoint2(`notifications/delete?id=${notificationId}`);

export const paymentHistory = (reservationId: string) => endpoint2(`bookings/reservation/${reservationId}/payment-breakdown`);

// Get available dates for apartment
export const getAvailableDates = (apartmentId: string, startDate: string, endDate: string) =>
  endpoint2(`apartment/${apartmentId}/available-dates?startDate=${startDate}&endDate=${endDate}`);

// Chat endpoints
export const createChatForBooking = endpoint2("chat/create");
export const createInquiryChat = endpoint2("chat/inquiry/create");
export const getUserChats = (status = 'active') => endpoint2(`chat/my-chats?status=${status}`);
export const getChatByBooking = (bookingId: string) => endpoint2(`chat/booking/${bookingId}`);
export const getChatByReservation = (reservationId: string) => endpoint2(`chat/reservation/${reservationId}`);
export const getChatMessages = (chatId: string, page = 1, limit = 50) =>
  endpoint2(`chat/${chatId}/messages?page=${page}&limit=${limit}`);
export const sendChatMessage = (chatId: string) => endpoint2(`chat/${chatId}/messages`);
export const markChatAsRead = (chatId: string) => endpoint2(`chat/${chatId}/read`);
export const closeChat = (chatId: string) => endpoint2(`chat/${chatId}/close`);
export const getNearbyPlaces = (latitude: number, longitude: number) =>
  endpoint2(`places/nearby?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`);

// Request endpoints
export const createUserRequest = endpoint2("user/request/create");
export const getUserRequests = (status?: string, page = 1, limit = 10) => 
  endpoint2(`user/request/my-requests?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`);
export const getRequestResponses = (requestId: string) => endpoint2(`user/request/${requestId}/responses`);
export const closeUserRequest = (requestId: string) => endpoint2(`user/request/${requestId}/close`);
export const deleteUserRequest = (requestId: string) => endpoint2(`user/request/${requestId}`);
export const bookFromRequestResponse = (requestId: string, requestResponseId: string, apartmentId: string) =>
	endpoint2(`bookings/request/${requestId}/response/${requestResponseId}/apartment/${apartmentId}/book`);

// Bargains and price negotiation
export const createBargain = endpoint2("bargains");
export const getBargainConfig = endpoint2("bargains/config");
export const getMyBargains = endpoint2("bargains/my-bargains");
export const getBargainById = (bargainId: string) => endpoint2(`bargains/${bargainId}`);
export const respondToBargain = (bargainId: string) => endpoint2(`bargains/${bargainId}/respond`);
export const acceptUserBargain = (bargainId: string) => endpoint2(`bargains/${bargainId}/accept`);
export const cancelBargain = (bargainId: string) => endpoint2(`bargains/${bargainId}/cancel`);
export const payForBargain = (bargainId: string) => endpoint2(`bargains/${bargainId}/pay`);

export const getLandlordPolicy = (apartmentId: string) => endpoint2(`apartment/${apartmentId}/landlord-policy`);
