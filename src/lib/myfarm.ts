import type { Farm, DemoReview } from '../data/farms';
import type { Profile, Plot, Activity, FarmUpdate } from './types';

/** Build the investor-facing view of the user's own farm from their records. */
export function myFarm(p: Profile, plots: Plot[], activities: Activity[], _updates: FarmUpdate[], score: number): Farm {
  const acres = p.farmAcres ?? (plots.reduce((s, x) => s + (x.areaAcres ?? x.manualAcres ?? 0), 0) || 0);
  const harvests = activities.filter((a) => a.kind === 'harvest' && a.quantity);
  const byYear = new Map<string, { amount: number; unit: string; subject: string }>();
  for (const h of harvests) {
    const y = h.date.slice(0, 4);
    const plot = plots.find((x) => x.id === h.plotId);
    const cur = byYear.get(y) ?? { amount: 0, unit: h.unit ?? 'kg', subject: plot?.crop ?? p.crops[0] ?? 'crop' };
    cur.amount += h.quantity ?? 0; byYear.set(y, cur);
  }
  const v = p.verification ?? 'none';
  return {
    id: 'me', farmer: p.name, gender: 'f', farmName: p.farmName || `${p.name.split(' ')[0]}'s farm`, district: p.district, village: p.village,
    phone: p.phone, whatsapp: p.whatsapp || p.phone, email: p.email, yearsFarming: p.yearsFarming ?? 0, acres,
    things: [...p.crops, ...p.animals], bio: p.bio || 'Add a short story about your farm in your profile.',
    joined: new Date(p.createdAt).toISOString().slice(0, 10), recordsKept: activities.length, loanScore: score,
    coords: p.location ?? { lat: 0.3, lng: 32.6 },
    verification: {
      status: v === 'verified' ? 'verified' : v === 'requested' || v === 'scheduled' ? 'scheduled' : 'unverified',
      checks: [
        { label: 'National ID sighted and matches name', ok: v === 'verified' },
        { label: 'Land documents checked (title, kibanja or LC1 letter)', ok: v === 'verified' },
        { label: 'Farm boundary walked and measured by GPS', ok: plots.some((x) => x.boundary.length >= 3) },
        { label: 'Crops and animals counted on site', ok: v === 'verified' },
        { label: 'LC1 chairperson reference', ok: v === 'verified' },
        { label: 'Mobile money name matches farmer', ok: v === 'verified' },
        { label: 'Photos of farm and farmer taken', ok: !!p.photo },
      ],
    },
    opportunities: p.seekingInvestment && p.investmentNeed ? [{
      id: 'mine', kind: 'crop', title: p.investmentPitch || 'Grow my farm', subject: p.crops[0] ?? p.animals[0] ?? 'maize',
      unitLabel: '1 share', unitPrice: 250000, unitsTotal: Math.max(1, Math.round(p.investmentNeed / 250000)), unitsTaken: 0, months: 12,
      investorShare: 0.35, returnLow: 0, returnMid: 15, returnHigh: 25, risks: ['Weather', 'Pests and disease', 'Prices'],
      howItWorks: 'Opens to investors after your Kungula verification visit.',
    }] : [],
    yieldHistory: [...byYear.entries()].sort().map(([season, x]) => ({ season, subject: x.subject, amount: x.amount, unit: x.unit })),
    reviews: [] as DemoReview[],
    updates: [],
  };
}
