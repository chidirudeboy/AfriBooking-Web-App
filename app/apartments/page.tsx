'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppShell from '@/components/AppShell';
import ApartmentCard from '@/components/ApartmentCard';
import FilterModal, { FilterState } from '@/components/FilterModal';
import { TApartments, TOptionalFees } from '@/lib/types/airbnb';
import { getEveryApartments } from '@/lib/endpoints';
import { getPrice } from '@/lib/utils/price';
import axios from 'axios';
import {
  Search,
  Sliders,
  LocateFixed,
  Building2,
  Camera,
  Sparkles,
  Car,
  Calendar,
  Users,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useFavorites } from '@/hooks/useFavorites';

const usecases = {
  'All': 'all',
  'Normal Stay': 'normal',
  'Party': 'party',
  'Movie Shoot': 'movie',
  'Photo Shoot': 'photo',
};

const browseCategories = [
  { name: 'Apartments', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80', filter: 'Apartment' },
  { name: 'Hotels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80', filter: 'Hotel' },
  { name: 'Resorts', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop&q=80', filter: 'Resort' },
  { name: 'Beach Houses', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80', filter: 'Beach House' },
  { name: 'Vacation Homes', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80', filter: 'Vacation Home' },
];

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<TApartments[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Stays' | 'Spaces' | 'Experiences' | 'Transport'>('Stays');
  const [searchQuery, setSearchQuery] = useState('');
  const [destination, setDestination] = useState('All destinations');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guestsCount, setGuestsCount] = useState('2 guests');
  const [reservationType, setReservationType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [locating, setLocating] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    state: '',
    city: '',
    numOfBeds: '',
    priceRange: '',
    sortBy: '',
    sortOrder: 'desc',
  });

  const { user } = useAuth();
  const { favoriteIds, pendingIds, toggleFavorite } = useFavorites();
  const router = useRouter();

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
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

      const response = await axios.get(getEveryApartments, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        timeout: 15000,
      });

      let results = null;
      if (response.data?.apartments && Array.isArray(response.data.apartments)) {
        results = response.data.apartments;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        results = response.data.data;
      } else if (Array.isArray(response.data)) {
        results = response.data;
      }

      if (results && results.length > 0) {
        setApartments(results);
      } else {
        toast.error('No apartments found');
      }
    } catch (error: any) {
      console.error('Error fetching apartments:', error);
      let errorMessage = 'Failed to load apartments';
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to API server. Please verify network connection.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredApartments = useMemo(() => {
    let filtered = [...apartments];

    // Destination dropdown filter
    if (destination !== 'All destinations') {
      const dest = destination.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.city?.toLowerCase().includes(dest) ||
          apt.state?.toLowerCase().includes(dest) ||
          apt.address?.toLowerCase().includes(dest)
      );
    }

    // Free-form search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.apartmentName?.toLowerCase().includes(query) ||
          apt.address?.toLowerCase().includes(query) ||
          apt.city?.toLowerCase().includes(query) ||
          apt.state?.toLowerCase().includes(query) ||
          apt.description?.toLowerCase().includes(query)
      );
    }

    // Reservation use-case filter
    if (reservationType !== 'all' && reservationType !== 'normal') {
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

    // Apply modal filters
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

    if (filters.numOfBeds) {
      filtered = filtered.filter((apt) => {
        if (filters.numOfBeds === '5+') {
          return apt.bedrooms >= 5;
        } else {
          return apt.bedrooms === parseInt(filters.numOfBeds);
        }
      });
    }

    if (filters.priceRange) {
      let min = 0,
        max = Number.MAX_SAFE_INTEGER;
      if (filters.priceRange === '<100000') max = 99999;
      else if (filters.priceRange === '100000-200000') {
        min = 100000;
        max = 200000;
      } else if (filters.priceRange === '200000-300000') {
        min = 200000;
        max = 300000;
      } else if (filters.priceRange === '300000-400000') {
        min = 300000;
        max = 400000;
      } else if (filters.priceRange === '>400000') {
        min = 400001;
        max = Number.MAX_SAFE_INTEGER;
      }

      filtered = filtered.filter((apt) => {
        const price = getPrice(apt, reservationType === 'all' ? 'normal' : (reservationType as any), null);
        return price >= min && price <= max;
      });
    }

    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'name':
            comparison = a.apartmentName.localeCompare(b.apartmentName);
            break;
          case 'price':
            const priceA = getPrice(a, reservationType === 'all' ? 'normal' : (reservationType as any), null);
            const priceB = getPrice(b, reservationType === 'all' ? 'normal' : (reservationType as any), null);
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

    return filtered;
  }, [apartments, destination, searchQuery, reservationType, filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkInDate && checkOutDate && checkOutDate <= checkInDate) {
      toast.error('Choose a check-out date after check-in.');
      return;
    }
    const resultsElement = document.getElementById('results-section');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Location is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
            { headers: { Accept: 'application/json' } }
          );
          const result = await response.json();
          const place =
            result?.address?.city ||
            result?.address?.town ||
            result?.address?.county ||
            result?.address?.state;
          if (!place) throw new Error('Location unavailable');
          setSearchQuery(place);
          toast.success(`Showing stays around ${place}`);
        } catch {
          toast.error('Found your position but could not identify the city.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error('Allow location access to find stays near you.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const hasActiveFilters =
    filters.state || filters.city || filters.numOfBeds || filters.priceRange || filters.sortBy;

  return (
    <AppShell>
      {/* 1. Intro Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
        <div>
          <span className="block text-xs font-bold tracking-[1.7px] text-[#896300] dark:text-[#ffbf00] uppercase mb-2">
            YOUR NEXT DESTINATION
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#17191b] dark:text-[#f0f2f6] tracking-tight leading-tight">
            Where would you like to go?
          </h1>
          <p className="text-sm sm:text-base text-[#6c7075] dark:text-[#acb4c0] mt-2">
            Find your stay. Make room for experiences.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6c7075] dark:text-[#acb4c0]">
          <span>Explore Nigeria</span>
        </div>
      </div>

      {/* 2. Category Tabs */}
      <div className="flex items-center gap-6 sm:gap-8 border-b border-[#e7e8eb] dark:border-[#353c47] mb-6 overflow-x-auto no-scrollbar">
        {[
          { name: 'Stays', icon: Building2 },
          { name: 'Spaces', icon: Camera },
          { name: 'Experiences', icon: Sparkles },
          { name: 'Transport', icon: Car },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name as any)}
              className={`flex items-center gap-2.5 pb-3.5 text-sm font-semibold whitespace-nowrap transition-colors relative ${
                isActive
                  ? 'text-[#17191b] dark:text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-[#ffbf00]'
                  : 'text-[#6c7075] dark:text-[#acb4c0] hover:text-[#17191b] dark:hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#ffbf00]' : 'stroke-[1.8]'} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* If Spaces, Experiences or Transport is selected, show category guidance */}
      {activeTab !== 'Stays' ? (
        <div className="bg-[#fff9e9] dark:bg-[#1c222c] border border-[#f4e5b9] dark:border-[#353c47] rounded-2xl p-6 mb-8">
          <h2 className="font-display text-xl font-bold mb-2">
            {activeTab === 'Spaces' && 'Space to create: Photo, Video & Content Houses'}
            {activeTab === 'Experiences' && 'Build a day around food, culture, beaches & nightlife'}
            {activeTab === 'Transport' && 'Find your ride: Self-drive & Chauffeur rentals'}
          </h2>
          <p className="text-sm text-[#6c7075] dark:text-[#acb4c0] mb-4">
            {activeTab === 'Spaces' && 'Book verified studios, creator spaces, and shoot locations with flexible hourly pricing.'}
            {activeTab === 'Experiences' && 'Discover curated local experiences or build an interactive custom itinerary with AfriBooking AI.'}
            {activeTab === 'Transport' && 'Rent premium SUVs and sedans for city travel, airport pickups, and executive chauffeur service.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/planner"
              className="inline-flex items-center gap-2 bg-[#ffbf00] hover:bg-[#eeb200] text-[#17191b] font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Sparkles size={16} />
              Plan with AfriBooking AI ↗
            </Link>
            <button
              onClick={() => setActiveTab('Stays')}
              className="inline-flex items-center text-sm font-semibold border border-[#e7e8eb] dark:border-[#353c47] px-4 py-2.5 rounded-xl hover:bg-white dark:hover:bg-[#141922] transition-colors"
            >
              View Available Stays
            </button>
          </div>
        </div>
      ) : (
        /* 3. Unified Search Bar */
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white dark:bg-[#1c222c] border border-[#dedfe2] dark:border-[#353c47] rounded-2xl p-2.5 sm:p-3 shadow-sm mb-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-0 lg:divide-x divide-[#e7e8eb] dark:divide-[#353c47]"
        >
          {/* Destination */}
          <div className="px-3 sm:px-4 py-2 flex flex-col justify-center rounded-xl bg-gray-50/70 sm:bg-transparent dark:bg-transparent">
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#896300] dark:text-[#ffbf00] mb-1">
              Destination
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-transparent text-sm font-medium text-[#17191b] dark:text-[#f0f2f6] focus:outline-none cursor-pointer w-full"
            >
              <option value="All destinations">All destinations</option>
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja</option>
              <option value="Port Harcourt">Port Harcourt</option>
              <option value="Ibadan">Ibadan</option>
            </select>
          </div>

          {/* Check-in Date */}
          <div className="px-3 sm:px-4 py-2 flex flex-col justify-center rounded-xl bg-gray-50/70 sm:bg-transparent dark:bg-transparent">
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6c7075] dark:text-[#acb4c0] mb-1">
              Check-in
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="bg-transparent text-sm text-[#17191b] dark:text-[#f0f2f6] focus:outline-none w-full"
            />
          </div>

          {/* Check-out Date */}
          <div className="px-3 sm:px-4 py-2 flex flex-col justify-center rounded-xl bg-gray-50/70 sm:bg-transparent dark:bg-transparent">
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6c7075] dark:text-[#acb4c0] mb-1">
              Check-out
            </label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="bg-transparent text-sm text-[#17191b] dark:text-[#f0f2f6] focus:outline-none w-full"
            />
          </div>

          {/* Guests */}
          <div className="px-3 sm:px-4 py-2 flex flex-col justify-center rounded-xl bg-gray-50/70 sm:bg-transparent dark:bg-transparent">
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6c7075] dark:text-[#acb4c0] mb-1">
              Guests
            </label>
            <select
              value={guestsCount}
              onChange={(e) => setGuestsCount(e.target.value)}
              className="bg-transparent text-sm font-medium text-[#17191b] dark:text-[#f0f2f6] focus:outline-none cursor-pointer w-full"
            >
              <option value="1 guest">1 guest</option>
              <option value="2 guests">2 guests</option>
              <option value="3 guests">3 guests</option>
              <option value="4 guests">4 guests</option>
              <option value="5+ guests">5+ guests</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="p-1 sm:col-span-2 lg:col-span-1 flex items-center justify-center">
            <button
              type="submit"
              className="w-full h-full min-h-[46px] bg-[#ffbf00] hover:bg-[#eeb200] text-[#17191b] font-bold text-sm rounded-xl px-5 py-3 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Search size={18} className="stroke-[2.5]" />
              <span>Search</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. AI Banner */}
      <section className="banner-gradient rounded-2xl p-5 sm:p-7 md:p-8 mb-8 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5 sm:gap-4">
          <div className="text-3xl sm:text-4xl md:text-5xl text-[#dc9d00] dark:text-[#ffbf00] leading-none select-none">
            ✦
          </div>
          <div>
            <span className="block text-[10px] sm:text-[11px] font-bold tracking-[1.5px] text-[#896300] dark:text-[#ffbf00] uppercase mb-1">
              AFRIBOOKING AI
            </span>
            <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-[#17191b] dark:text-white leading-tight">
              Your trip, all in one plan.
            </h2>
            <p className="text-xs sm:text-sm text-[#62605a] dark:text-[#acb4c0] mt-1 max-w-xl">
              Choose your destination, dates and interests. We’ll put your days together with places to stay, eat, and visit.
            </p>
          </div>
        </div>
        <Link
          href="/planner"
          className="shrink-0 w-full sm:w-auto text-center justify-center bg-[#17191b] hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-[#17191b] font-bold text-sm px-5 py-3 rounded-xl inline-flex items-center gap-2 transition-colors shadow-md"
        >
          <span>Plan my trip</span>
          <span>↗</span>
        </Link>
      </section>

      {/* 5. Browse Categories Row */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#17191b] dark:text-[#f0f2f6]">
            Find your kind of stay
          </h2>
        </div>
        <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
          {browseCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => {
                setSearchQuery(cat.filter);
                const res = document.getElementById('results-section');
                if (res) res.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="group relative flex-shrink-0 w-[140px] sm:w-auto h-28 sm:h-32 rounded-xl overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-[#ffbf00]"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 140px, (max-width: 768px) 33vw, 20vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <span className="absolute bottom-3 left-3.5 right-3 text-white font-semibold text-xs sm:text-sm drop-shadow-sm line-clamp-1">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 6. Results Header & Filter Bar */}
      <div id="results-section" className="scroll-mt-28 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#17191b] dark:text-[#f0f2f6]">
              Places worth staying
            </h2>
            <p className="text-xs sm:text-sm text-[#6c7075] dark:text-[#acb4c0] mt-1">
              Showing {filteredApartments.length} {filteredApartments.length === 1 ? 'place' : 'places'}{' '}
              {destination !== 'All destinations' ? `in ${destination}` : 'across Nigeria'}
            </p>
          </div>

          {/* Action buttons: Filter Modal & Near Me */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(true)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${
                hasActiveFilters
                  ? 'bg-[#fff9e9] dark:bg-[#302916] border-[#ffbf00] text-[#896300] dark:text-[#ffbf00]'
                  : 'border-[#e7e8eb] dark:border-[#353c47] bg-white dark:bg-[#1c222c] text-[#17191b] dark:text-[#f0f2f6] hover:border-[#ffbf00]'
              }`}
            >
              <Sliders size={16} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-[#ffbf00] text-[#17191b] text-[10px] font-bold flex items-center justify-center">
                  {[filters.state, filters.city, filters.numOfBeds, filters.priceRange, filters.sortBy].filter(Boolean).length}
                </span>
              )}
            </button>

            <button
              onClick={useMyLocation}
              disabled={locating}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#e7e8eb] dark:border-[#353c47] bg-white dark:bg-[#1c222c] text-xs sm:text-sm font-semibold text-[#17191b] dark:text-[#f0f2f6] hover:border-[#ffbf00] transition-colors disabled:opacity-60"
            >
              <LocateFixed size={16} className={locating ? 'animate-pulse text-[#ffbf00]' : ''} />
              <span>{locating ? 'Locating…' : 'Near me'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills (Use-cases) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {Object.entries(usecases).map(([label, value]) => (
            <button
              key={value}
              onClick={() => setReservationType(value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                reservationType === value
                  ? 'bg-[#17191b] text-white border-[#17191b] dark:bg-white dark:text-[#17191b] dark:border-white'
                  : 'bg-white dark:bg-[#1c222c] text-[#6c7075] dark:text-[#acb4c0] border-[#e7e8eb] dark:border-[#353c47] hover:border-[#ffbf00]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 7. Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-transparent border-t-[#ffbf00] border-r-[#ffbf00]"></div>
          <p className="text-xs text-[#6c7075] dark:text-[#acb4c0] mt-3">Loading available stays…</p>
        </div>
      )}

      {/* 8. Empty State */}
      {!loading && filteredApartments.length === 0 && (
        <div className="border border-[#e7e8eb] dark:border-[#353c47] rounded-2xl p-12 text-center my-8 bg-white dark:bg-[#1c222c]">
          <Building2 size={36} className="mx-auto text-[#6c7075] dark:text-[#acb4c0] mb-3" />
          <h3 className="font-display font-bold text-lg text-[#17191b] dark:text-[#f0f2f6]">No apartments found</h3>
          <p className="text-sm text-[#6c7075] dark:text-[#acb4c0] mt-1 mb-4">
            Try adjusting your search criteria or resetting filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setDestination('All destinations');
              setReservationType('all');
              setFilters({
                state: '',
                city: '',
                numOfBeds: '',
                priceRange: '',
                sortBy: '',
                sortOrder: 'desc',
              });
            }}
            className="px-4 py-2 bg-[#ffbf00] hover:bg-[#eeb200] text-[#17191b] font-bold text-xs rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 9. Apartment Grid */}
      {!loading && filteredApartments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredApartments.map((apartment) => (
            <ApartmentCard
              key={apartment._id}
              apartment={apartment}
              reservationType={reservationType === 'all' ? 'normal' : reservationType}
              isFavorite={favoriteIds.has(apartment._id)}
              favoritePending={pendingIds.has(apartment._id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        onReset={() => {
          setFilters({
            state: '',
            city: '',
            numOfBeds: '',
            priceRange: '',
            sortBy: '',
            sortOrder: 'desc',
          });
          fetchApartments();
        }}
        currentFilters={filters}
      />
    </AppShell>
  );
}
