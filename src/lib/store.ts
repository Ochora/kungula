import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Activity, Animal, CartItem, ChatMsg, CoopMember, Delivery, LessonProgress, Listing,
  LoanApplication, Lot, Order, Plot, Post, Profile, Reminder, SavingsGoal, ScanRecord,
  Settings, TracePlot, VaccineRecord, WeatherCache,
} from './types';
import { SEED_POSTS } from '../data/community';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const today = () => new Date().toISOString().slice(0, 10);

type Coll<T> = T[];

interface State {
  profile?: Profile;
  settings: Settings;
  plots: Coll<Plot>;
  animals: Coll<Animal>;
  vaccines: Coll<VaccineRecord>;
  activities: Coll<Activity>;
  reminders: Coll<Reminder>;
  scans: Coll<ScanRecord>;
  chat: Coll<ChatMsg>;
  listings: Coll<Listing>;
  cart: Coll<CartItem>;
  orders: Coll<Order>;
  loans: Coll<LoanApplication>;
  savings: Coll<SavingsGoal>;
  lessons: Coll<LessonProgress>;
  tracePlots: Coll<TracePlot>;
  lots: Coll<Lot>;
  members: Coll<CoopMember>;
  deliveries: Coll<Delivery>;
  posts: Coll<Post>;
  joinedGroups: string[];
  weather?: WeatherCache;

  setProfile: (p: Profile) => void;
  updateProfile: (p: Partial<Profile>) => void;
  setSettings: (s: Partial<Settings>) => void;
  upsert: <K extends CollKey>(key: K, item: ItemOf<K>) => void;
  remove: <K extends CollKey>(key: K, id: string) => void;
  set: (patch: Partial<State>) => void;
  resetAll: () => void;
}

type CollKey =
  | 'plots' | 'animals' | 'vaccines' | 'activities' | 'reminders' | 'scans' | 'chat' | 'listings'
  | 'orders' | 'loans' | 'savings' | 'tracePlots' | 'lots' | 'members' | 'deliveries' | 'posts';
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
};

const empty = {
  profile: undefined,
  settings: defaultSettings,
  plots: [], animals: [], vaccines: [], activities: [], reminders: [], scans: [], chat: [],
  listings: [], cart: [], orders: [], loans: [], savings: [], lessons: [], tracePlots: [],
  lots: [], members: [], deliveries: [], posts: SEED_POSTS, joinedGroups: [], weather: undefined,
};

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
          return { [key]: next } as Partial<State>;
        }),
      remove: (key, id) =>
        set((s) => ({ [key]: (s[key] as { id: string }[]).filter((x) => x.id !== id) }) as Partial<State>),
      set: (patch) => set(patch),
      resetAll: () => set({ ...empty, posts: SEED_POSTS }),
    }),
    {
      name: 'kungula-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Snapshot of everything, for backup/export. */
export function exportData() {
  const s = useStore.getState();
  const { setProfile, updateProfile, setSettings, upsert, remove, set, resetAll, ...data } = s;
  void setProfile; void updateProfile; void setSettings; void upsert; void remove; void set; void resetAll;
  const safe = { ...data, settings: { ...data.settings, aiKey: undefined } };
  return JSON.stringify({ app: 'kungula', version: 1, exportedAt: new Date().toISOString(), data: safe }, null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json);
  if (parsed?.app !== 'kungula' || !parsed.data) throw new Error('Not a Kungula backup file');
  useStore.setState({ ...parsed.data });
}
