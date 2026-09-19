'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import { numberWithCommas } from '@/lib/utils';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Car,
  Compass,
  ArrowLeft,
  Share2,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ActivityItem {
  time: string;
  category: string;
  title: string;
  location: string;
  pricePerPerson: number;
}

const sampleActivities: Record<string, ActivityItem[]> = {
  Abuja: [
    {
      time: '10:00 AM · MORNING',
      category: 'Culture',
      title: 'Thought Pyramid Art Centre',
      location: 'Wuse 2, Abuja',
      pricePerPerson: 6000,
    },
    {
      time: '1:30 PM · AFTERNOON',
      category: 'Relaxation',
      title: 'Jabi Lake Park & Waterfront Stroll',
      location: 'Jabi, Abuja',
      pricePerPerson: 2500,
    },
    {
      time: '6:00 PM · EVENING',
      category: 'Food',
      title: 'Nkoyo Traditional Dining',
      location: 'Wuse 2, Abuja',
      pricePerPerson: 12000,
    },
    {
      time: '9:30 PM · NIGHT',
      category: 'Nightlife',
      title: 'Moscow Underground Lounge',
      location: 'Wuse 2, Abuja',
      pricePerPerson: 15000,
    },
  ],
  Lagos: [
    {
      time: '10:00 AM · MORNING',
      category: 'Beaches',
      title: 'Moist Beach Club & Oceanfront Breakfast',
      location: 'Oniru, Victoria Island, Lagos',
      pricePerPerson: 10000,
    },
    {
      time: '1:30 PM · AFTERNOON',
      category: 'Culture',
      title: 'Nike Art Gallery & African Crafts',
      location: 'Lekki Phase 1, Lagos',
      pricePerPerson: 5000,
    },
    {
      time: '6:30 PM · EVENING',
      category: 'Food',
      title: 'Terra Kulture Restaurant & Arts',
      location: 'Victoria Island, Lagos',
      pricePerPerson: 16000,
    },
    {
      time: '10:00 PM · NIGHT',
      category: 'Nightlife',
      title: 'Zaza Lounge & Club',
      location: 'Victoria Island, Lagos',
      pricePerPerson: 25000,
    },
  ],
};

const interestOptions = [
  'Food',
  'Culture',
  'Beaches',
  'Nightlife',
  'Shopping',
  'Adventure',
  'Relaxation',
  'Family',
  'Events',
];

export default function TripPlannerPage() {
  const [step, setStep] = useState<'form' | 'itinerary'>('form');
  const [city, setCity] = useState('Abuja');
  const [travellers, setTravellers] = useState(2);
  const [startDate, setStartDate] = useState('2026-10-21');
  const [endDate, setEndDate] = useState('2026-10-24');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Food',
    'Culture',
    'Nightlife',
  ]);
  const [pace, setPace] = useState('Balanced');
  const [transport, setTransport] = useState('Rent a car');
  const [budget, setBudget] = useState(250000);
  const [notes, setNotes] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleBuildItinerary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error('Please select both arrival and departure dates.');
      return;
    }
    const days = Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days <= 0 || days > 14) {
      toast.error('Please choose a trip duration between 1 and 14 days.');
      return;
    }
    if (selectedInterests.length === 0) {
      toast.error('Please select at least one interest.');
      return;
    }
    setSelectedDay(1);
    setStep('itinerary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tripDays = Math.max(
    1,
    Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const cityActivities = sampleActivities[city] || sampleActivities.Abuja;
  const filteredActivities = cityActivities.filter((a) =>
    selectedInterests.includes(a.category)
  );
  const activitiesToDisplay =
    filteredActivities.length > 0 ? filteredActivities : cityActivities.slice(0, 3);
  const count = pace === 'Relaxed' ? 2 : pace === 'Packed' ? 4 : 3;
  const currentDayActivities = activitiesToDisplay.slice(0, count);

  const activityTotal = currentDayActivities.reduce(
    (acc, item) => acc + item.pricePerPerson * travellers,
    0
  );
  const transportCost = transport === 'Use my car' ? 0 : 45000;
  const dayTotal = activityTotal + transportCost;

  return (
    <AppShell>
      {step === 'form' ? (
        <div>
          {/* Back link */}
          <Link
            href="/apartments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6c7075] dark:text-[#acb4c0] hover:text-[#17191b] dark:hover:text-white mb-6"
          >
            <ArrowLeft size={14} />
            <span>Back to discover</span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <span className="block text-xs font-bold tracking-[1.7px] text-[#896300] dark:text-[#ffbf00] uppercase mb-2">
              AFRIBOOKING AI · TRIP DETAILS
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#17191b] dark:text-[#f0f2f6] tracking-tight">
              Make every day your kind of day.
            </h1>
            <p className="text-sm sm:text-base text-[#6c7075] dark:text-[#acb4c0] mt-2">
              Tell us where you’ll be and what you enjoy. We’ll organize stays, spaces, and plans.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* Form */}
            <form onSubmit={handleBuildItinerary} className="space-y-6">
              {/* Panel 1: Essentials */}
              <section className="bg-white dark:bg-[#1c222c] border border-[#e7e8eb] dark:border-[#353c47] rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold mb-4 text-[#17191b] dark:text-[#f0f2f6]">
                  Your trip essentials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6c7075] dark:text-[#acb4c0] mb-1.5">
                      Where will you stay?
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-white dark:bg-[#141922] border border-[#dedfe2] dark:border-[#353c47] rounded-xl px-3.5 py-2.5 text-sm text-[#17191b] dark:text-[#f0f2f6] focus:outline-none focus:ring-2 focus:ring-[#ffbf00]"
                    >
                      <option value="Abuja">Abuja</option>
                      <option value="Lagos">Lagos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6c7075] dark:text-[#acb4c0] mb-1.5">
                      Travellers
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={travellers}
                      onChange={(e) => setTravellers(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#141922] border border-[#dedfe2] dark:border-[#353c47] rounded-xl px-3.5 py-2.5 text-sm text-[#17191b] dark:text-[#f0f2f6] focus:outline-none focus:ring-2 focus:ring-[#ffbf00]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6c7075] dark:text-[#acb4c0] mb-1.5">
                      Arrival
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white dark:bg-[#141922] border border-[#dedfe2] dark:border-[#353c47] rounded-xl px-3.5 py-2.5 text-sm text-[#17191b] dark:text-[#f0f2f6] focus:outline-none focus:ring-2 focus:ring-[#ffbf00]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6c7075] dark:text-[#acb4c0] mb-1.5">
                      Departure
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white dark:bg-[#141922] border border-[#dedfe2] dark:border-[#353c47] rounded-xl px-3.5 py-2.5 text-sm text-[#17191b] dark:text-[#f0f2f6] focus:outline-none focus:ring-2 focus:ring-[#ffbf00]"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Panel 2: Interests */}
              <section className="bg-white dark:bg-[#1c222c] border border-[#e7e8eb] dark:border-[#353c47] rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold mb-2 text-[#17191b] dark:text-[#f0f2f6]">
                  What do you want to enjoy?
                </h3>
                <p className="text-xs text-[#6c7075] dark:text-[#acb4c0] mb-4">
                  Select experiences you’d like woven into your itinerary.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {interestOptions.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        type="button"
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                          isSelected
                            ? 'bg-[#fff9e9] dark:bg-[#302916] border-[#e1ad24] text-[#866000] dark:text-[#ffbf00]'
                            : 'border-[#dedfe2] dark:border-[#353c47] text-[#17191b] dark:text-[#f0f2f6] hover:border-[#ffbf00]'
                        }`}
                      >
                        {interest} {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Panel 3: Pace & Budget */}
              <section className="bg-white dark:bg-[#1c222c] border border-[#e7e8eb] dark:border-[#353c47] rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold mb-4 text-[#17191b] dark:text-[#f0f2f6]">
                  Set the pace and budget
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6c7075] dark:text-[#acb4c0] mb-1.5">
                      Pace of the trip
                    </label>
                    <select
                      value={pace}
                      onChange={(e) => setPace(e.target.value)}
                      className="w-full bg-white dark:bg-[#141922] border border-[#dedfe2] dark:border-[#353c47] rounded-xl px-3.5 py-2.5 text-sm text-[#17191b] dark:text-[#f0f2f6] focus:outline-none focus:ring-2 focus:ring-[#ffbf00]"
                    >
                      <option value="Relaxed">Relaxed</option>
                      <option value="Balanced">Balanced</option>
                      <option value="Packed">Packed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6c7075] dark:text-[#acb4c0] mb-1.5">
                      Getting around
                    </label>
                    <select
                      value={transport}
                      onChange={(e) => setTransport(e.target.value)}
                      className="w-full bg-white dark:bg-[#141922] border border-[#dedfe2] dark:border-[#353c47] rounded-xl px-3.5 py-2.5 text-sm text-[#17191b] dark:text-[#f0f2f6] focus:outline-none focus:ring-2 focus:ring-[#ffbf00]"
                    >
                      <option value="Use my car">Use my car</option>
                      <option value="Rent a car">Rent a car</option>
                      <option value="Chauffeur">Chauffeur</option>
                      <option value="Ride-hailing">Ride-hailing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6c7075] dark:text-[#acb4c0] mb-1.5">
                      Total budget (₦)
                    </label>
                    <input
                      type="number"
                      min={10000}
                      step={10000}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#141922] border border-[#dedfe2] dark:border-[#353c47] rounded-xl px-3.5 py-2.5 text-sm text-[#17191b] dark:text-[#f0f2f6] focus:outline-none focus:ring-2 focus:ring-[#ffbf00]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6c7075] dark:text-[#acb4c0] mb-1.5">
                    Anything else? <span className="text-gray-400 font-normal">Optional</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Romantic dinner spots, child-friendly places, wheelchair access…"
                    className="w-full bg-white dark:bg-[#141922] border border-[#dedfe2] dark:border-[#353c47] rounded-xl p-3 text-sm text-[#17191b] dark:text-[#f0f2f6] focus:outline-none focus:ring-2 focus:ring-[#ffbf00]"
                  />
                </div>
              </section>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-[#ffbf00] hover:bg-[#eeb200] text-[#17191b] font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Build my itinerary</span>
                <span className="text-xl leading-none">✦</span>
              </button>
            </form>

            {/* Aside */}
            <aside className="bg-[#fff9e9] dark:bg-[#1c222c] border border-[#f4e5b9] dark:border-[#353c47] rounded-2xl p-6 sticky top-28">
              <span className="block text-[11px] font-bold tracking-[1.5px] text-[#896300] dark:text-[#ffbf00] uppercase mb-1.5">
                A LITTLE LESS PLANNING
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2 text-[#17191b] dark:text-[#f0f2f6]">
                A little more living.
              </h2>
              <p className="text-xs sm:text-sm text-[#686254] dark:text-[#acb4c0] mb-5">
                Your stay is just the beginning. Bring the rest of your trip together seamlessly.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#686254] dark:text-[#acb4c0] mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-[#ffbf00] font-bold">✓</span> Activities organised by day
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ffbf00] font-bold">✓</span> Estimated costs at a glance
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ffbf00] font-bold">✓</span> Transport alongside your plans
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ffbf00] font-bold">✓</span> Directions to each destination
                </li>
              </ul>
              <div className="relative w-full h-40 rounded-xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop&q=80"
                  alt="Palm resort pool"
                  fill
                  sizes="(max-width: 1024px) 100vw, 360px"
                  className="object-cover"
                />
              </div>
            </aside>
          </div>
        </div>
      ) : (
        /* Itinerary View */
        <div>
          {/* Back link */}
          <button
            onClick={() => setStep('form')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6c7075] dark:text-[#acb4c0] hover:text-[#17191b] dark:hover:text-white mb-6"
          >
            <ArrowLeft size={14} />
            <span>Edit trip preferences</span>
          </button>

          {/* Intro */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="block text-xs font-bold tracking-[1.7px] text-[#896300] dark:text-[#ffbf00] uppercase mb-2">
                YOUR TRIP, BROUGHT TOGETHER
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#17191b] dark:text-[#f0f2f6] tracking-tight">
                Your {city} itinerary
              </h1>
              <p className="text-sm text-[#6c7075] dark:text-[#acb4c0] mt-1.5">
                {startDate} — {endDate} · {tripDays} days · {travellers} travellers · {pace} pace
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.success('Itinerary saved for this session!')}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#e7e8eb] dark:border-[#353c47] bg-white dark:bg-[#1c222c] rounded-xl text-xs font-semibold text-[#17191b] dark:text-[#f0f2f6] hover:border-[#ffbf00] transition-colors"
              >
                <Bookmark size={15} />
                <span>Save itinerary</span>
              </button>
            </div>
          </div>

          {/* Banner */}
          <div className="banner-gradient rounded-2xl p-5 sm:p-6 mb-7 flex items-center gap-4">
            <div className="text-3xl text-[#dc9d00] dark:text-[#ffbf00] leading-none">✦</div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#17191b] dark:text-white">
                {pace} days, built around you.
              </h2>
              <p className="text-xs sm:text-sm text-[#62605a] dark:text-[#acb4c0]">
                Curated suggestions for {selectedInterests.join(', ').toLowerCase()}.
              </p>
            </div>
          </div>

          {/* Day Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-7 pb-1">
            {Array.from({ length: tripDays }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setSelectedDay(i + 1)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  selectedDay === i + 1
                    ? 'bg-[#ffbf00] border-[#ffbf00] text-[#17191b] shadow-sm'
                    : 'bg-white dark:bg-[#1c222c] border-[#e7e8eb] dark:border-[#353c47] text-[#6c7075] dark:text-[#acb4c0] hover:border-[#ffbf00]'
                }`}
              >
                Day {i + 1}
              </button>
            ))}
          </div>

          {/* Main Layout: Timeline & Spend Side */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
            {/* Timeline */}
            <div className="relative pl-5 sm:pl-6 border-l-2 border-[#e2b542] dark:border-[#866000] space-y-6">
              {currentDayActivities.map((act, index) => (
                <article
                  key={index}
                  className="relative bg-white dark:bg-[#1c222c] border border-[#e7e8eb] dark:border-[#353c47] rounded-2xl p-4 sm:p-6 shadow-sm"
                >
                  {/* Circle dot on timeline */}
                  <div className="absolute -left-[27px] sm:-left-[31px] top-6 w-3 h-3 rounded-full bg-[#ffbf00] border-4 border-[#fff9e9] dark:border-[#302916] box-content" />

                  <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2">
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#997000] dark:text-[#ffbf00] tracking-wider uppercase">
                        {act.time}
                      </span>
                      <h3 className="font-display text-base sm:text-lg font-bold text-[#17191b] dark:text-[#f0f2f6] mt-0.5">
                        {act.title}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-sm sm:text-base text-[#17191b] dark:text-[#f0f2f6]">
                        ₦{numberWithCommas(act.pricePerPerson)}
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-[#6c7075] dark:text-[#acb4c0]">est. / person</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#6c7075] dark:text-[#acb4c0] mb-2">{act.category} · Suggested activity</p>

                  <p className="flex items-center text-xs text-[#6c7075] dark:text-[#acb4c0] mb-4">
                    <MapPin size={14} className="mr-1.5 text-[#ffbf00] shrink-0" />
                    <span className="truncate">{act.location}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        act.title + ' ' + act.location
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#e7e8eb] dark:border-[#353c47] rounded-lg text-xs font-semibold hover:border-[#ffbf00] transition-colors"
                    >
                      <ExternalLink size={13} />
                      <span>Directions</span>
                    </a>
                    <button
                      onClick={() => toast.success('Venue contacts available on verified bookings.')}
                      className="px-3 py-1.5 border border-[#e7e8eb] dark:border-[#353c47] rounded-lg text-xs font-semibold hover:border-[#ffbf00] transition-colors text-[#6c7075] dark:text-[#acb4c0]"
                    >
                      Contact venue
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Trip Spend Side Summary */}
            <aside className="bg-[#fff9e9] dark:bg-[#1c222c] border border-[#f4e5b9] dark:border-[#353c47] rounded-2xl p-6 sticky top-28 space-y-4">
              <div>
                <span className="block text-[11px] font-bold tracking-[1.5px] text-[#896300] dark:text-[#ffbf00] uppercase mb-1">
                  DAY {selectedDay} · ESTIMATED SPEND
                </span>
                <h2 className="font-display text-2xl font-extrabold text-[#17191b] dark:text-[#f0f2f6]">
                  ₦{numberWithCommas(dayTotal)}
                </h2>
              </div>

              <div className="space-y-2 border-t border-[#e7dcb7] dark:border-[#353c47] pt-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-[#686254] dark:text-[#acb4c0]">
                  <span>Activities · {travellers} people</span>
                  <span className="font-semibold text-[#17191b] dark:text-white">
                    ₦{numberWithCommas(activityTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#686254] dark:text-[#acb4c0]">
                  <span>{transport}</span>
                  <span className="font-semibold text-[#17191b] dark:text-white">
                    ₦{numberWithCommas(transportCost)}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#e7dcb7] dark:border-[#353c47] pt-3">
                <p className="text-xs text-[#686254] dark:text-[#acb4c0]">
                  Trip budget: <strong className="text-[#17191b] dark:text-white">₦{numberWithCommas(budget)}</strong>
                </p>
                <div className="w-full bg-[#dedfe2] dark:bg-gray-700 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-[#ffbf00] h-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((dayTotal / budget) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-[#6c7075] dark:text-[#acb4c0] mt-1.5">
                  This day accounts for {Math.round((dayTotal / budget) * 100)}% of your overall budget.
                </p>
              </div>

              <Link
                href="/apartments"
                className="w-full py-3 bg-[#ffbf00] hover:bg-[#eeb200] text-[#17191b] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Find stays in {city}</span>
                <span>→</span>
              </Link>
            </aside>
          </div>
        </div>
      )}
    </AppShell>
  );
}
