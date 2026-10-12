'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllNotification } from '@/lib/endpoints';
import api from '@/lib/utils/api';

export default function BrowserNotificationBridge() {
  const { user } = useAuth();
  const seen = useRef<Set<string>>(new Set());
  useEffect(() => {
    const userId = user?.user?._id || user?._id || user?.id;
    if (!userId || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const poll = async (initial = false) => {
      try {
        const { data } = await api.get(getAllNotification(userId));
        const notifications = data?.data || data?.notifications || [];
        notifications.slice(0, 20).forEach((item: any) => {
          const id = String(item?._id || item?.id || `${item?.title}-${item?.createdAt}`);
          if (!seen.current.has(id) && !initial && Notification.permission === 'granted') new Notification(item?.title || 'AfriBooking update', { body: item?.body || item?.message || 'You have a new update.', icon: '/favicon.ico', tag: id });
          seen.current.add(id);
        });
      } catch { /* in-app notification page remains the fallback */ }
    };
    poll(true);
    const interval = window.setInterval(() => poll(false), 60000);
    return () => window.clearInterval(interval);
  }, [user]);
  return null;
}
