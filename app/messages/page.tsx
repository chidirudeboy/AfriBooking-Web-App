'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { getUserChats, getChatByBooking } from '@/lib/endpoints';
import axios from 'axios';
import { MessageSquare, RefreshCw, Send, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface Chat {
  _id: string;
  id?: string;
  bookingId?: string;
  booking?: {
    _id: string;
    propertyDetails?: {
      name?: string;
    };
    apartment?: {
      name?: string;
    };
    propertyName?: string;
    apartmentName?: string;
  };
  metadata?: {
    propertyName?: string;
    bookingRef?: string;
    checkInDate?: string;
    checkOutDate?: string;
  };
  propertyName?: string;
  apartmentName?: string;
  lastMessage?: {
    content?: string;
    createdAt?: string;
    created_at?: string;
    sender?: {
      _id?: string;
      firstName?: string;
      lastName?: string;
    };
  };
  lastActivityAt?: string;
  unreadCount?: number | {
    user?: number;
    agent?: number;
  };
  status?: string;
  createdAt?: string;
  created_at?: string;
  participants?: Array<{
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }>;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'closed'>('active');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchChats();
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(() => {
      fetchChats(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [user, router, filter]);

  const fetchChats = useCallback(async (showLoading = true) => {
    if (!user) return;

    try {
      if (showLoading) {
        setRefreshing(true);
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

      const response = await axios.get(getUserChats(filter), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000
      });

      let chatsData: Chat[] = [];
      if (response.data?.success && response.data?.data) {
        // Mobile app structure: { success: true, data: { chats: [...] } }
        if (response.data.data.chats && Array.isArray(response.data.data.chats)) {
          chatsData = response.data.data.chats;
        } else if (Array.isArray(response.data.data)) {
          chatsData = response.data.data;
        }
      } else if (response.data?.chats) {
        chatsData = Array.isArray(response.data.chats) ? response.data.chats : [];
      } else if (Array.isArray(response.data)) {
        chatsData = response.data;
      }

      setChats(chatsData);
    } catch (error: any) {
      console.error('Error fetching chats:', error);
      if (showLoading) {
        toast.error(error.response?.data?.message || 'Failed to load messages');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user, filter]);

  const getChatTitle = (chat: Chat): string => {
    return chat.metadata?.propertyName ||
           chat.booking?.propertyDetails?.name || 
           chat.booking?.apartment?.name || 
           chat.booking?.propertyName || 
           chat.booking?.apartmentName ||
           chat.propertyName || 
           chat.apartmentName || 
           'Chat';
  };

  const getLastMessagePreview = (chat: Chat): string | null => {
    if (chat.lastMessage?.content) {
      const content = chat.lastMessage.content;
      return content.length > 50 ? content.substring(0, 50) + '...' : content;
    }
    // Don't show "No messages yet" - return null to hide it
    return null;
  };

  const getLastMessageTime = (chat: Chat): string => {
    // Use lastActivityAt if available (mobile app structure), otherwise use lastMessage time or createdAt
    const time = chat.lastActivityAt || 
                  chat.lastMessage?.createdAt || 
                  chat.lastMessage?.created_at || 
                  chat.createdAt || 
                  chat.created_at;
    if (!time) return '';
    
    try {
      const date = new Date(time);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true });
      } else {
        return format(date, 'MMM dd, yyyy');
      }
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex items-center justify-center`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
          </div>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Messages</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Chat with property owners</p>
            </div>
            <button
              onClick={() => fetchChats()}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={`text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="mb-4 sm:mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 font-medium text-sm sm:text-base transition-colors ${
                filter === 'active'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 font-medium text-sm sm:text-base transition-colors ${
                filter === 'closed'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Closed
            </button>
          </div>

          {/* Chats List */}
          {chats.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <MessageSquare size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No {filter} chats</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                {filter === 'active' 
                  ? "You don't have any active conversations yet."
                  : "You don't have any closed conversations."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {chats.map((chat) => {
                const chatId = chat._id || chat.id;
                // Handle both number and object unreadCount structures
                const unreadCount = typeof chat.unreadCount === 'object' 
                  ? (chat.unreadCount?.user || 0)
                  : (chat.unreadCount || 0);
                const chatTitle = getChatTitle(chat);
                const lastMessage = getLastMessagePreview(chat);
                const lastMessageTime = getLastMessageTime(chat);

                return (
                  <button
                    key={chatId}
                    onClick={() => router.push(`/messages/${chatId}`)}
                    className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow text-left p-4 sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-lg sm:text-xl flex-shrink-0">
                        {chatTitle.charAt(0).toUpperCase()}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {chatTitle}
                          </h3>
                          {lastMessageTime && (
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                              {lastMessageTime}
                            </span>
                          )}
                        </div>
                        {lastMessage ? (
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate mb-2">
                            {lastMessage}
                          </p>
                        ) : (
                          <div className="mb-2 space-y-1">
                            {chat.metadata?.bookingRef && (
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Booking: {chat.metadata.bookingRef}
                              </p>
                            )}
                            {chat.metadata?.checkInDate && chat.metadata?.checkOutDate && (
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                {format(new Date(chat.metadata.checkInDate), 'MMM dd')} - {format(new Date(chat.metadata.checkOutDate), 'MMM dd, yyyy')}
                              </p>
                            )}
                          </div>
                        )}
                        {chat.booking?._id && !chat.metadata?.bookingRef && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Booking ID: {chat.booking._id.slice(-8)}
                          </p>
                        )}
                      </div>

                      {/* Unread Badge */}
                      {unreadCount > 0 && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

