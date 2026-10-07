// Kungula Duka demonstration catalogue. Dealer names are fictional and
// registration numbers are placeholders ("DEMO-…") until real verified
// dealers are onboarded. Ordering, delivery and payment are simulated.

export interface Dealer { id: string; name: string; district: string; verified: boolean; rating: number; phone: string; distanceKm: number }
export interface Product {
  id: string; name: string; category: 'seed' | 'fungicide' | 'insecticide' | 'fertiliser' | 'vet' | 'feed' | 'tool';
  active?: string; // matches Treatment.product
  pack: string; regNo: string; icon: string;
  prices: Record<string, number>; // dealerId -> UGX
}

export const DEALERS: Dealer[] = [
  { id: 'd1', name: 'Kiganjo Agro-Vet (demo)', district: 'Masaka', verified: true, rating: 4.6, phone: '+256700100001', distanceKm: 2.4 },
  { id: 'd2', name: 'Bweyogerere Farm Inputs (demo)', district: 'Wakiso', verified: true, rating: 4.3, phone: '+256700100002', distanceKm: 6.1 },
  { id: 'd3', name: 'Gulu Farmers Shop (demo)', district: 'Gulu', verified: true, rating: 4.5, phone: '+256700100003', distanceKm: 3.8 },
  { id: 'd4', name: 'Mbarara Vet Centre (demo)', district: 'Mbarara', verified: true, rating: 4.7, phone: '+256700100004', distanceKm: 4.2 },
];

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Mancozeb 80% WP fungicide', category: 'fungicide', active: 'mancozeb', pack: '1 kg', regNo: 'DEMO-AC-0101', icon: '🧪', prices: { d1: 22000, d2: 21000, d3: 23500 } },
  { id: 'p2', name: 'Metalaxyl + Mancozeb fungicide', category: 'fungicide', active: 'metalaxyl', pack: '1 kg', regNo: 'DEMO-AC-0102', icon: '🧪', prices: { d1: 38000, d2: 36500 } },
  { id: 'p3', name: 'Copper oxychloride 50% WP', category: 'fungicide', active: 'copper', pack: '1 kg', regNo: 'DEMO-AC-0103', icon: '🧪', prices: { d1: 26000, d2: 25000, d3: 27000 } },
  { id: 'p4', name: 'Emamectin benzoate 5% (fall armyworm)', category: 'insecticide', active: 'emamectin', pack: '100 g', regNo: 'DEMO-AC-0201', icon: '🐛', prices: { d1: 15000, d2: 14000, d3: 15500 } },
  { id: 'p5', name: 'Broad-spectrum insecticide', category: 'insecticide', active: 'insecticide', pack: '500 ml', regNo: 'DEMO-AC-0202', icon: '🐛', prices: { d2: 18000, d3: 19000 } },
  { id: 'p6', name: 'NPK 17:17:17 fertiliser', category: 'fertiliser', active: 'fertiliser', pack: '50 kg bag', regNo: 'DEMO-FT-0301', icon: '🌱', prices: { d1: 165000, d2: 160000, d3: 170000 } },
  { id: 'p7', name: 'DAP planting fertiliser', category: 'fertiliser', active: 'fertiliser', pack: '50 kg bag', regNo: 'DEMO-FT-0302', icon: '🌱', prices: { d1: 175000, d2: 172000 } },
  { id: 'p8', name: 'Calcium nitrate foliar feed', category: 'fertiliser', active: 'calcium', pack: '1 kg', regNo: 'DEMO-FT-0303', icon: '🌱', prices: { d2: 9000 } },
  { id: 'p9', name: 'Certified hybrid maize seed', category: 'seed', pack: '2 kg', regNo: 'DEMO-SD-0401', icon: '🌽', prices: { d1: 24000, d2: 23000, d3: 24500 } },
  { id: 'p10', name: 'Certified bean seed (NABE series)', category: 'seed', pack: '2 kg', regNo: 'DEMO-SD-0402', icon: '🫘', prices: { d1: 16000, d3: 15000 } },
  { id: 'p11', name: 'Clean coffee seedlings (wilt-resistant robusta)', category: 'seed', pack: '10 seedlings', regNo: 'DEMO-SD-0403', icon: '☕', prices: { d1: 10000 } },
  { id: 'p12', name: 'Newcastle vaccine (I-2 / LaSota)', category: 'vet', active: 'newcastle-vaccine', pack: '100 doses', regNo: 'DEMO-VD-0501', icon: '💉', prices: { d1: 9000, d3: 9500, d4: 8500 } },
  { id: 'p13', name: 'Amprolium soluble powder (coccidiosis)', category: 'vet', active: 'amprolium', pack: '100 g', regNo: 'DEMO-VD-0502', icon: '💊', prices: { d1: 12000, d4: 11000 } },
  { id: 'p14', name: 'Acaricide (tick spray)', category: 'vet', active: 'acaricide', pack: '1 litre', regNo: 'DEMO-VD-0503', icon: '🐄', prices: { d4: 45000, d3: 47000 } },
  { id: 'p15', name: 'Goat & cattle dewormer', category: 'vet', active: 'dewormer', pack: '1 litre', regNo: 'DEMO-VD-0504', icon: '💊', prices: { d4: 38000, d1: 40000 } },
  { id: 'p16', name: 'Layers mash', category: 'feed', pack: '70 kg bag', regNo: 'DEMO-FD-0601', icon: '🐔', prices: { d1: 115000, d2: 112000, d3: 118000 } },
  { id: 'p17', name: 'Dairy meal', category: 'feed', pack: '70 kg bag', regNo: 'DEMO-FD-0602', icon: '🐄', prices: { d4: 95000, d2: 98000 } },
  { id: 'p18', name: 'Knapsack sprayer 16 L', category: 'tool', pack: '1 unit', regNo: 'n/a', icon: '🧰', prices: { d1: 95000, d2: 90000, d3: 98000 } },
  { id: 'p19', name: 'Hermetic storage bags (PICS)', category: 'tool', pack: '5 bags', regNo: 'n/a', icon: '🛍️', prices: { d1: 25000, d2: 24000, d3: 26000 } },
  { id: 'p20', name: 'Protective gloves + mask set', category: 'tool', pack: '1 set', regNo: 'n/a', icon: '🧤', prices: { d1: 18000, d2: 17000, d3: 19000 } },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
export const dealerById = (id: string) => DEALERS.find((d) => d.id === id);
export const productsFor = (active?: string) => (active ? PRODUCTS.filter((p) => p.active === active) : []);
export const cheapest = (p: Product) => {
  const [dealerId, price] = Object.entries(p.prices).sort((a, b) => a[1] - b[1])[0];
  return { dealerId, price };
};

export interface FinanceProduct {
  id: string; name: string; partnerType: string; minScore: number; maxAmount: number;
  monthlyRatePct: number; termMonths: number; how: string; kind: 'loan' | 'insurance' | 'savings';
}

// Illustrative partner products. All are delivered by licensed partners;
// Kungula never lends or holds money itself.
export const FINANCE_PRODUCTS: FinanceProduct[] = [
  { id: 'f1', name: 'Seasonal input loan', partnerType: 'SACCO / PDM SACCO', minScore: 45, maxAmount: 1500000, monthlyRatePct: 1.5, termMonths: 6, how: 'Inputs paid straight to a verified Duka dealer; repay after harvest.', kind: 'loan' },
  { id: 'f2', name: 'Instant small loan', partnerType: 'Licensed digital lender', minScore: 30, maxAmount: 300000, monthlyRatePct: 4, termMonths: 1, how: 'Paid to your mobile money; repay in 30 days.', kind: 'loan' },
  { id: 'f3', name: 'Buyer-backed advance', partnerType: 'Exporter / processor', minScore: 55, maxAmount: 3000000, monthlyRatePct: 1.2, termMonths: 4, how: 'Advance against a confirmed purchase order; deducted at delivery.', kind: 'loan' },
  { id: 'f4', name: 'Warehouse receipt loan', partnerType: 'Bank + licensed warehouse', minScore: 50, maxAmount: 5000000, monthlyRatePct: 1.4, termMonths: 6, how: 'Store graded grain; borrow up to 60% of its value; sell when prices rise.', kind: 'loan' },
  { id: 'f5', name: 'Weather-index crop insurance', partnerType: 'Licensed insurer (UAIS)', minScore: 20, maxAmount: 0, monthlyRatePct: 0, termMonths: 6, how: 'Pays out automatically if rainfall is too low for your area. Premium partly subsidised under UAIS.', kind: 'insurance' },
  { id: 'f6', name: 'Livestock mortality cover', partnerType: 'Licensed insurer', minScore: 25, maxAmount: 0, monthlyRatePct: 0, termMonths: 12, how: 'Covers death of insured animals from disease or accident; vet certificate needed.', kind: 'insurance' },
];
