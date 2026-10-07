import type { Post } from '../lib/types';

export const GROUPS = [
  { id: 'coffee-masaka', name: 'Coffee farmers of Greater Masaka', icon: '☕' },
  { id: 'matooke', name: 'Matooke farmers of Buganda', icon: '🍌' },
  { id: 'dairy-ankole', name: 'Dairy farmers of Ankole', icon: '🐄' },
  { id: 'poultry', name: 'Poultry keepers Uganda', icon: '🐔' },
  { id: 'north-grains', name: 'Soya, simsim & grains — North', icon: '🌾' },
  { id: 'youth', name: 'Young farmers (under 35)', icon: '🚀' },
  { id: 'vegetables', name: 'Vegetable growers — Wakiso & Mukono', icon: '🍅' },
];

const h = 3600 * 1000;
const now = Date.now();

// Example posts so the community screen is not empty on first open.
export const SEED_POSTS: Post[] = [
  {
    id: 'seed1', group: 'coffee-masaka', author: 'Nakato (Kalungu)', at: now - 5 * h,
    text: 'Orange powder under my coffee leaves after these rains. Anyone sprayed copper this season? Which shop in Masaka has it genuine?',
    replies: [{ author: 'Champion Ssali', text: 'That looks like leaf rust. Copper works — check the registration number on the pack. Kungula Duka lists verified dealers.', at: now - 3 * h }],
  },
  {
    id: 'seed2', group: 'poultry', author: 'Okello (Gulu)', at: now - 26 * h,
    text: 'Vaccinated my 300 layers against Newcastle yesterday using eye drops. Tip: keep the vaccine in a cool box and use it within 2 hours of mixing.',
    replies: [],
  },
  {
    id: 'seed3', group: 'north-grains', author: 'Akello (Lira)', at: now - 50 * h,
    text: 'Our group is bulking simsim for the next collection day. We have 3.2 tonnes so far. Who else in Lira wants to join?',
    replies: [{ author: 'Opio', text: 'I have 400 kg, clean and dry. Adding to the list.', at: now - 40 * h }],
  },
  {
    id: 'seed4', group: 'dairy-ankole', author: 'Mugisha (Kiruhura)', at: now - 72 * h,
    text: 'Ticks are heavy this month. I moved to spraying every week. Remember to rotate acaricide classes so ticks don\'t become resistant.',
    replies: [],
  },
];

export const EVENTS = [
  { id: 'e1', title: 'Coffee collection day', where: 'Kalungu co-operative store', when: 'Every 2nd Saturday', kind: 'Collection' },
  { id: 'e2', title: 'Field day: clean coffee seedlings', where: 'NaCORI, Mukono', when: 'Ask your Champion for dates', kind: 'Training' },
  { id: 'e3', title: 'Jinja Agricultural Show', where: 'Jinja', when: 'Annual (usually July)', kind: 'Show' },
  { id: 'e4', title: 'Poultry vaccination drive', where: 'Sub-county HQ', when: 'Quarterly', kind: 'Vet' },
  { id: 'e5', title: 'PDM SACCO members meeting', where: 'Parish chief\'s office', when: 'Monthly', kind: 'Finance' },
];

export const CHAMPIONS = [
  { name: 'Ssali Joseph', parish: 'Kalungu', phone: '+256700200001', crops: 'Coffee, banana' },
  { name: 'Aber Grace', parish: 'Laroo, Gulu', phone: '+256700200002', crops: 'Soya, poultry' },
  { name: 'Tumusiime Ivan', parish: 'Kazo', phone: '+256700200003', crops: 'Dairy' },
];
