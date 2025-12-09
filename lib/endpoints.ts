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
export const cancelReservation = (reservationId: string) => endpoint2(`reservations/${reservationId}/cancel`);
export const bookingHistory = endpoint("apartment/booking/history");
export const userBookingHistory = (page = 1, limit = 10, status = "booked,completed", startDate = "2024-01-01", endDate = "2024-12-31") => 
  `${baseUrl2}/bookings/user/history?page=${page}&limit=${limit}&status=${status}&startDate=${startDate}&endDate=${endDate}`;
export const ViewUserBookingHistory = (bookingId: string) => endpoint2(`bookings/user/${bookingId}`);
export const bookAndPay = (reservationId: string) => endpoint2(`bookings/${reservationId}/book-and-pay`); 

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
export const getUserChats = (status = 'active') => endpoint2(`chat/my-chats?status=${status}`);
export const getChatByBooking = (bookingId: string) => endpoint2(`chat/booking/${bookingId}`);
export const getChatMessages = (chatId: string, page = 1, limit = 50) =>
  endpoint2(`chat/${chatId}/messages?page=${page}&limit=${limit}`);
export const sendChatMessage = (chatId: string) => endpoint2(`chat/${chatId}/messages`);
export const markChatAsRead = (chatId: string) => endpoint2(`chat/${chatId}/read`);
export const closeChat = (chatId: string) => endpoint2(`chat/${chatId}/close`);

