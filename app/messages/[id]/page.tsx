'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { getChatMessages, sendChatMessage, markChatAsRead, getUserChats } from '@/lib/endpoints';
import axios from 'axios';
import { ArrowLeft, Send, RefreshCw, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface Message {
  _id: string;
  id?: string;
  content: string;
  senderId?: string;
  senderType?: 'user' | 'agent' | 'system';
  sender?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt?: string;
  created_at?: string;
  isRead?: boolean;
  read?: boolean;
}

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
  participants?: Array<{
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }>;
  status?: string;
}

export default function ChatDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatId = params.id as string;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!chatId) {
      router.push('/messages');
      return;
    }
    
    fetchChatInfo();
    fetchMessages();
    markChatAsReadHandler();

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      fetchNewMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, router, chatId]);

  const fetchChatInfo = async () => {
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

      const response = await axios.get(getUserChats('active'), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      let chatsData: Chat[] = [];
      if (response.data?.success && response.data?.data) {
        if (response.data.data.chats && Array.isArray(response.data.data.chats)) {
          chatsData = response.data.data.chats;
        } else if (Array.isArray(response.data.data)) {
          chatsData = response.data.data;
        }
      } else if (response.data?.chats) {
        chatsData = Array.isArray(response.data.chats) ? response.data.chats : [];
      }

      const foundChat = chatsData.find(c => (c._id || c.id) === chatId);
      if (foundChat) {
        setChat(foundChat);
      }
    } catch (error) {
      console.error('Error fetching chat info:', error);
    }
  };

  const fetchMessages = async (pageNum = 1, append = false) => {
    if (!chatId) return;

    try {
      if (pageNum === 1) {
        setLoading(true);
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

      const response = await axios.get(getChatMessages(chatId, pageNum, 50), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      let messagesData: Message[] = [];
      if (response.data?.success && response.data?.data) {
        // Mobile app structure: { success: true, data: { messages: [...], totalPages: X, currentPage: Y } }
        if (response.data.data.messages && Array.isArray(response.data.data.messages)) {
          messagesData = response.data.data.messages;
        } else if (Array.isArray(response.data.data)) {
          messagesData = response.data.data;
        }
      } else if (response.data?.messages) {
        messagesData = Array.isArray(response.data.messages) ? response.data.messages : [];
      } else if (Array.isArray(response.data)) {
        messagesData = response.data;
      }

      // Sort messages by createdAt to ensure correct order (oldest to newest)
      messagesData.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
        const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
        return timeA - timeB; // Oldest first
      });
      
      console.log('📨 Fetched messages:', messagesData.length, messagesData);
      console.log('👤 Current user ID:', user?.user?._id || user?._id || user?.id);
      
      if (append) {
        // When loading older messages, add them to the beginning
        setMessages(prev => [...messagesData, ...prev]);
      } else {
        // Initial load - set messages and scroll to bottom
        setMessages(messagesData);
        // Scroll to bottom after initial load
        setTimeout(() => scrollToBottom(), 100);
      }

      // Check if there are more pages from the API response
      const totalPages = response.data?.data?.totalPages || response.data?.totalPages;
      if (totalPages) {
        setHasMore(pageNum < totalPages);
      } else {
        setHasMore(messagesData.length === 50);
      }
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error(error.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewMessages = async () => {
    if (!chatId || loading) return;

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

      const response = await axios.get(getChatMessages(chatId, 1, 50), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      let messagesData: Message[] = [];
      if (response.data?.success && response.data?.data) {
        if (response.data.data.messages && Array.isArray(response.data.data.messages)) {
          messagesData = response.data.data.messages;
        } else if (Array.isArray(response.data.data)) {
          messagesData = response.data.data;
        }
      } else if (response.data?.messages) {
        messagesData = Array.isArray(response.data.messages) ? response.data.messages : [];
      } else if (Array.isArray(response.data)) {
        messagesData = response.data;
      }

      // Sort messages by createdAt to ensure correct order (oldest to newest)
      messagesData.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
        const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
        return timeA - timeB; // Oldest first
      });

      // Only update if there are new messages
      if (messagesData.length > messages.length) {
        setMessages(messagesData);
        scrollToBottom();
        markChatAsReadHandler();
      }
    } catch (error) {
      // Silently fail for polling
      console.error('Error polling messages:', error);
    }
  };

  const markChatAsReadHandler = async () => {
    if (!chatId) return;

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

      await axios.patch(markChatAsRead(chatId), {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Silently fail
      console.error('Error marking chat as read:', error);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!messageText.trim() || !chatId || sending) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

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

      const response = await axios.post(
        sendChatMessage(chatId),
        { content: textToSend },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.success || response.data?.message) {
        // Get the message from response - could be in data.message or data.data.message
        const responseMessage = response.data.data?.message || 
                                response.data.data || 
                                response.data.message;
        
        // Add the new message to the list with proper structure
        const newMessage: Message = responseMessage || {
          _id: Date.now().toString(),
          content: textToSend,
          senderType: 'user',
          senderId: user?.user?._id || user?._id || '',
          sender: {
            _id: user?.user?._id || user?._id || '',
            firstName: user?.user?.firstName,
            lastName: user?.user?.lastName,
            email: user?.email,
          },
          createdAt: new Date().toISOString(),
        };
        
        // Ensure senderType and senderId are set for user messages
        if (!newMessage.senderType) {
          newMessage.senderType = 'user';
        }
        if (!newMessage.senderId && newMessage.sender?._id) {
          newMessage.senderId = newMessage.sender._id;
        }
        
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => scrollToBottom(), 100);
      } else {
        // If response doesn't have the message, refetch
        setTimeout(() => fetchMessages(1, false), 500);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
      setMessageText(textToSend); // Restore message text on error
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Also try scrolling the container directly
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    });
  };

  const loadMoreMessages = () => {
    if (hasMore && !loading) {
      fetchMessages(page + 1, true);
    }
  };

  const isMyMessage = (message: Message): boolean => {
    const userId = user?.user?._id || user?._id || user?.id;
    if (!userId) return false;
    
    // Check senderType first (mobile app structure)
    if (message.senderType !== undefined) {
      // If senderType is 'user', it's a user message - check if it's from current user
      if (message.senderType === 'user') {
        const messageSenderId = message.senderId || message.sender?._id;
        return messageSenderId === userId || String(messageSenderId) === String(userId);
      }
      // If senderType is 'agent' or 'system', it's not the user's message
      return false;
    }
    
    // Fallback: check sender._id or senderId
    const messageSenderId = message.senderId || message.sender?._id;
    return messageSenderId === userId || String(messageSenderId) === String(userId);
  };

  const getSenderName = (message: Message): string => {
    if (isMyMessage(message)) {
      return 'You';
    }
    if (message.sender?.firstName && message.sender?.lastName) {
      return `${message.sender.firstName} ${message.sender.lastName}`;
    }
    return message.sender?.email || 'Unknown';
  };

  const getMessageTime = (message: Message): string => {
    const time = message.createdAt || message.created_at;
    if (!time) return '';
    
    try {
      const date = new Date(time);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return format(date, 'h:mm a');
      } else {
        return format(date, 'MMM dd, h:mm a');
      }
    } catch {
      return '';
    }
  };

  const getChatTitle = (): string => {
    if (!chat) return 'Chat';
    return chat.metadata?.propertyName ||
           chat.booking?.propertyDetails?.name || 
           chat.booking?.apartment?.name || 
           chat.booking?.propertyName || 
           chat.booking?.apartmentName ||
           chat.propertyName || 
           chat.apartmentName || 
           'Chat';
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex items-center justify-center`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex flex-col`}>
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/messages')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                {getChatTitle()}
              </h1>
              {chat?.booking?._id && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Booking ID: {chat.booking._id.slice(-8)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            if (target.scrollTop === 0 && hasMore) {
              loadMoreMessages();
            }
          }}
        >
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMoreMessages}
                disabled={loading}
                className="text-sm text-primary hover:underline"
              >
                {loading ? 'Loading...' : 'Load older messages'}
              </button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <MessageSquare size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No messages yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMine = isMyMessage(message);
              const prevSenderId = messages[index - 1]?.senderId || messages[index - 1]?.sender?._id;
              const currentSenderId = message.senderId || message.sender?._id;
              const showAvatar = index === 0 || prevSenderId !== currentSenderId;
              const messageTime = getMessageTime(message);
              const isSystemMessage = message.senderType === 'system';
              
              // Debug logging
              if (index === 0) {
                console.log('🔍 Message check:', {
                  messageId: message._id,
                  senderType: message.senderType,
                  senderId: message.senderId,
                  sender: message.sender,
                  isMine,
                  userId: user?.user?._id || user?._id || user?.id
                });
              }

              // System messages
              if (isSystemMessage) {
                return (
                  <div key={message._id || message.id || index} className="flex justify-center my-4">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic text-center">
                        {message.content}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message._id || message.id || index}
                  className={`flex gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  {showAvatar && !isMine && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {getSenderName(message).charAt(0).toUpperCase()}
                    </div>
                  )}
                  {showAvatar && isMine && <div className="w-8 flex-shrink-0" />}

                  {/* Message Bubble */}
                  <div className={`flex flex-col max-w-[70%] sm:max-w-[60%] ${isMine ? 'items-end' : 'items-start'}`}>
                    {showAvatar && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
                        {getSenderName(message)}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isMine
                          ? 'bg-primary text-black'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    {messageTime && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                        {messageTime}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

