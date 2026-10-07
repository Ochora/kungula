// Market data for the first version. These are SAMPLE prices built from
// typical seasonal patterns so the screens, charts and advice can be tested.
// They are labelled as samples in the app until the live price feed
// (Champions + market reporters) is connected.

export const MARKETS = [
  { id: 'owino', name: 'Owino (St. Balikuddembe)', town: 'Kampala', factor: 1.12 },
  { id: 'nakasero', name: 'Nakasero', town: 'Kampala', factor: 1.18 },
  { id: 'kalerwe', name: 'Kalerwe', town: 'Kampala', factor: 1.1 },
  { id: 'masaka', name: 'Masaka central', town: 'Masaka', factor: 1.0 },
  { id: 'mbarara', name: 'Mbarara central', town: 'Mbarara', factor: 1.02 },
  { id: 'gulu', name: 'Gulu main', town: 'Gulu', factor: 0.95 },
  { id: 'lira', name: 'Lira main', town: 'Lira', factor: 0.94 },
  { id: 'mbale', name: 'Mbale central', town: 'Mbale', factor: 0.98 },
  { id: 'arua', name: 'Arua main', town: 'Arua', factor: 0.97 },
];

interface PriceModel { base: number; amp: number; peakMonth: number; bimodal: boolean; unit: string }

// base = average UGX per unit at a farm-gate-ish regional market
const MODELS: Record<string, PriceModel> = {
  coffee: { base: 7600, amp: 0.1, peakMonth: 2, bimodal: false, unit: 'kg (FAQ)' },
  maize: { base: 1050, amp: 0.25, peakMonth: 4, bimodal: true, unit: 'kg' },
  beans: { base: 3600, amp: 0.18, peakMonth: 4, bimodal: true, unit: 'kg' },
  banana: { base: 22000, amp: 0.2, peakMonth: 2, bimodal: false, unit: 'bunch' },
  cassava: { base: 1300, amp: 0.15, peakMonth: 3, bimodal: false, unit: 'kg (dry chips)' },
  tomato: { base: 2800, amp: 0.35, peakMonth: 3, bimodal: true, unit: 'kg' },
  soya: { base: 2300, amp: 0.15, peakMonth: 5, bimodal: false, unit: 'kg' },
  sesame: { base: 6200, amp: 0.12, peakMonth: 6, bimodal: false, unit: 'kg' },
  groundnuts: { base: 5200, amp: 0.15, peakMonth: 4, bimodal: true, unit: 'kg' },
  rice: { base: 4300, amp: 0.1, peakMonth: 5, bimodal: false, unit: 'kg' },
  cabbage: { base: 1500, amp: 0.3, peakMonth: 3, bimodal: true, unit: 'head' },
  onion: { base: 3800, amp: 0.25, peakMonth: 5, bimodal: false, unit: 'kg' },
  milk: { base: 1300, amp: 0.15, peakMonth: 2, bimodal: true, unit: 'litre' },
  eggs: { base: 13000, amp: 0.1, peakMonth: 12, bimodal: false, unit: 'tray' },
};

export const PRICED = Object.keys(MODELS);
export const priceUnit = (crop: string) => MODELS[crop]?.unit ?? 'kg';

// small deterministic noise so charts look real but stay stable
function noise(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}
function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

/** Price for crop in a market for a given date (sample model). */
export function priceOn(crop: string, marketId: string, d: Date): number | undefined {
  const m = MODELS[crop];
  if (!m) return undefined;
  const mk = MARKETS.find((x) => x.id === marketId) ?? MARKETS[0];
  const month = d.getMonth() + 1 + d.getDate() / 31;
  const period = m.bimodal ? 6 : 12;
  const season = Math.cos((2 * Math.PI * (month - m.peakMonth)) / period);
  const dayIndex = Math.floor(d.getTime() / 86400000);
  const n = noise(dayIndex / 7 + hash(crop + marketId)) * 0.05 + noise(d.getFullYear() + hash(crop)) * 0.06;
  const p = m.base * mk.factor * (1 + m.amp * season + n);
  const step = p > 10000 ? 500 : p > 2000 ? 50 : 10;
  return Math.round(p / step) * step;
}

export function priceSeries(crop: string, marketId: string, weeks = 52, end = new Date()) {
  const out: { date: Date; price: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 7 * 86400000);
    const p = priceOn(crop, marketId, d);
    if (p) out.push({ date: d, price: p });
  }
  return out;
}

/** Plain-language advice from the seasonal pattern over the last five years. */
export function priceAdvice(crop: string, marketId: string, now = new Date()) {
  const m = MODELS[crop];
  if (!m) return undefined;
  const todayP = priceOn(crop, marketId, now)!;
  // best month within the next 4 months, averaged over 5 past years
  let best = { month: now.getMonth(), gain: 0, years: 0 };
  for (let ahead = 1; ahead <= 4; ahead++) {
    let ups = 0; let sum = 0;
    for (let y = 1; y <= 5; y++) {
      const base = new Date(now.getFullYear() - y, now.getMonth(), 15);
      const fut = new Date(now.getFullYear() - y, now.getMonth() + ahead, 15);
      const a = priceOn(crop, marketId, base)!; const b = priceOn(crop, marketId, fut)!;
      const g = (b - a) / a; sum += g; if (g > 0.05) ups++;
    }
    const avg = sum / 5;
    if (avg > best.gain) best = { month: (now.getMonth() + ahead) % 12, gain: avg, years: ups };
  }
  const monthName = new Date(2000, best.month, 1).toLocaleString('en', { month: 'long' });
  if (best.gain >= 0.08) {
    const lo = Math.round(best.gain * 100 * 0.7); const hi = Math.round(best.gain * 100 * 1.2);
    return {
      action: 'store' as const,
      text: `Prices have risen about ${lo}–${hi}% by ${monthName} in ${best.years} of the last 5 years. If you can dry and store well, consider waiting.`,
      today: todayP,
    };
  }
  return { action: 'sell' as const, text: 'Prices are near their usual high for the season. Selling now is reasonable.', today: todayP };
}

export interface Buyer { id: string; name: string; type: 'trader' | 'processor' | 'supermarket' | 'exporter' | 'institution'; crops: string[]; location: string; minKg: number; note: string; phone: string }

// Demonstration buyers (fictional names) — replaced by the verified registry.
export const BUYERS: Buyer[] = [
  { id: 'b1', name: 'Kyotera Produce Traders (demo)', type: 'trader', crops: ['maize', 'beans', 'coffee'], location: 'Kyotera', minKg: 100, note: 'Pays cash on collection', phone: '+256700000001' },
  { id: 'b2', name: 'Lake Region Grain Millers (demo)', type: 'processor', crops: ['maize', 'soya', 'sesame'], location: 'Jinja', minKg: 5000, note: 'Moisture ≤13.5%; pays mobile money within 3 days', phone: '+256700000002' },
  { id: 'b3', name: 'Fresh Basket Supermarkets (demo)', type: 'supermarket', crops: ['tomato', 'cabbage', 'onion', 'banana'], location: 'Kampala', minKg: 300, note: 'Weekly supply, graded and crated', phone: '+256700000003' },
  { id: 'b4', name: 'Pearl Origin Coffee Exporters (demo)', type: 'exporter', crops: ['coffee'], location: 'Kampala', minKg: 10000, note: 'EUDR-mapped plots required; premium for traceable lots', phone: '+256700000004' },
  { id: 'b5', name: 'Northern Oilseed Processors (demo)', type: 'processor', crops: ['sesame', 'soya', 'groundnuts'], location: 'Lira', minKg: 2000, note: 'Buys through co-operatives', phone: '+256700000005' },
  { id: 'b6', name: 'School Feeding Programme (demo)', type: 'institution', crops: ['maize', 'beans'], location: 'Gulu', minKg: 10000, note: 'Tender each term; quality certificate needed', phone: '+256700000006' },
];
