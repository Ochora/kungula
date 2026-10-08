import type { GameState } from './types';

// Kungula Garden: every useful thing a farmer does waters their plant.
// The plant grows through levels; streaks reward coming back each day.

export const LEVELS = [
  { xp: 0, name: 'Seed', icon: '🌰' },
  { xp: 60, name: 'Sprout', icon: '🌱' },
  { xp: 180, name: 'Seedling', icon: '🌿' },
  { xp: 400, name: 'Grower', icon: '🪴' },
  { xp: 800, name: 'Flowering', icon: '🌼' },
  { xp: 1400, name: 'Fruiting', icon: '🍅' },
  { xp: 2200, name: 'Harvester', icon: '🧺' },
  { xp: 3500, name: 'Jjajja', icon: '🌳' },
];

export function levelOf(xp: number) {
  let i = 0;
  while (i < LEVELS.length - 1 && xp >= LEVELS[i + 1].xp) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  const pct = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { index: i, ...cur, next, pct, toNext: next ? next.xp - xp : 0 };
}

/** XP for adding a new item to a collection. */
export const XP_FOR: Record<string, { xp: number; label: string }> = {
  activities: { xp: 10, label: 'Record saved' },
  plots: { xp: 25, label: 'Plot added' },
  animals: { xp: 20, label: 'Animals added' },
  vaccines: { xp: 15, label: 'Vaccination recorded' },
  scans: { xp: 15, label: 'Farm checked' },
  listings: { xp: 15, label: 'Produce listed' },
  posts: { xp: 10, label: 'Shared with the community' },
  tracePlots: { xp: 30, label: 'Plot registered' },
  deliveries: { xp: 5, label: 'Delivery recorded' },
  members: { xp: 10, label: 'Member added' },
  reviews: { xp: 10, label: 'Review posted' },
  updates: { xp: 15, label: 'Farm update posted' },
  investments: { xp: 25, label: 'Investment made' },
  savings: { xp: 10, label: 'Savings goal set' },
  lessons: { xp: 40, label: 'Lesson completed' },
  reminders: { xp: 3, label: 'Reminder set' },
};

export const BADGES: Record<string, { name: string; icon: string; how: string }> = {
  first_record: { name: 'First record', icon: '📒', how: 'Save your first farm record' },
  mapper: { name: 'Land mapper', icon: '🗺️', how: 'Add a plot' },
  doctor: { name: 'Plant doctor', icon: '🩺', how: 'Check your farm with Scan' },
  scholar: { name: 'Scholar', icon: '🎓', how: 'Complete 3 lessons' },
  streak7: { name: 'Week strong', icon: '🔥', how: 'Use Kungula 7 days in a row' },
  record25: { name: 'Bookkeeper', icon: '🧾', how: 'Save 25 records' },
  seller: { name: 'Market ready', icon: '🧺', how: 'List produce for sale' },
  neighbour: { name: 'Good neighbour', icon: '🤝', how: 'Post or review in the community' },
  investor: { name: 'Backer', icon: '💚', how: 'Back a verified farm' },
  verified: { name: 'Verified farmer', icon: '✅', how: 'Pass the Kungula farm visit' },
};

export const emptyGame = (): GameState => ({ xp: 0, streak: 0, badges: [], waterings: 0 });

const dayStr = (d = new Date()) => d.toISOString().slice(0, 10);

/** Update streak for a visit/activity today. Returns new state and bonus xp. */
export function touchStreak(g: GameState, now = new Date()): { g: GameState; bonus: number } {
  const today = dayStr(now);
  if (g.lastDay === today) return { g, bonus: 0 };
  const yesterday = dayStr(new Date(now.getTime() - 86400000));
  const streak = g.lastDay === yesterday ? g.streak + 1 : 1;
  const bonus = streak > 1 ? Math.min(20, streak * 2) : 5;
  return { g: { ...g, streak, lastDay: today }, bonus };
}

export function badgesEarned(counts: Record<string, number>, g: GameState): string[] {
  const out: string[] = [];
  if ((counts.activities ?? 0) >= 1) out.push('first_record');
  if ((counts.plots ?? 0) >= 1 || (counts.tracePlots ?? 0) >= 1) out.push('mapper');
  if ((counts.scans ?? 0) >= 1) out.push('doctor');
  if ((counts.lessons ?? 0) >= 3) out.push('scholar');
  if (g.streak >= 7) out.push('streak7');
  if ((counts.activities ?? 0) >= 25) out.push('record25');
  if ((counts.listings ?? 0) >= 1) out.push('seller');
  if ((counts.posts ?? 0) + (counts.reviews ?? 0) >= 1) out.push('neighbour');
  if ((counts.investments ?? 0) >= 1) out.push('investor');
  return out.filter((b) => !g.badges.includes(b));
}
