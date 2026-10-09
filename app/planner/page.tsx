'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BedDouble,
  Bot,
  CalendarDays,
  Check,
  Compass,
  Loader2,
  MapPin,
  RotateCcw,
  Send,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import { tripPlannerMessage } from '@/lib/endpoints';

type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type TripIntent = {
  destination?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  guests?: number;
  budget?: number;
  interests: string[];
  pace?: 'relaxed' | 'balanced' | 'packed';
  transport?: string;
  notes?: string;
  missingFields: string[];
};

type ApartmentCandidate = {
  id: string;
  name: string;
  city: string;
  state: string;
  neighborhood?: string;
  address: string;
  pricePerNight: number;
  bedrooms: number;
  guests: number;
  amenities: string[];
  image?: string;
};

type ItineraryActivity = {
  time: string;
  title: string;
  category: string;
  location: string;
  description: string;
  estimatedCostPerPerson?: number;
};

type ItineraryDay = {
  day: number;
  title: string;
  activities: ItineraryActivity[];
};

type PlannerResult = {
  provider: string;
  reply: string;
  status: 'gathering' | 'ready' | 'no_inventory';
  intent: TripIntent;
  apartments: ApartmentCandidate[];
  activities: Array<{ id: string; name: string }>;
  itinerary?: {
    title: string;
    summary: string;
    selectedApartmentId?: string;
    estimatedActivityCost?: number;
    days: ItineraryDay[];
  };
};

const starterPrompts = [
  'Plan a relaxing weekend in Ikeja for two',
  'I want a family trip to Jos on a budget',
  'Give me a lively three-day Lagos experience',
];

const answerSuggestions: Record<string, string[]> = {
  destination: ['Ikeja, Lagos', 'Jos, Plateau', 'Abuja'],
  datesOrDuration: ['This weekend', '3 days', '5 days'],
  guests: ['Just me', '2 guests', 'A family of 4'],
  budget: ['Under ₦250,000', '₦500,000 total', 'Luxury — flexible budget'],
  interests: ['Food and culture', 'Nature and relaxation', 'Nightlife and shopping', 'Family activities'],
  pace: ['Relaxed pace', 'Balanced pace', 'Pack in as much as possible'],
  transport: ['I have a car', 'Ride-hailing', 'Keep everything nearby'],
};

const initialMessage: ConversationMessage = {
  role: 'assistant',
  content:
    'Tell me where you are going or the kind of trip you want. I’ll begin with available AfriBooking stays, then build the experience around you.',
};

const formatNaira = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

export default function TripPlannerPage() {
  const [messages, setMessages] = useState<ConversationMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [failedTurn, setFailedTurn] = useState<{ message: string; error: string } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = useMemo(() => {
    if (!result) return starterPrompts;
    const firstMissing = result.intent.missingFields?.[0];
    return (firstMissing && answerSuggestions[firstMissing]) || [
      'Make it more affordable',
      'Show me a different stay',
      'Keep activities closer together',
    ];
  }, [result]);

  const selectedApartment = useMemo(() => {
    if (!result?.apartments.length) return undefined;
    return (
      result.apartments.find(
        (apartment) => apartment.id === result.itinerary?.selectedApartmentId
      ) || result.apartments[0]
    );
  }, [result]);

  const selectedItineraryDay =
    result?.itinerary?.days.find((day) => day.day === selectedDay) || result?.itinerary?.days[0];

  const sendMessage = async (message: string, appendUser = true) => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    const nextMessages: ConversationMessage[] = appendUser
      ? [...messages, { role: 'user', content: trimmed }]
      : messages;
    if (appendUser) setMessages(nextMessages);
    setInput('');
    setFailedTurn(null);
    setLoading(true);

    try {
      const response = await fetch(tripPlannerMessage, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversation: nextMessages.slice(-10),
          intent: result?.intent,
        }),
      });
      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : null;
      if (!response.ok || !payload?.success) {
        const fallbackMessage =
          response.status === 504
            ? 'Trip planning took too long. Please try this answer again.'
            : 'Unable to plan this trip right now';
        throw new Error(payload?.message || fallbackMessage);
      }

      const plannerResult = payload.data as PlannerResult;
      setResult(plannerResult);
      setSelectedDay(plannerResult.itinerary?.days[0]?.day || 1);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: plannerResult.reply },
      ]);
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : 'Unable to plan this trip right now';
      const message =
        rawMessage === 'Failed to fetch'
          ? 'The trip planner could not reach the server. Please try this answer again.'
          : rawMessage;
      toast.error(message);
      setFailedTurn({ message: trimmed, error: message });
    } finally {
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const resetPlanner = () => {
    setMessages([initialMessage]);
    setInput('');
    setResult(null);
    setFailedTurn(null);
    setSelectedDay(1);
    inputRef.current?.focus();
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-[1320px] pb-16">
        <header className="relative overflow-hidden rounded-[28px] border border-[#f1dfac] bg-[radial-gradient(circle_at_top_right,_#fff2b7,_#fffaf0_45%,_#ffffff_78%)] px-5 py-8 sm:px-9 sm:py-10 dark:border-[#403821] dark:bg-[radial-gradient(circle_at_top_right,_#3d3215,_#1c222c_50%,_#141922_80%)]">
          <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-[#ffbf00]/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e9c75f] bg-white/80 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#7c5a00] dark:bg-[#181d25]/80 dark:text-[#ffcb32]">
              <Sparkles size={13} /> AfriBooking AI
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight text-[#17191b] sm:text-5xl dark:text-white">
              Start with a thought. Leave with a trip.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#636970] sm:text-base dark:text-[#bbc2cc]">
              Speak naturally. We search AfriBooking stays first and shape a practical itinerary around what matters to you.
            </p>
          </div>
        </header>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <section className="overflow-hidden rounded-3xl border border-[#e8e9ec] bg-white shadow-[0_14px_45px_rgba(20,24,30,0.06)] dark:border-[#353c47] dark:bg-[#1c222c]">
            <div className="flex items-center justify-between border-b border-[#eceef1] px-5 py-4 dark:border-[#353c47]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ffbf00] text-[#17191b]">
                  <Bot size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-[#17191b] dark:text-white">Your trip conversation</h2>
                  <p className="text-xs text-[#777e87] dark:text-[#aab1bc]">Flexible, private and easy to change</p>
                </div>
              </div>
              {messages.length > 1 && (
                <button
                  onClick={resetPlanner}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-[#6d737b] transition hover:bg-[#f5f6f7] hover:text-[#17191b] dark:hover:bg-[#252c36] dark:hover:text-white"
                >
                  <RotateCcw size={14} /> Start over
                </button>
              )}
            </div>

            <div className="max-h-[520px] min-h-[340px] space-y-4 overflow-y-auto px-5 py-6 sm:px-7">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[78%] ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-[#17191b] text-white dark:bg-[#ffbf00] dark:text-[#17191b]'
                        : 'rounded-bl-md border border-[#eceef1] bg-[#f7f8fa] text-[#30353a] dark:border-[#353c47] dark:bg-[#141922] dark:text-[#e7eaf0]'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-[#eceef1] bg-[#f7f8fa] px-4 py-3 text-sm text-[#6d737b] dark:border-[#353c47] dark:bg-[#141922] dark:text-[#b7bec8]">
                    <Loader2 size={16} className="animate-spin text-[#c58f00]" />
                    Checking AfriBooking stays first…
                  </div>
                </div>
              )}
              {failedTurn && !loading && (
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#f0c8c8] bg-[#fff5f5] px-4 py-3 dark:border-[#5d3333] dark:bg-[#2a1b1e] sm:max-w-[78%]">
                    <p className="text-sm leading-6 text-[#8d2f2f] dark:text-[#f0b1b1]">
                      {failedTurn.error}
                    </p>
                    <button
                      type="button"
                      onClick={() => void sendMessage(failedTurn.message, false)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#ddb4b4] bg-white px-3 py-1.5 text-xs font-extrabold text-[#7e2929] transition hover:border-[#bd7777] dark:border-[#684141] dark:bg-[#20171a] dark:text-[#f0b1b1]"
                    >
                      <RotateCcw size={13} /> Try this answer again
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#eceef1] px-5 py-4 dark:border-[#353c47] sm:px-7">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    disabled={loading}
                    className="shrink-0 rounded-full border border-[#e4e5e8] bg-white px-3.5 py-2 text-xs font-bold text-[#545a61] transition hover:border-[#e4aa00] hover:bg-[#fff9e8] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3a424e] dark:bg-[#181d25] dark:text-[#c5cbd4] dark:hover:border-[#ffbf00]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl border border-[#dfe1e5] bg-[#fafafa] p-2 focus-within:border-[#e0a600] focus-within:ring-4 focus-within:ring-[#ffbf00]/10 dark:border-[#3a424e] dark:bg-[#141922]">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  rows={2}
                  maxLength={1200}
                  placeholder="Example: I’m going to Ikeja for a relaxed weekend with my partner…"
                  className="max-h-32 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[#17191b] outline-none placeholder:text-[#9a9fa6] dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Send trip request"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ffbf00] text-[#17191b] shadow-sm transition hover:bg-[#eeb200] disabled:cursor-not-allowed disabled:bg-[#e7e8eb] disabled:text-[#a0a4aa]"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
              <p className="mt-2 text-center text-[10px] text-[#92979e]">
                Recommendations are suggestions. Confirm prices, opening hours and availability before travelling.
              </p>
            </div>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-3xl border border-[#e8e9ec] bg-white p-5 dark:border-[#353c47] dark:bg-[#1c222c]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b6700] dark:text-[#ffbf00]">Trip snapshot</p>
                  <h2 className="mt-1 text-lg font-black text-[#17191b] dark:text-white">
                    {result?.intent.destination || 'Waiting for your destination'}
                  </h2>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff5ce] text-[#ae7e00] dark:bg-[#312a17] dark:text-[#ffbf00]">
                  <Compass size={21} />
                </div>
              </div>

              {result ? (
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <SnapshotItem icon={CalendarDays} label="Length" value={result.intent.durationDays ? `${result.intent.durationDays} days` : result.intent.startDate || 'Flexible'} />
                  <SnapshotItem icon={Users} label="Guests" value={result.intent.guests ? String(result.intent.guests) : 'Flexible'} />
                  <SnapshotItem icon={Wallet} label="Budget" value={result.intent.budget ? formatNaira(result.intent.budget) : 'Flexible'} />
                  <SnapshotItem icon={Sparkles} label="Pace" value={result.intent.pace || 'Flexible'} />
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-[#dfe1e5] p-4 text-sm leading-6 text-[#777e87] dark:border-[#3a424e] dark:text-[#aeb5bf]">
                  As you chat, your destination, budget, dates and interests will appear here automatically.
                </div>
              )}
            </section>

            {result && (
              <section className="rounded-3xl border border-[#e8e9ec] bg-white p-5 dark:border-[#353c47] dark:bg-[#1c222c]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b6700] dark:text-[#ffbf00]">AfriBooking inventory first</p>
                    <h2 className="mt-1 text-lg font-black text-[#17191b] dark:text-white">
                      {result.apartments.length
                        ? `${result.apartments.length} matching stay${result.apartments.length === 1 ? '' : 's'}`
                        : 'No matching stay yet'}
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ecf8ef] px-2.5 py-1 text-[10px] font-extrabold text-[#24733a] dark:bg-[#173322] dark:text-[#84d99a]">
                    <Check size={11} /> Searched first
                  </span>
                </div>

                {selectedApartment ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-[#e8e9ec] dark:border-[#353c47]">
                    {selectedApartment.image ? (
                      <div className="relative h-36 w-full bg-[#eef0f2]">
                        <Image
                          src={selectedApartment.image}
                          alt={selectedApartment.name}
                          fill
                          unoptimized
                          sizes="(max-width: 1280px) 100vw, 420px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="grid h-28 place-items-center bg-[#f2f3f5] text-[#a2a7ae] dark:bg-[#141922]">
                        <BedDouble size={28} />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-extrabold text-[#17191b] dark:text-white">{selectedApartment.name}</h3>
                          <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#777e87] dark:text-[#aeb5bf]">
                            <MapPin size={12} /> {selectedApartment.neighborhood || selectedApartment.city}, {selectedApartment.state}
                          </p>
                        </div>
                        <p className="shrink-0 text-right text-xs font-black text-[#17191b] dark:text-white">
                          {formatNaira(selectedApartment.pricePerNight)}
                          <span className="block font-medium text-[#8a9098]">per night</span>
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-[#686e76] dark:text-[#b7bec8]">
                        <span>{selectedApartment.bedrooms} bedrooms</span>
                        <span>•</span>
                        <span>Up to {selectedApartment.guests} guests</span>
                      </div>
                      <Link
                        href={`/apartments/${selectedApartment.id}`}
                        className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-[#17191b] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#303438] dark:bg-[#ffbf00] dark:text-[#17191b]"
                      >
                        View recommended stay <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-[#fff7dc] p-4 text-sm leading-6 text-[#6f570d] dark:bg-[#302916] dark:text-[#efcf77]">
                    Try a nearby neighbourhood or another destination where AfriBooking currently has published stays.
                  </p>
                )}
              </section>
            )}
          </aside>
        </div>

        {result?.itinerary && result.itinerary.days.length > 0 && (
          <section className="mt-6 rounded-3xl border border-[#e8e9ec] bg-white p-5 sm:p-7 dark:border-[#353c47] dark:bg-[#1c222c]">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b6700] dark:text-[#ffbf00]">Your evolving itinerary</p>
                <h2 className="mt-1 font-display text-2xl font-black text-[#17191b] dark:text-white">{result.itinerary.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f757d] dark:text-[#b3bac4]">{result.itinerary.summary}</p>
              </div>
              {result.itinerary.estimatedActivityCost !== undefined && (
                <div className="rounded-2xl bg-[#fff7d8] px-4 py-3 text-right dark:bg-[#302916]">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8b6700]">Estimated activities</p>
                  <p className="text-lg font-black text-[#17191b] dark:text-white">{formatNaira(result.itinerary.estimatedActivityCost)}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {result.itinerary.days.map((day) => (
                <button
                  key={day.day}
                  onClick={() => setSelectedDay(day.day)}
                  className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-extrabold transition ${
                    selectedItineraryDay?.day === day.day
                      ? 'border-[#ffbf00] bg-[#ffbf00] text-[#17191b]'
                      : 'border-[#e3e5e8] bg-white text-[#656b73] hover:border-[#e0aa0a] dark:border-[#3a424e] dark:bg-[#141922] dark:text-[#c0c6cf]'
                  }`}
                >
                  Day {day.day}
                </button>
              ))}
            </div>

            {selectedItineraryDay && (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {selectedItineraryDay.activities.map((activity, index) => (
                  <article key={`${activity.title}-${index}`} className="rounded-2xl border border-[#e8e9ec] p-5 dark:border-[#353c47] dark:bg-[#181d25]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#9a7000] dark:text-[#ffbf00]">{activity.time}</span>
                      <span className="rounded-full bg-[#f3f4f5] px-2 py-1 text-[10px] font-bold text-[#686e76] dark:bg-[#252c36] dark:text-[#c3c9d2]">{activity.category}</span>
                    </div>
                    <h3 className="mt-3 text-base font-black text-[#17191b] dark:text-white">{activity.title}</h3>
                    <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-[#7a8088] dark:text-[#aeb5bf]"><MapPin size={13} className="mt-0.5 shrink-0" /> {activity.location}</p>
                    <p className="mt-3 text-sm leading-6 text-[#555b62] dark:text-[#c3c9d2]">{activity.description}</p>
                    {activity.estimatedCostPerPerson !== undefined && (
                      <p className="mt-4 text-xs font-extrabold text-[#17191b] dark:text-white">About {formatNaira(activity.estimatedCostPerPerson)} per person</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </AppShell>
  );
}

function SnapshotItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f7f8fa] p-3 dark:bg-[#141922]">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#858b93]">
        <Icon size={12} /> {label}
      </div>
      <p className="mt-1.5 truncate text-xs font-extrabold capitalize text-[#25292d] dark:text-white">{value}</p>
    </div>
  );
}
