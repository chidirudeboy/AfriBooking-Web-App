'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Check, Download, Film, ImageIcon, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export interface DownloadableMediaItem {
  type: 'image' | 'video';
  uri: string;
}

interface MediaDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: DownloadableMediaItem[];
  apartmentName: string;
  authToken: string;
}

const fileExtension = (uri: string, contentType: string, type: 'image' | 'video') => {
  const fromMime = contentType.split('/')[1]?.split(';')[0]?.replace('jpeg', 'jpg');
  if (fromMime && /^[a-z0-9]+$/i.test(fromMime)) return fromMime;

  try {
    const pathExtension = new URL(uri).pathname.split('.').pop()?.toLowerCase();
    if (pathExtension && /^[a-z0-9]{2,5}$/i.test(pathExtension)) return pathExtension;
  } catch {
    // The MIME type/default below is enough when the URL cannot be parsed.
  }

  return type === 'video' ? 'mp4' : 'jpg';
};

const safeFileName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'apartment';

export default function MediaDownloadModal({
  isOpen,
  onClose,
  mediaItems,
  apartmentName,
  authToken,
}: MediaDownloadModalProps) {
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [archiveProgress, setArchiveProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedIndexes(new Set(mediaItems.map((_, index) => index)));
    setProcessedFiles(0);
    setArchiveProgress(0);
  }, [isOpen, mediaItems]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDownloading) onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isDownloading, onClose]);

  const selectedItems = useMemo(
    () => mediaItems.filter((_, index) => selectedIndexes.has(index)),
    [mediaItems, selectedIndexes]
  );

  const imageCount = selectedItems.filter((item) => item.type === 'image').length;
  const videoCount = selectedItems.filter((item) => item.type === 'video').length;
  const allSelected = mediaItems.length > 0 && selectedIndexes.size === mediaItems.length;

  const toggleItem = (index: number) => {
    if (isDownloading) return;

    setSelectedIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (isDownloading) return;
    setSelectedIndexes(allSelected ? new Set() : new Set(mediaItems.map((_, index) => index)));
  };

  const handleDownload = async () => {
    if (!selectedItems.length || isDownloading) return;

    setIsDownloading(true);
    setProcessedFiles(0);
    setArchiveProgress(0);

    try {
      const JSZip = (await import('jszip')).default;
      const archive = new JSZip();
      const folder = archive.folder('media');

      if (!folder) throw new Error('Could not create the media archive.');

      for (let index = 0; index < selectedItems.length; index += 1) {
        const item = selectedItems[index];
        const response = await fetch(`/api/media-download?url=${encodeURIComponent(item.uri)}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Media ${index + 1} could not be downloaded.`);
        }

        const blob = await response.blob();
        const extension = fileExtension(item.uri, blob.type, item.type);
        const label = item.type === 'video' ? 'video' : 'photo';
        folder.file(`${label}-${String(index + 1).padStart(2, '0')}.${extension}`, blob);
        setProcessedFiles(index + 1);
      }

      const zipBlob = await archive.generateAsync(
        { type: 'blob', compression: 'STORE' },
        ({ percent }) => setArchiveProgress(Math.round(percent))
      );
      const objectUrl = URL.createObjectURL(zipBlob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${safeFileName(apartmentName)}-media.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      toast.success(`${selectedItems.length} media file${selectedItems.length === 1 ? '' : 's'} ready to download`);
      onClose();
    } catch (error) {
      console.error('Media download failed:', error);
      toast.error(error instanceof Error ? error.message : 'Could not download the selected media. Please try again.');
    } finally {
      setIsDownloading(false);
      setProcessedFiles(0);
      setArchiveProgress(0);
    }
  };

  if (!isOpen) return null;

  const progressLabel = processedFiles < selectedItems.length
    ? `Preparing ${processedFiles + 1} of ${selectedItems.length}`
    : `Creating ZIP ${archiveProgress}%`;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={() => !isDownloading && onClose()}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-media-title"
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 sm:max-w-4xl sm:rounded-3xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-gray-200 px-5 py-5 dark:border-gray-700 sm:px-7">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff5cc] text-[#8a6500] dark:bg-[#ffbf00]/15 dark:text-[#ffcf40]">
              <Download size={20} />
            </span>
            <div className="min-w-0">
              <h2 id="download-media-title" className="text-lg font-bold text-gray-950 dark:text-white sm:text-xl">Choose media to download</h2>
              <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{apartmentName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Close media selection"
          >
            <X size={22} />
          </button>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800 sm:px-7">
          <button type="button" onClick={toggleAll} disabled={isDownloading} className="inline-flex items-center gap-2 text-sm font-semibold text-[#7a5900] hover:text-[#4f3a00] disabled:opacity-50 dark:text-[#ffcf40]">
            <span className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${allSelected ? 'border-[#ffbf00] bg-[#ffbf00] text-black' : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'}`}>
              {allSelected && <Check size={14} strokeWidth={3} />}
            </span>
            {allSelected ? 'Clear selection' : 'Select all'}
          </button>
          <div className="flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1"><ImageIcon size={14} /> {imageCount} photos</span>
            <span className="inline-flex items-center gap-1"><Film size={14} /> {videoCount} videos</span>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {mediaItems.map((item, index) => {
              const selected = selectedIndexes.has(index);
              return (
                <button
                  type="button"
                  key={`${item.type}-${item.uri}-${index}`}
                  onClick={() => toggleItem(index)}
                  disabled={isDownloading}
                  aria-pressed={selected}
                  className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border-2 text-left transition duration-200 disabled:cursor-wait ${selected ? 'border-[#ffbf00] ring-2 ring-[#ffbf00]/25' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  {item.type === 'video' ? (
                    <video src={item.uri} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    <Image src={item.uri} alt={`Apartment photo ${index + 1}`} fill className="object-cover transition duration-300 group-hover:scale-[1.03]" unoptimized sizes="(max-width: 640px) 50vw, 25vw" />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
                  <span className={`absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border shadow-sm transition ${selected ? 'border-[#ffbf00] bg-[#ffbf00] text-black' : 'border-white/80 bg-black/30 text-transparent backdrop-blur-sm'}`}>
                    <Check size={17} strokeWidth={3} />
                  </span>
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    {item.type === 'video' ? <Film size={12} /> : <ImageIcon size={12} />}
                    {item.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <footer className="border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900 sm:px-7">
          {isDownloading && (
            <div className="mb-3">
              <div className="mb-1.5 flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                <span>{progressLabel}</span>
                <span>{processedFiles}/{selectedItems.length} files</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full rounded-full bg-[#ffbf00] transition-all duration-300" style={{ width: `${selectedItems.length ? Math.min(100, (processedFiles / selectedItems.length) * 90 + archiveProgress * 0.1) : 0}%` }} />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">{selectedItems.length} of {mediaItems.length} selected</p>
            <div className="flex w-full gap-3 sm:w-auto">
              <button type="button" onClick={onClose} disabled={isDownloading} className="flex-1 rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 sm:flex-none">Cancel</button>
              <button type="button" onClick={handleDownload} disabled={!selectedItems.length || isDownloading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ffca1a] to-[#e4a700] px-5 py-3 text-sm font-bold text-gray-950 shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-48 sm:flex-none">
                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {isDownloading ? 'Preparing download' : `Download ${selectedItems.length || ''} ${selectedItems.length === 1 ? 'file' : 'files'}`}
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
