'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import ApartmentCard from '@/components/ApartmentCard';
import FilterModal, { FilterState } from '@/components/FilterModal';
import { TApartments, TOptionalFees } from '@/lib/types/airbnb';
import { getEveryApartments } from '@/lib/endpoints';
import { usePrice } from '@/lib/utils/price';
import axios from 'axios';
import { Search, Filter, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';

const usecases = {
  'Normal Stay': 'normal',
  'Party': 'party',
  'Movie Shoot': 'movie',
  'Photo Shoot': 'photo',
};

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<TApartments[]>([]);
  const [filteredApartments, setFilteredApartments] = useState<TApartments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reservationType, setReservationType] = useState<string>('normal');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    state: '',
    city: '',
    numOfBeds: '',
    priceRange: '',
    sortBy: '',
    sortOrder: 'desc',
  });
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Allow viewing apartments without login (matching mobile app behavior)
    fetchApartments();
  }, []);

  useEffect(() => {
    filterApartments();
  }, [searchQuery, reservationType, apartments, filters]);

  const fetchApartments = async () => {
    try {
      setLoading(true);
      
      // Get auth token from localStorage (matching mobile app approach)
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

      // Make request with headers matching mobile app
      const response = await axios.get(getEveryApartments, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        timeout: 15000
      });
      
      // Handle different response structures (matching mobile app)
      let apartments = null;
      
      if (response.data?.apartments && Array.isArray(response.data.apartments)) {
        apartments = response.data.apartments;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        apartments = response.data.data;
      } else if (Array.isArray(response.data)) {
        apartments = response.data;
      }
      
      if (apartments && apartments.length > 0) {
        setApartments(apartments);
        setFilteredApartments(apartments);
      } else {
        console.error('Unexpected response structure:', response.data);
        toast.error('No apartments found');
      }
    } catch (error: any) {
      console.error('Error fetching apartments:', error);
      
      let errorMessage = 'Failed to load apartments';
      
      // Handle different error types
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to API server. Please ensure the backend server is running on http://localhost:8080';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and ensure the API server is accessible.';
      } else if (error.response?.status === 0 || error.message?.includes('CORS')) {
        errorMessage = 'CORS error: The API server is not allowing requests from this origin. Please check CORS settings on the backend.';
      } else if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please check the API URL configuration.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Full error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config?.url
      });
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterApartments = () => {
    let filtered = [...apartments];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((apt) =>
        apt.apartmentName.toLowerCase().includes(query) ||
        apt.address.toLowerCase().includes(query) ||
        apt.city.toLowerCase().includes(query) ||
        apt.state.toLowerCase().includes(query) ||
        apt.description.toLowerCase().includes(query)
      );
    }

    // Filter by reservation type
    if (reservationType !== 'normal') {
      const optionalFeeKey = {
        party: 'partyFee',
        movie: 'movieShootFee',
        photo: 'photoShootFee',
      }[reservationType] as keyof TOptionalFees;

      filtered = filtered.filter((apt) => {
        const optionalFees = apt.optionalFees;
        return optionalFees && optionalFees[optionalFeeKey] !== undefined;
      });
    }

    // Apply location filters (matching mobile app logic)
    if (filters.state || filters.city) {
      filtered = filtered.filter((apt) => {
        let matches = true;

        if (filters.state && apt.state) {
          matches = matches && apt.state.toLowerCase().includes(filters.state.toLowerCase());
        }

        if (filters.city && apt.city) {
          matches = matches && apt.city.toLowerCase().includes(filters.city.toLowerCase());
        }

        return matches;
      });
    }

    // Apply bedroom filter (matching mobile app logic)
    if (filters.numOfBeds) {
      filtered = filtered.filter((apt) => {
        if (filters.numOfBeds === '5+') {
          return apt.bedrooms >= 5;
        } else {
          return apt.bedrooms === parseInt(filters.numOfBeds);
        }
      });
    }

    // Apply price range filter (matching mobile app logic)
    if (filters.priceRange) {
      let min = 0, max = Number.MAX_SAFE_INTEGER;
      if (filters.priceRange === '<100000') { max = 99999; }
      else if (filters.priceRange === '100000-200000') { min = 100000; max = 200000; }
      else if (filters.priceRange === '200000-300000') { min = 200000; max = 300000; }
      else if (filters.priceRange === '300000-400000') { min = 300000; max = 400000; }
      else if (filters.priceRange === '>400000') { min = 400001; max = Number.MAX_SAFE_INTEGER; }

      filtered = filtered.filter((apt) => {
        const price = usePrice(apt, reservationType as any, null); // Filter uses default price
        return price >= min && price <= max;
      });
    }

    // Apply sorting (matching mobile app logic)
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (filters.sortBy) {
          case 'name':
            comparison = a.apartmentName.localeCompare(b.apartmentName);
            break;
          case 'price':
            const priceA = usePrice(a, reservationType as any, null);
            const priceB = usePrice(b, reservationType as any, null);
            comparison = priceA - priceB;
            break;
          case 'dateCreated':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'dateModified':
            comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            break;
        }

        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredApartments(filtered);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      state: '',
      city: '',
      numOfBeds: '',
      priceRange: '',
      sortBy: '',
      sortOrder: 'desc',
    });
    fetchApartments();
  };

  const hasActiveFilters = filters.state || filters.city || filters.numOfBeds || filters.priceRange || filters.sortBy;
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className="p-3 sm:p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Find Your Perfect Stay</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Discover amazing apartments for your next trip</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
            {/* Search Bar and Filter Button */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search apartments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800"
                />
              </div>
              <button
                onClick={() => setShowFilters(true)}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  hasActiveFilters
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-600 text-yellow-900 dark:text-yellow-200'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Sliders size={18} className={hasActiveFilters ? 'text-yellow-600' : 'text-gray-600'} />
                <span className="hidden xs:inline sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-semibold text-black">
                    {[filters.state, filters.city, filters.numOfBeds, filters.priceRange, filters.sortBy].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Reservation Type Filters */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(usecases).map(([label, value]) => (
                <button
                  key={value}
                  onClick={() => setReservationType(value)}
                  className={`
                    px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors
                    ${reservationType === value
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredApartments.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No apartments found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery ? 'Try adjusting your search criteria' : 'Check back later for new listings'}
              </p>
            </div>
          )}

          {/* Apartment Grid */}
          {!loading && filteredApartments.length > 0 && (
            <>
              <div className="mb-3 sm:mb-4 text-sm sm:text-base text-gray-600">
                Showing {filteredApartments.length} of {apartments.length} apartments
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                {filteredApartments.map((apartment) => (
                  <ApartmentCard
                    key={apartment._id}
                    apartment={apartment}
                    reservationType={reservationType}
                  />
                ))}
              </div>
            </>
          )}

          {/* Filter Modal */}
          <FilterModal
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            currentFilters={filters}
          />
        </main>
      </div>
    </div>
  );
}

