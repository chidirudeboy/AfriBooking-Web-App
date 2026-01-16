'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { getUserRequests, closeUserRequest } from '@/lib/endpoints';
import api from '@/lib/utils/api';
import { 
  Plus, FileText, Bed, MapPin, Calendar, MessageSquare, 
  XCircle, ArrowRight, Clock, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, differenceInDays, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';

interface UserRequest {
  id: string;
  _id: string;
  bedrooms: number;
  location: string;
  city?: string;
  state?: string;
  additionalNotes?: string;
  checkInDate?: string;
  checkOutDate?: string;
  status: 'active' | 'closed';
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function MyRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'active' | 'closed' | 'all'>('all');

  const fetchRequests = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const endpoint = getUserRequests(filterStatus === 'all' ? undefined : filterStatus);
      const response = await api.get(endpoint);

      if (response.data?.success) {
        setRequests(response.data.requests || []);
      }
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      if (error.response?.status !== 404) {
        toast.error(error.response?.data?.error || 'Failed to load requests');
      }
    } finally {
      setLoading(false);
    }
  }, [user, filterStatus]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    } else {
      router.push('/login');
    }
  }, [user, fetchRequests, router]);

  const handleCloseRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to close this request? Agents won\'t be able to respond anymore.')) {
      return;
    }

    try {
      const endpoint = closeUserRequest(requestId);
      
      // Try PATCH first (common for status updates)
      let response;
      try {
        response = await api.patch(endpoint, { status: 'closed' });
      } catch (patchError: any) {
        // If PATCH fails, try PUT
        if (patchError.response?.status === 404 || patchError.response?.status === 405) {
          response = await api.put(endpoint, { status: 'closed' });
        } else {
          throw patchError;
        }
      }

      if (response.data?.success) {
        toast.success('Request closed successfully');
        fetchRequests();
      } else {
        toast.error(response.data?.message || 'Could not close request');
      }
    } catch (error: any) {
      console.error('Error closing request:', error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || 'Failed to close request. Please try again later.';
      toast.error(errorMessage);
    }
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

  const getFilterCounts = () => {
    const active = requests.filter(r => r.status === 'active').length;
    const closed = requests.filter(r => r.status === 'closed').length;
    return { all: requests.length, active, closed };
  };

  const counts = getFilterCounts();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0`}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  My Requests
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {requests.length} request{requests.length !== 1 ? 's' : ''} total
                </p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/requests/create')}
              className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-3 mb-6">
            {(['all', 'active', 'closed'] as const).map((status) => {
              const isActive = filterStatus === status;
              const count = counts[status];
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-amber-300'
                  }`}
                >
                  <span className="capitalize font-medium">{status}</span>
                  {count > 0 && (
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                      isActive 
                        ? 'bg-white/30 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading && requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-5">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Loading your requests...</p>
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id || request._id}
                  onClick={() => router.push(`/requests/${request.id || request._id}/responses`)}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Header with status */}
                  <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Bed className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {request.bedrooms} Bedroom{request.bedrooms > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold capitalize ${
                      request.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {request.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    {/* Location */}
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {request.city && request.state 
                          ? `${request.city}, ${request.state}` 
                          : request.location || 'Location not specified'}
                      </p>
                    </div>

                    {/* Dates */}
                    {(request.checkInDate || request.checkOutDate) && (
                      <div className="flex bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 mb-2">
                        {request.checkInDate && (
                          <div className="flex-1 text-center">
                            <p className="text-[9px] text-gray-500 dark:text-gray-400 font-semibold mb-1">
                              CHECK-IN
                            </p>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">
                              {format(parseISO(request.checkInDate), 'MMM d')}
                            </p>
                          </div>
                        )}
                        {request.checkInDate && request.checkOutDate && (
                          <div className="w-px bg-gray-200 dark:bg-gray-600 mx-2" />
                        )}
                        {request.checkOutDate && (
                          <div className="flex-1 text-center">
                            <p className="text-[9px] text-gray-500 dark:text-gray-400 font-semibold mb-1">
                              CHECK-OUT
                            </p>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">
                              {format(parseISO(request.checkOutDate), 'MMM d')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {request.additionalNotes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2 italic">
                        &quot;{request.additionalNotes}&quot;
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      {/* Response count */}
                      <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                        request.responseCount > 0 
                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <MessageSquare className={`w-3 h-3 ${
                          request.responseCount > 0 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400'
                        }`} />
                        <span className={`text-xs font-semibold ${
                          request.responseCount > 0 
                            ? 'text-blue-700 dark:text-blue-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {request.responseCount} Response{request.responseCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {request.status === 'active' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseRequest(request.id || request._id);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <XCircle className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Close</span>
                          </button>
                        )}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white">
                          <span className="text-xs font-bold">View</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-10">
              <div className="w-30 h-30 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-7">
                <FileText className="w-14 h-14 text-amber-600 dark:text-amber-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
                No Requests Yet
              </h2>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 max-w-md">
                Create a request to let agents know what kind of apartment you're looking for.
              </p>

              <button
                onClick={() => router.push('/requests/create')}
                className="flex items-center gap-2 px-8 py-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/30 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Request</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
