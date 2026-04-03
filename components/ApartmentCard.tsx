'use client';

import Image from 'next/image';
import Link from 'next/link';
import { TApartments } from '@/lib/types/airbnb';
import { numberWithCommas } from '@/lib/utils';
import { MapPin, Bed, Bath, Users } from 'lucide-react';

interface ApartmentCardProps {
  apartment: TApartments;
  reservationType?: string;
}

export default function ApartmentCard({ apartment, reservationType = 'normal' }: ApartmentCardProps) {
  // Get primary image
  const getPrimaryImage = () => {
    let reelImage: string | null = null;

    if (apartment.media?.images && Array.isArray(apartment.media.images)) {
      if (typeof apartment.reelsImageIndex === 'number' && apartment.reelsImageIndex >= 0) {
        const selectedImage = apartment.media.images[apartment.reelsImageIndex];
        if (selectedImage) {
          reelImage = typeof selectedImage === 'string' ? selectedImage : selectedImage.uri || selectedImage.url || null;
        }
      }

      if (!reelImage) {
        const flaggedImage = apartment.media.images.find((img: any) => typeof img === 'object' && img.isReelsImage);
        if (flaggedImage && typeof flaggedImage === 'object') {
          reelImage = flaggedImage.uri || flaggedImage.url || null;
        }
      }
    }

    const firstImageData = apartment.media?.images?.[0];
    const firstImage = typeof firstImageData === 'string'
      ? firstImageData
      : firstImageData && typeof firstImageData === 'object'
        ? firstImageData.uri || firstImageData.url || null
        : null;

    // Fallback image as data URI to avoid external network calls
    const defaultFallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM4MCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    return reelImage || firstImage || defaultFallbackImage;
  };

  // Calculate price based on reservation type
  const getPrice = () => {
    let basePrice = apartment.defaultStayFee || 0;

    if (reservationType === 'party' && apartment.optionalFees?.partyFee) {
      basePrice += apartment.optionalFees.partyFee;
    } else if (reservationType === 'movie' && apartment.optionalFees?.movieShootFee) {
      basePrice += apartment.optionalFees.movieShootFee;
    } else if (reservationType === 'photo' && apartment.optionalFees?.photoShootFee) {
      basePrice += apartment.optionalFees.photoShootFee;
    }

    return basePrice;
  };

  const imageUrl = getPrimaryImage();
  const price = getPrice();

  return (
    <Link href={`/apartments/${apartment._id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900 overflow-hidden hover:shadow-xl dark:hover:shadow-gray-800 transition-shadow duration-300 cursor-pointer">
        {/* Image */}
        <div className="relative w-full h-64 bg-gray-200 dark:bg-gray-700">
          <Image
            src={imageUrl}
            alt={apartment.apartmentName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {apartment.isBooked && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Booked
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
            {apartment.apartmentName}
          </h3>

          <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-3">
            <MapPin size={16} className="mr-1" />
            <span className="line-clamp-1">
              {apartment.address}, {apartment.city}, {apartment.state}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400 text-sm mb-3">
            <div className="flex items-center">
              <Bed size={16} className="mr-1" />
              <span>{apartment.bedrooms} Bed</span>
            </div>
            <div className="flex items-center">
              <Bath size={16} className="mr-1" />
              <span>{apartment.bathrooms} Bath</span>
            </div>
            <div className="flex items-center">
              <Users size={16} className="mr-1" />
              <span>{apartment.guests} Guests</span>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
            {apartment.description}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-2xl font-bold text-primary">
                ₦{numberWithCommas(price)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">/night</span>
            </div>
            <button className="text-primary hover:text-primary-dark font-medium text-sm">
              View Details →
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

