// Jjajja — Kungula's advisor. Works fully offline from the Kungula knowledge
// library, the Scan conditions and the farmer's own records. If an online AI
// key is configured in Settings, harder questions are sent to a large language
// model grounded with the same library; offline answers remain the fallback.
import { ARTICLES } from '../data/knowledge';
import { CONDITIONS, SYMPTOMS, URGENCY_LABEL, conditionById } from '../data/conditions';
import { CROPS, ANIMALS, subjectName } from '../data/catalog';
import { priceAdvice, priceOn, priceUnit, MARKETS, PRICED } from '../data/market';
import { rankConditions } from './diagnose';
import type { Profile, WeatherCache } from './types';
import { ugx } from './util';
import { farmAlerts } from './weather';

export interface JjajjaContext {
  profile?: Profile;
  weather?: WeatherCache;
  score?: number;
  // conversation memory for follow-up questions
  pendingSubject?: string;
  pendingSigns?: string[];
}

export interface JjajjaReply {
  text: string;
  source: string;
  chips?: { label: string; value: string }[]; // quick replies
  links?: { label: string; to: string }[];
  next?: Partial<JjajjaContext>;
  escalate?: boolean;
}

const SUBJECT_WORDS: Record<string, string[]> = {
  coffee: ['coffee', 'kawa', 'emmwanyi', 'mmwanyi', 'kahawa', 'robusta', 'arabica'],
  banana: ['banana', 'bananas', 'matooke', 'gonja', 'ndizi', 'kitooke', 'bitooke', 'migomba', 'mugomba'],
  maize: ['maize', 'corn', 'kasooli', 'mahindi'],
  beans: ['beans', 'bean', 'ebijanjaalo', 'bijanjaalo', 'maharagwe'],
  cassava: ['cassava', 'muwogo', 'muhogo', 'mogo'],
  tomato: ['tomato', 'tomatoes', 'nnyaanya', 'nyanya'],
  poultry: ['chicken', 'chickens', 'hen', 'hens', 'poultry', 'birds', 'layers', 'broilers', 'chicks', 'enkoko', 'nkoko', 'kuku', 'gweno', 'koko'],
  cattle: ['cow', 'cows', 'cattle', 'calf', 'calves', 'bull', 'heifer', 'ente', 'nte', "ng'ombe", 'ngombe', 'dyang'],
  goats: ['goat', 'goats', 'embuzi', 'mbuzi', 'dyel'],
  pigs: ['pig', 'pigs', 'piglets', 'embizzi', 'mbizzi', 'nguruwe'],
};

// keywords in English / Luganda / Kiswahili that point to symptom ids
const SIGN_WORDS: Record<string, Record<string, string[]>> = {
  poultry: {
    sudden_deaths: ['dying', 'die', 'dead', 'deaths', 'zifa', 'kufa', 'wanakufa', 'died', 'mangu', 'quickly'],
    twisted_neck: ['twist', 'twisted', 'neck', 'circles', 'paralys'],
    gasping: ['cough', 'coughing', 'sneez', 'gasp', 'breath', 'kukolola', 'kikohozi'],
    green_diarrhoea: ['green', 'kiragala'],
    white_diarrhoea: ['white droppings', 'white diarr', 'vent'],
    bloody_droppings: ['blood', 'bloody', 'musaayi', 'damu'],
    egg_drop: ['eggs', 'egg', 'amagi', 'mayai', 'laying'],
    ruffled: ['sleepy', 'dull', 'ruffled', 'huddl', 'weak'],
    young_3_6wk: ['chicks', 'young', 'weeks old', 'wiki'],
    pale_comb: ['pale', 'comb', 'not growing'],
  },
  cattle: {
    high_fever: ['fever', 'hot', 'not eating', 'stopped eating', 'omusujja', 'homa'],
    swollen_nodes: ['swollen', 'swelling', 'glands', 'nodes'],
    breathing: ['breath', 'breathing', 'froth'],
    ticks: ['tick', 'ticks', 'enkwa', 'kupe'],
    skin_lumps: ['lump', 'lumps', 'nodules'],
    mouth_blisters: ['mouth', 'blister', 'drool', 'saliva'],
    lameness: ['lame', 'limp', 'hoof', 'feet', 'foot'],
    milk_drop: ['milk', 'amata', 'maziwa'],
  },
  pigs: {
    sudden_deaths: ['dying', 'dead', 'died', 'deaths', 'zifa', 'kufa'],
    red_skin: ['red', 'purple', 'skin', 'ears'],
    high_fever: ['fever', 'not eating', 'hot'],
    bloody_diarrhoea: ['blood', 'diarr', 'vomit'],
    huddling: ['huddl', 'weak'],
    cough: ['cough'],
  },
  goats: {
    high_fever: ['fever', 'not eating'],
    diarrhoea: ['diarr', 'running stomach'],
    eye_discharge: ['eye', 'nose', 'discharge'],
    mouth_sores: ['mouth', 'sores'],
    pale_eyelids: ['pale', 'weak', 'thin', 'bottle jaw'],
    cough: ['cough', 'breath'],
  },
  coffee: {
    wilt_whole: ['wilt', 'wilting', 'drying', 'dying', 'whole tree'],
    orange_powder: ['orange', 'rust', 'powder'],
    yellow_spots_top: ['yellow spot', 'spots'],
    berry_dark: ['berries black', 'black berr', 'dark berr', 'berry'],
    berry_drop: ['berries fall', 'berries drop', 'falling'],
    twig_hole: ['hole', 'borer', 'twig'],
    yellow_general: ['yellow', 'pale'],
    leaf_drop: ['leaves fall', 'leaf fall', 'shedding'],
  },
  banana: {
    yellow_leaves: ['yellow', 'wilt', 'wilting'],
    male_bud_shrivel: ['bud', 'flower'],
    uneven_ripen: ['ripen', 'ripening'],
    yellow_ooze: ['ooze', 'liquid', 'sap'],
    pulp_brown: ['brown inside', 'pulp', 'rotten'],
    weevil_tunnels: ['falling', 'fall over', 'weevil', 'tunnel'],
    stem_split: ['split'],
  },
  maize: {
    streaks_yellow: ['streak', 'lines', 'stripes'],
    ragged_holes: ['holes', 'eaten', 'ragged'],
    caterpillar: ['caterpillar', 'worm', 'armyworm', 'larva', 'viwavi'],
    frass: ['sawdust', 'droppings'],
    leaf_edge_dry: ['drying', 'dry edges', 'burnt'],
    purple_leaves: ['purple', 'red leaves'],
    stunted: ['stunted', 'small', 'short'],
    mottled: ['mottl', 'mosaic'],
  },
  cassava: {
    mosaic: ['mosaic', 'yellow green', 'patches'],
    leaf_twist: ['curl', 'twist', 'small leaves'],
    root_rot: ['rot', 'rotten', 'brown inside'],
    vein_yellow: ['veins'],
    stunted: ['stunted', 'small'],
  },
  beans: {
    rust_pustules: ['rust', 'red spots', 'brown spots'],
    angular_spots: ['angular', 'square'],
    pod_spots: ['pods'],
    wilting: ['wilt'],
    leaf_drop: ['leaves fall'],
  },
  tomato: {
    target_rings: ['ring', 'rings', 'target', 'spots'],
    water_patches: ['black', 'patches', 'water soaked', 'spreading fast'],
    white_mould: ['white', 'mould', 'mold'],
    fruit_rot_brown: ['fruit rot', 'rotten fruit'],
    sudden_wilt: ['wilt', 'wilting', 'drooping'],
    fruit_end_black: ['bottom black', 'end black', 'blossom'],
    yellow_around: ['yellow'],
  },
};

const ANIMAL_IDS = ['poultry', 'cattle', 'goats', 'pigs', 'sheep', 'fish'];
const norm = (s: string) => ' ' + s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ') + ' ';

export function detectSubject(text: string): string | undefined {
  const t = norm(text);
  for (const [subj, words] of Object.entries(SUBJECT_WORDS)) {
    if (words.some((w) => t.includes(' ' + w + ' '))) return subj;
  }
  return undefined;
}

export function detectSigns(subject: string, text: string): string[] {
  const t = norm(text);
  const map = SIGN_WORDS[subject] ?? {};
  return Object.entries(map).filter(([, words]) => words.some((w) => t.includes(w))).map(([id]) => id);
}

const GREET = /\b(hello|hi|hey|good morning|good afternoon|good evening|oli otya|osiibye otya|wasuze otya|habari|jambo|mambo|itye nining)\b/;
const THANKS = /\b(thank|thanks|webale|weebale|asante|apwoyo)\b/;
const PRICE = /\b(price|prices|cost of|how much|selling|sell|market|beeyi|bei|soko|okutunda)\b/;
const WEATHER = /\b(weather|rain|rains|forecast|sun|dry spell|enkuba|mvua|obudde|hali ya hewa)\b/;
const LOAN = /\b(loan|loans|credit|borrow|score|looni|mkopo|sacco)\b/;
const PROBLEM = /\b(sick|disease|dying|die|problem|yellow|spots|wilt|wilting|rot|pest|worm|insect|fever|cough|diarr|ndwadde|ugonjwa|zifa|kufa|holes|dead|not eating|lump|blister)\b/;

export function offlineReply(input: string, ctx: JjajjaContext): JjajjaReply {
  const t = norm(input);
  const first = ctx.profile?.name?.split(' ')[0];

  // Follow-up on a pending diagnosis (chip answers come as "sign:<id>" or "done")
  if (ctx.pendingSubject && (input.startsWith('sign:') || input === 'done' || input === 'none')) {
    const signs = [...(ctx.pendingSigns ?? [])];
    if (input.startsWith('sign:')) signs.push(input.slice(5));
    if (input.startsWith('sign:') && signs.length < 4) return askMoreSigns(ctx.pendingSubject, signs);
    return diagnosisReply(ctx.pendingSubject, signs);
  }

  if (GREET.test(t) && t.trim().split(' ').length <= 4) {
    return {
      text: `${first ? `Hello ${first}` : 'Hello, my friend'}. I am Jjajja. Ask me about your crops, animals, weather, prices or money — in English, Luganda or Kiswahili. What is happening on your farm today?`,
      source: 'Jjajja',
      chips: [
        { label: '🐔 My chickens are sick', value: 'My chickens are sick' },
        { label: '🌽 Maize price', value: 'What is the price of maize?' },
        { label: '🌦️ Weather', value: 'What is the weather this week?' },
        { label: '💰 Loan score', value: 'How do I get a loan?' },
      ],
    };
  }
  if (THANKS.test(t) && t.trim().split(' ').length <= 5) {
    return { text: 'You are welcome. Farm smarter, harvest more! Come back any time.', source: 'Jjajja' };
  }

  const subject = detectSubject(input);

  // Animal / crop problem → guided diagnosis
  if (subject && PROBLEM.test(t)) {
    const signs = detectSigns(subject, input);
    if (signs.length >= 2 || (signs.length === 1 && rankConditions(subject, signs)[0]?.confidence >= 0.6)) {
      if (signs.length < 3) return askMoreSigns(subject, signs);
      return diagnosisReply(subject, signs);
    }
    return askMoreSigns(subject, signs);
  }

  // Prices
  if (PRICE.test(t)) {
    const crop = subject && PRICED.includes(subject) ? subject : PRICED.find((c) => t.includes(c)) ?? (t.includes('milk') ? 'milk' : t.includes('egg') ? 'eggs' : undefined);
    if (crop) {
      const district = ctx.profile?.district?.toLowerCase();
      const market = MARKETS.find((m) => m.town.toLowerCase() === district) ?? MARKETS[0];
      const p = priceOn(crop, market.id, new Date());
      const adv = priceAdvice(crop, market.id);
      return {
        text: `${subjectName(crop) || crop} at ${market.name}: about ${ugx(p)} per ${priceUnit(crop)} today (sample price). ${adv?.text ?? ''}`,
        source: 'Kungula Market (sample data)',
        links: [{ label: 'Open Kungula Market', to: `/market?crop=${crop}` }],
      };
    }
    return { text: 'Which crop do you want the price for? For example: "price of maize" or "beeyi y\'emmwanyi".', source: 'Kungula Market', links: [{ label: 'Open Kungula Market', to: '/market' }] };
  }

  // Weather
  if (WEATHER.test(t)) {
    if (!ctx.weather) {
      return { text: 'I do not have your forecast yet. Open Kungula Weather while you have network and I will remember it for offline use.', source: 'Kungula Weather', links: [{ label: 'Open Weather', to: '/weather' }] };
    }
    const d = ctx.weather.daily.slice(0, 3).map((x) => `${new Date(x.date).toLocaleDateString('en-GB', { weekday: 'long' })}: ${Math.round(x.tMin)}–${Math.round(x.tMax)}°C, rain ${x.rain.toFixed(0)} mm`).join('; ');
    const alerts = farmAlerts(ctx.weather, ctx.profile?.crops ?? [], ctx.profile?.animals ?? []);
    return { text: `${d}. ${alerts[0]?.title}: ${alerts[0]?.text}`, source: 'Open-Meteo forecast', links: [{ label: 'Full forecast', to: '/weather' }] };
  }

  // Loans
  if (LOAN.test(t)) {
    const s = ctx.score;
    return {
      text: `${s !== undefined ? `Your Loan Readiness Score is ${s} out of 100. ` : ''}Lenders want to see that your farm is a business. Keep records every week, record harvests and sales, map your plots and finish lessons in the Academy. You choose when a lender can see your score.`,
      source: 'Kungula Finance',
      links: [{ label: 'See my score', to: '/finance' }],
    };
  }

  // Knowledge library search
  const best = searchArticles(input)[0];
  if (best && best.score >= 2) {
    return { text: best.article.body, source: best.article.source, links: best.article.link ? [{ label: 'Open', to: best.article.link }] : undefined };
  }

  // Subject mentioned without a problem — give general crop/animal tips
  if (subject) {
    const art = searchArticles(subjectName(subject))[0];
    if (art) return { text: art.article.body, source: art.article.source };
    return askMoreSigns(subject, []);
  }

  return {
    text: 'I am not sure about that one, and I do not want to guess on your farm. You can rephrase, or I can connect you to a human expert (a Champion or vet) who will call you back.',
    source: 'Jjajja',
    escalate: true,
    chips: [
      { label: '🩺 Something is sick', value: 'My crop is sick' },
      { label: '📈 Prices', value: 'Prices' },
      { label: '🌱 When to plant', value: 'When should I plant?' },
    ],
  };
}

function askMoreSigns(subject: string, signs: string[]): JjajjaReply {
  const options = (SYMPTOMS[subject] ?? []).filter((s) => !signs.includes(s.id)).slice(0, 7);
  const name = subjectName(subject).toLowerCase();
  const already = signs.length
    ? `I hear: ${signs.map((id) => SYMPTOMS[subject]?.find((s) => s.id === id)?.label.toLowerCase()).filter(Boolean).join('; ')}. `
    : '';
  return {
    text: `${already}Let me understand your ${name} better. Which of these do you also see? Tap one, then tap "That's all" when finished.`,
    source: 'Kungula Scan knowledge base',
    chips: [...options.map((s) => ({ label: s.label, value: 'sign:' + s.id })), { label: "✔ That's all", value: 'done' }],
    next: { pendingSubject: subject, pendingSigns: signs },
  };
}

function diagnosisReply(subject: string, signs: string[]): JjajjaReply {
  const ranked = rankConditions(subject, signs);
  if (!ranked.length) {
    return {
      text: 'From what you describe I cannot tell what it is. Please take a clear photo with Kungula Scan, or I can ask a human expert to call you back.',
      source: 'Kungula Scan knowledge base', escalate: true,
      links: [{ label: 'Open Kungula Scan', to: `/scan?subject=${subject}` }],
      next: { pendingSubject: undefined, pendingSigns: undefined },
    };
  }
  const top = ranked[0];
  const c = top.condition;
  const pct = Math.round(top.confidence * 100);
  const others = ranked.slice(1).map((r) => r.condition.name).join(' or ');
  const steps = c.treatments.slice(0, 3).map((tr, i) => `${i + 1}. ${tr.text}${tr.dose ? ` Dose: ${tr.dose}.` : ''}`).join(' ');
  const lowConf = top.confidence < 0.6;
  const text = [
    `${lowConf ? 'It might be' : ANIMAL_IDS.includes(subject) ? 'This is likely' : 'This looks like'} ${c.name} (${pct}% match${others ? `; it could also be ${others}` : ''}).`,
    c.explain,
    `What to do today: ${steps}`,
    URGENCY_LABEL[c.urgency] + '.',
    c.notifiable ? 'This disease must be reported to your district veterinary officer.' : '',
    lowConf ? 'I am not fully sure — a photo in Kungula Scan or a call from an expert will help.' : '',
  ].filter(Boolean).join(' ');
  return {
    text, source: 'Kungula Scan knowledge base (MAAIF/NARO guidance)',
    escalate: lowConf || !!c.vetRequired,
    links: [{ label: 'Full treatment plan', to: `/condition/${c.id}` }, { label: 'Scan with a photo', to: `/scan?subject=${subject}` }],
    next: { pendingSubject: undefined, pendingSigns: undefined },
  };
}

export function searchArticles(q: string) {
  const t = norm(q);
  return ARTICLES.map((a) => {
    let score = 0;
    for (const k of a.keywords) if (t.includes(k.toLowerCase())) score += k.includes(' ') ? 2 : 1;
    for (const w of norm(a.title).trim().split(' ')) if (w.length > 3 && t.includes(' ' + w)) score += 1;
    return { article: a, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
}

// ---------- Online mode (optional) ----------

export function buildSystemPrompt(ctx: JjajjaContext) {
  const p = ctx.profile;
  const crops = (p?.crops ?? []).map(subjectName).join(', ') || 'unknown';
  const animals = (p?.animals ?? []).map(subjectName).join(', ') || 'none';
  const library = ARTICLES.map((a) => `## ${a.title} (source: ${a.source})\n${a.body}`).join('\n\n');
  const conditions = CONDITIONS.map((c) => `- ${subjectName(c.subject)} — ${c.name}: ${c.explain} Treatments: ${c.treatments.map((x) => x.text + (x.dose ? ` (${x.dose})` : '')).join(' | ')}${c.notifiable ? ' NOTIFIABLE — report to district veterinary officer.' : ''}`).join('\n');
  return `You are Jjajja, the farming advisor inside the Kungula app in Uganda. You speak like a wise, warm elder who knows modern agronomy and veterinary science: plain words, short sentences, practical steps, local measures (bottle-tops, 20-litre tanks, jerrycans, acres, UGX).
Reply in the same language the farmer used (English, Luganda, Kiswahili or Luo). Keep answers under 150 words unless asked for more.
Rules:
- Base advice on the Kungula library below and well-established Ugandan extension guidance. If unsure, say so clearly and recommend a human expert, Champion or vet.
- Only recommend agricultural chemicals and vet drugs registered in Uganda, by generic active ingredient, and always say to follow the label, use protective equipment and respect pre-harvest/withdrawal periods. Never recommend banned products.
- For FMD, lumpy skin, ASF, PPR, Newcastle outbreaks and other notifiable diseases, tell the farmer to contact the district veterinary officer.
- Never ask for mobile money PINs or passwords. Never push products.
Farmer: ${p?.name ?? 'unknown'}, district ${p?.district ?? 'unknown'}. Crops: ${crops}. Animals: ${animals}.

# Kungula library
${library}

# Crop and animal conditions
${conditions}`;
}

export async function onlineReply(
  history: { role: 'user' | 'assistant'; content: string }[],
  ctx: JjajjaContext,
  apiKey: string,
  model = 'claude-sonnet-5-5',
  photo?: string,
): Promise<string> {
  const msgs = history.slice(-10).map((m) => ({ role: m.role, content: m.content as unknown }));
  if (photo && msgs.length) {
    const last = msgs[msgs.length - 1];
    const [meta, data] = photo.split(',');
    const media = meta.match(/data:(.*?);/)?.[1] ?? 'image/jpeg';
    last.content = [
      { type: 'image', source: { type: 'base64', media_type: media, data } },
      { type: 'text', text: String(last.content) },
    ];
  }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: 700, system: buildSystemPrompt(ctx), messages: msgs }),
  });
  if (!r.ok) throw new Error(`AI service error ${r.status}`);
  const j = await r.json();
  return (j.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n').trim();
}

/** Ask the online model for a second opinion on a Scan photo. */
export async function onlinePhotoOpinion(photo: string, subject: string, signs: string[], apiKey: string, model?: string) {
  const signText = signs.map((id) => SYMPTOMS[subject]?.find((s) => s.id === id)?.label).filter(Boolean).join('; ');
  const prompt = `Photo of a farmer's ${subjectName(subject)} in Uganda. Signs the farmer ticked: ${signText || 'none'}. What is the most likely problem? Give: likely cause with your confidence, 2 other possibilities, what to do today, and when to call an expert. If the photo is unclear or not a ${subjectName(subject)}, say so.`;
  return onlineReply([{ role: 'user', content: prompt }], {}, apiKey, model, photo);
}

export { conditionById, CROPS, ANIMALS };
