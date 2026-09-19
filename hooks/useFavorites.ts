'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/utils/api';
import { addFavorite, getFavorites, removeFavorite } from '@/lib/endpoints';
import { useAuth } from '@/contexts/AuthContext';

export function useFavorites() {
  const { user } = useAuth();
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    setLoadingFavorites(true);
    try {
      const response = await api.get(getFavorites);
      const ids = response.data?.data?.apartmentIds || response.data?.apartmentIds || [];
      setFavoriteIds(new Set(Array.isArray(ids) ? ids.map(String) : []));
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Unable to load saved stays.');
      }
    } finally {
      setLoadingFavorites(false);
    }
  }, [user]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const toggleFavorite = async (apartmentId: string) => {
    if (!user) {
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (pendingIds.has(apartmentId)) return;

    const wasFavorite = favoriteIds.has(apartmentId);
    setPendingIds((current) => new Set(current).add(apartmentId));
    setFavoriteIds((current) => {
      const next = new Set(current);
      wasFavorite ? next.delete(apartmentId) : next.add(apartmentId);
      return next;
    });

    try {
      if (wasFavorite) await api.delete(removeFavorite(apartmentId));
      else await api.post(addFavorite(apartmentId));
      toast.success(wasFavorite ? 'Removed from saved stays' : 'Saved for later');
    } catch (error: any) {
      setFavoriteIds((current) => {
        const next = new Set(current);
        wasFavorite ? next.add(apartmentId) : next.delete(apartmentId);
        return next;
      });
      toast.error(error?.response?.data?.message || 'Unable to update saved stays.');
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(apartmentId);
        return next;
      });
    }
  };

  return { favoriteIds, pendingIds, loadingFavorites, refreshFavorites, toggleFavorite };
}
