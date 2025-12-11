export type TMediaItem = {
  uri?: string;
  url?: string;
  isReelsImage?: boolean;
  [key: string]: any;
} | string;

export type TMedia = {
  images: TMediaItem[];
  videos: TMediaItem[];
};

export type TAccessDetails = {
  wifiCode: string;
  doorCode: string;
  accessCode: string;
};

export type TOptionalFees = {
  partyFee?: number;
  movieShootFee?: number;
  photoShootFee?: number;
};

export type TAgent = {
  firstName: string;
  lastName: string;
  email: string;
  afriId: string;
  role: string;
  phone: number;
  status: string;
  refreshToken: string;
  lastActive: string;
  policy: string;
  paymentMethods: any[];
  createdAt: string;
  updatedAt: string;
  address: string;
  age: number | null;
  city: string;
  id: string;
};

export type TBedroomPricing = {
  bedrooms: number;
  price: number;
  isActive: boolean;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TSeasonalPricing = {
  name: string;
  startDate: string;
  endDate: string;
  additionalFee: number;
  isActive?: boolean;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TApartments = {
  optionalFees?: TOptionalFees;
  accessDetails: TAccessDetails;
  media: TMedia;
  videos?: string[];
  reelsImageIndex?: number;
  _id: string;
  agentId: TAgent | string; 
  apartmentName: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  guests: number;
  amenities: string[];
  address: string;
  city: string;
  state: string;
  defaultStayFee: number;
  cautionFee: number;
  africartzFee: number;
  watchingAgents: string[];
  isBooked: boolean;
  allowedReservations: string[];
  webLink: string;
  bedroomPricing?: TBedroomPricing[];
  seasonalPricing?: TSeasonalPricing[];
  createdAt: string;
  updatedAt: string;
  __v: number;
};

