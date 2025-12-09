'use client';

import { useState } from 'react';
import { X, Sliders } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
  currentFilters: FilterState;
}

export interface FilterState {
  state: string;
  city: string;
  numOfBeds: string;
  priceRange: '<100000' | '100000-200000' | '200000-300000' | '300000-400000' | '>400000' | '';
  sortBy: 'name' | 'dateModified' | 'dateCreated' | 'price' | '';
  sortOrder: 'asc' | 'desc';
}

export default function FilterModal({ isOpen, onClose, onApply, onReset, currentFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      state: '',
      city: '',
      numOfBeds: '',
      priceRange: '',
      sortBy: '',
      sortOrder: 'desc',
    };
    setFilters(resetFilters);
    onReset();
    onClose();
  };

  const applyLocation = (location: string) => {
    setFilters(prev => {
      if (location === 'Lagos' || location === 'Abuja' || location === 'Kaduna') {
        return { ...prev, state: prev.state === location ? '' : location, city: '' };
      } else if (location === 'Port Harcourt') {
        return { ...prev, city: prev.city === 'Port Harcourt' ? '' : 'Port Harcourt', state: '' };
      }
      return prev;
    });
  };

  const hasActiveFilters = filters.state || filters.city || filters.numOfBeds || filters.priceRange || filters.sortBy;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-0 sm:p-4">
        <div className="relative w-full sm:max-w-2xl transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-900 transition-all max-h-[90vh] sm:max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-1.5 sm:p-2">
                <Sliders size={18} className="sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Filter Apartments</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 dark:bg-gray-700 p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X size={18} className="sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 rounded-lg border-l-4 border-yellow-500 dark:border-yellow-600 bg-blue-50 dark:bg-blue-900/20 p-2.5 sm:p-3 flex-shrink-0">
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1">Active Filters:</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 break-words">
                {[
                  filters.state,
                  filters.city,
                  filters.numOfBeds && `${filters.numOfBeds} bedrooms`,
                  filters.priceRange && `Price ${filters.priceRange.replace('<=', '≤ ').replace('>=', '≥ ')}`,
                  filters.sortBy && `Sort: ${filters.sortBy} (${filters.sortOrder})`
                ].filter(Boolean).join(' • ')}
              </p>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
            {/* Location */}
            <div className="mb-4 sm:mb-6">
              <label className="mb-2 sm:mb-3 block text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Location</label>
              <div className="flex flex-wrap gap-2">
                {['Lagos', 'Abuja', 'Port Harcourt', 'Kaduna'].map((loc) => {
                  const isActive = 
                    (filters.state === loc) || 
                    (loc === 'Port Harcourt' && filters.city === 'Port Harcourt');
                  
                  return (
                    <button
                      key={loc}
                      onClick={() => applyLocation(loc)}
                      className={`rounded-full border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-yellow-500 dark:border-yellow-600 bg-yellow-500 dark:bg-yellow-600 text-black'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bedroom Type */}
            <div className="mb-4 sm:mb-6">
              <label className="mb-2 sm:mb-3 block text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Bedroom type</label>
              <div className="flex flex-wrap gap-2">
                {['1', '2', '3', '4', '5+'].map((bedCount) => {
                  const isActive = filters.numOfBeds === bedCount;
                  return (
                    <button
                      key={bedCount}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        numOfBeds: prev.numOfBeds === bedCount ? '' : bedCount 
                      }))}
                      className={`rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-yellow-500 dark:border-yellow-600 bg-yellow-500 dark:bg-yellow-600 text-black'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {bedCount} {bedCount === '1' ? 'bed' : 'beds'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-4 sm:mb-6">
              <label className="mb-2 sm:mb-3 block text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Price range (per night)</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: '<100000' as const, label: '< ₦100k' },
                  { key: '100000-200000' as const, label: '₦100k - ₦200k' },
                  { key: '200000-300000' as const, label: '₦200k - ₦300k' },
                  { key: '300000-400000' as const, label: '₦300k - ₦400k' },
                  { key: '>400000' as const, label: '> ₦400k' }
                ].map((range) => {
                  const isActive = filters.priceRange === range.key;
                  return (
                    <button
                      key={range.key}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        priceRange: prev.priceRange === range.key ? '' : range.key 
                      }))}
                      className={`rounded-full border px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-yellow-500 dark:border-yellow-600 bg-yellow-500 dark:bg-yellow-600 text-black'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort By */}
            <div className="mb-4 sm:mb-6">
              <label className="mb-2 sm:mb-3 block text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Sort by</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'name' as const, label: 'Name' },
                  { key: 'price' as const, label: 'Price (High to Low)', order: 'desc' as const },
                  { key: 'price-asc' as const, label: 'Price (Low to High)', actualKey: 'price' as const, order: 'asc' as const },
                  { key: 'dateCreated' as const, label: 'Date Added' },
                  { key: 'dateModified' as const, label: 'Last Updated' }
                ].map((sort) => {
                  const isActive = 
                    (sort.key === 'price' && filters.sortBy === 'price' && filters.sortOrder === 'desc') ||
                    (sort.key === 'price-asc' && filters.sortBy === 'price' && filters.sortOrder === 'asc') ||
                    (sort.key !== 'price' && sort.key !== 'price-asc' && filters.sortBy === sort.key);
                  
                  return (
                    <button
                      key={sort.key}
                      onClick={() => {
                        if (sort.key === 'price-asc') {
                          setFilters(prev => ({ ...prev, sortBy: 'price', sortOrder: 'asc' }));
                        } else if (sort.key === 'price') {
                          setFilters(prev => ({ ...prev, sortBy: 'price', sortOrder: 'desc' }));
                        } else if (filters.sortBy === sort.key) {
                          setFilters(prev => ({ 
                            ...prev, 
                            sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                          }));
                        } else {
                          setFilters(prev => ({ 
                            ...prev, 
                            sortBy: sort.key, 
                            sortOrder: sort.key === 'name' ? 'asc' : 'desc' 
                          }));
                        }
                      }}
                      className={`rounded-full border px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-yellow-500 dark:border-yellow-600 bg-yellow-500 dark:bg-yellow-600 text-black'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {sort.label} {sort.key !== 'price' && sort.key !== 'price-asc' && filters.sortBy === sort.key
                        ? (filters.sortOrder === 'asc' ? '↑' : '↓') 
                        : ''}
                    </button>
                  );
                })}
              </div>
              {filters.sortBy && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {filters.sortBy === 'price'
                    ? `Sorting by price ${filters.sortOrder === 'asc' ? 'from low to high' : 'from high to low'}`
                    : `Currently sorting by ${filters.sortBy} in ${filters.sortOrder === 'asc' ? 'ascending' : 'descending'} order. Tap again to toggle.`}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
            <button
              onClick={handleApply}
              className="w-full rounded-2xl bg-yellow-500 dark:bg-yellow-600 py-3 sm:py-4 text-center text-base sm:text-lg font-semibold text-black shadow-lg dark:shadow-gray-900 transition-opacity hover:opacity-90"
            >
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="mt-2 sm:mt-3 w-full rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 sm:py-3 text-center text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

