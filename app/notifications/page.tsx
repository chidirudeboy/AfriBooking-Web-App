'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { getAllNotification, markSingleNotificationRead, deleteSingleNotification, deleteSingleNotificationAlt, deleteSingleNotificationAlt2, deleteSingleNotificationAlt3, sendInspection } from '@/lib/endpoints';
import axios from 'axios';
import { Bell, Trash2, CheckCircle, X, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Notification {
  id?: string;
  _id?: string;
  title?: string;
  body?: string;
  message?: string;
  is_read?: boolean;
  read?: boolean;
  notification_type?: string;
  type?: string;
  data?: string | any;
  created_at?: string;
  createdAt?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchNotifications();
  }, [user, router]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setRefreshing(true);
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

      const response = await axios.get(getAllNotification(userId), {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        timeout: 15000
      });

      let notificationsData: Notification[] = [];
      if (response.data?.success && response.data?.data) {
        notificationsData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (response.data?.status === 'success' && response.data?.notifications) {
        notificationsData = Array.isArray(response.data.notifications) ? response.data.notifications : [];
      }

      setNotifications(notificationsData);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error(error.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const markAsRead = async (notification: Notification) => {
    const notificationId = notification.id || notification._id;
    if (!notificationId) return;

    const isRead = notification.is_read !== undefined ? notification.is_read : notification.read;
    if (isRead) return;

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

      await axios.patch(markSingleNotificationRead(notificationId), {}, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });

      // Update local state
      setNotifications(prev => prev.map(n => 
        (n.id || n._id) === notificationId 
          ? { ...n, is_read: true, read: true }
          : n
      ));

      fetchNotifications();
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const deleteNotification = async (notification: Notification) => {
    const notificationId = notification.id || notification._id;
    if (!notificationId) return;

    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

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

      const endpoints = [
        deleteSingleNotification(notificationId),
        deleteSingleNotificationAlt(notificationId),
        deleteSingleNotificationAlt2(notificationId),
        deleteSingleNotificationAlt3(notificationId)
      ];

      let deleted = false;
      for (const endpoint of endpoints) {
        try {
          const response = await axios.delete(endpoint, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            }
          });

          if (response.data?.success || response.status === 200 || response.status === 204) {
            deleted = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (deleted) {
        toast.success('Notification deleted');
        setNotifications(prev => prev.filter(n => (n.id || n._id) !== notificationId));
      } else {
        toast.error('Failed to delete notification');
      }
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const isExpired = (createdAt: string | undefined): boolean => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return created < oneHourAgo;
  };

  const parseNotificationData = (data: string | any): any => {
    if (!data) return {};
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return {};
      }
    }
    return data;
  };

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

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className="p-3 sm:p-4 lg:p-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Notifications</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Stay updated with your booking activities</p>
            </div>
            <button
              onClick={fetchNotifications}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={`text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
                <Bell size={32} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No notifications</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {notifications.map((notification) => {
                const notificationId = notification.id || notification._id;
                const notificationTitle = notification.title || '';
                const notificationBody = notification.body || notification.message || '';
                const isRead = notification.is_read !== undefined ? notification.is_read : notification.read;
                const notificationType = notification.notification_type || notification.type || '';
                const createdAt = notification.created_at || notification.createdAt;
                const expired = isExpired(createdAt);
                const data = parseNotificationData(notification.data);

                // Determine if notification should be clickable (reservation accepted)
                // Check for both snake_case and camelCase field names
                const apartmentId = data?.apartment_id || data?.apartmentId || data?.propertyId || data?.property_id;
                const reservationId = data?.reservation_id || data?.reservationId;
                
                // Check if this is an accepted reservation notification
                // Also check for variations of the notification type
                const isAcceptType = notificationType === 'airbnb_accept' || 
                                     notificationType === 'accept' ||
                                     notificationType?.toLowerCase().includes('accept');
                
                const isReservationAccepted = !expired && 
                  isAcceptType && 
                  apartmentId && 
                  reservationId;

                // Debug logging (remove in production if needed)
                if (isAcceptType && apartmentId && reservationId) {
                  console.log('📬 Accepted reservation notification detected:', {
                    notificationType,
                    apartmentId,
                    reservationId,
                    expired,
                    isReservationAccepted
                  });
                }

                const handleNotificationClick = async (e?: React.MouseEvent) => {
                  // Prevent navigation if clicking on action buttons
                  if (e && (e.target as HTMLElement).closest('button')) {
                    return;
                  }

                  if (isReservationAccepted && apartmentId && reservationId) {
                    try {
                      // Mark as read if not already read
                      if (!isRead) {
                        await markAsRead(notification);
                      }
                      // Route directly to booking page
                      const bookingUrl = `/apartments/${apartmentId}/book?reservationId=${reservationId}`;
                      console.log('🚀 Navigating to booking page:', bookingUrl);
                      router.push(bookingUrl);
                    } catch (error) {
                      console.error('❌ Error navigating to booking page:', error);
                      toast.error('Failed to navigate to booking page. Please try again.');
                    }
                  } else {
                    console.log('⚠️ Notification not clickable:', {
                      isReservationAccepted,
                      apartmentId,
                      reservationId,
                      notificationType,
                      expired
                    });
                  }
                };

                return (
                  <div
                    key={notificationId}
                    className={`bg-white dark:bg-gray-800 rounded-lg border-2 shadow-sm transition-all ${
                      !isRead ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                    } ${isReservationAccepted ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''}`}
                    onClick={isReservationAccepted ? handleNotificationClick : undefined}
                    role={isReservationAccepted ? 'button' : undefined}
                    tabIndex={isReservationAccepted ? 0 : undefined}
                    onKeyDown={isReservationAccepted ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick();
                      }
                    } : undefined}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            {!isRead && (
                              <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                            )}
                            <div className="flex-1 min-w-0">
                              {notificationTitle && (
                                <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white mb-1">
                                  {notificationTitle}
                                </h3>
                              )}
                              <p className={`text-sm sm:text-base leading-relaxed ${
                                expired ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {expired 
                                  ? 'This reservation request is expired, kindly place another one.'
                                  : notificationBody
                                }
                              </p>
                              {createdAt && (
                                <p className="text-xs sm:text-sm text-orange-500 dark:text-orange-400 mt-2">
                                  {format(new Date(createdAt), 'MMM dd, yyyy h:mm a')}
                                </p>
                              )}
                              {isReservationAccepted && (
                                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                                  Click to book now →
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {!isRead && (
                            <button
                              onClick={() => markAsRead(notification)}
                              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle size={18} className="text-blue-600 dark:text-blue-400" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>

                      {/* Action Button - Show for accepted reservations */}
                      {isReservationAccepted && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick();
                            }}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-light to-primary-dark text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base flex items-center justify-center gap-2"
                          >
                            <span>Book Now</span>
                            <Calendar size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

