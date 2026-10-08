import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Activity, Animal, CartItem, ChatMsg, CoopMember, Delivery, FarmUpdate, GameState, Investment,
  LessonProgress, Listing, LoanApplication, Lot, Order, Plot, Post, Profile, Reminder, Review,
  RewardEvent, SavingsGoal, ScanRecord, Settings, TracePlot, VaccineRecord, WeatherCache,
} from './types';
import { SEED_POSTS } from '../data/community';
import { XP_FOR, BADGES, badgesEarned, emptyGame, levelOf, touchStreak } from './game';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const today = () => new Date().toISOString().slice(0, 10);

interface State {
  profile?: Profile;
  settings: Settings;
  plots: Plot[];
  animals: Animal[];
  vaccines: VaccineRecord[];
  activities: Activity[];
  reminders: Reminder[];
  scans: ScanRecord[];
  chat: ChatMsg[];
  listings: Listing[];
  cart: CartItem[];
  orders: Order[];
  loans: LoanApplication[];
  savings: SavingsGoal[];
  lessons: LessonProgress[];
  tracePlots: TracePlot[];
  lots: Lot[];
  members: CoopMember[];
  deliveries: Delivery[];
  posts: Post[];
  joinedGroups: string[];
  weather?: WeatherCache;
  // v2
  game: GameState;
  lastReward?: RewardEvent;
  investments: Investment[];
  reviews: Review[];
  updates: FarmUpdate[];
  follows: string[];

  setProfile: (p: Profile) => void;
  updateProfile: (p: Partial<Profile>) => void;
  setSettings: (s: Partial<Settings>) => void;
  upsert: <K extends CollKey>(key: K, item: ItemOf<K>) => void;
  remove: <K extends CollKey>(key: K, id: string) => void;
  set: (patch: Partial<State>) => void;
  reward: (key: string, label?: string) => void;
  dailyVisit: () => void;
  resetAll: () => void;
}

type CollKey =
  | 'plots' | 'animals' | 'vaccines' | 'activities' | 'reminders' | 'scans' | 'chat' | 'listings'
  | 'orders' | 'loans' | 'savings' | 'tracePlots' | 'lots' | 'members' | 'deliveries' | 'posts'
  | 'investments' | 'reviews' | 'updates';
type ItemOf<K extends CollKey> = State[K] extends (infer U)[] ? U : never;

const defaultSettings: Settings = {
  lang: 'en',
  voiceReplies: false,
  smsCrops: [],
  consentLenders: false,
  consentBuyers: false,
  consentResearch: false,
  consentDataDonation: false,
  largeText: false,
  theme: 'system',
  gamify: true,
  intro: true,
};

const empty = {
  profile: undefined,
  settings: defaultSettings,
  plots: [], animals: [], vaccines: [], activities: [], reminders: [], scans: [], chat: [],
  listings: [], cart: [], orders: [], loans: [], savings: [], lessons: [], tracePlots: [],
  lots: [], members: [], deliveries: [], posts: SEED_POSTS, joinedGroups: [], weather: undefined,
  game: emptyGame(), lastReward: undefined, investments: [], reviews: [], updates: [], follows: [],
};

/** Apply XP + streak + new badges; returns the partial state to merge. */
function grant(s: State, key: string, label?: string): Partial<State> {
  const rule = XP_FOR[key];
  if (!rule) return {};
  const before = levelOf(s.game.xp);
  const st = touchStreak(s.game);
  let g: GameState = { ...st.g, xp: st.g.xp + rule.xp + st.bonus, waterings: st.g.waterings + 1 };
  const counts: Record<string, number> = {
    activities: s.activities.length, plots: s.plots.length, tracePlots: s.tracePlots.length, scans: s.scans.length,
    lessons: s.lessons.filter((l) => l.completedAt).length, listings: s.listings.length,
    posts: s.posts.filter((p) => p.mine).length, reviews: s.reviews.filter((r) => r.mine).length, investments: s.investments.length,
  };
  const newBadges = badgesEarned(counts, g);
  if (newBadges.length) g = { ...g, badges: [...g.badges, ...newBadges], xp: g.xp + 20 * newBadges.length };
  const after = levelOf(g.xp);
  let ev: RewardEvent = { id: uid(), xp: g.xp - s.game.xp, label: label ?? rule.label, kind: 'water', at: Date.now() };
  if (after.index > before.index) ev = { ...ev, kind: 'level', label: `Your plant grew: ${after.name}!` };
  else if (newBadges.length) ev = { ...ev, kind: 'badge', badge: newBadges[0], label: `Badge: ${BADGES[newBadges[0]].name}` };
  return { game: g, lastReward: ev };
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      ...empty,
      setProfile: (p) => set({ profile: p }),
      updateProfile: (p) => set((s) => (s.profile ? { profile: { ...s.profile, ...p } } : {})),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      upsert: (key, item) =>
        set((s) => {
          const list = s[key] as { id: string }[];
          const it = item as unknown as { id: string };
          const i = list.findIndex((x) => x.id === it.id);
          const next = i >= 0 ? list.map((x) => (x.id === it.id ? it : x)) : [it, ...list];
          const patch = { [key]: next } as Partial<State>;
          // New entries water the plant (not chat or system collections)
          if (i < 0 && key !== 'chat' && key !== 'orders' && key !== 'lots' && key !== 'loans') {
            return { ...patch, ...grant({ ...s, ...patch } as State, key) };
          }
          return patch;
        }),
      remove: (key, id) =>
        set((s) => ({ [key]: (s[key] as { id: string }[]).filter((x) => x.id !== id) }) as Partial<State>),
      set: (patch) => set(patch),
      reward: (key, label) => set((s) => grant(s, key, label)),
      dailyVisit: () => set((s) => {
        const st = touchStreak(s.game);
        if (!st.bonus) return {};
        const g = { ...st.g, xp: st.g.xp + st.bonus };
        return { game: g, lastReward: st.g.streak > 1 ? { id: uid(), xp: st.bonus, label: `${st.g.streak}-day streak`, kind: 'grow', at: Date.now() } : undefined };
      }),
      resetAll: () => set({ ...empty, posts: SEED_POSTS, game: emptyGame() }),
    }),
    {
      name: 'kungula-v1',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<State>;
        if (version < 2) {
          return {
            ...s,
            settings: { ...defaultSettings, ...(s.settings ?? {}) },
            game: s.game ?? emptyGame(), investments: s.investments ?? [], reviews: s.reviews ?? [],
            updates: s.updates ?? [], follows: s.follows ?? [],
            profile: s.profile ? { ...s.profile, roles: s.profile.roles ?? ['farmer'] } : undefined,
          } as State;
        }
        return s as State;
      },
      partialize: (s) => {
        // the reward event is transient — don't replay it on next launch
        const { lastReward, ...rest } = s;
        void lastReward;
        return rest as State;
      },
    },
  ),
);

export const rolesOf = (p?: Profile) => p?.roles?.length ? p.roles : ['farmer' as const];
export const isFarmer = (p?: Profile) => rolesOf(p).includes('farmer');
export const isInvestor = (p?: Profile) => rolesOf(p).includes('investor');

/** Snapshot of everything, for backup/export. */
export function exportData() {
  const s = useStore.getState();
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s)) if (typeof v !== 'function' && k !== 'lastReward') data[k] = v;
  const safe = { ...data, settings: { ...s.settings, aiKey: undefined } };
  return JSON.stringify({ app: 'kungula', version: 2, exportedAt: new Date().toISOString(), data: safe }, null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json);
  if (parsed?.app !== 'kungula' || !parsed.data) throw new Error('This is not a Kungula backup file.');
  useStore.setState({ ...empty, ...parsed.data, settings: { ...defaultSettings, ...parsed.data.settings } });
}
