'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TApartments } from '@/lib/types/airbnb';
import { numberWithCommas } from '@/lib/utils';
import { MapPin, MessageSquare, Play, Heart } from 'lucide-react';
import { getPrice as calculatePrice } from '@/lib/utils/price';

interface ApartmentCardProps {
  apartment: TApartments;
  reservationType?: string;
  isFavorite?: boolean;
  favoritePending?: boolean;
  onToggleFavorite?: (apartmentId: string) => void;
}

export default function ApartmentCard({
  apartment,
  reservationType = 'normal',
  isFavorite = false,
  favoritePending = false,
  onToggleFavorite,
}: ApartmentCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

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
    const firstImage =
      typeof firstImageData === 'string'
        ? firstImageData
        : firstImageData && typeof firstImageData === 'object'
        ? firstImageData.uri || firstImageData.url || null
        : null;

    const defaultFallbackImage =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM4MCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    return reelImage || firstImage || defaultFallbackImage;
  };

  const getPrimaryVideo = (): string | null => {
    const first = apartment.media?.videos?.[0];
    if (first) return typeof first === 'string' ? first : (first as any).fullPath || (first as any).uri || (first as any).url || null;
    const legacy = (apartment as any).videos?.[0];
    if (legacy) return typeof legacy === 'string' ? legacy : legacy.uri || legacy.url || null;
    return null;
  };

  const imageUrl = getPrimaryImage();
  const hasRealImage = !imageUrl.startsWith('data:image/svg');
  const primaryVideo = !hasRealImage ? getPrimaryVideo() : null;
  const price = calculatePrice(apartment, reservationType as any, null);
  const reviewCount = Number(apartment.totalReviews || 0);
  const rating = Number(apartment.averageRating || 0);

  // Property type badge label
  const typeBadge =
    (apartment as any).propertyType ||
    (apartment.bedrooms >= 4 ? 'Entire Home' : apartment.bedrooms >= 2 ? 'Apartments' : 'Studio');

  // Tag pill
  const tagLabel =
    apartment.optionalFees?.photoShootFee
      ? 'Stay & photo shoot'
      : reservationType === 'party'
      ? 'Party allowed'
      : 'Stay';

  return (
    <article className="group relative bg-white dark:bg-[#1c222c] rounded-2xl border border-[#e7e8eb] dark:border-[#353c47] overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Photo / Media Container */}
      <div className="relative w-full h-[235px] sm:h-[240px] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Link href={`/apartments/${apartment._id}`} className="block w-full h-full">
          {primaryVideo ? (
            <>
              <video
                ref={videoRef}
                src={primaryVideo}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onLoadedMetadata={() => {
                  if (videoRef.current) videoRef.current.currentTime = 1;
                }}
              />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#ffbf00] text-[#17191b] shadow-md">
                  <Play size={24} className="ml-0.5 fill-current" />
                </div>
              </div>
            </>
          ) : (
            <Image
              src={imageUrl}
              alt={apartment.apartmentName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
        </Link>

        {/* Favorite Save Button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(apartment._id);
            }}
            disabled={favoritePending}
            className="absolute top-3.5 right-3.5 z-10 w-[34px] h-[34px] rounded-full bg-white/95 dark:bg-[#1c222c]/90 text-[#17191b] dark:text-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-60"
            aria-label={isFavorite ? 'Unsave listing' : 'Save listing'}
          >
            <Heart
              size={18}
              className={isFavorite ? 'fill-[#c58d00] text-[#c58d00]' : 'stroke-[2] text-gray-700 dark:text-gray-200'}
            />
          </button>
        )}

        {/* Type Badge */}
        <span className="absolute bottom-3 left-3.5 z-10 bg-white/95 dark:bg-[#17191b]/90 text-[#17191b] dark:text-[#f0f2f6] px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide shadow-sm">
          {typeBadge}
        </span>

        {apartment.isBooked && (
          <div className="absolute top-3.5 left-3.5 z-10 bg-rose-500 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm">
            Booked
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-[18px]">
        {/* Title */}
        <Link
          href={`/apartments/${apartment._id}`}
          className="font-display font-bold text-[17px] text-[#17191b] dark:text-[#f0f2f6] hover:text-[#eeb200] line-clamp-1 tracking-tight"
        >
          {apartment.apartmentName}
        </Link>

        {/* Location */}
        <p className="flex items-center text-[13px] text-[#6c7075] dark:text-[#acb4c0] mt-1 mb-1.5">
          <MapPin size={14} className="mr-1.5 shrink-0 text-[#ffbf00]" />
          <span className="line-clamp-1">
            {(apartment as any).area || apartment.address}, {apartment.city}
          </span>
        </p>

        {/* Rating */}
        <div className="text-[13px] mb-2 flex items-center gap-1.5">
          {reviewCount > 0 || rating > 0 ? (
            <>
              <span className="text-[#da9b00] font-bold text-sm">★</span>
              <span className="font-semibold text-[#17191b] dark:text-[#f0f2f6]">
                {rating > 0 ? rating.toFixed(1) : '5.0'}
              </span>
              <span className="text-[#6c7075] dark:text-[#acb4c0] text-xs">
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </>
          ) : (
            <span className="text-[#6c7075] dark:text-[#acb4c0] text-xs">New listing</span>
          )}
        </div>

        {/* Meta Line */}
        <div className="text-xs text-[#6c7075] dark:text-[#acb4c0] mb-3">
          {apartment.bedrooms} {apartment.bedrooms === 1 ? 'bedroom' : 'bedrooms'} ·{' '}
          {apartment.bathrooms || 1} {apartment.bathrooms === 1 ? 'bath' : 'baths'} · {apartment.guests} guests
        </div>

        {/* Message Owner Direct Link */}
        <Link
          href={`/messages?apartmentId=${apartment._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#946a00] dark:text-[#efc353] hover:underline mb-4"
        >
          <MessageSquare size={14} />
          <span>Message owner</span>
        </Link>

        {/* Card Bottom Row */}
        <div className="border-t border-[#e7e8eb] dark:border-[#353c47] pt-3 flex items-center justify-between">
          <div className="text-xs text-[#6c7075] dark:text-[#acb4c0]">
            <strong className="text-lg sm:text-[20px] font-extrabold text-[#17191b] dark:text-white mr-1 tracking-tight">
              ₦{numberWithCommas(price)}
            </strong>
            / night
          </div>
          <span className="bg-[#fff9e9] dark:bg-[#302916] text-[#5a4920] dark:text-[#ffbf00] px-2.5 py-1 rounded-md text-[11px] font-semibold">
            {tagLabel}
          </span>
        </div>
      </div>
    </article>
  );
}
