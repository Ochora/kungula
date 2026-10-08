// Kungula Invest — demonstration farms. Names, phone numbers and figures are
// fictional and clearly marked as demo in the app. Real farms appear only
// after a physical verification visit by Kungula field officers.

export interface Opportunity {
  id: string;
  kind: 'crop' | 'livestock' | 'equipment';
  title: string;
  subject: string; // crop/animal id
  unitLabel: string; // "1 share = inputs for ¼ acre", "1 dairy heifer"
  unitPrice: number; // UGX
  unitsTotal: number;
  unitsTaken: number;
  months: number;
  // projections per unit
  yieldPerUnit?: number; // kg, litres, eggs, kids…
  yieldUnit?: string;
  pricePerYield?: number; // UGX per kg/litre/egg
  investorShare: number; // share of net proceeds going to investor (0–1)
  returnLow: number; // % over the period
  returnMid: number;
  returnHigh: number;
  risks: string[];
  howItWorks: string;
}

export interface Verification {
  status: 'verified' | 'scheduled' | 'unverified';
  visitedOn?: string; // ISO date
  officer?: string;
  checks: { label: string; ok: boolean; note?: string }[];
}

export interface DemoReview { author: string; stars: number; text: string; genuine: boolean; daysAgo: number }
export interface DemoUpdate { daysAgo: number; text: string; kind: 'update' | 'harvest' | 'health' | 'verification'; scene?: string[] }
export interface FarmAnimal { tag: string; kind: string; name: string; baseHr: number; baseTemp: number }

export interface Farm {
  id: string;
  farmer: string;
  gender: 'f' | 'm';
  farmName: string;
  district: string;
  village: string;
  phone: string;
  whatsapp: string;
  email?: string;
  yearsFarming: number;
  acres: number;
  things: string[]; // crops & animals
  bio: string;
  joined: string; // ISO date on Kungula
  recordsKept: number; // records in Kungula Book
  loanScore: number;
  verification: Verification;
  opportunities: Opportunity[];
  yieldHistory: { season: string; subject: string; amount: number; unit: string }[];
  reviews: DemoReview[];
  updates: DemoUpdate[];
  animals?: FarmAnimal[];
  coords: { lat: number; lng: number };
}

const checks = (ok: boolean[], notes: (string | undefined)[] = []) => [
  'National ID sighted and matches name',
  'Land documents checked (title, kibanja or LC1 letter)',
  'Farm boundary walked and measured by GPS',
  'Crops and animals counted on site',
  'LC1 chairperson reference',
  'Mobile money name matches farmer',
  'Photos of farm and farmer taken',
].map((label, i) => ({ label, ok: ok[i] ?? false, note: notes[i] }));

const ALL = [true, true, true, true, true, true, true];

export const FARMS: Farm[] = [
  {
    id: 'f-nakato', farmer: 'Nakato Florence', gender: 'f', farmName: 'Kalungu Hill Coffee', district: 'Kalungu', village: 'Bukulula',
    phone: '+256700300001', whatsapp: '+256700300001', yearsFarming: 14, acres: 6.5, things: ['coffee', 'banana', 'beans'],
    bio: 'Third-generation robusta grower. Replaced 1,200 wilt-damaged trees with resistant clones in 2024 and intercrops matooke for shade and food.',
    joined: '2026-02-11', recordsKept: 214, loanScore: 78, coords: { lat: -0.17, lng: 31.81 },
    verification: { status: 'verified', visitedOn: '2026-08-19', officer: 'Kungula field officer (Masaka region)', checks: checks(ALL, [undefined, 'Kibanja letter + LC1 stamp', '6.48 acres measured']) },
    opportunities: [
      { id: 'o1', kind: 'crop', title: 'Fertiliser & pruning for next robusta harvest', subject: 'coffee', unitLabel: '1 share = inputs and labour for ¼ acre', unitPrice: 300000, unitsTotal: 20, unitsTaken: 13, months: 9, yieldPerUnit: 160, yieldUnit: 'kg FAQ', pricePerYield: 7400, investorShare: 0.35, returnLow: 4, returnMid: 18, returnHigh: 30, risks: ['Coffee prices can fall', 'Drought or heavy rain at flowering', 'Coffee wilt or twig borer'], howItWorks: 'Your money buys fertiliser and pays pruning labour, paid directly to a verified Duka dealer and workers. At harvest the co-operative sells the coffee and 35% of the extra income on your shares comes back to you.' },
    ],
    yieldHistory: [{ season: '2024', subject: 'coffee', amount: 3900, unit: 'kg FAQ' }, { season: '2025', subject: 'coffee', amount: 4700, unit: 'kg FAQ' }, { season: '2026', subject: 'coffee', amount: 5300, unit: 'kg FAQ' }],
    reviews: [
      { author: 'Okello P. (investor)', stars: 5, text: 'Sends photos every two weeks. Paid out on time last season.', genuine: true, daysAgo: 40 },
      { author: 'Kalungu Coffee Co-op', stars: 5, text: 'Delivers clean, well-dried coffee every collection day.', genuine: true, daysAgo: 95 },
      { author: 'Sarah N.', stars: 4, text: 'Very knowledgeable. Visited the farm myself — exactly as described.', genuine: true, daysAgo: 130 },
    ],
    updates: [
      { daysAgo: 3, text: 'Flowering has started on the lower terraces after good rains. Mulched 400 trees this week.', kind: 'update', scene: ['coffee', 'banana'] },
      { daysAgo: 17, text: 'Applied NPK to block B. Scanned for leaf rust — none found.', kind: 'health' },
      { daysAgo: 49, text: 'Kungula officer visit: farm verified, 6.48 acres measured.', kind: 'verification' },
    ],
  },
  {
    id: 'f-mugisha', farmer: 'Mugisha Robert', gender: 'm', farmName: 'Kazo Dairy Ranch', district: 'Kiruhura', village: 'Kazo',
    phone: '+256700300002', whatsapp: '+256700300002', yearsFarming: 19, acres: 42, things: ['cattle', 'goats'],
    bio: 'Runs 38 Friesian-Ankole crosses on paddocked pasture with a borehole and a milk cooler shared with neighbours.',
    joined: '2026-01-20', recordsKept: 388, loanScore: 84, coords: { lat: -0.52, lng: 30.76 },
    verification: { status: 'verified', visitedOn: '2026-07-30', officer: 'Kungula field officer (Ankole region)', checks: checks(ALL, [undefined, 'Freehold title sighted', '42.1 acres measured', '38 cattle, 22 goats counted']) },
    opportunities: [
      { id: 'o1', kind: 'livestock', title: 'Own an in-calf dairy heifer on Kazo Ranch', subject: 'cattle', unitLabel: '1 in-calf Friesian-cross heifer', unitPrice: 3200000, unitsTotal: 10, unitsTaken: 6, months: 24, yieldPerUnit: 4800, yieldUnit: 'litres milk', pricePerYield: 1100, investorShare: 0.4, returnLow: 6, returnMid: 22, returnHigh: 35, risks: ['Animal illness or death (insured)', 'Milk price drop in flush season', 'Drought reducing pasture'], howItWorks: 'You buy a heifer that is ear-tagged in your name and kept on the ranch. 40% of her milk income is paid to you monthly; the first calf is yours. Mortality insurance is included.' },
      { id: 'o2', kind: 'livestock', title: 'Goat breeding unit', subject: 'goats', unitLabel: '5 does + share of a Boer buck', unitPrice: 1750000, unitsTotal: 8, unitsTaken: 2, months: 18, yieldPerUnit: 8, yieldUnit: 'kids', pricePerYield: 260000, investorShare: 0.5, returnLow: 5, returnMid: 19, returnHigh: 32, risks: ['Disease (PPR, worms)', 'Theft'], howItWorks: 'Your does are tagged in your name. Kids are sold at 8 months and proceeds split 50/50 after feed and vet costs.' },
    ],
    yieldHistory: [{ season: '2024', subject: 'cattle', amount: 61000, unit: 'litres' }, { season: '2025', subject: 'cattle', amount: 68500, unit: 'litres' }, { season: '2026 (Jan–Sep)', subject: 'cattle', amount: 55200, unit: 'litres' }],
    reviews: [
      { author: 'Diaspora Investors Club', stars: 5, text: 'Monthly milk statements arrive on time. We visited in July.', genuine: true, daysAgo: 22 },
      { author: 'Dr. Tumusiime (vet)', stars: 5, text: 'Excellent tick control and vaccination records.', genuine: true, daysAgo: 80 },
    ],
    updates: [
      { daysAgo: 2, text: 'Heifer KZ-014 calved — healthy bull calf. Milk up to 14 litres/day.', kind: 'harvest', scene: ['cattle'] },
      { daysAgo: 9, text: 'Tick spraying done for the whole herd. Lumpy skin vaccination booked.', kind: 'health' },
    ],
    animals: [
      { tag: 'KZ-014', kind: 'cattle', name: 'Kyomuhendo', baseHr: 64, baseTemp: 38.6 },
      { tag: 'KZ-021', kind: 'cattle', name: 'Bisi', baseHr: 70, baseTemp: 38.7 },
      { tag: 'KZ-033', kind: 'cattle', name: 'Kaaka', baseHr: 58, baseTemp: 38.5 },
      { tag: 'KZ-G07', kind: 'goats', name: 'Doe batch 7', baseHr: 82, baseTemp: 39.2 },
    ],
  },
  {
    id: 'f-akello', farmer: 'Akello Grace', gender: 'f', farmName: 'Lira Sunrise Grains', district: 'Lira', village: 'Ojwina',
    phone: '+256700300003', whatsapp: '+256700300003', yearsFarming: 9, acres: 12, things: ['soya', 'sesame', 'maize'],
    bio: 'Leads a 40-member women’s group bulking soya and simsim for processors in Lira. Uses hermetic bags and a solar dryer.',
    joined: '2026-03-02', recordsKept: 156, loanScore: 71, coords: { lat: 2.25, lng: 32.9 },
    verification: { status: 'verified', visitedOn: '2026-09-04', officer: 'Kungula field officer (Lango region)', checks: checks(ALL, [undefined, 'Customary land, clan letter + LC1', '12.3 acres measured']) },
    opportunities: [
      { id: 'o1', kind: 'crop', title: 'Second-season soya with certified seed', subject: 'soya', unitLabel: '1 share = 1 acre of soya inputs', unitPrice: 420000, unitsTotal: 12, unitsTaken: 5, months: 5, yieldPerUnit: 650, yieldUnit: 'kg', pricePerYield: 2300, investorShare: 0.4, returnLow: 3, returnMid: 14, returnHigh: 24, risks: ['Dry spell at pod filling', 'Price dip at harvest (mitigated by storage)'], howItWorks: 'Seed, inoculant and fertiliser are delivered by a verified dealer. The group sells to a contracted processor; 40% of the net income on your acres is paid to you.' },
    ],
    yieldHistory: [{ season: '2025A', subject: 'soya', amount: 5200, unit: 'kg' }, { season: '2025B', subject: 'soya', amount: 6100, unit: 'kg' }, { season: '2026A', subject: 'soya', amount: 7300, unit: 'kg' }],
    reviews: [{ author: 'Northern Oilseed Processors (demo)', stars: 4, text: 'Consistent quality, delivers on contract volumes.', genuine: true, daysAgo: 60 }],
    updates: [{ daysAgo: 5, text: 'Planted 12 acres of soya on time with the rains. Germination looks even.', kind: 'update', scene: ['soya', 'maize'] }],
  },
  {
    id: 'f-ssemanda', farmer: 'Ssemanda Isaac', gender: 'm', farmName: 'Mukono Layers', district: 'Mukono', village: 'Seeta',
    phone: '+256700300004', whatsapp: '+256700300004', yearsFarming: 6, acres: 1.5, things: ['poultry'],
    bio: 'Young farmer with 2,400 layers in two deep-litter houses, supplying eggs to shops in Seeta and Mukono town.',
    joined: '2026-04-15', recordsKept: 301, loanScore: 66, coords: { lat: 0.36, lng: 32.75 },
    verification: { status: 'verified', visitedOn: '2026-09-12', officer: 'Kungula field officer (Central region)', checks: checks([true, true, true, true, true, true, true], [undefined, 'Lease agreement sighted (5 years)', undefined, '2,380 birds counted']) },
    opportunities: [
      { id: 'o1', kind: 'livestock', title: 'Layer batch: 500 point-of-lay birds', subject: 'poultry', unitLabel: '1 share = 50 birds + feed to first eggs', unitPrice: 1150000, unitsTotal: 10, unitsTaken: 9, months: 14, yieldPerUnit: 14000, yieldUnit: 'eggs', pricePerYield: 430, investorShare: 0.3, returnLow: 2, returnMid: 16, returnHigh: 28, risks: ['Newcastle or Gumboro outbreak', 'Feed price increases', 'Egg price drop in rainy season'], howItWorks: 'Your share buys 50 birds and their feed until laying. Egg sales are recorded daily in Kungula Book; 30% of net egg income is paid to you monthly.' },
    ],
    yieldHistory: [{ season: '2025', subject: 'poultry', amount: 410000, unit: 'eggs' }, { season: '2026 (Jan–Sep)', subject: 'poultry', amount: 455000, unit: 'eggs' }],
    reviews: [
      { author: 'Kato J.', stars: 4, text: 'Good records. Mortality was higher than expected in March but he explained why.', genuine: true, daysAgo: 70 },
      { author: 'Anonymous', stars: 3, text: 'Slow to reply on WhatsApp sometimes.', genuine: true, daysAgo: 35 },
    ],
    updates: [{ daysAgo: 1, text: 'Laying rate this week: 86%. Newcastle booster given to house B.', kind: 'health', scene: ['poultry'] }],
  },
  {
    id: 'f-kisakye', farmer: 'Kisakye Ruth', gender: 'f', farmName: 'Wakiso Greens', district: 'Wakiso', village: 'Matugga',
    phone: '+256700300005', whatsapp: '+256700300005', yearsFarming: 4, acres: 2, things: ['tomato', 'cabbage', 'onion'],
    bio: 'Grows tomatoes and cabbages under drip irrigation for Kampala supermarkets. Wants a second greenhouse.',
    joined: '2026-06-01', recordsKept: 92, loanScore: 58, coords: { lat: 0.47, lng: 32.53 },
    verification: { status: 'scheduled', visitedOn: '2026-10-15', officer: 'Visit booked', checks: checks([true, false, false, false, true, true, false]) },
    opportunities: [
      { id: 'o1', kind: 'equipment', title: 'Greenhouse + drip kit for tomatoes', subject: 'tomato', unitLabel: '1 share of an 8 m × 30 m greenhouse', unitPrice: 500000, unitsTotal: 30, unitsTaken: 4, months: 12, yieldPerUnit: 600, yieldUnit: 'kg tomatoes', pricePerYield: 2600, investorShare: 0.35, returnLow: 0, returnMid: 20, returnHigh: 38, risks: ['Late blight and bacterial wilt', 'Price swings in Kampala markets', 'New farmer — shorter track record'], howItWorks: 'Opens for investment after the verification visit. Shares buy the greenhouse and drip kit; tomato sales are split for three cropping cycles.' },
    ],
    yieldHistory: [{ season: '2025B', subject: 'tomato', amount: 3800, unit: 'kg' }, { season: '2026A', subject: 'tomato', amount: 5100, unit: 'kg' }],
    reviews: [],
    updates: [{ daysAgo: 6, text: 'Verification visit booked for 15 October.', kind: 'verification', scene: ['tomato', 'cabbage'] }],
  },
  {
    id: 'f-opio', farmer: 'Opio Samuel', gender: 'm', farmName: 'Gulu Matooke & Pigs', district: 'Gulu', village: 'Laroo',
    phone: '+256700300006', whatsapp: '+256700300006', yearsFarming: 11, acres: 5, things: ['banana', 'pigs', 'cassava'],
    bio: 'Mixed farm: improved matooke, NASE cassava and a 12-sow piggery with a biogas digester.',
    joined: '2026-05-09', recordsKept: 67, loanScore: 49, coords: { lat: 2.77, lng: 32.3 },
    verification: { status: 'unverified', checks: checks([false, false, false, false, false, false, false]) },
    opportunities: [
      { id: 'o1', kind: 'livestock', title: 'Expand piggery: 4 sows', subject: 'pigs', unitLabel: '1 sow + feed to first litter', unitPrice: 900000, unitsTotal: 4, unitsTaken: 0, months: 12, yieldPerUnit: 9, yieldUnit: 'piglets', pricePerYield: 150000, investorShare: 0.45, returnLow: -10, returnMid: 15, returnHigh: 30, risks: ['African swine fever has no cure or vaccine', 'Feed costs', 'Not yet verified'], howItWorks: 'Not open: this farm has not had its Kungula verification visit yet.' },
    ],
    yieldHistory: [],
    reviews: [],
    updates: [{ daysAgo: 12, text: 'Joined Kungula and requested a verification visit.', kind: 'verification', scene: ['banana', 'pigs'] }],
  },
];

export const farmById = (id: string) => FARMS.find((f) => f.id === id);

export const daysAgoISO = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

/** Trust score 0–100: verification, reviews saying "genuine", records, track record. */
export function trustScore(f: { verification: Verification; reviews: { stars: number; genuine: boolean }[]; recordsKept: number; yieldHistory: unknown[]; joined: string }) {
  const v = f.verification.status === 'verified' ? 40 : f.verification.status === 'scheduled' ? 10 : 0;
  const checksOk = f.verification.checks.filter((c) => c.ok).length / Math.max(1, f.verification.checks.length);
  const r = f.reviews.length ? f.reviews.reduce((s, x) => s + x.stars, 0) / f.reviews.length : 0;
  const genuine = f.reviews.length ? f.reviews.filter((x) => x.genuine).length / f.reviews.length : 0;
  const rec = Math.min(1, f.recordsKept / 200);
  const hist = Math.min(1, f.yieldHistory.length / 3);
  return Math.round(v + checksOk * 10 + (r / 5) * 15 * Math.min(1, f.reviews.length / 3) + genuine * 10 * Math.min(1, f.reviews.length / 2) + rec * 15 + hist * 10);
}

export function avgStars(reviews: { stars: number }[]) {
  return reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : 0;
}

/** Projection for a number of units: expected output and money back (low/mid/high). */
export function project(o: Opportunity, units: number) {
  const invested = o.unitPrice * units;
  const out = (pct: number) => Math.round(invested * (1 + pct / 100));
  return {
    invested,
    output: o.yieldPerUnit ? o.yieldPerUnit * units : undefined,
    grossValue: o.yieldPerUnit && o.pricePerYield ? o.yieldPerUnit * units * o.pricePerYield : undefined,
    low: out(o.returnLow), mid: out(o.returnMid), high: out(o.returnHigh),
  };
}

/** Demo sensor feed for livestock collars: smooth, believable vitals that change over time. */
export function vitals(a: FarmAnimal, t = Date.now()) {
  const m = t / 60000; // minutes
  const k = a.tag.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const wave = (p: number, amp: number) => Math.sin(m / p + k) * amp;
  const hr = Math.round(a.baseHr + wave(7, 5) + wave(1.3, 2));
  const temp = +(a.baseTemp + wave(45, 0.25) + wave(9, 0.08)).toFixed(1);
  const activity = Math.max(0, Math.min(100, Math.round(55 + wave(30, 30) + wave(4, 8))));
  const rumination = a.kind === 'cattle' ? Math.round(420 + wave(60, 40)) : undefined; // minutes/day
  const normalHr = a.kind === 'cattle' ? [48, 84] : [70, 95];
  const normalT = a.kind === 'cattle' ? [38.0, 39.3] : [38.5, 39.7];
  const ok = hr >= normalHr[0] && hr <= normalHr[1] && temp >= normalT[0] && temp <= normalT[1];
  return { hr, temp, activity, rumination, ok, normalHr, normalT };
}

/** Demo crop greenness index (0–1) over the last weeks, from satellite in future versions. */
export function greenness(farmId: string, weeks = 16, t = Date.now()) {
  const k = farmId.length * 7;
  return Array.from({ length: weeks }, (_, i) => {
    const w = weeks - 1 - i;
    const d = new Date(t - w * 7 * 86400000);
    const season = Math.sin(((d.getMonth() + 1) / 12) * Math.PI * 4 - 1);
    return +(0.55 + 0.18 * season + Math.sin(i + k) * 0.03).toFixed(2);
  });
}
