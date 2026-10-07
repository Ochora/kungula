export type Lang = 'en' | 'lg' | 'sw';

export type LatLng = { lat: number; lng: number };

export interface Profile {
  name: string;
  phone: string;
  district: string;
  village: string;
  crops: string[]; // crop ids
  animals: string[]; // animal ids
  isChampion: boolean;
  location?: LatLng;
  createdAt: number;
}

export interface Plot {
  id: string;
  name: string;
  crop: string; // crop id
  variety?: string;
  seedSource?: string;
  plantedOn?: string; // yyyy-mm-dd
  expectedHarvest?: string;
  boundary: LatLng[]; // polygon (>=3) or single point
  areaAcres?: number;
  manualAcres?: number;
  notes?: string;
  createdAt: number;
}

export interface Animal {
  id: string;
  kind: string; // animal id
  name: string; // tag / name / batch name
  count: number;
  breed?: string;
  ageMonths?: number;
  value?: number; // UGX
  notes?: string;
  createdAt: number;
}

export interface VaccineRecord {
  id: string;
  animalId: string;
  vaccine: string;
  date: string;
  nextDue?: string;
}

export type ActivityKind =
  | 'planting' | 'weeding' | 'spraying' | 'fertilising' | 'irrigation'
  | 'harvest' | 'sale' | 'labour' | 'transport' | 'inputs' | 'feeding'
  | 'treatment' | 'vaccination' | 'other';

export interface Activity {
  id: string;
  date: string; // yyyy-mm-dd
  kind: ActivityKind;
  plotId?: string;
  animalId?: string;
  description: string;
  cost?: number; // UGX money out
  income?: number; // UGX money in
  quantity?: number;
  unit?: string;
  createdAt: number;
}

export interface Reminder {
  id: string;
  title: string;
  due: string; // ISO datetime
  done: boolean;
  source?: 'scan' | 'vaccine' | 'manual' | 'weather' | 'loan';
  notifId?: number;
}

export interface ScanRecord {
  id: string;
  date: number;
  subject: string; // crop or animal id
  photo?: string; // data URL (compressed)
  symptoms: string[];
  results: { conditionId: string; confidence: number }[];
  aiText?: string; // optional online AI opinion
  followUpDone?: boolean;
  plotId?: string;
}

export interface ChatMsg {
  id: string;
  from: 'me' | 'jjajja';
  text: string;
  at: number;
  links?: { label: string; to: string }[];
  source?: string;
}

export interface Listing {
  id: string;
  crop: string;
  quantityKg: number;
  pricePerKg: number;
  grade: 'A' | 'B' | 'C';
  location: string;
  harvestDate?: string;
  photo?: string;
  status: 'open' | 'offer' | 'sold';
  createdAt: number;
}

export interface CartItem { productId: string; dealerId: string; qty: number }

export interface Order {
  id: string;
  items: { productId: string; dealerId: string; qty: number; price: number }[];
  total: number;
  delivery: 'boda' | 'pickup';
  payment: 'mtn' | 'airtel' | 'cash';
  status: 'placed' | 'confirmed' | 'on-the-way' | 'delivered';
  createdAt: number;
}

export interface LoanApplication {
  id: string;
  productId: string;
  amount: number;
  purpose: string;
  scoreAtApply: number;
  status: 'submitted' | 'under-review' | 'approved' | 'declined';
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  by?: string;
}

export interface LessonProgress { lessonId: string; completedAt?: number; score?: number }

export interface TracePlot {
  id: string;
  farmerName: string;
  farmerPhone?: string;
  coopName?: string;
  plotName: string;
  crop: 'robusta' | 'arabica' | 'cocoa' | 'other';
  boundary: LatLng[];
  areaHa?: number;
  treesCount?: number;
  landTenure: 'owned' | 'customary' | 'leased' | 'family';
  forestBefore2021: 'no' | 'yes' | 'unsure';
  consent: boolean;
  status: 'green' | 'amber' | 'red';
  createdAt: number;
}

export interface Lot {
  id: string;
  code: string;
  crop: string;
  weightKg: number;
  plotIds: string[];
  createdAt: number;
}

export interface CoopMember {
  id: string;
  name: string;
  phone: string;
  village: string;
  acres?: number;
  crops: string;
  createdAt: number;
}

export interface Delivery {
  id: string;
  memberId: string;
  date: string;
  crop: string;
  weightKg: number;
  grade: 'FAQ' | 'A' | 'B' | 'Reject';
  pricePerKg: number;
  paid: boolean;
}

export interface Post {
  id: string;
  group: string;
  author: string;
  text: string;
  photo?: string;
  at: number;
  replies: { author: string; text: string; at: number }[];
  mine?: boolean;
}

export interface Settings {
  lang: Lang;
  voiceReplies: boolean;
  smsCrops: string[];
  consentLenders: boolean;
  consentBuyers: boolean;
  consentResearch: boolean;
  consentDataDonation: boolean;
  aiKey?: string;
  aiModel?: string;
  largeText: boolean;
}

export interface WeatherCache {
  fetchedAt: number;
  location: LatLng;
  place?: string;
  daily: {
    date: string;
    tMax: number;
    tMin: number;
    rain: number; // mm
    rainProb: number; // %
    wind: number; // km/h
    code: number;
  }[];
  current?: { temp: number; humidity: number; code: number; wind: number };
}
