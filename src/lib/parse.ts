import type { ActivityKind, Plot } from './types';
import { CROPS } from '../data/catalog';

const NUM_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, fifty: 50, hundred: 100,
  emu: 1, bbiri: 2, ssatu: 3, nnya: 4, ttaano: 5, // Luganda
  moja: 1, mbili: 2, tatu: 3, nne: 4, tano: 5, // Kiswahili
};

const KIND_WORDS: [ActivityKind, RegExp][] = [
  ['sale', /\b(sold|sell|sale|nnatunda|natunda|tunda|nimeuza|uza)\b/],
  ['harvest', /\b(harvest(ed)?|picked|kungula|nkunguddde|nakunguze|vuna|nimevuna)\b/],
  ['weeding', /\b(weed(ed|ing)?|digging|dig|kukoola|nkoola|palilia)\b/],
  ['spraying', /\b(spray(ed|ing)?|fumigat\w*|kufuuyira|nyunyizia)\b/],
  ['fertilising', /\b(fertili[sz]\w*|manure|npk|dap|urea|top.?dress\w*|mbolea|obusa)\b/],
  ['planting', /\b(plant(ed|ing)?|sow(ed|ing)?|kusimba|nsimba|panda)\b/],
  ['irrigation', /\b(irrigat\w*|water(ed|ing)?)\b/],
  ['vaccination', /\b(vaccin\w*|chanjo)\b/],
  ['treatment', /\b(treat(ed|ment)?|inject\w*|dew(or)?m\w*|dosed)\b/],
  ['feeding', /\b(feed|feeds|fed|mash|meal|chakula)\b/],
  ['transport', /\b(transport|boda|lorry|truck|fare|carried)\b/],
  ['inputs', /\b(bought|buy|purchased|seed|seeds|chemical|pesticide|fungicide|nnaguze|nimenunua)\b/],
  ['labour', /\b(paid|workers?|labou?r|casual|abapakasi|wafanyakazi)\b/],
];

function parseAmount(raw: string): number | undefined {
  const m = raw.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(k|m|thousand|million|000)?/i);
  if (!m) return undefined;
  let n = parseFloat(m[1]);
  const suf = (m[2] || '').toLowerCase();
  if (suf === 'k' || suf === 'thousand') n *= 1000;
  if (suf === 'm' || suf === 'million') n *= 1000000;
  return n;
}

export interface ParsedRecord {
  kind: ActivityKind;
  cost?: number;
  income?: number;
  quantity?: number;
  unit?: string;
  plotId?: string;
  crop?: string;
  description: string;
}

/**
 * Turn a spoken or typed sentence into a farm record, e.g.
 * "I paid two workers 10,000 each to weed the north plot"
 * → weeding, cost 20,000, plot "North plot".
 */
export function parseRecord(text: string, plots: Plot[] = []): ParsedRecord {
  const t = ' ' + text.toLowerCase().replace(/[’']/g, "'") + ' ';
  let kind: ActivityKind = 'other';
  // weeding/spraying etc. beat generic "paid"
  for (const [k, re] of KIND_WORDS) { if (re.test(t)) { kind = k; break; } }

  // people count e.g. "two workers" / "3 workers"
  let people = 1;
  const pm = t.match(/\b(\d+|[a-z]+)\s+(workers?|people|men|women|abapakasi|wafanyakazi)\b/);
  if (pm) people = Number(pm[1]) || NUM_WORDS[pm[1]] || 1;

  // money: "10,000", "ugx 20000", "shs 5k", "20k"
  const moneyMatches = [...t.matchAll(/(?:ugx|shs?|shillings?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m|thousand|million)?\b(?!\s*(kg|kgs|kilos?|bags?|bunch|bunches|litres?|l|trays?|crates?|birds|acres?)\b)/g)];
  const amounts = moneyMatches
    .map((m) => parseAmount(m[1] + (m[2] ?? '')))
    .filter((n): n is number => !!n && n >= 500);
  let money = amounts.length ? Math.max(...amounts) : undefined;
  if (money && /\beach\b|\bper (person|worker|head)\b|\bbuli omu\b|\bkila mmoja\b/.test(t)) money *= people;

  // quantity: "200 kg", "15 bags"
  const qm = t.match(/(\d[\d,]*(?:\.\d+)?)\s*(kg|kgs|kilos?|bags?|bunch(?:es)?|litres?|trays?|crates?|tonnes?)\b/);
  const quantity = qm ? parseFloat(qm[1].replace(/,/g, '')) : undefined;
  const unit = qm ? qm[2].replace(/s$/, '').replace('kilo', 'kg').replace('kgs', 'kg').replace(/bunche$/, 'bunch') : undefined;

  // "at 1,100 per kg" → price × quantity
  const per = t.match(/(?:at|@|for)\s*(?:ugx|shs?)?\s*(\d[\d,]*)\s*(?:per|a|each|\/)\s*(kg|bag|bunch|litre|tray|kilo)/);
  if (per && quantity) money = parseFloat(per[1].replace(/,/g, '')) * quantity;

  const crop = CROPS.find((c) => t.includes(c.id) || t.includes(c.lg.toLowerCase()) || t.includes(c.sw.toLowerCase()))?.id;

  // plot: match any plot name word (e.g. "north plot", "hill")
  let plotId: string | undefined;
  for (const p of plots) {
    const words = p.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !['plot', 'field', 'garden'].includes(w));
    if (words.some((w) => t.includes(' ' + w))) { plotId = p.id; break; }
  }

  const isIncome = kind === 'sale';
  return {
    kind,
    cost: !isIncome ? money : undefined,
    income: isIncome ? money : undefined,
    quantity, unit, plotId, crop,
    description: text.trim().replace(/^\w/, (c) => c.toUpperCase()),
  };
}
