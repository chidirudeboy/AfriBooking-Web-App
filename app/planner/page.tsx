'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  BedDouble,
  Bot,
  CalendarDays,
  Car,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Compass,
  Copy,
  ExternalLink,
  Globe2,
  Loader2,
  MapPin,
  Moon,
  MoveRight,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Send,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  Trees,
  Utensils,
  Users,
  Wallet,
  Waves,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/utils/api';
import {
  deleteTripPlan,
  addTripActivity,
  autocompletePlaces,
  getPlaceDetails,
  getPlacePhoto,
  getTripPlan,
  getTripApartmentPage,
  getTripPlans,
  tripPlannerMessage,
  resetTripStayPreferences,
  saveTripPlannerSetup,
  selectTripStay,
  setTripStayPreference,
  undoTripStayPreference,
  updateTripActivityRadius,
  updateTripPlan,
} from '@/lib/endpoints';

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
  activityRadiusKm?: number;
  activityCategory?: string;
  activitySubcategories?: string[];
  activityPreferences?: Record<string, string[]>;
  specificArea?: string;
  accommodationMode?: 'afribooking' | 'own';
  accommodationAddress?: string;
  activityLocation?: {
    name: string;
    address?: string;
    placeId?: string;
    latitude: number;
    longitude: number;
  };
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
  priceIncludesPlatformFee?: boolean;
  bedrooms: number;
  guests: number;
  amenities: string[];
  image?: string;
  distanceKm?: number;
  recommendationScore?: number;
  recommendationReasons?: string[];
};

type ApartmentSearchPage = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

type ItineraryActivity = {
  time: string;
  title: string;
  category: string;
  location: string;
  description: string;
  estimatedCostPerPerson?: number;
  sourceActivityId?: string;
};

type ActivityCandidate = {
  id: string;
  name: string;
  address: string;
  types: string[];
  latitude?: number;
  longitude?: number;
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  phoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  priceLevel?: string;
  openNow?: boolean;
  distanceKm?: number;
  drivingDistanceKm?: number;
  travelTimeMinutes?: number;
  trafficAware?: boolean;
  recommendationScore?: number;
  addedByUser?: boolean;
  hasPhoto?: boolean;
  photoAttributions?: Array<{
    displayName: string;
    uri?: string;
    photoUri?: string;
  }>;
};

type PlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
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
  planId: string;
  planStatus: 'draft' | 'saved';
  intent: TripIntent;
  apartments: ApartmentCandidate[];
  apartmentSearch?: ApartmentSearchPage;
  activities: ActivityCandidate[];
  itinerary?: {
    title: string;
    summary: string;
    selectedApartmentId?: string;
    estimatedActivityCost?: number;
    days: ItineraryDay[];
  };
  stayPreferences?: StayPreferences;
};

type StayDecision = 'interested' | 'rejected';

type StayPreferences = {
  interestedApartmentIds: string[];
  rejectedApartmentIds: string[];
  currentApartmentId?: string;
  selectedApartmentId?: string;
  decisions: Array<{
    apartmentId: string;
    decision: StayDecision;
    reasons: string[];
    decidedAt: string;
  }>;
};

type SavedPlan = {
  _id: string;
  title: string;
  status: 'draft' | 'saved';
  intent: TripIntent;
  conversation?: ConversationMessage[];
  apartments?: ApartmentCandidate[];
  activities?: ActivityCandidate[];
  itinerary?: PlannerResult['itinerary'];
  stayPreferences?: StayPreferences;
  updatedAt: string;
};

const rejectionReasons = ['Too expensive', 'Wrong area', 'Not enough space', 'Not my style'];

const starterPrompts = [
  'Plan a relaxing weekend in Ikeja for two',
  'I want a family trip to Jos on a budget',
  'Give me a lively three-day Lagos experience',
];

const quickChoiceGroups = [
  {
    label: 'What budget?',
    icon: Wallet,
    choices: ['Under ₦250,000', '₦500,000 total', 'Luxury — flexible'],
  },
  {
    label: 'What experience?',
    icon: Sparkles,
    choices: ['Food and culture', 'Nature and relaxation', 'Nightlife', 'Family activities'],
  },
];

type ActivityCategoryDefinition = { id: string; label: string; emoji: string; subcategories: Array<{ id: string; label: string }> };
const activityTaxonomy: ActivityCategoryDefinition[] = [
  { id: 'food', label: 'Food & Cafés', emoji: '☕', subcategories: [
    ['cafes', 'Cafés'], ['coffee', 'Coffee Shops'], ['breakfast', 'Breakfast Restaurants'], ['brunch', 'Brunch Spots'], ['fine_dining', 'Fine Dining'], ['rooftop', 'Rooftop Restaurants'], ['local_food', 'Local Food'], ['fast_food', 'Fast Food'], ['street_food', 'Street Food'], ['seafood', 'Seafood'], ['barbecue', 'Barbecue & Grills'], ['pizza', 'Pizza'], ['shawarma', 'Shawarma'], ['ice_cream', 'Ice Cream'], ['bakeries', 'Bakeries'], ['desserts', 'Desserts'], ['juice', 'Juice & Smoothies'], ['tea', 'Tea Lounges'], ['buffet', 'Buffets'], ['waterfront', 'Waterfront Restaurants'], ['romantic', 'Romantic Dinner'], ['private_dining', 'Private Dining'], ['food_courts', 'Food Courts'], ['food_festivals', 'Food Festivals'], ['cooking_classes', 'Cooking Classes'],
  ].map(([id, label]) => ({ id, label })) },
  { id: 'nightlife', label: 'Nightlife', emoji: '🍸', subcategories: [['nightclubs','Nightclubs'],['lounges','Lounges'],['rooftop_bars','Rooftop Bars'],['cocktail_bars','Cocktail Bars'],['beach_clubs','Beach Clubs'],['pool_parties','Pool Parties'],['karaoke','Karaoke'],['live_music','Live Music'],['comedy','Comedy Shows'],['private_parties','Private Parties']].map(([id,label]) => ({id,label})) },
  { id: 'wellness', label: 'Wellness & Fitness', emoji: '🧘', subcategories: [['spas','Spas & Massage'],['gyms','Gyms'],['yoga','Yoga & Pilates'],['pools','Swimming Pools'],['sauna','Sauna & Steam'],['personal_training','Personal Training'],['martial_arts','Boxing & Martial Arts'],['retreats','Wellness Retreats'],['meditation','Meditation'],['physiotherapy','Physiotherapy']].map(([id,label]) => ({id,label})) },
  { id: 'beauty', label: 'Beauty', emoji: '💇', subcategories: [['hair_salons','Hair Salons'],['barbers','Barbershops'],['nails','Nail Studios'],['makeup','Makeup Artists'],['tattoos','Tattoo Studios'],['piercing','Piercing Studios'],['lashes','Lashes & Brows'],['skincare','Skincare & Facials'],['braiding','Hair Braiding'],['teeth','Teeth Whitening']].map(([id,label]) => ({id,label})) },
  { id: 'transport', label: 'Car Rentals', emoji: '🚗', subcategories: [['car_rentals','Self-drive Cars'],['chauffeur','Chauffeur Services'],['airport_transfers','Airport Transfers'],['bus_rentals','Bus Rentals'],['shuttles','Private Shuttles'],['motorbikes','Motorbike Rentals'],['bicycles','Bicycle Rentals'],['group_transport','Group Transport']].map(([id,label]) => ({id,label})) },
  { id: 'boat_beach', label: 'Boat & Beach', emoji: '🛥️', subcategories: [['cruises','Boat Cruises'],['yacht_rentals','Yacht Rentals'],['yacht_parties','Yacht Parties'],['speedboats','Speedboats'],['beaches','Beaches'],['beach_clubs','Beach Clubs'],['jet_skiing','Jet Skiing'],['kayaking','Kayaking'],['diving','Snorkelling & Diving']].map(([id,label]) => ({id,label})) },
  { id: 'adventure', label: 'Adventure', emoji: '🏝️', subcategories: [['tours','City Tours'],['sightseeing','Sightseeing'],['museums','Museums'],['galleries','Art Galleries'],['historical','Historical Sites'],['parks','Nature Parks'],['wildlife','Wildlife Parks'],['waterfalls','Waterfalls'],['hiking','Hiking & Mountains'],['theme_parks','Theme Parks']].map(([id,label]) => ({id,label})) },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', subcategories: [['malls','Shopping Malls'],['supermarkets','Supermarkets'],['boutiques','Fashion Boutiques'],['luxury_fashion','Luxury Fashion'],['markets','Local Markets'],['jewelry','Jewellery & Watches'],['electronics','Electronics'],['books','Bookshops'],['gifts','Gift Shops'],['decor','Home Décor']].map(([id,label]) => ({id,label})) },
  { id: 'sports', label: 'Games & Sports', emoji: '🎳', subcategories: [['bowling','Bowling'],['billiards','Snooker & Billiards'],['arcades','Arcades'],['virtual_reality','Virtual Reality'],['escape_rooms','Escape Rooms'],['go_karting','Go-karting'],['paintball','Paintball & Laser Tag'],['board_games','Board Games'],['mini_golf','Mini Golf'],['trampoline','Trampoline Parks']].map(([id,label]) => ({id,label})) },
  { id: 'photo', label: 'Photo & Content', emoji: '📸', subcategories: [['studios','Photography Studios'],['outdoor_shoots','Outdoor Photoshoots'],['video_studios','Video Studios'],['podcast_studios','Podcast Studios'],['music_studios','Music Studios'],['content_studios','Content Studios'],['filming_locations','Filming Locations'],['equipment','Equipment Rentals']].map(([id,label]) => ({id,label})) },
  { id: 'workspaces', label: 'Workspaces', emoji: '💻', subcategories: [['coworking','Coworking Spaces'],['private_offices','Private Offices'],['meeting_rooms','Meeting Rooms'],['conference','Conference Centres'],['training_rooms','Training Rooms'],['lounges','Business Lounges'],['printing','Printing Centres'],['event_halls','Event Halls'],['networking','Networking Spaces']].map(([id,label]) => ({id,label})) },
  { id: 'family', label: 'Family Fun', emoji: '🎡', subcategories: [['cinemas','Cinemas'],['playgrounds','Playgrounds'],['indoor_play','Indoor Play Centres'],['amusement','Amusement Parks'],['water_parks','Water Parks'],['resorts','Family Resorts'],['museums','Educational Museums'],['workshops','Kids Workshops'],['birthdays','Birthday Venues']].map(([id,label]) => ({id,label})) },
  { id: 'romance', label: 'Romantic Dates', emoji: '❤️', subcategories: [['dinners','Romantic Dinners'],['couples_spa','Couples Spa'],['private_cinema','Private Cinemas'],['cruises','Sunset Cruises'],['picnics','Beach Picnics'],['photoshoots','Couples Photoshoots'],['private_chefs','Private Chef Dinners'],['wine_tasting','Wine Tasting'],['proposals','Proposal Experiences'],['anniversaries','Anniversary Venues']].map(([id,label]) => ({id,label})) },
  { id: 'essentials', label: 'Essentials', emoji: '🧺', subcategories: [['pharmacies','Pharmacies'],['hospitals','Hospitals & Clinics'],['dental','Dental Clinics'],['laundry','Laundry & Dry Cleaning'],['groceries','Grocery Delivery'],['food_delivery','Food Delivery'],['personal_chefs','Personal Chefs'],['home_cleaning','Home Cleaning'],['babysitting','Babysitting'],['banks','Banks & ATMs']].map(([id,label]) => ({id,label})) },
  { id: 'events', label: 'Events', emoji: '🎟️', subcategories: [['concerts','Concerts'],['comedy','Comedy Shows'],['theatre','Theatre'],['fashion','Fashion Shows'],['exhibitions','Art Exhibitions'],['food_festivals','Food Festivals'],['film_festivals','Film Festivals'],['conferences','Tech Conferences'],['business','Business Events'],['cultural','Cultural Festivals']].map(([id,label]) => ({id,label})) },
];

const answerSuggestions: Record<string, string[]> = {
  destination: ['Ikeja, Lagos', 'Jos, Plateau', 'Abuja'],
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

const normalizePlannerResult = (raw: any): PlannerResult => {
  const intent = raw?.intent && typeof raw.intent === 'object' ? raw.intent : {};
  const legacyPreferences = typeof intent.activityCategory === 'string' && intent.activityCategory !== 'all'
    ? { [intent.activityCategory]: Array.isArray(intent.activitySubcategories) ? intent.activitySubcategories : [] }
    : {};
  const activityPreferences = intent.activityPreferences && typeof intent.activityPreferences === 'object' && !Array.isArray(intent.activityPreferences)
    ? Object.fromEntries(Object.entries(intent.activityPreferences).map(([key, values]) => [key, Array.isArray(values) ? values.map(String) : []]))
    : legacyPreferences;
  const activities = Array.isArray(raw?.activities) ? raw.activities.map((activity: any) => ({
    ...activity,
    id: String(activity?.id || ''),
    name: String(activity?.name || 'Saved place'),
    address: String(activity?.address || ''),
    types: Array.isArray(activity?.types) ? activity.types : [],
    photoAttributions: Array.isArray(activity?.photoAttributions) ? activity.photoAttributions : [],
  })) : [];
  const itinerary = raw?.itinerary && typeof raw.itinerary === 'object'
    ? {
        ...raw.itinerary,
        title: String(raw.itinerary.title || `${intent.destination || 'My'} itinerary`),
        summary: String(raw.itinerary.summary || 'Continue shaping your saved trip.'),
        days: Array.isArray(raw.itinerary.days) ? raw.itinerary.days.map((day: any, index: number) => ({
          ...day,
          day: Number(day?.day) || index + 1,
          title: String(day?.title || `Day ${index + 1}`),
          activities: Array.isArray(day?.activities) ? day.activities : [],
        })) : [],
      }
    : undefined;
  const storedPreferences = raw?.stayPreferences && typeof raw.stayPreferences === 'object'
    ? raw.stayPreferences
    : {};

  return {
    ...raw,
    provider: String(raw?.provider || 'saved'),
    reply: String(raw?.reply || 'Your trip is ready to continue.'),
    status: ['gathering', 'ready', 'no_inventory'].includes(raw?.status) ? raw.status : (itinerary ? 'ready' : 'gathering'),
    planId: String(raw?.planId || raw?._id || ''),
    planStatus: raw?.planStatus === 'saved' || raw?.status === 'saved' ? 'saved' : 'draft',
    intent: {
      ...intent,
      interests: Array.isArray(intent.interests) ? intent.interests : [],
      activityCategory: typeof intent.activityCategory === 'string' ? intent.activityCategory : 'all',
      activitySubcategories: Array.isArray(intent.activitySubcategories) ? intent.activitySubcategories : [],
      activityPreferences,
      missingFields: Array.isArray(intent.missingFields) ? intent.missingFields : [],
    },
    apartments: Array.isArray(raw?.apartments) ? raw.apartments.map((apartment: any) => ({
      ...apartment,
      id: String(apartment?.id || apartment?._id || ''),
      name: String(apartment?.name || 'Saved stay'),
      city: String(apartment?.city || ''),
      state: String(apartment?.state || ''),
      address: String(apartment?.address || ''),
      description: String(apartment?.description || ''),
      amenities: Array.isArray(apartment?.amenities) ? apartment.amenities : [],
      pricePerNight: Number(apartment?.pricePerNight) || 0,
      bedrooms: Number(apartment?.bedrooms) || 0,
      guests: Number(apartment?.guests) || 0,
    })) : [],
    activities,
    itinerary,
    stayPreferences: {
      ...storedPreferences,
      interestedApartmentIds: Array.isArray(storedPreferences.interestedApartmentIds) ? storedPreferences.interestedApartmentIds : [],
      rejectedApartmentIds: Array.isArray(storedPreferences.rejectedApartmentIds) ? storedPreferences.rejectedApartmentIds : [],
      decisions: Array.isArray(storedPreferences.decisions) ? storedPreferences.decisions : [],
    },
  };
};

const formatNaira = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

const formatPlacePrice = (priceLevel?: string) => {
  const levels: Record<string, string> = {
    PRICE_LEVEL_FREE: 'Free',
    PRICE_LEVEL_INEXPENSIVE: 'Budget friendly',
    PRICE_LEVEL_MODERATE: 'Moderate',
    PRICE_LEVEL_EXPENSIVE: 'Premium',
    PRICE_LEVEL_VERY_EXPENSIVE: 'Luxury',
  };
  return priceLevel ? levels[priceLevel] : undefined;
};

const safeExternalUrl = (value?: string) => {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
};

export default function TripPlannerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ConversationMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [failedTurn, setFailedTurn] = useState<{ message: string; error: string } | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [pendingRadius, setPendingRadius] = useState<number | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationPredictions, setLocationPredictions] = useState<PlacePrediction[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [placeSearchMode, setPlaceSearchMode] = useState<'area' | 'place'>('area');
  const [staySkipped, setStaySkipped] = useState(false);
  const [selectedActivityCategory, setSelectedActivityCategory] = useState('all');
  const [selectedActivitySubcategories, setSelectedActivitySubcategories] = useState<string[]>([]);
  const [activityPreferences, setActivityPreferences] = useState<Record<string, string[]>>({});
  const [activityPage, setActivityPage] = useState(1);
  const [failedActivityImages, setFailedActivityImages] = useState<Set<string>>(new Set());
  const [stayDecisionLoading, setStayDecisionLoading] = useState(false);
  const [stayPageLoading, setStayPageLoading] = useState(false);
  const [stayCardMotion, setStayCardMotion] = useState<'left' | 'right' | null>(null);
  const [lastRejectedApartmentId, setLastRejectedApartmentId] = useState<string | null>(null);
  const [showInterestedStays, setShowInterestedStays] = useState(false);
  const [showStayComparison, setShowStayComparison] = useState(false);
  const [planPendingDeletion, setPlanPendingDeletion] = useState<SavedPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [editingPlanTitle, setEditingPlanTitle] = useState(false);
  const [planTitleDraft, setPlanTitleDraft] = useState('');
  const [savingPlanTitle, setSavingPlanTitle] = useState(false);
  const [checkInDraft, setCheckInDraft] = useState('');
  const [checkOutDraft, setCheckOutDraft] = useState('');
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
  const [setupSaving, setSetupSaving] = useState(false);
  const [destinationDraft, setDestinationDraft] = useState('');
  const [areaDraft, setAreaDraft] = useState('');
  const [staySetupMode, setStaySetupMode] = useState<'afribooking' | 'own'>('afribooking');
  const [ownStayAddress, setOwnStayAddress] = useState('');
  const [guestDraft, setGuestDraft] = useState(2);
  const [budgetDraft, setBudgetDraft] = useState('');
  const [activityTransfer, setActivityTransfer] = useState<{
    sourceDay: number;
    activityIndex: number;
    mode: 'move' | 'copy';
  } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activityLocationInputRef = useRef<HTMLInputElement>(null);
  const deleteCancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (authLoading || user) return;
    const storedUser = window.localStorage.getItem('user');
    if (!storedUser) router.replace('/login?returnTo=/planner');
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!user) return;
    const loadPlans = async () => {
      try {
        const response = await api.get(getTripPlans);
        setSavedPlans(response.data?.data?.plans || []);
      } catch (error: any) {
        if (error.response?.status === 401) router.replace('/login?returnTo=/planner');
      } finally {
        setPlansLoading(false);
      }
    };
    void loadPlans();
  }, [router, user]);

  useEffect(() => {
    if (result?.intent.startDate) setCheckInDraft(result.intent.startDate.slice(0, 10));
    if (result?.intent.endDate) setCheckOutDraft(result.intent.endDate.slice(0, 10));
    if (result?.intent.destination) setDestinationDraft(result.intent.destination);
    if (result?.intent.guests) setGuestDraft(result.intent.guests);
    if (result?.intent.budget) setBudgetDraft(String(result.intent.budget));
  }, [result?.intent.budget, result?.intent.destination, result?.intent.endDate, result?.intent.guests, result?.intent.startDate]);

  useEffect(() => {
    if (!showStayComparison) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowStayComparison(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [showStayComparison]);

  useEffect(() => {
    if (!planPendingDeletion) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deletingPlan) setPlanPendingDeletion(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    window.requestAnimationFrame(() => deleteCancelButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [deletingPlan, planPendingDeletion]);

  useEffect(() => {
    if (!activityTransfer) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingPlan) setActivityTransfer(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [activityTransfer, savingPlan]);

  const suggestions = useMemo(() => {
    if (!result) return starterPrompts;
    const firstMissing = result.intent.missingFields?.[0];
    if (firstMissing === 'datesOrDuration') return [];
    return (firstMissing && answerSuggestions[firstMissing]) || [
      'Make it more affordable',
      'Show me a different stay',
      'Keep activities closer together',
    ];
  }, [result]);

  const selectedApartment = useMemo(() => {
    if (!result?.apartments.length) return undefined;
    const decidedIds = new Set([
      ...(result.stayPreferences?.interestedApartmentIds || []),
      ...(result.stayPreferences?.rejectedApartmentIds || []),
    ]);
    return (
      result.apartments.find(
        (apartment) => apartment.id === result.stayPreferences?.currentApartmentId
      ) ||
      result.apartments.find(
        (apartment) => apartment.id === result.itinerary?.selectedApartmentId && !decidedIds.has(apartment.id)
      ) || result.apartments.find((apartment) => !decidedIds.has(apartment.id))
    );
  }, [result]);

  const interestedApartments = useMemo(() => {
    const interestedIds = new Set(result?.stayPreferences?.interestedApartmentIds || []);
    return (result?.apartments || []).filter((apartment) => interestedIds.has(apartment.id));
  }, [result]);

  const chosenApartment = useMemo(
    () => (result?.apartments || []).find(
      (apartment) => apartment.id === result?.stayPreferences?.selectedApartmentId
    ),
    [result]
  );

  const reviewedStayCount = useMemo(
    () => new Set([
      ...(result?.stayPreferences?.interestedApartmentIds || []),
      ...(result?.stayPreferences?.rejectedApartmentIds || []),
    ]).size,
    [result]
  );

  const selectedItineraryDay =
    result?.itinerary?.days?.find((day) => day.day === selectedDay) || result?.itinerary?.days?.[0];

  const activityBeingTransferred = useMemo(() => {
    if (!activityTransfer || !result?.itinerary) return undefined;
    return result.itinerary.days
      .find((day) => day.day === activityTransfer.sourceDay)
      ?.activities[activityTransfer.activityIndex];
  }, [activityTransfer, result?.itinerary]);

  const activeActivityCategory = activityTaxonomy.find((category) => category.id === selectedActivityCategory);
  const visibleActivities = useMemo(() => result?.activities || [], [result?.activities]);
  const activitiesById = useMemo(
    () => new Map((result?.activities || []).map((activity) => [activity.id, activity])),
    [result?.activities]
  );

  const activitiesPerPage = 9;
  const activityPageCount = Math.max(1, Math.ceil(visibleActivities.length / activitiesPerPage));
  const paginatedActivities = useMemo(
    () => visibleActivities.slice((activityPage - 1) * activitiesPerPage, activityPage * activitiesPerPage),
    [activityPage, visibleActivities]
  );
  const activityPageNumbers = useMemo(() => {
    if (activityPageCount <= 7) return Array.from({ length: activityPageCount }, (_, index) => index + 1);
    const pages = new Set([1, activityPageCount, activityPage - 1, activityPage, activityPage + 1]);
    return Array.from(pages).filter((page) => page >= 1 && page <= activityPageCount).sort((a, b) => a - b);
  }, [activityPage, activityPageCount]);

  useEffect(() => {
    setActivityPage(1);
  }, [selectedActivityCategory, selectedActivitySubcategories, result?.activities]);

  const sendMessage = async (
    message: string,
    appendUser = true,
    requestContext?: { planId: string; intent: TripIntent }
  ) => {
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
      const response = await api.post(tripPlannerMessage, {
          message: trimmed,
          planId: requestContext?.planId || planId,
          intent: requestContext?.intent || result?.intent,
      });
      const payload = response.data;
      if (!payload?.success) {
        throw new Error(payload?.message || 'Unable to plan this trip right now');
      }

      const plannerResult = normalizePlannerResult(payload.data);
      setPlanId(plannerResult.planId);
      setResult(plannerResult);
      const extractedPreferences = plannerResult.intent.activityPreferences || {};
      setActivityPreferences(extractedPreferences);
      const extractedCategory = Object.keys(extractedPreferences)[0];
      if (extractedCategory) {
        setSelectedActivityCategory(extractedCategory);
        setSelectedActivitySubcategories(extractedPreferences[extractedCategory] || []);
      }
      setSelectedDay(plannerResult.itinerary?.days[0]?.day || 1);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: plannerResult.reply },
      ]);
      setSavedPlans((current) => {
        const existingSummary = current.find((plan) => plan._id === plannerResult.planId);
        const summary: SavedPlan = {
          _id: plannerResult.planId,
          title: existingSummary?.title || plannerResult.itinerary?.title || `${plannerResult.intent.destination || 'My'} trip`,
          status: plannerResult.planStatus,
          intent: plannerResult.intent,
          itinerary: plannerResult.itinerary,
          updatedAt: new Date().toISOString(),
        };
        return [summary, ...current.filter((plan) => plan._id !== summary._id)];
      });
    } catch (error) {
      const requestError = error as any;
      if (requestError.response?.status === 401) {
        router.replace('/login?returnTo=/planner');
        return;
      }
      const rawMessage = requestError.response?.data?.message ||
        (error instanceof Error ? error.message : 'Unable to plan this trip right now');
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

  const saveStructuredSetup = async (intentPatch: Partial<TripIntent>) => {
    setSetupSaving(true);
    try {
      const response = await api.post(saveTripPlannerSetup, { planId, intent: intentPatch });
      const savedPlanId = String(response.data?.data?.planId || planId || '');
      const savedIntent = {
        interests: [],
        missingFields: [],
        ...(result?.intent || {}),
        ...(response.data?.data?.intent || intentPatch),
      } as TripIntent;
      setPlanId(savedPlanId);
      setResult((current) => current
        ? { ...current, planId: savedPlanId, intent: savedIntent }
        : normalizePlannerResult({ planId: savedPlanId, intent: savedIntent, apartments: [], activities: [] })
      );
      return { planId: savedPlanId, intent: savedIntent };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save your trip details');
      return null;
    } finally {
      setSetupSaving(false);
    }
  };

  const continueFromDestination = async () => {
    if (!destinationDraft.trim()) {
      toast.error('Enter the city or state you are visiting');
      return;
    }
    if (staySetupMode === 'own' && !ownStayAddress.trim()) {
      toast.error('Enter the address where you will be staying');
      return;
    }
    const saved = await saveStructuredSetup({
      destination: destinationDraft.trim(),
      specificArea: areaDraft.trim() || undefined,
      accommodationMode: staySetupMode,
      accommodationAddress: staySetupMode === 'own' ? ownStayAddress.trim() : undefined,
    });
    if (saved) setSetupStep(2);
  };

  const continueFromTripDetails = async () => {
    if (!checkInDraft || !checkOutDraft) {
      toast.error('Choose both check-in and check-out dates');
      return;
    }
    const start = new Date(`${checkInDraft}T00:00:00`);
    const end = new Date(`${checkOutDraft}T00:00:00`);
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 14) {
      toast.error('Choose a trip between 1 and 14 days');
      return;
    }
    const budget = Number(budgetDraft.replace(/[^0-9.]/g, ''));
    const saved = await saveStructuredSetup({
      startDate: checkInDraft,
      endDate: checkOutDraft,
      durationDays,
      guests: Math.max(1, guestDraft),
      budget: Number.isFinite(budget) && budget > 0 ? budget : undefined,
    });
    if (saved) setSetupStep(3);
  };

  const toggleSetupInterest = (category: string) => {
    setActivityPreferences((current) => {
      const next = { ...current };
      if (Object.prototype.hasOwnProperty.call(next, category)) delete next[category];
      else next[category] = [];
      return next;
    });
  };

  const createStructuredTrip = async () => {
    if (Object.keys(activityPreferences).length === 0) {
      toast.error('Select at least one type of experience');
      return;
    }
    const selectedLabels = activityTaxonomy
      .filter((category) => Object.prototype.hasOwnProperty.call(activityPreferences, category.id))
      .map((category) => category.label);
    const saved = await saveStructuredSetup({
      activityPreferences,
      interests: selectedLabels,
      missingFields: [],
    });
    if (!saved) return;
    await sendMessage(
      `Plan my ${saved.intent.durationDays || ''}-day trip to ${saved.intent.destination}. I am interested in ${selectedLabels.join(', ')}. Use my saved dates, guests, budget and accommodation preference.`,
      true,
      saved
    );
  };

  const submitTravelDates = () => {
    if (!checkInDraft || !checkOutDraft) {
      toast.error('Choose both your check-in and check-out dates');
      return;
    }
    const checkIn = new Date(`${checkInDraft}T00:00:00`);
    const checkOut = new Date(`${checkOutDraft}T00:00:00`);
    if (!Number.isFinite(checkIn.getTime()) || !Number.isFinite(checkOut.getTime()) || checkOut <= checkIn) {
      toast.error('Check-out must be after check-in');
      return;
    }
    const durationDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
    if (durationDays > 14) {
      toast.error('The AI planner currently supports trips of up to 14 days');
      return;
    }
    void sendMessage(`My check-in date is ${checkInDraft} and my check-out date is ${checkOutDraft}.`);
  };

  const resetPlanner = () => {
    setMessages([initialMessage]);
    setInput('');
    setResult(null);
    setFailedTurn(null);
    setSelectedDay(1);
    setPlanId(null);
    setLastRejectedApartmentId(null);
    setShowInterestedStays(false);
    setShowStayComparison(false);
    setEditingPlanTitle(false);
    setPlanTitleDraft('');
    setActivityTransfer(null);
    setStaySkipped(false);
    setLocationQuery('');
    setLocationPredictions([]);
    setSelectedActivityCategory('all');
    setSelectedActivitySubcategories([]);
    setActivityPreferences({});
    setSetupStep(1);
    setDestinationDraft('');
    setAreaDraft('');
    setStaySetupMode('afribooking');
    setOwnStayAddress('');
    setGuestDraft(2);
    setBudgetDraft('');
    setCheckInDraft('');
    setCheckOutDraft('');
    inputRef.current?.focus();
  };

  const resumePlan = async (selectedPlanId: string) => {
    try {
      setPlansLoading(true);
      const response = await api.get(getTripPlan(selectedPlanId));
      const plan = response.data?.data?.plan as SavedPlan;
      setEditingPlanTitle(false);
      setPlanTitleDraft('');
      setActivityTransfer(null);
      setPlanId(plan._id);
      setMessages(plan.conversation?.length ? plan.conversation : [initialMessage]);
      setResult(normalizePlannerResult({
        provider: 'saved',
        reply: plan.conversation?.at(-1)?.content || 'Your trip is ready to continue.',
        status: plan.itinerary ? 'ready' : 'gathering',
        planId: plan._id,
        planStatus: plan.status,
        intent: plan.intent,
        apartments: plan.apartments || [],
        activities: plan.activities || [],
        itinerary: plan.itinerary,
        stayPreferences: plan.stayPreferences,
      }));
      setSelectedDay(plan.itinerary?.days?.[0]?.day || 1);
      setSelectedActivityCategory(plan.intent?.activityCategory || 'all');
      setSelectedActivitySubcategories(Array.isArray(plan.intent?.activitySubcategories) ? plan.intent.activitySubcategories : []);
      const savedPreferences = plan.intent?.activityPreferences && typeof plan.intent.activityPreferences === 'object'
        ? plan.intent.activityPreferences
        : plan.intent?.activityCategory && plan.intent.activityCategory !== 'all'
          ? { [plan.intent.activityCategory]: plan.intent.activitySubcategories || [] }
          : {};
      setActivityPreferences(savedPreferences);
      setDestinationDraft(plan.intent?.destination || '');
      setAreaDraft(plan.intent?.specificArea || '');
      setStaySetupMode(plan.intent?.accommodationMode === 'own' ? 'own' : 'afribooking');
      setOwnStayAddress(plan.intent?.accommodationAddress || '');
      setGuestDraft(plan.intent?.guests || 2);
      setBudgetDraft(plan.intent?.budget ? String(plan.intent.budget) : '');
      setSetupStep(plan.intent?.startDate && plan.intent?.endDate ? 3 : plan.intent?.destination ? 2 : 1);
      setActivityPage(1);
      toast.success('Trip restored');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to restore this trip');
    } finally {
      setPlansLoading(false);
    }
  };

  const applyStayPreferenceResponse = (data: {
    stayPreferences: StayPreferences;
    itinerary?: PlannerResult['itinerary'];
    activities?: ActivityCandidate[];
  }) => {
    setResult((current) => current
      ? {
          ...current,
          stayPreferences: data.stayPreferences,
          itinerary: data.itinerary,
          activities: data.activities || current.activities,
        }
      : current
    );
    setSavedPlans((current) => current.map((plan) =>
      plan._id === planId
        ? { ...plan, stayPreferences: data.stayPreferences, itinerary: data.itinerary, updatedAt: new Date().toISOString() }
        : plan
    ));
  };

  const decideStay = async (
    apartmentId: string,
    decision: StayDecision,
    reasons: string[] = []
  ) => {
    if (!planId || stayDecisionLoading) return;
    setStayDecisionLoading(true);
    setStayCardMotion(decision === 'interested' ? 'right' : 'left');
    try {
      const response = await api.post(setTripStayPreference(planId), {
        apartmentId,
        decision,
        reasons,
      });
      applyStayPreferenceResponse(response.data.data);
      if (decision === 'interested') {
        setLastRejectedApartmentId(null);
        toast.success('Added to your interested stays');
      } else {
        setLastRejectedApartmentId(apartmentId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save your choice');
    } finally {
      setStayCardMotion(null);
      setStayDecisionLoading(false);
    }
  };

  const addRejectionReason = async (reason: string) => {
    if (!lastRejectedApartmentId || !result) return;
    const existingReasons = result.stayPreferences?.decisions.find(
      (item) => item.apartmentId === lastRejectedApartmentId
    )?.reasons || [];
    await decideStay(lastRejectedApartmentId, 'rejected', [...existingReasons, reason]);
    setLastRejectedApartmentId(null);
    toast.success('Preference noted');
  };

  const undoStayDecision = async () => {
    if (!planId || stayDecisionLoading) return;
    setStayDecisionLoading(true);
    try {
      const response = await api.delete(undoTripStayPreference(planId));
      applyStayPreferenceResponse(response.data.data);
      setLastRejectedApartmentId(null);
      toast.success('Last choice undone');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to undo your last choice');
    } finally {
      setStayDecisionLoading(false);
    }
  };

  const resetStayChoices = async () => {
    if (!planId || stayDecisionLoading) return;
    setStayDecisionLoading(true);
    try {
      const response = await api.delete(resetTripStayPreferences(planId));
      applyStayPreferenceResponse(response.data.data);
      setLastRejectedApartmentId(null);
      setShowInterestedStays(false);
      setShowStayComparison(false);
      toast.success('Stay choices reset');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to reset your choices');
    } finally {
      setStayDecisionLoading(false);
    }
  };

  const loadMoreStays = async () => {
    if (!planId || !result?.apartmentSearch?.hasMore || stayPageLoading) return;
    setStayPageLoading(true);
    try {
      const nextPage = result.apartmentSearch.page + 1;
      const response = await api.get(
        getTripApartmentPage(planId, nextPage, result.apartmentSearch.pageSize)
      );
      const data = response.data?.data;
      const incoming = Array.isArray(data?.apartments) ? data.apartments : [];
      setResult((current) => {
        if (!current) return current;
        const byId = new Map(current.apartments.map((apartment) => [apartment.id, apartment]));
        incoming.forEach((apartment: ApartmentCandidate) => byId.set(apartment.id, apartment));
        return {
          ...current,
          apartments: Array.from(byId.values()),
          apartmentSearch: data?.apartmentSearch || current.apartmentSearch,
          stayPreferences: data?.stayPreferences || current.stayPreferences,
        };
      });
      toast.success(`${incoming.length} more matching stays loaded`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load more stays');
    } finally {
      setStayPageLoading(false);
    }
  };

  const chooseStay = async (apartment: ApartmentCandidate) => {
    if (!planId || stayDecisionLoading) return;
    setStayDecisionLoading(true);
    try {
      const response = await api.post(selectTripStay(planId), { apartmentId: apartment.id });
      applyStayPreferenceResponse(response.data.data);
      setStaySkipped(false);
      setShowStayComparison(false);
      setShowInterestedStays(true);
      toast.success(`${apartment.name} is now your primary stay`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to choose this stay');
    } finally {
      setStayDecisionLoading(false);
    }
  };

  const skipStays = () => {
    setStaySkipped(true);
    setLocationQuery('');
    setLocationPredictions([]);
    document.getElementById('activity-recommendations')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => activityLocationInputRef.current?.focus(), 450);
  };

  const refreshActivitySearch = async (
    radiusKm: number,
    location?: TripIntent['activityLocation'],
    category?: string,
    subcategories?: string[],
    preferences?: Record<string, string[]>
  ) => {
    if (!planId || !result || rangeLoading) return;
    if (!location && category === undefined && subcategories === undefined && preferences === undefined && result.intent.activityRadiusKm === radiusKm) {
      setPendingRadius(null);
      return;
    }
    setRangeLoading(true);
    setPendingRadius(radiusKm);
    try {
      const response = await api.patch(updateTripActivityRadius(planId), { radiusKm, location, category, subcategories, preferences });
      const data = response.data?.data;
      setResult((current) => current ? {
        ...current,
        intent: { ...current.intent, ...(data?.intent || {}), activityRadiusKm: radiusKm },
        activities: data?.activities || [],
      } : current);
      if (category !== undefined) setSelectedActivityCategory(category);
      if (subcategories !== undefined) setSelectedActivitySubcategories(subcategories);
      if (preferences !== undefined) setActivityPreferences(preferences);
      setActivityPage(1);
      toast.success(`Showing activities within ${radiusKm} km`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to change the activity range');
    } finally {
      setRangeLoading(false);
      setPendingRadius(null);
    }
  };

  const changeActivityRadius = async (radiusKm: number) => {
    await refreshActivitySearch(radiusKm);
  };

  const chooseActivityCategory = async (category: string) => {
    if (!result || rangeLoading) return;
    if (category === 'all') {
      setSelectedActivityCategory('all');
      setSelectedActivitySubcategories([]);
      await refreshActivitySearch(result.intent.activityRadiusKm || 5, undefined, 'all', [], {});
      return;
    }
    setSelectedActivityCategory(category);
    const selected = activityPreferences[category];
    setSelectedActivitySubcategories(selected || []);
    if (selected !== undefined) return;
    const nextPreferences = { ...activityPreferences, [category]: [] };
    await refreshActivitySearch(result.intent.activityRadiusKm || 5, undefined, category, [], nextPreferences);
  };

  const toggleActivitySubcategory = async (subcategory: string) => {
    if (!result || rangeLoading || selectedActivityCategory === 'all') return;
    const current = activityPreferences[selectedActivityCategory] || [];
    const next = current.includes(subcategory)
      ? current.filter((item) => item !== subcategory)
      : [...current, subcategory];
    const nextPreferences = { ...activityPreferences, [selectedActivityCategory]: next };
    await refreshActivitySearch(result.intent.activityRadiusKm || 5, undefined, selectedActivityCategory, next, nextPreferences);
  };

  const removeActivityCategory = async () => {
    if (!result || rangeLoading || selectedActivityCategory === 'all') return;
    const nextPreferences = { ...activityPreferences };
    delete nextPreferences[selectedActivityCategory];
    const nextActive = Object.keys(nextPreferences)[0] || 'all';
    setSelectedActivityCategory(nextActive);
    setSelectedActivitySubcategories(nextActive === 'all' ? [] : nextPreferences[nextActive] || []);
    await refreshActivitySearch(result.intent.activityRadiusKm || 5, undefined, nextActive, nextActive === 'all' ? [] : nextPreferences[nextActive], nextPreferences);
  };

  const searchActivityLocation = async () => {
    const query = locationQuery.trim();
    if (query.length < 3) {
      toast.error('Enter at least 3 characters to search for an area');
      return;
    }
    setLocationSearching(true);
    try {
      const response = await api.get(autocompletePlaces(query));
      const predictions = response.data?.data?.predictions || [];
      setLocationPredictions(predictions);
      if (predictions.length === 0) toast.error('No matching locations found');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to search locations');
    } finally {
      setLocationSearching(false);
    }
  };

  const chooseActivityLocation = async (prediction: PlacePrediction) => {
    if (!planId || !result) return;
    setLocationSearching(true);
    try {
      const response = await api.get(getPlaceDetails(prediction.place_id));
      const place = response.data?.data;
      const latitude = Number(place?.geometry?.location?.lat);
      const longitude = Number(place?.geometry?.location?.lng);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('This location has no map coordinates');
      const location = {
        name: prediction.structured_formatting?.main_text || prediction.description,
        address: place.formatted_address || prediction.description,
        placeId: place.place_id || prediction.place_id,
        latitude,
        longitude,
      };
      setLocationQuery(location.name);
      setLocationPredictions([]);
      await refreshActivitySearch(result.intent.activityRadiusKm || 5, location);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Unable to use this location');
    } finally {
      setLocationSearching(false);
    }
  };

  const addSpecificPlace = async (prediction: PlacePrediction) => {
    if (!planId || !result || locationSearching) return;
    setLocationSearching(true);
    try {
      const response = await api.get(getPlaceDetails(prediction.place_id));
      const place = response.data?.data;
      const activity: ActivityCandidate = {
        id: place.place_id || prediction.place_id,
        name: place.name || prediction.structured_formatting?.main_text || prediction.description,
        address: place.formatted_address || prediction.description,
        latitude: Number.isFinite(Number(place?.geometry?.location?.lat)) ? Number(place.geometry.location.lat) : undefined,
        longitude: Number.isFinite(Number(place?.geometry?.location?.lng)) ? Number(place.geometry.location.lng) : undefined,
        types: Array.isArray(place.types) ? place.types : [],
        primaryType: place.primaryType,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        phoneNumber: place.phoneNumber,
        websiteUri: place.websiteUri,
        googleMapsUri: place.googleMapsUri,
        priceLevel: place.priceLevel,
        openNow: place.openNow,
        hasPhoto: Boolean(place.hasPhoto),
        photoAttributions: place.photoAttributions,
        addedByUser: true,
      };
      const saved = await api.post(addTripActivity(planId), { activity });
      setResult((current) => current ? { ...current, activities: saved.data?.data?.activities || [...current.activities, activity] } : current);
      setLocationQuery('');
      setLocationPredictions([]);
      await addActivity(activity);
      toast.success(`${activity.name} was added to your plan`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Unable to add this place');
    } finally {
      setLocationSearching(false);
    }
  };

  const persistPlan = async (
    itinerary: PlannerResult['itinerary'],
    status: 'draft' | 'saved' = result?.planStatus || 'draft'
  ) => {
    if (!planId || !result) return false;
    setSavingPlan(true);
    try {
      await api.patch(updateTripPlan(planId), { itinerary, intent: result.intent, status });
      setResult((current) => current ? { ...current, itinerary, planStatus: status } : current);
      setSavedPlans((current) =>
        current.map((plan) =>
          plan._id === planId ? { ...plan, itinerary, status, updatedAt: new Date().toISOString() } : plan
        )
      );
      if (status === 'saved') toast.success('Trip saved to your account');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save trip changes');
      return false;
    } finally {
      setSavingPlan(false);
    }
  };

  const startEditingPlanTitle = () => {
    if (!result?.itinerary) return;
    setPlanTitleDraft(result.itinerary.title);
    setEditingPlanTitle(true);
  };

  const savePlanTitle = async () => {
    if (!planId || !result?.itinerary || savingPlanTitle) return;
    const title = planTitleDraft.trim().slice(0, 120);
    if (!title) {
      toast.error('Give your trip a name');
      return;
    }
    if (title === result.itinerary.title) {
      setEditingPlanTitle(false);
      return;
    }

    const itinerary = { ...result.itinerary, title };
    setSavingPlanTitle(true);
    try {
      await api.patch(updateTripPlan(planId), { title, itinerary });
      setResult((current) => current ? { ...current, itinerary } : current);
      setSavedPlans((current) => current.map((plan) =>
        plan._id === planId
          ? { ...plan, title, itinerary, updatedAt: new Date().toISOString() }
          : plan
      ));
      setEditingPlanTitle(false);
      toast.success('Trip name updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to rename this trip');
    } finally {
      setSavingPlanTitle(false);
    }
  };

  const addActivity = async (activity: ActivityCandidate) => {
    if (!result) return;
    const existing = result.itinerary;
    const targetDay = existing?.days.find((day) => day.day === selectedDay) || existing?.days[0];
    if (targetDay?.activities.some((item) => item.sourceActivityId === activity.id)) {
      toast('This activity is already in your plan');
      return;
    }

    const newActivity: ItineraryActivity = {
      time: 'Flexible',
      title: activity.name,
      category: activity.types[0]?.replaceAll('_', ' ') || 'Activity',
      location: activity.address,
      description: activity.addedByUser ? 'A specific place you chose for this trip.' : 'Added by you from verified nearby recommendations.',
      sourceActivityId: activity.id,
    };

    const itinerary = existing
      ? {
          ...existing,
          days: existing.days.length
            ? existing.days.map((day) =>
                day.day === (targetDay?.day || 1)
                  ? { ...day, activities: [...day.activities, newActivity] }
                  : day
              )
            : [{ day: 1, title: 'Your day', activities: [newActivity] }],
        }
      : {
          title: `${result.intent.destination || 'My'} itinerary`,
          summary: 'A flexible plan you can continue shaping with AfriBooking AI.',
          selectedApartmentId: selectedApartment?.id,
          days: [
            {
              day: 1,
              title: 'Your day',
              activities: [newActivity],
            },
          ],
        };

    setSelectedDay(targetDay?.day || 1);
    await persistPlan(itinerary);
  };

  const removeActivity = async (dayNumber: number, activityIndex: number) => {
    if (!result?.itinerary) return;
    const itinerary = {
      ...result.itinerary,
      days: result.itinerary.days.map((day) =>
        day.day === dayNumber
          ? { ...day, activities: day.activities.filter((_, index) => index !== activityIndex) }
          : day
      ),
    };
    await persistPlan(itinerary);
  };

  const updateActivityTime = async (
    dayNumber: number,
    activityIndex: number,
    time: string
  ) => {
    if (!result?.itinerary || !time.trim()) return;
    const itinerary = {
      ...result.itinerary,
      days: result.itinerary.days.map((day) =>
        day.day === dayNumber
          ? {
              ...day,
              activities: day.activities.map((activity, index) =>
                index === activityIndex ? { ...activity, time: time.trim().slice(0, 30) } : activity
              ),
            }
          : day
      ),
    };
    await persistPlan(itinerary);
  };

  const moveActivity = async (
    dayNumber: number,
    activityIndex: number,
    direction: -1 | 1
  ) => {
    if (!result?.itinerary) return;
    const destinationIndex = activityIndex + direction;
    const day = result.itinerary.days.find((item) => item.day === dayNumber);
    if (!day || destinationIndex < 0 || destinationIndex >= day.activities.length) return;

    const reordered = [...day.activities];
    [reordered[activityIndex], reordered[destinationIndex]] = [
      reordered[destinationIndex],
      reordered[activityIndex],
    ];
    const itinerary = {
      ...result.itinerary,
      days: result.itinerary.days.map((item) =>
        item.day === dayNumber ? { ...item, activities: reordered } : item
      ),
    };
    await persistPlan(itinerary);
  };

  const transferActivityToDay = async (targetDayNumber: number, createDay = false) => {
    if (!result?.itinerary || !activityTransfer || savingPlan) return;
    const sourceDay = result.itinerary.days.find((day) => day.day === activityTransfer.sourceDay);
    const activity = sourceDay?.activities[activityTransfer.activityIndex];
    if (!sourceDay || !activity || targetDayNumber === sourceDay.day) return;

    const existingTarget = result.itinerary.days.find((day) => day.day === targetDayNumber);
    if (!createDay && !existingTarget) return;
    if ((existingTarget?.activities.length || 0) >= 20) {
      toast.error(`Day ${targetDayNumber} already has the maximum of 20 activities`);
      return;
    }
    const alreadyExists = existingTarget?.activities.some((item) =>
      activity.sourceActivityId
        ? item.sourceActivityId === activity.sourceActivityId
        : item.title === activity.title && item.location === activity.location
    );
    if (alreadyExists) {
      toast(`“${activity.title}” is already on Day ${targetDayNumber}`);
      return;
    }

    const transferredActivity = activityTransfer.mode === 'copy'
      ? { ...activity, time: 'Flexible' }
      : activity;
    let days = result.itinerary.days.map((day) => {
      if (day.day === sourceDay.day && activityTransfer.mode === 'move') {
        return {
          ...day,
          activities: day.activities.filter((_, index) => index !== activityTransfer.activityIndex),
        };
      }
      if (day.day === targetDayNumber) {
        return { ...day, activities: [...day.activities, transferredActivity] };
      }
      return day;
    });

    if (createDay) {
      days = [...days, {
        day: targetDayNumber,
        title: `Day ${targetDayNumber}`,
        activities: [transferredActivity],
      }].sort((first, second) => first.day - second.day);
    }

    const mode = activityTransfer.mode;
    const itinerary = { ...result.itinerary, days };
    const saved = await persistPlan(itinerary);
    if (saved) {
      setSelectedDay(targetDayNumber);
      setActivityTransfer(null);
      toast.success(`${mode === 'move' ? 'Moved' : 'Copied'} to Day ${targetDayNumber}`);
    }
  };

  const sharePlan = async () => {
    if (!result?.itinerary) return;
    const itineraryText = result.itinerary.days
      .map((day) => `Day ${day.day}: ${day.activities.map((activity) => activity.title).join(', ')}`)
      .join('\n');
    const text = `${result.itinerary.title}\n${result.itinerary.summary}\n\n${itineraryText}`;
    try {
      if (navigator.share) await navigator.share({ title: result.itinerary.title, text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success('Trip copied to your clipboard');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') toast.error('Unable to share this trip');
    }
  };

  const removePlan = async () => {
    if (!planPendingDeletion || deletingPlan) return;
    const selectedPlanId = planPendingDeletion._id;
    setDeletingPlan(true);
    try {
      await api.delete(deleteTripPlan(selectedPlanId));
      setSavedPlans((current) => current.filter((plan) => plan._id !== selectedPlanId));
      if (planId === selectedPlanId) resetPlanner();
      setPlanPendingDeletion(null);
      toast.success('Trip deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to delete this trip');
    } finally {
      setDeletingPlan(false);
    }
  };

  if (authLoading || !user) {
    return (
      <AppShell>
        <div className="grid min-h-[55vh] place-items-center">
          <div className="text-center">
            <Loader2 className="mx-auto animate-spin text-[#d39b00]" size={30} />
            <p className="mt-3 text-sm font-semibold text-[#777e87]">Opening your private trip workspace…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-[1320px] pb-16">
        <header className="relative overflow-hidden rounded-[32px] border border-[#f1dfac] bg-[radial-gradient(circle_at_top_right,_#fff0a8,_#fffaf0_42%,_#ffffff_78%)] px-5 py-8 sm:px-9 sm:py-10 dark:border-[#403821] dark:bg-[radial-gradient(circle_at_top_right,_#4a380e,_#1c222c_48%,_#10151d_82%)]">
          <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full bg-[#ffbf00]/25 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e9c75f] bg-white/80 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#7c5a00] dark:bg-[#181d25]/80 dark:text-[#ffcb32]">
              <Sparkles size={13} /> AfriBooking AI
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight text-[#17191b] sm:text-5xl dark:text-white">
              Start with a thought. Leave with a trip.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#636970] sm:text-base dark:text-[#bbc2cc]">
              Speak naturally. We search AfriBooking stays first and shape a practical itinerary around what matters to you.
            </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-extrabold text-[#5d4a12] dark:text-[#e5d08d]">
                <span className="rounded-full bg-white/75 px-3 py-2 shadow-sm dark:bg-black/20">Stays first</span>
                <span className="rounded-full bg-white/75 px-3 py-2 shadow-sm dark:bg-black/20">Real nearby places</span>
                <span className="rounded-full bg-white/75 px-3 py-2 shadow-sm dark:bg-black/20">Saved privately</span>
              </div>
            </div>

            <div className="relative hidden min-h-[230px] overflow-hidden rounded-[28px] border border-white/70 bg-[#17191b] p-6 shadow-[0_24px_70px_rgba(111,78,0,0.22)] lg:block dark:border-[#55471f]">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#ffbf00]/30 blur-2xl" />
              <div className="absolute -bottom-20 -left-14 h-48 w-48 rounded-full border-[32px] border-[#ffbf00]/10" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ffbf00] text-[#17191b]"><Bot size={23} /></div>
                  <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/70">Live planner</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffcb32]">Your Africa experience</p>
                  <p className="mt-2 max-w-[250px] text-2xl font-black leading-tight text-white">One conversation. A complete trip.</p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-white/65">
                    <MapPin size={14} className="text-[#ffbf00]" /> Discover · stay · experience
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-3xl border border-[#e8e9ec] bg-white p-4 sm:p-5 dark:border-[#353c47] dark:bg-[#1c222c]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b6700] dark:text-[#ffbf00]">Your private trip workspace</p>
              <h2 className="mt-1 text-base font-black text-[#17191b] dark:text-white">Continue a trip or begin somewhere new</h2>
            </div>
            <button
              type="button"
              onClick={resetPlanner}
              className="inline-flex items-center gap-2 rounded-xl bg-[#17191b] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#303438] dark:bg-[#ffbf00] dark:text-[#17191b]"
            >
              <Plus size={15} /> New trip
            </button>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
            {plansLoading ? (
              <div className="inline-flex items-center gap-2 px-2 py-3 text-xs text-[#858b93]"><Loader2 size={14} className="animate-spin" /> Loading your trips…</div>
            ) : savedPlans.length > 0 ? (
              savedPlans.map((plan) => (
                <div
                  key={plan._id}
                  className={`flex min-w-[230px] items-center gap-2 rounded-2xl border p-2 transition ${planId === plan._id ? 'border-[#e4aa00] bg-[#fff9e8] dark:bg-[#302916]' : 'border-[#e5e7ea] dark:border-[#3a424e]'}`}
                >
                  <button type="button" onClick={() => void resumePlan(plan._id)} className="min-w-0 flex-1 px-2 py-1 text-left">
                    <p className="truncate text-xs font-extrabold text-[#25292d] dark:text-white">{plan.title}</p>
                    <p className="mt-1 text-[10px] capitalize text-[#858b93]">{plan.intent?.destination || 'Trip in progress'} · {plan.status}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanPendingDeletion(plan)}
                    aria-label={`Delete ${plan.title}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-[#9b7777] transition hover:bg-[#fff0f0] hover:text-[#a72c2c] dark:hover:bg-[#382124]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="px-2 py-3 text-xs text-[#858b93]">Your trips will appear here automatically as you plan.</p>
            )}
          </div>
        </section>

        <section className="mx-auto mt-5 max-w-4xl overflow-hidden rounded-[28px] border border-[#e8e9ec] bg-white shadow-[0_18px_55px_rgba(20,24,30,0.08)] dark:border-[#353c47] dark:bg-[#101820]">
          <div className="border-b border-[#eceef1] px-5 py-5 sm:px-8 dark:border-[#303945]">
            <div className="grid grid-cols-3 gap-2">
              {['Where & Stay', 'Budget & Guests', 'Interests'].map((label, index) => {
                const number = index + 1;
                const complete = setupStep > number;
                const active = setupStep === number;
                return <button key={label} type="button" onClick={() => { if (number <= setupStep) setSetupStep(number as 1 | 2 | 3); }} className="relative flex flex-col items-center text-center">
                  {index < 2 && <span className={`absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-4 h-0.5 ${complete ? 'bg-[#ffbf00]' : 'bg-[#3a424c]'}`} />}
                  <span className={`relative grid h-8 w-8 place-items-center rounded-full border text-xs font-black ${complete || active ? 'border-[#ffbf00] bg-[#ffbf00] text-[#17191b]' : 'border-[#58616b] text-[#9ba3ad]'}`}>{complete ? <Check size={14} strokeWidth={3} /> : number}</span>
                  <span className={`mt-2 text-[10px] font-extrabold sm:text-xs ${active || complete ? 'text-[#9b7300] dark:text-[#ffbf00]' : 'text-[#858c95]'}`}>{label}</span>
                </button>;
              })}
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {setupStep === 1 && <div>
              <h2 className="text-2xl font-black text-[#17191b] dark:text-white">Where are you going and where will you stay?</h2>
              <p className="mt-2 text-sm text-[#777e87] dark:text-[#aeb5bf]">Tell us your destination and accommodation preference.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="text-xs font-extrabold text-[#34383d] dark:text-white">Destination (State / City)</span><div className="relative mt-2"><MapPin size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ffbf00]" /><input value={destinationDraft} onChange={(event) => setDestinationDraft(event.target.value)} placeholder="Lagos, Nigeria" className="h-12 w-full rounded-xl border border-[#dfe2e6] bg-[#fafafa] pl-11 pr-4 text-sm font-bold outline-none focus:border-[#ffbf00] dark:border-[#3a424e] dark:bg-[#18212a] dark:text-white" /></div></label>
                <label className="sm:col-span-2"><span className="text-xs font-extrabold text-[#34383d] dark:text-white">Specific area <span className="font-medium text-[#8b929b]">(optional)</span></span><input value={areaDraft} onChange={(event) => setAreaDraft(event.target.value)} placeholder="e.g. Lekki, Victoria Island, Ikoyi" className="mt-2 h-12 w-full rounded-xl border border-[#dfe2e6] bg-[#fafafa] px-4 text-sm font-semibold outline-none focus:border-[#ffbf00] dark:border-[#3a424e] dark:bg-[#18212a] dark:text-white" /></label>
                <button type="button" onClick={() => setStaySetupMode('afribooking')} className={`flex min-h-[112px] gap-4 rounded-2xl border p-4 text-left transition ${staySetupMode === 'afribooking' ? 'border-[#ffbf00] bg-[#fff8df] ring-1 ring-[#ffbf00] dark:bg-[#302916]' : 'border-[#dfe2e6] dark:border-[#3a424e]'}`}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ffbf00] text-[#17191b]"><BedDouble size={22} /></span><span><strong className="block text-sm text-[#25292d] dark:text-white">Find me an apartment on AfriBooking</strong><small className="mt-1 block leading-5 text-[#747b84]">We’ll show available stays and use the selected address to plan your trip.</small></span></button>
                <button type="button" onClick={() => setStaySetupMode('own')} className={`flex min-h-[112px] gap-4 rounded-2xl border p-4 text-left transition ${staySetupMode === 'own' ? 'border-[#ffbf00] bg-[#fff8df] ring-1 ring-[#ffbf00] dark:bg-[#302916]' : 'border-[#dfe2e6] dark:border-[#3a424e]'}`}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#222a33] text-white"><MapPin size={22} /></span><span><strong className="block text-sm text-[#25292d] dark:text-white">I already have a place to stay</strong><small className="mt-1 block leading-5 text-[#747b84]">Enter its address and we’ll plan around that location.</small></span></button>
                {staySetupMode === 'own' && <label className="sm:col-span-2"><span className="text-xs font-extrabold text-[#34383d] dark:text-white">Accommodation address</span><input value={ownStayAddress} onChange={(event) => setOwnStayAddress(event.target.value)} placeholder="Enter the full address or nearby landmark" className="mt-2 h-12 w-full rounded-xl border border-[#dfe2e6] bg-[#fafafa] px-4 text-sm font-semibold outline-none focus:border-[#ffbf00] dark:border-[#3a424e] dark:bg-[#18212a] dark:text-white" /></label>}
              </div>
              <button type="button" disabled={setupSaving} onClick={() => void continueFromDestination()} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffbf00] text-sm font-black text-[#17191b] disabled:opacity-50">{setupSaving ? <Loader2 size={16} className="animate-spin" /> : <>Next <ArrowRight size={17} /></>}</button>
            </div>}

            {setupStep === 2 && <div>
              <h2 className="text-2xl font-black text-[#17191b] dark:text-white">When are you travelling and who’s going?</h2>
              <p className="mt-2 text-sm text-[#777e87] dark:text-[#aeb5bf]">Set your dates, number of guests and total trip budget.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label><span className="text-xs font-extrabold dark:text-white">Check-in date</span><input type="date" value={checkInDraft} onChange={(event) => setCheckInDraft(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dfe2e6] bg-[#fafafa] px-4 text-sm font-bold dark:border-[#3a424e] dark:bg-[#18212a] dark:text-white" /></label>
                <label><span className="text-xs font-extrabold dark:text-white">Check-out date</span><input type="date" min={checkInDraft || undefined} value={checkOutDraft} onChange={(event) => setCheckOutDraft(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dfe2e6] bg-[#fafafa] px-4 text-sm font-bold dark:border-[#3a424e] dark:bg-[#18212a] dark:text-white" /></label>
                <div><span className="text-xs font-extrabold dark:text-white">Number of guests</span><div className="mt-2 flex h-12 items-center justify-between rounded-xl border border-[#dfe2e6] bg-[#fafafa] px-3 dark:border-[#3a424e] dark:bg-[#18212a]"><button type="button" onClick={() => setGuestDraft((value) => Math.max(1, value - 1))} className="grid h-8 w-8 place-items-center rounded-lg border dark:border-[#46505c]">−</button><strong className="dark:text-white">{guestDraft}</strong><button type="button" onClick={() => setGuestDraft((value) => Math.min(20, value + 1))} className="grid h-8 w-8 place-items-center rounded-lg border dark:border-[#46505c]">+</button></div></div>
                <label><span className="text-xs font-extrabold dark:text-white">Total trip budget (₦) <span className="font-medium text-[#8b929b]">optional</span></span><input inputMode="numeric" value={budgetDraft} onChange={(event) => setBudgetDraft(event.target.value)} placeholder="250,000" className="mt-2 h-12 w-full rounded-xl border border-[#dfe2e6] bg-[#fafafa] px-4 text-sm font-bold dark:border-[#3a424e] dark:bg-[#18212a] dark:text-white" /></label>
              </div>
              <div className="mt-6 flex gap-3"><button type="button" onClick={() => setSetupStep(1)} className="h-12 flex-1 rounded-xl border border-[#dfe2e6] text-sm font-black dark:border-[#46505c] dark:text-white">Back</button><button type="button" disabled={setupSaving} onClick={() => void continueFromTripDetails()} className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#ffbf00] text-sm font-black text-[#17191b] disabled:opacity-50">{setupSaving ? <Loader2 size={16} className="animate-spin" /> : <>Next <ArrowRight size={17} /></>}</button></div>
            </div>}

            {setupStep === 3 && <div>
              <h2 className="text-2xl font-black text-[#17191b] dark:text-white">What do you want to include?</h2>
              <p className="mt-2 text-sm text-[#777e87] dark:text-[#aeb5bf]">Select every experience you’re interested in. You can refine them later.</p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{activityTaxonomy.map((category) => { const selected = Object.prototype.hasOwnProperty.call(activityPreferences, category.id); return <button key={category.id} type="button" onClick={() => toggleSetupInterest(category.id)} className={`relative min-h-[92px] rounded-2xl border p-3 text-center text-xs font-extrabold transition ${selected ? 'border-[#ffbf00] bg-[#fff4c8] text-[#5e4700] ring-1 ring-[#ffbf00] dark:bg-[#302916] dark:text-[#ffd85d]' : 'border-[#dfe2e6] text-[#626970] dark:border-[#3a424e] dark:text-[#c6ccd5]'}`}>{selected && <Check size={13} className="absolute right-2 top-2" />}<span className="mb-2 block text-2xl">{category.emoji}</span>{category.label}</button>; })}</div>
              <div className="mt-6 flex gap-3"><button type="button" onClick={() => setSetupStep(2)} className="h-12 flex-1 rounded-xl border border-[#dfe2e6] text-sm font-black dark:border-[#46505c] dark:text-white">Back</button><button type="button" disabled={setupSaving || loading} onClick={() => void createStructuredTrip()} className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#ffbf00] text-sm font-black text-[#17191b] disabled:opacity-50">{setupSaving || loading ? <Loader2 size={16} className="animate-spin" /> : <>Create my trip <Sparkles size={16} /></>}</button></div>
            </div>}
          </div>
        </section>

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
                  <div className="w-full max-w-[430px] rounded-2xl rounded-bl-md border border-[#eadfbd] bg-[linear-gradient(135deg,#fffdf5,#fff7d9)] p-4 shadow-sm dark:border-[#403821] dark:bg-[linear-gradient(135deg,#1a2029,#282317)]">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ffbf00] text-[#17191b]"><Bot size={19} /></div>
                      <div>
                        <p className="text-sm font-black text-[#25292d] dark:text-white">Building your experience</p>
                        <p className="text-[11px] text-[#777e87] dark:text-[#b7bec8]">This usually takes a few seconds</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-[11px] font-bold">
                      <PlanningStatus label="Understanding your preferences" complete />
                      <PlanningStatus label="Checking AfriBooking stays first" active />
                      <PlanningStatus label="Finding useful places nearby" />
                      <PlanningStatus label="Shaping your day-by-day plan" />
                    </div>
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
                      {(result.apartmentSearch?.total || result.apartments.length)
                        ? `${result.apartmentSearch?.total || result.apartments.length} matching stay${(result.apartmentSearch?.total || result.apartments.length) === 1 ? '' : 's'}`
                        : 'No matching stay yet'}
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ecf8ef] px-2.5 py-1 text-[10px] font-extrabold text-[#24733a] dark:bg-[#173322] dark:text-[#84d99a]">
                    <Check size={11} /> Searched first
                  </span>
                </div>

                {!chosenApartment && (
                  <button
                    type="button"
                    onClick={skipStays}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#806000] underline decoration-[#d7b64d] underline-offset-4 transition hover:text-[#4f3b00] dark:text-[#ffcf3d] dark:hover:text-[#ffe38a]"
                  >
                    Skip stays and explore activities <ArrowRight size={13} />
                  </button>
                )}

                {selectedApartment ? (
                  <div
                    key={selectedApartment.id}
                    className={`mt-4 overflow-hidden rounded-2xl border border-[#e8e9ec] bg-white shadow-[0_14px_40px_rgba(28,31,35,0.08)] transition duration-300 ease-out dark:border-[#353c47] dark:bg-[#181d25] ${stayCardMotion === 'left' ? '-translate-x-8 -rotate-2 opacity-20' : stayCardMotion === 'right' ? 'translate-x-8 rotate-2 opacity-20' : 'translate-x-0 rotate-0 opacity-100'}`}
                  >
                    <div className="flex items-center justify-between bg-[#fafafa] px-4 py-2.5 text-[10px] font-extrabold text-[#7b8189] dark:bg-[#141922] dark:text-[#aeb5bf]">
                      <span>{reviewedStayCount + 1} of {result.apartmentSearch?.total || result.apartments.length}</span>
                      <span>{Math.max(0, result.apartments.length - reviewedStayCount)} loaded left to review</span>
                    </div>
                    {selectedApartment.image ? (
                      <div className="relative h-44 w-full bg-[#eef0f2]">
                        <Image
                          src={selectedApartment.image}
                          alt={selectedApartment.name}
                          fill
                          unoptimized
                          sizes="(max-width: 1280px) 100vw, 420px"
                          className="object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
                        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black text-[#17191b] shadow-sm backdrop-blur">
                          Recommended for your trip
                        </span>
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
                          {typeof selectedApartment.distanceKm === 'number' && (
                            <p className="mt-1 text-[10px] font-semibold text-[#8a9098] dark:text-[#929aa5]">
                              {selectedApartment.distanceKm < 1
                                ? `${Math.max(1, Math.round(selectedApartment.distanceKm * 1000))} m from your searched area`
                                : `${selectedApartment.distanceKm.toFixed(1)} km from your searched area`}
                            </p>
                          )}
                          {selectedApartment.recommendationReasons?.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {selectedApartment.recommendationReasons.map((reason) => (
                                <span key={reason} className="rounded-full bg-[#fff5ce] px-2 py-1 text-[9px] font-bold text-[#765800] dark:bg-[#312a17] dark:text-[#ffcf3d]">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-right text-xs font-black text-[#17191b] dark:text-white">
                          {formatNaira(selectedApartment.pricePerNight)}
                          <span className="block font-medium text-[#8a9098]">per night</span>
                          {selectedApartment.priceIncludesPlatformFee && <span className="mt-0.5 block text-[8px] font-semibold text-[#a0a5ab]">includes service fee</span>}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-[#686e76] dark:text-[#b7bec8]">
                        <span>{selectedApartment.bedrooms} bedrooms</span>
                        <span>•</span>
                        <span>Up to {selectedApartment.guests} guests</span>
                      </div>
                      <div className="mt-5 flex items-center justify-center gap-5 border-t border-[#eceef1] pt-4 dark:border-[#353c47]">
                        <button
                          type="button"
                          onClick={() => void decideStay(selectedApartment.id, 'rejected')}
                          disabled={stayDecisionLoading}
                          aria-label={`Not interested in ${selectedApartment.name}`}
                          className="group flex flex-col items-center gap-1.5 text-[10px] font-extrabold text-[#8b9097] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-[#e3e5e8] bg-white text-[#e85d62] shadow-[0_8px_24px_rgba(28,31,35,0.10)] transition group-hover:-translate-y-1 group-hover:border-[#f0b2b5] group-hover:bg-[#fff5f5] dark:border-[#3a424e] dark:bg-[#202630]">
                            <X size={25} strokeWidth={2.6} />
                          </span>
                          Not for me
                        </button>
                        <button
                          type="button"
                          onClick={() => void decideStay(selectedApartment.id, 'interested')}
                          disabled={stayDecisionLoading}
                          aria-label={`Interested in ${selectedApartment.name}`}
                          className="group flex flex-col items-center gap-1.5 text-[10px] font-extrabold text-[#8b9097] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="grid h-16 w-16 place-items-center rounded-full bg-[#ffbf00] text-[#17191b] shadow-[0_10px_28px_rgba(255,191,0,0.32)] transition group-hover:-translate-y-1 group-hover:bg-[#eeb200]">
                            {stayDecisionLoading ? <Loader2 size={24} className="animate-spin" /> : <Check size={27} strokeWidth={2.8} />}
                          </span>
                          I’m interested
                        </button>
                      </div>
                      <Link
                        href={`/apartments/${selectedApartment.id}`}
                        className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-[#17191b] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#303438] dark:bg-[#ffbf00] dark:text-[#17191b]"
                      >
                        View recommended stay <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ) : result.apartmentSearch?.hasMore ? (
                  <div className="mt-4 rounded-2xl border border-[#e6dfca] bg-[linear-gradient(145deg,#fffdf6,#fff5d7)] p-5 text-center dark:border-[#403821] dark:bg-[linear-gradient(145deg,#202630,#2c2617)]">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#ffbf00] text-[#17191b]"><BedDouble size={22} /></div>
                    <h3 className="mt-3 text-base font-black text-[#17191b] dark:text-white">More matching stays are ready</h3>
                    <p className="mt-2 text-xs leading-5 text-[#737981] dark:text-[#b8bec7]">
                      You reviewed the {result.apartments.length} stays currently loaded. Continue without losing your shortlist or skipped choices.
                    </p>
                    <button type="button" onClick={() => void loadMoreStays()} disabled={stayPageLoading} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#17191b] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#303438] disabled:opacity-50 dark:bg-[#ffbf00] dark:text-[#17191b]">
                      {stayPageLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Load more stays
                    </button>
                  </div>
                ) : result.apartments.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-[#e6dfca] bg-[linear-gradient(145deg,#fffdf6,#fff5d7)] p-5 text-center dark:border-[#403821] dark:bg-[linear-gradient(145deg,#202630,#2c2617)]">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#ffbf00] text-[#17191b]"><BookmarkCheck size={22} /></div>
                    <h3 className="mt-3 text-base font-black text-[#17191b] dark:text-white">{chosenApartment ? 'Your primary stay is set' : 'You’ve reviewed every stay'}</h3>
                    {chosenApartment ? (
                      <>
                        <p className="mt-2 text-sm font-extrabold text-[#4d5157] dark:text-[#edf0f4]">{chosenApartment.name}</p>
                        <p className="mt-1 text-xs text-[#737981] dark:text-[#b8bec7]">{chosenApartment.neighborhood || chosenApartment.city}, {chosenApartment.state} · {formatNaira(chosenApartment.pricePerNight)} / night</p>
                        <button type="button" onClick={() => void sendMessage(`Build my itinerary around ${chosenApartment.name}`)} disabled={loading} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#17191b] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#303438] disabled:opacity-50 dark:bg-[#ffbf00] dark:text-[#17191b]">
                          <Sparkles size={13} /> Build itinerary around this stay
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 text-xs leading-5 text-[#737981] dark:text-[#b8bec7]">
                          {interestedApartments.length
                            ? `${interestedApartments.length} stay${interestedApartments.length === 1 ? ' is' : 's are'} waiting in your shortlist.`
                            : 'None felt right yet. Reset your choices or ask the AI to adjust the search.'}
                        </p>
                        {interestedApartments.length > 0 && (
                          <button type="button" onClick={() => setShowStayComparison(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#17191b] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#303438] dark:bg-[#ffbf00] dark:text-[#17191b]">
                            Compare and choose <ArrowRight size={13} />
                          </button>
                        )}
                      </>
                    )}
                    <button type="button" onClick={() => void resetStayChoices()} disabled={stayDecisionLoading} className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#e5d397] bg-white px-4 py-2.5 text-xs font-extrabold text-[#67500b] transition hover:border-[#d2ad34] disabled:opacity-50 dark:border-[#4c432b] dark:bg-[#181d25] dark:text-[#f0d47f]">
                      <RotateCcw size={13} /> Review again
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-[#fff7dc] p-4 text-sm leading-6 text-[#6f570d] dark:bg-[#302916] dark:text-[#efcf77]">
                    Try a nearby neighbourhood or another destination where AfriBooking currently has published stays.
                  </p>
                )}

                {lastRejectedApartmentId && (
                  <div className="mt-3 rounded-2xl border border-[#ece5d1] bg-[#fffdf7] p-3 dark:border-[#403a2c] dark:bg-[#211f19]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-extrabold text-[#52575e] dark:text-[#d6dbe2]">Help improve the next picks <span className="font-medium text-[#92979e]">(optional)</span></p>
                      <button type="button" onClick={() => setLastRejectedApartmentId(null)} className="text-[10px] font-bold text-[#8d9299]">Skip</button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {rejectionReasons.map((reason) => (
                        <button key={reason} type="button" onClick={() => void addRejectionReason(reason)} disabled={stayDecisionLoading} className="rounded-full border border-[#e1d6b5] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#6e5b20] transition hover:border-[#d4a914] hover:bg-[#fff7db] disabled:opacity-50 dark:border-[#4b432e] dark:bg-[#181d25] dark:text-[#e4cd86]">
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(reviewedStayCount > 0 || interestedApartments.length > 0) && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setShowInterestedStays((current) => !current)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#fff6d8] px-3 py-2.5 text-[11px] font-extrabold text-[#755900] transition hover:bg-[#ffefb9] dark:bg-[#302916] dark:text-[#f2d372]">
                      <BookmarkCheck size={14} /> Interested stays ({interestedApartments.length})
                    </button>
                    {result.stayPreferences?.decisions.length ? (
                      <button type="button" onClick={() => void undoStayDecision()} disabled={stayDecisionLoading} aria-label="Undo last stay choice" className="grid h-9 w-9 place-items-center rounded-xl border border-[#e3e5e8] text-[#6f757d] transition hover:bg-[#f5f6f7] disabled:opacity-40 dark:border-[#3a424e] dark:text-[#c0c6cf] dark:hover:bg-[#252c36]">
                        <RotateCcw size={14} />
                      </button>
                    ) : null}
                  </div>
                )}

                {interestedApartments.length > 0 && (
                  <button type="button" onClick={() => setShowStayComparison(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17191b] px-4 py-3 text-xs font-extrabold text-white transition hover:bg-[#303438] dark:bg-[#ffbf00] dark:text-[#17191b]">
                    Compare {interestedApartments.length} interested stay{interestedApartments.length === 1 ? '' : 's'} <ArrowRight size={14} />
                  </button>
                )}

                {showInterestedStays && (
                  <div className="mt-3 space-y-2 rounded-2xl border border-[#eceef1] bg-[#fafafa] p-3 dark:border-[#353c47] dark:bg-[#141922]">
                    {interestedApartments.length ? interestedApartments.map((apartment) => (
                      <Link key={apartment.id} href={`/apartments/${apartment.id}`} className={`flex items-center gap-3 rounded-xl border p-2.5 transition hover:shadow-sm ${chosenApartment?.id === apartment.id ? 'border-[#e3aa00] bg-[#fff8df] dark:border-[#7a5e0d] dark:bg-[#2b2618]' : 'border-transparent bg-white dark:bg-[#1c222c]'}`}>
                        <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-[#eceef1] dark:bg-[#252c36]">
                          {apartment.image ? <Image src={apartment.image} alt="" fill unoptimized sizes="56px" className="object-cover" /> : <div className="grid h-full place-items-center text-[#a2a7ae]"><BedDouble size={16} /></div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-extrabold text-[#25292d] dark:text-white">{apartment.name}</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-[#81868d]">{formatNaira(apartment.pricePerNight)} / night{chosenApartment?.id === apartment.id ? ' · Primary stay' : ''}</p>
                        </div>
                        <ArrowRight size={13} className="text-[#9a9fa6]" />
                      </Link>
                    )) : <p className="py-3 text-center text-xs text-[#8a9098]">Tap the check mark on a stay you like and it will appear here.</p>}
                  </div>
                )}
              </section>
            )}
          </aside>
        </div>

        {result && planId && (
          <section id="activity-recommendations" className="mt-6 scroll-mt-24 rounded-3xl border border-[#e8e9ec] bg-white p-5 sm:p-7 dark:border-[#353c47] dark:bg-[#1c222c]">
            <div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b6700] dark:text-[#ffbf00]">Verified nearby recommendations</p>
                <h2 className="mt-1 font-display text-2xl font-black text-[#17191b] dark:text-white">{staySkipped && !result.intent.activityLocation ? (placeSearchMode === 'place' ? 'Add places you already know' : 'Where would you like to explore?') : 'What would you like to do?'}</h2>
                <p className="mt-2 text-sm text-[#737981] dark:text-[#b3bac4]">{staySkipped && !result.intent.activityLocation ? (placeSearchMode === 'place' ? 'Search by name and add restaurants, attractions or landmarks directly to your plan.' : 'Search and select an area to get activity recommendations without booking a stay.') : 'Choose a category, then refine it so recommendations match the experience you want.'}</p>
                <span className="mt-3 inline-flex rounded-full bg-[#eef7f0] px-2.5 py-1 text-[10px] font-extrabold text-[#347047] dark:bg-[#173322] dark:text-[#87d69d]">Booking a stay is optional</span>
                <p className="mt-2 text-[10px] font-medium text-[#969ba2]">Place details provided by <span translate="no" className="whitespace-nowrap font-bold text-[#666b72] dark:text-[#c4cad2]">Google Maps</span></p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#e7e9ec] bg-[#fafafa] p-3 sm:p-4 dark:border-[#343b46] dark:bg-[#151a22]">
              <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
                <button type="button" disabled={rangeLoading} onClick={() => void chooseActivityCategory('all')} className={`flex min-w-[104px] shrink-0 flex-col items-center justify-center rounded-2xl border px-3 py-3 text-xs font-extrabold transition disabled:opacity-60 ${Object.keys(activityPreferences).length === 0 ? 'border-[#ffbf00] bg-[#ffbf00] text-[#17191b] shadow-[0_8px_24px_rgba(255,191,0,0.22)]' : 'border-[#e1e4e8] bg-white text-[#626970] dark:border-[#3a424e] dark:bg-[#1c222c] dark:text-[#c6ccd5]'}`}><span className="mb-1 text-xl">✨</span>Explore all</button>
                {activityTaxonomy.map((category) => (
                  <button key={category.id} type="button" disabled={rangeLoading} onClick={() => void chooseActivityCategory(category.id)} className={`relative flex min-w-[116px] shrink-0 flex-col items-center justify-center rounded-2xl border px-3 py-3 text-center text-xs font-extrabold transition disabled:opacity-60 ${Object.prototype.hasOwnProperty.call(activityPreferences, category.id) ? 'border-[#ffbf00] bg-[#fff4c8] text-[#5e4700] shadow-[0_8px_24px_rgba(255,191,0,0.14)] dark:bg-[#332b14] dark:text-[#ffd85d]' : 'border-[#e1e4e8] bg-white text-[#626970] hover:border-[#d3aa2c] dark:border-[#3a424e] dark:bg-[#1c222c] dark:text-[#c6ccd5]'} ${selectedActivityCategory === category.id ? 'ring-2 ring-[#ffbf00]/40' : ''}`}>
                    {Object.prototype.hasOwnProperty.call(activityPreferences, category.id) && <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-[#ffbf00] text-[#17191b]"><Check size={10} strokeWidth={3} /></span>}
                    <span className="mb-1 text-xl">{category.emoji}</span>{category.label}
                  </button>
                ))}
              </div>
              {activeActivityCategory && (
                <div className="mt-3 border-t border-[#e3e5e8] pt-3 dark:border-[#343b46]">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div><p className="text-xs font-black text-[#25292d] dark:text-white">Refine {activeActivityCategory.label}</p><span className="text-[10px] font-semibold text-[#8a9098]">Select one or more; your other categories stay selected</span></div>
                    <button type="button" disabled={rangeLoading} onClick={() => void removeActivityCategory()} className="shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold text-[#a13d3d] transition hover:bg-[#fff0f0] disabled:opacity-50 dark:hover:bg-[#382124]">Remove</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={rangeLoading} onClick={() => void refreshActivitySearch(result.intent.activityRadiusKm || 5, undefined, selectedActivityCategory, [], { ...activityPreferences, [selectedActivityCategory]: [] })} className={`rounded-full border px-3 py-2 text-[11px] font-extrabold transition disabled:opacity-60 ${selectedActivitySubcategories.length === 0 ? 'border-[#ffbf00] bg-[#fff2bd] text-[#654b00] dark:bg-[#332b14] dark:text-[#ffd85d]' : 'border-[#dfe2e6] bg-white text-[#697078] dark:border-[#3a424e] dark:bg-[#1c222c] dark:text-[#c6ccd5]'}`}>All {activeActivityCategory.label}</button>
                    {activeActivityCategory.subcategories.map((subcategory) => {
                      const selected = selectedActivitySubcategories.includes(subcategory.id);
                      return <button key={subcategory.id} type="button" disabled={rangeLoading} onClick={() => void toggleActivitySubcategory(subcategory.id)} className={`rounded-full border px-3 py-2 text-[11px] font-extrabold transition disabled:opacity-60 ${selected ? 'border-[#ffbf00] bg-[#ffbf00] text-[#17191b]' : 'border-[#dfe2e6] bg-white text-[#697078] hover:border-[#d3aa2c] dark:border-[#3a424e] dark:bg-[#1c222c] dark:text-[#c6ccd5]'}`}>{selected && <Check size={11} className="mr-1 inline" />}{subcategory.label}</button>;
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-[#eceef1] bg-[#fafafa] p-4 dark:border-[#353c47] dark:bg-[#151a22]">
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-[#eceef1] p-1 dark:bg-[#252c36]">
                <button type="button" onClick={() => { setPlaceSearchMode('area'); setLocationPredictions([]); setLocationQuery(''); }} className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${placeSearchMode === 'area' ? 'bg-white text-[#17191b] shadow-sm dark:bg-[#171c24] dark:text-white' : 'text-[#737981] dark:text-[#aeb5bf]'}`}>
                  Explore an area
                </button>
                <button type="button" onClick={() => { setPlaceSearchMode('place'); setLocationPredictions([]); setLocationQuery(''); window.setTimeout(() => activityLocationInputRef.current?.focus(), 50); }} className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${placeSearchMode === 'place' ? 'bg-white text-[#17191b] shadow-sm dark:bg-[#171c24] dark:text-white' : 'text-[#737981] dark:text-[#aeb5bf]'}`}>
                  Add a specific place
                </button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="min-w-0 flex-1">
                  <span className="text-xs font-black text-[#25292d] dark:text-white">{placeSearchMode === 'area' ? 'Search activities around another location' : 'Search for a restaurant, attraction or place'}</span>
                  <span className="mt-1 block text-[11px] text-[#7b8189] dark:text-[#aeb5bf]">{placeSearchMode === 'area' ? 'Your stay can remain in Ikeja while you explore Lekki, Victoria Island or anywhere else.' : 'Already have somewhere in mind? Find it by name and add it directly to your itinerary.'}</span>
                  <div className="relative mt-2">
                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#92989f]" />
                    <input
                      ref={activityLocationInputRef}
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void searchActivityLocation(); } }}
                      placeholder={placeSearchMode === 'area' ? 'Search an area, landmark or city' : 'Example: The George Lagos'}
                      className="h-11 w-full rounded-xl border border-[#dfe2e6] bg-white pl-10 pr-3 text-sm font-semibold text-[#25292d] outline-none transition focus:border-[#e3aa00] focus:ring-2 focus:ring-[#ffbf00]/20 dark:border-[#3a424e] dark:bg-[#1c222c] dark:text-white"
                    />
                  </div>
                </label>
                <button type="button" disabled={locationSearching} onClick={() => void searchActivityLocation()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#17191b] px-5 text-xs font-extrabold text-white transition hover:bg-[#303438] disabled:opacity-60 dark:bg-[#ffbf00] dark:text-[#17191b]">
                  {locationSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} {placeSearchMode === 'area' ? 'Search' : 'Find place'}
                </button>
              </div>

              {locationPredictions.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-xl border border-[#dfe2e6] bg-white dark:border-[#3a424e] dark:bg-[#1c222c]">
                  {locationPredictions.map((prediction) => (
                    <button key={prediction.place_id} type="button" disabled={locationSearching} onClick={() => void (placeSearchMode === 'area' ? chooseActivityLocation(prediction) : addSpecificPlace(prediction))} className="flex w-full items-center gap-3 border-b border-[#eef0f2] px-4 py-3 text-left transition last:border-0 hover:bg-[#fff8df] disabled:opacity-60 dark:border-[#303743] dark:hover:bg-[#2b2618]">
                      <MapPin size={15} className="mt-0.5 shrink-0 text-[#d8a000]" />
                      <span className="min-w-0 flex-1"><strong className="block text-xs text-[#25292d] dark:text-white">{prediction.structured_formatting?.main_text || prediction.description}</strong>{prediction.structured_formatting?.secondary_text && <span className="mt-0.5 block text-[10px] text-[#858b93]">{prediction.structured_formatting.secondary_text}</span>}</span>
                      <span className="shrink-0 rounded-full bg-[#ffbf00] px-2.5 py-1 text-[9px] font-black text-[#17191b]">{placeSearchMode === 'area' ? 'Explore here' : 'Add to plan'}</span>
                    </button>
                  ))}
                </div>
              )}

              {staySkipped && !result.intent.activityLocation && placeSearchMode === 'area' && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#efd77f] bg-[#fff8df] p-3.5 text-xs leading-5 text-[#66500a] dark:border-[#55471d] dark:bg-[#292515] dark:text-[#f2d77d]">
                  <Compass size={17} className="mt-0.5 shrink-0" />
                  <span><strong className="block text-[#3d310b] dark:text-[#fff0b5]">Select an exploration area to continue</strong>We won’t use an apartment’s location after you skip stays.</span>
                </div>
              )}

              {(!staySkipped || Boolean(result.intent.activityLocation)) && <div className="mt-5 flex flex-col gap-3 border-t border-[#e5e7ea] pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#343b46]">
              <div>
                <p className="text-xs font-black text-[#25292d] dark:text-white">How far should we look?</p>
                <p className="mt-1 text-[11px] text-[#7b8189] dark:text-[#aeb5bf]">
                  Measured from {result.intent.activityLocation?.name || (chosenApartment ? 'your primary stay' : 'the recommended stay')}. A wider range can increase driving time.
                </p>
              </div>
              <div className="w-full sm:max-w-sm">
                <div className="mb-2 flex items-center justify-between text-[10px] font-bold text-[#858b93]"><span>1 km</span><span className="rounded-full bg-[#ffbf00] px-2.5 py-1 text-[#17191b]">{pendingRadius ?? result.intent.activityRadiusKm ?? 5} km</span><span>25 km</span></div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={pendingRadius ?? result.intent.activityRadiusKm ?? 5}
                  disabled={rangeLoading}
                  onChange={(event) => setPendingRadius(Number(event.target.value))}
                  onMouseUp={(event) => void changeActivityRadius(Number(event.currentTarget.value))}
                  onTouchEnd={(event) => void changeActivityRadius(Number(event.currentTarget.value))}
                  onKeyUp={(event) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) void changeActivityRadius(Number(event.currentTarget.value)); }}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#e1e4e8] accent-[#ffbf00] disabled:cursor-wait dark:bg-[#343b46]"
                  aria-label="Activity search distance"
                />
              </div>
              </div>}
            </div>

            {(!staySkipped || Boolean(result.intent.activityLocation)) && (visibleActivities.length > 0 ? <>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedActivities.map((activity) => {
                const isAdded = Boolean(
                  result.itinerary?.days.some((day) =>
                    day.activities.some((item) => item.sourceActivityId === activity.id)
                  )
                );
                const mapsUrl = safeExternalUrl(activity.googleMapsUri) || (activity.latitude !== undefined && activity.longitude !== undefined
                  ? `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${activity.name} ${activity.address}`)}`);
                const websiteUrl = safeExternalUrl(activity.websiteUri);
                const showPhoto = activity.hasPhoto && !failedActivityImages.has(activity.id);
                const priceLabel = formatPlacePrice(activity.priceLevel);
                const displayedDistance = activity.drivingDistanceKm ?? activity.distanceKm;
                const isDrivingDistance = activity.drivingDistanceKm !== undefined;
                return (
                  <article key={activity.id} className="group flex min-h-[310px] flex-col overflow-hidden rounded-[22px] border border-[#e2e4e7] bg-white shadow-[0_12px_35px_rgba(31,35,41,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(31,35,41,0.12)] dark:border-[#353c47] dark:bg-[#181d25]">
                    {showPhoto ? (
                      <div className="relative h-40 overflow-hidden bg-[#e8e9ec]">
                        <Image
                          src={getPlacePhoto(activity.id)}
                          alt={activity.name}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                          onError={() => setFailedActivityImages((current) => new Set(current).add(activity.id))}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
                        {activity.photoAttributions?.length ? (
                          <div className="absolute bottom-2 left-3 right-3 truncate text-[8px] font-semibold text-white/90">
                            Photo: {activity.photoAttributions.map((attribution, index) => (
                              <span key={`${attribution.displayName}-${index}`}>
                                {index > 0 ? ', ' : ''}
                                {safeExternalUrl(attribution.uri) ? <a href={safeExternalUrl(attribution.uri)} target="_blank" rel="noreferrer" className="underline">{attribution.displayName}</a> : attribution.displayName}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <ActivityArtwork type={activity.types[0]} name={activity.name} />
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-full bg-[#fff3c1] px-2.5 py-1 text-[9px] font-extrabold capitalize text-[#765800] dark:bg-[#302916] dark:text-[#ffcf3f]">
                          {activity.addedByUser ? 'Added by you' : activity.primaryType || (activity.types[0] || 'Activity').replaceAll('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          {activity.openNow !== undefined && <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${activity.openNow ? 'bg-[#e9f8ed] text-[#25753b] dark:bg-[#173322] dark:text-[#87d69d]' : 'bg-[#f5ecec] text-[#985050] dark:bg-[#382124] dark:text-[#e6a3a3]'}`}>{activity.openNow ? 'Open now' : 'Closed'}</span>}
                          {isAdded && <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#2f7b45] dark:text-[#87d69d]"><Check size={12} /> In plan</span>}
                        </div>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-base font-black text-[#17191b] dark:text-white">{activity.name}</h3>
                      {(activity.rating !== undefined || priceLabel) && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#60666d] dark:text-[#c3c9d2]">
                          {activity.rating !== undefined && (
                            <span className="inline-flex items-center gap-1"><Star size={13} className="fill-[#ffbf00] text-[#ffbf00]" /> {activity.rating.toFixed(1)} {activity.userRatingCount !== undefined && <span className="font-medium text-[#92979e]">({activity.userRatingCount.toLocaleString()})</span>}</span>
                          )}
                          {priceLabel && <><span className="text-[#c6c9cd]">•</span><span>{priceLabel}</span></>}
                        </div>
                      )}
                      <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-[#7a8088] dark:text-[#aeb5bf]"><MapPin size={13} className="mt-0.5 shrink-0" /> <span className="line-clamp-2">{activity.address || result.intent.destination}</span></p>
                      {(displayedDistance !== undefined || activity.travelTimeMinutes !== undefined) && (
                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-extrabold">
                          {displayedDistance !== undefined && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f4f6] px-2.5 py-1.5 text-[#59616a] dark:bg-[#252c36] dark:text-[#c6ccd5]">
                              <MapPin size={11} /> {displayedDistance < 1 ? `${Math.max(1, Math.round(displayedDistance * 1000))} m` : `${displayedDistance.toFixed(1)} km`} {isDrivingDistance ? 'by road' : 'direct'} from stay
                            </span>
                          )}
                          {activity.travelTimeMinutes !== undefined && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3c1] px-2.5 py-1.5 text-[#765800] dark:bg-[#302916] dark:text-[#ffcf3f]">
                              <Car size={11} /> About {activity.travelTimeMinutes} min drive{activity.trafficAware ? ' in current traffic' : ''}
                            </span>
                          )}
                        </div>
                      )}
                      {(activity.phoneNumber || websiteUrl) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {activity.phoneNumber && <a href={`tel:${activity.phoneNumber}`} className="inline-flex items-center gap-1 rounded-lg bg-[#f5f6f7] px-2.5 py-1.5 text-[10px] font-bold text-[#5f656d] dark:bg-[#252c36] dark:text-[#c6ccd5]"><Phone size={11} /> Call</a>}
                          {websiteUrl && <a href={websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-[#f5f6f7] px-2.5 py-1.5 text-[10px] font-bold text-[#5f656d] dark:bg-[#252c36] dark:text-[#c6ccd5]"><Globe2 size={11} /> Website <ExternalLink size={9} /></a>}
                        </div>
                      )}
                      <div className="mt-auto flex gap-2 pt-4">
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#e0e2e5] px-3 py-2.5 text-[11px] font-extrabold text-[#5f656d] transition hover:border-[#c99a0b] dark:border-[#3a424e] dark:text-[#c6ccd5]"
                        >
                          <MapPin size={13} /> Map
                        </a>
                        <button
                          type="button"
                          disabled={isAdded || savingPlan}
                          onClick={() => void addActivity(activity)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#17191b] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#303438] disabled:bg-[#edf0f2] disabled:text-[#8b9198] dark:bg-[#ffbf00] dark:text-[#17191b] dark:disabled:bg-[#343a44] dark:disabled:text-[#8f96a1]"
                        >
                          {isAdded ? <><Check size={14} /> Added</> : <><Plus size={14} /> Add to plan</>}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {activityPageCount > 1 && (
              <nav aria-label="Activity result pages" className="mt-7 flex flex-wrap items-center justify-center gap-2">
                <button type="button" disabled={activityPage === 1} onClick={() => setActivityPage((page) => Math.max(1, page - 1))} className="rounded-xl border border-[#dfe2e6] px-3 py-2 text-xs font-extrabold text-[#5f656d] transition hover:border-[#d0a00c] disabled:cursor-not-allowed disabled:opacity-35 dark:border-[#3a424e] dark:text-[#c6ccd5]">Previous</button>
                {activityPageNumbers.map((page, index) => {
                  const previousPage = activityPageNumbers[index - 1];
                  return <span key={page} className="contents">
                    {previousPage && page - previousPage > 1 && <span className="px-1 text-[#8b9198]">…</span>}
                    <button type="button" aria-current={page === activityPage ? 'page' : undefined} onClick={() => setActivityPage(page)} className={`grid h-9 min-w-9 place-items-center rounded-xl px-2 text-xs font-black transition ${page === activityPage ? 'bg-[#ffbf00] text-[#17191b] shadow-[0_6px_18px_rgba(255,191,0,0.25)]' : 'border border-[#dfe2e6] text-[#626970] hover:border-[#d0a00c] dark:border-[#3a424e] dark:text-[#c6ccd5]'}`}>{page}</button>
                  </span>;
                })}
                <button type="button" disabled={activityPage === activityPageCount} onClick={() => setActivityPage((page) => Math.min(activityPageCount, page + 1))} className="rounded-xl border border-[#dfe2e6] px-3 py-2 text-xs font-extrabold text-[#5f656d] transition hover:border-[#d0a00c] disabled:cursor-not-allowed disabled:opacity-35 dark:border-[#3a424e] dark:text-[#c6ccd5]">Next</button>
                <span className="ml-1 text-[10px] font-bold text-[#8b9198]">{visibleActivities.length} matching places</span>
              </nav>
            )}
            </> : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#dfe2e6] px-5 py-10 text-center dark:border-[#3a424e]">
                <p className="font-bold text-[#3d4248] dark:text-white">No matching activities in this range</p>
                <p className="mt-1 text-sm text-[#858b93]">Try a wider distance or add more interests to your trip.</p>
              </div>
            ))}
          </section>
        )}

        {result?.itinerary && result.itinerary.days.length > 0 && (
          <section className="mt-6 rounded-3xl border border-[#e8e9ec] bg-white p-5 sm:p-7 dark:border-[#353c47] dark:bg-[#1c222c]">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b6700] dark:text-[#ffbf00]">Your evolving itinerary</p>
                {editingPlanTitle ? (
                  <div className="mt-1 flex max-w-xl items-center gap-2">
                    <input
                      autoFocus
                      value={planTitleDraft}
                      maxLength={120}
                      aria-label="Trip name"
                      disabled={savingPlanTitle}
                      onChange={(event) => setPlanTitleDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void savePlanTitle();
                        if (event.key === 'Escape' && !savingPlanTitle) setEditingPlanTitle(false);
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-[#d7aa20] bg-[#fffaf0] px-3 py-2 font-display text-xl font-black text-[#17191b] outline-none ring-[#ffbf00]/25 transition focus:ring-4 disabled:opacity-60 dark:border-[#6c571b] dark:bg-[#141922] dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => void savePlanTitle()}
                      disabled={savingPlanTitle || !planTitleDraft.trim()}
                      aria-label="Save trip name"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ffbf00] text-[#17191b] transition hover:bg-[#eeb200] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingPlanTitle ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} strokeWidth={3} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPlanTitle(false)}
                      disabled={savingPlanTitle}
                      aria-label="Cancel renaming trip"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dde0e4] text-[#6d737b] transition hover:bg-[#f3f4f5] disabled:opacity-50 dark:border-[#3a424e] dark:text-[#c7cdd5] dark:hover:bg-[#252c36]"
                    >
                      <X size={17} />
                    </button>
                  </div>
                ) : (
                  <div className="group/title mt-1 flex items-center gap-2">
                    <h2 className="font-display text-2xl font-black text-[#17191b] dark:text-white">{result.itinerary.title}</h2>
                    <button
                      type="button"
                      onClick={startEditingPlanTitle}
                      aria-label="Edit trip name"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#858b93] opacity-100 transition hover:bg-[#fff3c1] hover:text-[#8b6700] sm:opacity-0 sm:group-hover/title:opacity-100 sm:focus:opacity-100 dark:hover:bg-[#302916] dark:hover:text-[#ffbf00]"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                )}
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f757d] dark:text-[#b3bac4]">{result.itinerary.summary}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {result.itinerary.estimatedActivityCost !== undefined && (
                  <div className="mr-1 rounded-2xl bg-[#fff7d8] px-4 py-2.5 text-right dark:bg-[#302916]">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#8b6700]">Estimated activities</p>
                    <p className="text-base font-black text-[#17191b] dark:text-white">{formatNaira(result.itinerary.estimatedActivityCost)}</p>
                  </div>
                )}
                <button
                  type="button"
                  disabled={savingPlan || result.planStatus === 'saved'}
                  onClick={() => void persistPlan(result.itinerary, 'saved')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#ffbf00] px-4 py-3 text-xs font-extrabold text-[#17191b] transition hover:bg-[#eeb200] disabled:opacity-60"
                >
                  {savingPlan ? <Loader2 size={15} className="animate-spin" /> : result.planStatus === 'saved' ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                  {result.planStatus === 'saved' ? 'Saved' : 'Save plan'}
                </button>
                <button
                  type="button"
                  onClick={() => void sharePlan()}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#dde0e4] px-4 py-3 text-xs font-extrabold text-[#4f555d] transition hover:border-[#d5a000] dark:border-[#3a424e] dark:text-[#d0d5dd]"
                >
                  <Share2 size={15} /> Share
                </button>
              </div>
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
              <div className="mt-7 max-w-4xl">
                <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-[#f7f8fa] px-4 py-3 dark:bg-[#141922]">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8e6a00] dark:text-[#ffbf00]">Day {selectedItineraryDay.day}</p>
                    <h3 className="mt-1 text-sm font-black text-[#25292d] dark:text-white">{selectedItineraryDay.title}</h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-[#777e87] shadow-sm dark:bg-[#1c222c]">{selectedItineraryDay.activities.length} stops</span>
                </div>
                {selectedItineraryDay.activities.map((activity, index) => {
                  const sourceActivity = activity.sourceActivityId
                    ? activitiesById.get(activity.sourceActivityId)
                    : undefined;
                  const showPhoto = Boolean(
                    sourceActivity?.hasPhoto && !failedActivityImages.has(sourceActivity.id)
                  );
                  return (
                  <article key={`${activity.title}-${index}`} className="relative grid grid-cols-[38px_minmax(0,1fr)] gap-3 pb-5 last:pb-0 sm:grid-cols-[52px_minmax(0,1fr)] sm:gap-4">
                    {index < selectedItineraryDay.activities.length - 1 && <div className="absolute bottom-0 left-[18px] top-10 w-0.5 bg-[#ece3c8] sm:left-[25px] dark:bg-[#3d392e]" />}
                    <div className="relative z-10 grid h-9 w-9 place-items-center rounded-full border-4 border-white bg-[#17191b] text-[11px] font-black text-white shadow-sm sm:h-12 sm:w-12 dark:border-[#1c222c] dark:bg-[#ffbf00] dark:text-[#17191b]">{index + 1}</div>
                    <div className="overflow-hidden rounded-2xl border border-[#e8e9ec] bg-white shadow-sm dark:border-[#353c47] dark:bg-[#181d25]">
                      {sourceActivity && (
                        <div className="relative h-40 overflow-hidden bg-[#e9ebee] dark:bg-[#111720] sm:h-48">
                          {showPhoto ? (
                            <Image
                              src={getPlacePhoto(sourceActivity.id)}
                              alt={`${activity.title} from Google Maps`}
                              fill
                              unoptimized
                              sizes="(max-width: 640px) calc(100vw - 90px), 800px"
                              className="object-cover transition duration-500 hover:scale-[1.02]"
                              onError={() => setFailedActivityImages((current) => new Set(current).add(sourceActivity.id))}
                            />
                          ) : (
                            <ActivityArtwork type={sourceActivity.types[0] || activity.category} name={activity.title} className="h-full" />
                          )}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                          <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-extrabold text-white backdrop-blur-sm">
                            {sourceActivity.addedByUser ? 'Chosen by you' : 'Verified place'}
                          </span>
                          {showPhoto && sourceActivity.photoAttributions?.length ? (
                            <p className="absolute bottom-3 right-3 max-w-[52%] truncate text-right text-[8px] font-semibold text-white/85">
                              Photo: {sourceActivity.photoAttributions.map((attribution) => attribution.displayName).join(', ')}
                            </p>
                          ) : null}
                        </div>
                      )}
                      <div className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 rounded-lg bg-[#fff5ce] px-2.5 py-1.5 text-[10px] font-extrabold text-[#8a6500] dark:bg-[#302916] dark:text-[#ffbf00]">
                            <Clock3 size={12} />
                            <input
                              aria-label={`Time for ${activity.title}`}
                              defaultValue={activity.time}
                              maxLength={30}
                              disabled={savingPlan}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') event.currentTarget.blur();
                              }}
                              onBlur={(event) => {
                                if (event.target.value.trim() !== activity.time) {
                                  void updateActivityTime(selectedItineraryDay.day, index, event.target.value);
                                }
                              }}
                              className="w-[72px] bg-transparent outline-none placeholder:text-[#a58b42]"
                            />
                          </label>
                          <span className="rounded-full bg-[#f3f4f5] px-2.5 py-1.5 text-[10px] font-bold capitalize text-[#686e76] dark:bg-[#252c36] dark:text-[#c3c9d2]">{activity.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" disabled={index === 0 || savingPlan} onClick={() => void moveActivity(selectedItineraryDay.day, index, -1)} aria-label={`Move ${activity.title} earlier`} className="grid h-8 w-8 place-items-center rounded-lg text-[#777e87] transition hover:bg-[#f2f3f5] disabled:opacity-25 dark:hover:bg-[#252c36]"><ChevronUp size={14} /></button>
                          <button type="button" disabled={index === selectedItineraryDay.activities.length - 1 || savingPlan} onClick={() => void moveActivity(selectedItineraryDay.day, index, 1)} aria-label={`Move ${activity.title} later`} className="grid h-8 w-8 place-items-center rounded-lg text-[#777e87] transition hover:bg-[#f2f3f5] disabled:opacity-25 dark:hover:bg-[#252c36]"><ChevronDown size={14} /></button>
                          <button
                            type="button"
                            disabled={savingPlan}
                            onClick={() => void removeActivity(selectedItineraryDay.day, index)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#9a7777] transition hover:bg-[#fff0f0] hover:text-[#a72c2c] disabled:opacity-40 dark:hover:bg-[#382124]"
                            aria-label={`Remove ${activity.title}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <h3 className="mt-3 text-base font-black text-[#17191b] dark:text-white">{activity.title}</h3>
                      <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-[#7a8088] dark:text-[#aeb5bf]"><MapPin size={13} className="mt-0.5 shrink-0" /> {activity.location}</p>
                      <p className="mt-3 text-sm leading-6 text-[#555b62] dark:text-[#c3c9d2]">{activity.description}</p>
                      {activity.estimatedCostPerPerson !== undefined && (
                        <p className="mt-4 text-xs font-extrabold text-[#17191b] dark:text-white">About {formatNaira(activity.estimatedCostPerPerson)} per person</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eceef1] pt-4 dark:border-[#303844]">
                        <button
                          type="button"
                          disabled={savingPlan}
                          onClick={() => setActivityTransfer({ sourceDay: selectedItineraryDay.day, activityIndex: index, mode: 'move' })}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe2e6] px-3 py-2 text-[11px] font-extrabold text-[#555c64] transition hover:border-[#d0a00c] hover:bg-[#fffaf0] disabled:opacity-40 dark:border-[#3a424e] dark:text-[#c8ced7] dark:hover:border-[#6b581c] dark:hover:bg-[#282317]"
                        >
                          <MoveRight size={14} /> Move to day
                        </button>
                        <button
                          type="button"
                          disabled={savingPlan}
                          onClick={() => setActivityTransfer({ sourceDay: selectedItineraryDay.day, activityIndex: index, mode: 'copy' })}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe2e6] px-3 py-2 text-[11px] font-extrabold text-[#555c64] transition hover:border-[#d0a00c] hover:bg-[#fffaf0] disabled:opacity-40 dark:border-[#3a424e] dark:text-[#c8ced7] dark:hover:border-[#6b581c] dark:hover:bg-[#282317]"
                        >
                          <Copy size={14} /> Copy to day
                        </button>
                      </div>
                      </div>
                    </div>
                  </article>
                  );
                })}
                <a
                  href="#activity-recommendations"
                  className="ml-[51px] mt-2 inline-flex items-center gap-2 rounded-xl border border-dashed border-[#d8bd6d] bg-[#fffaf0] px-4 py-3 text-xs font-extrabold text-[#765800] transition hover:border-[#d09b00] hover:bg-[#fff4ce] sm:ml-[68px] dark:border-[#55491f] dark:bg-[#282317] dark:text-[#ffcf3f]"
                >
                  <Plus size={14} /> Add more activities
                </a>
              </div>
            )}
          </section>
        )}

        {activityTransfer && activityBeingTransferred && result?.itinerary && (
          <div
            role="presentation"
            className="fixed inset-0 z-[90] flex items-end justify-center bg-[#090d13]/75 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !savingPlan) setActivityTransfer(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="activity-transfer-title"
              className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-[#e4e7eb] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7 dark:border-[#353e4a] dark:bg-[#1b222c]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#987000] dark:text-[#ffbf00]">Organize your itinerary</p>
                  <h2 id="activity-transfer-title" className="mt-1 text-xl font-black text-[#17191b] dark:text-white">
                    {activityTransfer.mode === 'move' ? 'Move activity' : 'Copy activity'}
                  </h2>
                  <p className="mt-2 text-sm leading-5 text-[#737a82] dark:text-[#b7bec8]">
                    Choose where <span className="font-extrabold text-[#34393f] dark:text-white">{activityBeingTransferred.title}</span> should go.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingPlan}
                  onClick={() => setActivityTransfer(null)}
                  aria-label="Close activity organizer"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#707780] transition hover:bg-[#f1f3f5] disabled:opacity-40 dark:hover:bg-[#29323d]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 rounded-2xl bg-[#f3f4f6] p-1 dark:bg-[#121821]">
                {(['move', 'copy'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={savingPlan}
                    onClick={() => setActivityTransfer((current) => current ? { ...current, mode } : current)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold capitalize transition ${activityTransfer.mode === mode ? 'bg-white text-[#17191b] shadow-sm dark:bg-[#29313c] dark:text-white' : 'text-[#777e87] hover:text-[#34393f] dark:hover:text-white'}`}
                  >
                    {mode === 'move' ? <MoveRight size={15} /> : <Copy size={14} />}{mode}
                  </button>
                ))}
              </div>

              {activityTransfer.mode === 'copy' && (
                <p className="mt-3 rounded-xl bg-[#fff8df] px-3 py-2.5 text-[11px] leading-5 text-[#80651b] dark:bg-[#2d281a] dark:text-[#e7ce81]">
                  The copy will use a flexible time so it does not conflict with the original.
                </p>
              )}

              <div className="mt-5 space-y-2">
                {result.itinerary.days.map((day) => {
                  const isCurrent = day.day === activityTransfer.sourceDay;
                  const hasDuplicate = day.activities.some((item) =>
                    activityBeingTransferred.sourceActivityId
                      ? item.sourceActivityId === activityBeingTransferred.sourceActivityId
                      : item.title === activityBeingTransferred.title && item.location === activityBeingTransferred.location
                  );
                  const disabled = isCurrent || hasDuplicate || day.activities.length >= 20 || savingPlan;
                  return (
                    <button
                      key={day.day}
                      type="button"
                      disabled={disabled}
                      onClick={() => void transferActivityToDay(day.day)}
                      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#e1e4e8] px-4 py-3.5 text-left transition hover:border-[#d5a10a] hover:bg-[#fffaf0] disabled:cursor-not-allowed disabled:opacity-55 dark:border-[#38414d] dark:hover:border-[#6d591b] dark:hover:bg-[#282317]"
                    >
                      <span>
                        <span className="block text-sm font-black text-[#252a30] dark:text-white">Day {day.day}</span>
                        <span className="mt-0.5 block text-[11px] text-[#858b93]">{day.title} · {day.activities.length} {day.activities.length === 1 ? 'stop' : 'stops'}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-[#f2f3f5] px-2.5 py-1 text-[9px] font-extrabold text-[#737980] dark:bg-[#29313c] dark:text-[#c1c7d0]">
                        {isCurrent ? 'Current day' : hasDuplicate ? 'Already added' : day.activities.length >= 20 ? 'Full' : activityTransfer.mode === 'move' ? 'Move here' : 'Copy here'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {result.itinerary.days.length < 14 && (() => {
                const nextDayNumber = Math.max(...result.itinerary.days.map((day) => day.day), 0) + 1;
                return (
                  <button
                    type="button"
                    disabled={savingPlan}
                    onClick={() => void transferActivityToDay(nextDayNumber, true)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d6b34f] bg-[#fffaf0] px-4 py-3.5 text-xs font-extrabold text-[#795b00] transition hover:border-[#c99700] hover:bg-[#fff3c8] disabled:opacity-50 dark:border-[#5c4c20] dark:bg-[#282317] dark:text-[#ffcf3f]"
                  >
                    {savingPlan ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    Create Day {nextDayNumber} and {activityTransfer.mode}
                  </button>
                );
              })()}
            </section>
          </div>
        )}

        {showStayComparison && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="stay-comparison-title"
            className="fixed inset-0 z-[80] flex items-end justify-center bg-[#090b0f]/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowStayComparison(false);
            }}
          >
            <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-t-[30px] border border-[#e4e6e9] bg-[#f7f8fa] shadow-2xl sm:rounded-[30px] dark:border-[#353c47] dark:bg-[#111720]">
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e4e6e9] bg-white/95 px-5 py-5 backdrop-blur sm:px-7 dark:border-[#353c47] dark:bg-[#1c222c]/95">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9b7300] dark:text-[#ffbf00]">Your shortlist</p>
                  <h2 id="stay-comparison-title" className="mt-1 font-display text-xl font-black text-[#17191b] sm:text-2xl dark:text-white">Compare and choose your stay</h2>
                  <p className="mt-1 text-xs text-[#777e87] dark:text-[#b5bcc5]">Your final choice becomes the anchor for nearby activities and the itinerary.</p>
                </div>
                <button type="button" onClick={() => setShowStayComparison(false)} aria-label="Close stay comparison" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e2e4e7] bg-white text-[#686e76] transition hover:bg-[#f0f1f3] dark:border-[#3a424e] dark:bg-[#181d25] dark:text-[#d0d5dc]">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
                {interestedApartments.map((apartment) => {
                  const isChosen = chosenApartment?.id === apartment.id;
                  return (
                    <article key={apartment.id} className={`overflow-hidden rounded-[22px] border bg-white shadow-[0_12px_35px_rgba(31,35,41,0.06)] dark:bg-[#1c222c] ${isChosen ? 'border-[#e2a900] ring-2 ring-[#ffbf00]/25 dark:border-[#ffbf00]' : 'border-[#e2e4e7] dark:border-[#353c47]'}`}>
                      <div className="relative h-44 bg-[#e9ebee] dark:bg-[#141922]">
                        {apartment.image ? (
                          <Image src={apartment.image} alt={apartment.name} fill unoptimized sizes="(max-width: 640px) 100vw, 360px" className="object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-[#9da2aa]"><BedDouble size={30} /></div>
                        )}
                        {isChosen && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#ffbf00] px-3 py-1.5 text-[10px] font-black text-[#17191b] shadow"><Check size={11} strokeWidth={3} /> Primary stay</span>}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="line-clamp-2 text-sm font-black text-[#17191b] dark:text-white">{apartment.name}</h3>
                            <p className="mt-1 flex items-start gap-1 text-[11px] leading-4 text-[#7c828a] dark:text-[#b4bbc5]"><MapPin size={11} className="mt-0.5 shrink-0" /> {apartment.neighborhood || apartment.city}, {apartment.state}</p>
                          </div>
                          <p className="shrink-0 text-right text-xs font-black text-[#17191b] dark:text-white">{formatNaira(apartment.pricePerNight)}<span className="block text-[9px] font-medium text-[#90959c]">per night</span></p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold text-[#646a72] dark:text-[#c1c7d0]">
                          <span className="rounded-full bg-[#f3f4f5] px-2.5 py-1.5 dark:bg-[#252c36]">{apartment.bedrooms} bedroom{apartment.bedrooms === 1 ? '' : 's'}</span>
                          <span className="rounded-full bg-[#f3f4f5] px-2.5 py-1.5 dark:bg-[#252c36]">Up to {apartment.guests} guests</span>
                        </div>
                        {apartment.amenities.length > 0 && <p className="mt-3 line-clamp-2 text-[10px] leading-5 text-[#858b93] dark:text-[#aeb5bf]">{apartment.amenities.slice(0, 4).join(' · ')}</p>}
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Link href={`/apartments/${apartment.id}`} className="flex items-center justify-center rounded-xl border border-[#dfe1e5] px-3 py-2.5 text-[11px] font-extrabold text-[#555b62] transition hover:bg-[#f5f6f7] dark:border-[#3a424e] dark:text-[#c8ced7] dark:hover:bg-[#252c36]">View details</Link>
                          <button type="button" onClick={() => void chooseStay(apartment)} disabled={stayDecisionLoading || isChosen} className="flex items-center justify-center gap-1 rounded-xl bg-[#ffbf00] px-3 py-2.5 text-[11px] font-extrabold text-[#17191b] transition hover:bg-[#eeb200] disabled:cursor-default disabled:bg-[#e8e1ca] disabled:text-[#8a8168] dark:disabled:bg-[#353126]">
                            {stayDecisionLoading ? <Loader2 size={12} className="animate-spin" /> : isChosen ? <Check size={12} /> : null}
                            {isChosen ? 'Chosen' : 'Choose stay'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {planPendingDeletion && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-[#090d13]/75 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingPlan) setPlanPendingDeletion(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-trip-title"
            aria-describedby="delete-trip-description"
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] dark:border-[#343c48] dark:bg-[#1b222c] sm:p-7"
          >
            <button
              type="button"
              onClick={() => setPlanPendingDeletion(null)}
              disabled={deletingPlan}
              aria-label="Close delete confirmation"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-[#777e87] transition hover:bg-[#f1f2f4] hover:text-[#25292d] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[#29313c] dark:hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0f0] text-[#c53434] dark:bg-[#3b2025] dark:text-[#ff7d7d]">
              <Trash2 size={24} />
            </div>
            <h2 id="delete-trip-title" className="mt-5 pr-10 text-xl font-black text-[#17191b] dark:text-white">
              Delete this trip?
            </h2>
            <p id="delete-trip-description" className="mt-2 text-sm leading-6 text-[#6f757d] dark:text-[#b4bbc5]">
              <span className="font-bold text-[#34383d] dark:text-[#eef1f5]">“{planPendingDeletion.title}”</span> and its saved choices will be permanently removed. This cannot be undone.
            </p>

            <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
              <button
                ref={deleteCancelButtonRef}
                type="button"
                onClick={() => setPlanPendingDeletion(null)}
                disabled={deletingPlan}
                className="order-2 rounded-xl border border-[#dfe2e6] px-4 py-3 text-sm font-extrabold text-[#4f555c] transition hover:bg-[#f5f6f7] focus:outline-none focus:ring-2 focus:ring-[#ffbf00]/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3b4552] dark:text-[#d8dde5] dark:hover:bg-[#252d38] sm:order-1"
              >
                Keep trip
              </button>
              <button
                type="button"
                onClick={() => void removePlan()}
                disabled={deletingPlan}
                className="order-1 flex items-center justify-center gap-2 rounded-xl bg-[#c93636] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#aa2929] focus:outline-none focus:ring-2 focus:ring-[#e85c5c]/50 disabled:cursor-wait disabled:opacity-70 sm:order-2"
              >
                {deletingPlan ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deletingPlan ? 'Deleting…' : 'Delete trip'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function PlanningStatus({
  label,
  active = false,
  complete = false,
}: {
  label: string;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${active ? 'bg-white shadow-sm dark:bg-black/20' : ''}`}>
      <span className={`grid h-5 w-5 place-items-center rounded-full ${complete ? 'bg-[#ffbf00] text-[#17191b]' : active ? 'bg-[#fff3c1] text-[#9a7000] dark:bg-[#3c3217] dark:text-[#ffbf00]' : 'border border-[#dbd7ca] text-[#a4a6a8] dark:border-[#4a463b]'}`}>
        {complete ? <Check size={11} strokeWidth={3} /> : active ? <Loader2 size={11} className="animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </span>
      <span className={active || complete ? 'text-[#4c5055] dark:text-[#e0e4e9]' : 'text-[#9a9ea4] dark:text-[#777e87]'}>{label}</span>
    </div>
  );
}

function ActivityArtwork({ type, name, className = 'h-32' }: { type?: string; name: string; className?: string }) {
  const normalized = String(type || '').toLowerCase();
  let Icon = Compass;
  let gradient = 'from-[#1d2732] via-[#314456] to-[#d09b00]';
  let accent = 'bg-[#ffbf00]';

  if (normalized.includes('restaurant') || normalized.includes('food')) {
    Icon = Utensils;
    gradient = 'from-[#3d1d16] via-[#8e3e25] to-[#f2a532]';
    accent = 'bg-[#ffcf4c]';
  } else if (normalized.includes('park') || normalized.includes('natural')) {
    Icon = Trees;
    gradient = 'from-[#12362c] via-[#26705a] to-[#d3ad43]';
    accent = 'bg-[#d9b541]';
  } else if (normalized.includes('shopping') || normalized.includes('store')) {
    Icon = ShoppingBag;
    gradient = 'from-[#271f4a] via-[#674f9f] to-[#d49a39]';
    accent = 'bg-[#ffcf5a]';
  } else if (normalized.includes('night') || normalized.includes('bar')) {
    Icon = Moon;
    gradient = 'from-[#11152f] via-[#34276e] to-[#d08445]';
    accent = 'bg-[#ffbf00]';
  } else if (normalized.includes('beach') || normalized.includes('water')) {
    Icon = Waves;
    gradient = 'from-[#12344c] via-[#1684a6] to-[#e3bd57]';
    accent = 'bg-[#ffce47]';
  } else if (normalized.includes('tourist') || normalized.includes('museum')) {
    Icon = Camera;
    gradient = 'from-[#3b251b] via-[#8b6040] to-[#d8aa57]';
    accent = 'bg-[#ffd36a]';
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}>
      <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[22px] border-white/10" />
      <div className="absolute -bottom-16 left-6 h-32 w-32 rounded-full bg-black/15 blur-xl" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
      <div className="relative flex h-full items-center justify-between px-5">
        <div className={`grid h-14 w-14 place-items-center rounded-[20px] ${accent} text-[#17191b] shadow-lg`}><Icon size={27} /></div>
        <p className="max-w-[58%] text-right text-sm font-black leading-5 text-white drop-shadow-sm">{name}</p>
      </div>
    </div>
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
