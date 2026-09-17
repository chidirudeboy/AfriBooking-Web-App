'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowUpRight, Heart, MapPin, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getEveryApartments } from '@/lib/endpoints';
import { TApartments } from '@/lib/types/airbnb';
import api from '@/lib/utils/api';
import { numberWithCommas } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';

const mediaUrl = (item: any) => typeof item === 'string' ? item : item?.uri || item?.url || item?.fullPath || '';

export default function ReelsPage() {
  const router = useRouter();
  const [apartments, setApartments] = useState<TApartments[]>([]);
  const [loading, setLoading] = useState(true);
  const { favoriteIds, pendingIds, toggleFavorite } = useFavorites();
  useEffect(() => { api.get(getEveryApartments).then(({ data }) => setApartments(data?.apartments || data?.data || [])).finally(() => setLoading(false)); }, []);
  const reels = useMemo(() => apartments.map((apartment) => ({ apartment, video: mediaUrl(apartment.media?.videos?.[0] || apartment.videos?.[0]), image: mediaUrl(apartment.media?.images?.[apartment.reelsImageIndex || 0] || apartment.media?.images?.[0]) })).filter((item) => item.video || item.image), [apartments]);

  return (
    <AppShell width="max-w-3xl">
      <div className="mb-6"><p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-600">DISCOVER VISUALLY</p><h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">Apartment reels</h1><p className="mt-2 text-gray-600 dark:text-gray-400">Swipe through immersive tours and save the stays that feel right.</p></div>
      {loading ? <div className="aspect-[9/14] animate-pulse rounded-[2rem] bg-gray-200 dark:bg-gray-800" /> : reels.length ? <div className="h-[calc(100vh-190px)] snap-y snap-mandatory overflow-y-auto rounded-[2rem] bg-black shadow-2xl">{reels.map(({ apartment, video, image }) => <Reel key={apartment._id} apartment={apartment} video={video} image={image} isFavorite={favoriteIds.has(apartment._id)} pending={pendingIds.has(apartment._id)} onFavorite={() => toggleFavorite(apartment._id)} onOpen={() => router.push(`/apartments/${apartment._id}`)} />)}</div> : <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-14 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900">Apartment tours will appear here as hosts add videos.</div>}
    </AppShell>
  );
}

function Reel({ apartment, video, image, isFavorite, pending, onFavorite, onOpen }: { apartment: TApartments; video: string; image: string; isFavorite: boolean; pending: boolean; onFavorite: () => void; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    if (!video || !containerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { videoRef.current?.play().catch(() => undefined); setPlaying(true); } else { videoRef.current?.pause(); setPlaying(false); } }, { threshold: 0.65 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [video]);
  return <article ref={containerRef} className="relative h-full min-h-[560px] snap-start overflow-hidden bg-gray-950 text-white">{video ? <video ref={videoRef} src={video} autoPlay loop muted={muted} playsInline className="h-full w-full object-cover" /> : image ? <Image src={image} alt={apartment.apartmentName} fill className="object-cover" sizes="768px" /> : null}<div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/20" /><div className="absolute right-4 top-4 flex gap-2"><button onClick={() => { if (!videoRef.current) return; playing ? videoRef.current.pause() : videoRef.current.play(); setPlaying(!playing); }} className="grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur" aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={19} /> : <Play size={19} />}</button>{video && <button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }} className="grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur" aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button>}</div><div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8"><div className="flex items-end justify-between gap-5"><div className="min-w-0"><div className="mb-3 flex items-center gap-2 text-sm text-white/80"><MapPin size={15} /><span className="truncate">{[apartment.city, apartment.state].filter(Boolean).join(', ')}</span></div><h2 className="text-2xl font-extrabold sm:text-3xl">{apartment.apartmentName}</h2><p className="mt-2 text-lg font-bold text-amber-300">₦{numberWithCommas(apartment.defaultStayFee)} <span className="text-sm font-normal text-white/70">/ night</span></p><button onClick={onOpen} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-extrabold text-gray-950">View this stay <ArrowUpRight size={18} /></button></div><button onClick={onFavorite} disabled={pending} className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:scale-105 disabled:opacity-60" aria-label="Save stay"><Heart size={25} className={isFavorite ? 'fill-rose-500 text-rose-500' : ''} /></button></div></div></article>;
}
