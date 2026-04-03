'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  uri: string;
}

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  initialIndex: number;
}

export default function MediaModal({ isOpen, onClose, mediaItems, initialIndex }: MediaModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handlePrevious = () => {
    setIsVideoPlaying(false);
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsVideoPlaying(false);
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  // Touch handlers for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (!isOpen) return null;

  const currentMedia = mediaItems[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 p-3 sm:p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Close"
      >
        <X size={24} className="sm:w-6 sm:h-6" />
      </button>

      {/* Media Container */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {currentMedia.type === 'video' ? (
          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
            <video
              ref={videoRef}
              src={currentMedia.uri}
              className="max-w-full max-h-full object-contain"
              controls={isVideoPlaying}
              autoPlay={isVideoPlaying}
              loop
              playsInline
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
            {!isVideoPlaying && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVideoPlaying(true);
                  videoRef.current?.play();
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors touch-manipulation"
                aria-label="Play video"
              >
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-4 sm:p-6 md:p-8 shadow-lg">
                  <Play className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-gray-900 dark:text-white fill-current" />
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
            <Image
              src={currentMedia.uri}
              alt={`Media ${currentIndex + 1}`}
              width={1920}
              height={1080}
              className="max-w-full max-h-full object-contain"
              priority
              unoptimized
              sizes="100vw"
            />
          </div>
        )}

        {/* Navigation Buttons */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-4 sm:p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-40 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Previous"
            >
              <ChevronLeft size={24} className="sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-4 sm:p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-40 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Next"
            >
              <ChevronRight size={24} className="sm:w-6 sm:h-6" />
            </button>

            {/* Indicator */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-40">
              {mediaItems.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                    setIsVideoPlaying(false);
                  }}
                  className={`h-2 sm:h-2.5 rounded-full transition-all touch-manipulation min-w-[20px] ${
                    index === currentIndex
                      ? 'w-8 sm:w-10 bg-white'
                      : 'w-2 sm:w-2.5 bg-white/50'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>

            {/* Counter */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-40 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-black/50 text-white text-xs sm:text-sm font-medium">
              {currentIndex + 1} / {mediaItems.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

