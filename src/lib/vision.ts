// Kungula Vision — on-device photo check that works with no internet.
// It measures the colours and shapes on a leaf photo (healthy green, yellowing,
// brown/dead tissue, orange rust powder, white mould, purple, spots and
// streaks) and turns them into the signs Scan already understands. It is a
// first step: a trained disease model replaces it once enough labelled
// Ugandan field photos are collected.

export interface Pixels { data: Uint8ClampedArray | number[]; width: number; height: number }

export interface VisionResult {
  quality: { ok: boolean; issue?: string; brightness: number; sharpness: number; plantShare: number };
  share: { green: number; yellow: number; brown: number; orange: number; white: number; dark: number; purple: number; red: number };
  spots: number; // lesion patches
  bigPatches: number; // lesions larger than ~2% of the plant area
  streaks: number; // long thin yellow/brown marks
  mosaic: boolean;
  health: number; // 0–100 share of healthy-looking tissue
  signs: string[]; // symptom ids for the chosen subject
  notes: string[]; // plain-language findings
  overlay?: string; // data URL highlighting affected areas
}

type Cls = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // none, green, yellow, brown, orange, white, dark, purple, red
const GREEN = 1, YELLOW = 2, BROWN = 3, ORANGE = 4, WHITE = 5, DARK = 6, PURPLE = 7, RED = 8;

function hsv(r: number, g: number, b: number) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max / 255 };
}

export function classify(r: number, g: number, b: number): Cls {
  const { h, s, v } = hsv(r, g, b);
  if (v < 0.16) return DARK;
  if (s < 0.13 && v > 0.72) return WHITE;
  if (s < 0.16) return 0; // grey: sky, wall, shadowless background
  if (h >= 75 && h < 170 && s > 0.2) return GREEN;
  if (h >= 50 && h < 75) return s > 0.35 && v > 0.45 ? YELLOW : GREEN;
  if (h >= 22 && h < 50) {
    if (s > 0.55 && v > 0.6 && h < 42) return ORANGE;
    if (v > 0.55 && s > 0.35 && h >= 38) return YELLOW;
    return BROWN;
  }
  if (h >= 8 && h < 22) return s > 0.6 && v > 0.55 ? ORANGE : BROWN;
  if (h >= 260 && h < 335 && s > 0.2) return PURPLE;
  if ((h >= 335 || h < 8) && s > 0.45) return v > 0.3 ? RED : BROWN;
  return 0;
}

/** Analyse already-decoded pixels (the testable core). */
export function analysePixels(px: Pixels, subject: string): Omit<VisionResult, 'overlay'> & { cls: Uint8Array; plant: Uint8Array } {
  const { width: W, height: H, data } = px;
  const N = W * H;
  const cls = new Uint8Array(N);
  let vSum = 0;
  const lum = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    cls[i] = classify(r, g, b);
    const L = 0.299 * r + 0.587 * g + 0.114 * b;
    lum[i] = L; vSum += L;
  }
  // sharpness: variance of a Laplacian
  let lapSum = 0, lapSq = 0, lapN = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    const l = 4 * lum[i] - lum[i - 1] - lum[i + 1] - lum[i - W] - lum[i + W];
    lapSum += l; lapSq += l * l; lapN++;
  }
  const sharpness = lapN ? lapSq / lapN - (lapSum / lapN) ** 2 : 0;
  const brightness = vSum / N / 255;

  // Plant region: pixels whose neighbourhood is mostly plant-coloured.
  // This keeps lesions inside a leaf while dropping soil and sky around it.
  const R = Math.max(2, Math.round(Math.min(W, H) / 28));
  const isTissue = (c: number) => c === GREEN || c === YELLOW || c === ORANGE || c === PURPLE;
  const integ = new Int32Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let row = 0;
    for (let x = 0; x < W; x++) {
      row += isTissue(cls[y * W + x]) ? 1 : 0;
      integ[(y + 1) * (W + 1) + x + 1] = integ[y * (W + 1) + x + 1] + row;
    }
  }
  // Background = non-tissue pixels connected to the photo edge. Anything not
  // reachable from the edge is enclosed by leaf, so it is a lesion, not soil.
  const outside = new Uint8Array(N);
  const q: number[] = [];
  const seed = (i: number) => { if (!outside[i] && !isTissue(cls[i])) { outside[i] = 1; q.push(i); } };
  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
  while (q.length) {
    const i = q.pop()!; const x = i % W;
    if (x > 0) seed(i - 1); if (x < W - 1) seed(i + 1); if (i >= W) seed(i - W); if (i < N - W) seed(i + W);
  }
  const plant = new Uint8Array(N);
  let plantN = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const x0 = Math.max(0, x - R), x1 = Math.min(W, x + R + 1), y0 = Math.max(0, y - R), y1 = Math.min(H, y + R + 1);
    const cnt = integ[y1 * (W + 1) + x1] - integ[y0 * (W + 1) + x1] - integ[y1 * (W + 1) + x0] + integ[y0 * (W + 1) + x0];
    const frac = cnt / ((x1 - x0) * (y1 - y0));
    const c = cls[i];
    if (isTissue(c) || !outside[i] || (frac > 0.35 && c !== 0)) { plant[i] = 1; plantN++; }
  }
  // Drop the soft brown rim where a leaf meets the background (photo blur), so
  // healthy leaf edges are not counted as dead tissue.
  for (let pass = 0; pass < 2; pass++) {
    const edge: number[] = [];
    for (let i = 0; i < N; i++) {
      if (!plant[i] || (cls[i] !== BROWN && cls[i] !== DARK && cls[i] !== 0)) continue;
      const x = i % W;
      const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W];
      if (nb.some((j) => j < 0 || j >= N || !plant[j])) edge.push(i);
    }
    for (const i of edge) { plant[i] = 0; plantN--; }
  }
  const plantShare = plantN / N;

  const count = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < N; i++) if (plant[i]) count[cls[i]]++;
  const f = (c: number) => (plantN ? count[c] / plantN : 0);
  const share = { green: f(GREEN), yellow: f(YELLOW), brown: f(BROWN), orange: f(ORANGE), white: f(WHITE), dark: f(DARK), purple: f(PURPLE), red: f(RED) };

  // Connected lesion patches (brown/dark/orange/white) and yellow patches.
  const seen = new Uint8Array(N);
  const isLesion = (i: number) => !!plant[i] && (cls[i] === BROWN || cls[i] === DARK || cls[i] === ORANGE || cls[i] === WHITE || cls[i] === RED);
  const isYellow = (i: number) => !!plant[i] && cls[i] === YELLOW;
  const comps = (test: (i: number) => boolean) => {
    const out: { n: number; w: number; h: number }[] = [];
    const stack: number[] = [];
    for (let s = 0; s < N; s++) {
      if (seen[s] || !test(s)) continue;
      seen[s] = 1; stack.push(s);
      let n = 0, minX = W, maxX = 0, minY = H, maxY = 0;
      while (stack.length) {
        const i = stack.pop()!; n++;
        const x = i % W, y = (i / W) | 0;
        if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
        for (const j of [i - 1, i + 1, i - W, i + W]) {
          if (j < 0 || j >= N || seen[j]) continue;
          if ((j === i - 1 && x === 0) || (j === i + 1 && x === W - 1)) continue;
          if (test(j)) { seen[j] = 1; stack.push(j); }
        }
      }
      out.push({ n, w: maxX - minX + 1, h: maxY - minY + 1 });
    }
    return out;
  };
  const minSpot = Math.max(3, plantN * 0.0004);
  const lesions = comps(isLesion).filter((c) => c.n >= minSpot);
  seen.fill(0);
  const yellows = comps(isYellow).filter((c) => c.n >= minSpot);
  const elongated = (c: { w: number; h: number; n: number }) => Math.max(c.w, c.h) / Math.max(1, Math.min(c.w, c.h)) >= 4 && Math.max(c.w, c.h) > Math.min(W, H) / 8;
  const spots = lesions.length;
  const bigPatches = lesions.filter((c) => c.n > plantN * 0.02).length;
  const streaks = [...lesions, ...yellows].filter(elongated).length;
  const mosaic = share.yellow > 0.08 && share.green > 0.25 && yellows.length >= 6;
  const health = Math.round(Math.max(0, Math.min(1, share.green + share.purple * 0.3)) * 100);

  // Quality gate
  let issue: string | undefined;
  if (brightness < 0.18) issue = 'The photo is too dark. Take it in daylight.';
  else if (brightness > 0.92) issue = 'The photo is too bright. Avoid direct sun on the camera.';
  else if (sharpness < 25) issue = 'The photo is blurry. Hold the phone still and tap to focus.';
  else if (plantShare < 0.12 && !ANIMALS.includes(subject)) issue = 'I cannot see enough leaf. Go closer so the leaf fills the screen.';
  const quality = { ok: !issue, issue, brightness, sharpness, plantShare };

  const { signs, notes } = toSigns(subject, { share, spots, bigPatches, streaks, mosaic, health, lesions: lesions.length }, px, cls);
  return { quality, share, spots, bigPatches, streaks, mosaic, health, signs, notes, cls, plant };
}

const ANIMALS = ['poultry', 'cattle', 'goats', 'pigs', 'sheep', 'fish'];

function toSigns(subject: string, m: { share: VisionResult['share']; spots: number; bigPatches: number; streaks: number; mosaic: boolean; health: number; lesions: number }, px: Pixels, cls: Uint8Array) {
  const s = m.share; const signs = new Set<string>(); const notes: string[] = [];
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const sick = 1 - s.green;
  if (!ANIMALS.includes(subject)) {
    if (m.health >= 85 && m.spots < 4) notes.push(`Leaves look mostly healthy (${m.health}% green).`);
    else notes.push(`${m.health}% of the plant looks healthy green.`);
    if (s.yellow > 0.06) notes.push(`Yellowing on about ${pct(s.yellow)} of the leaf.`);
    if (s.brown + s.dark > 0.05) notes.push(`Brown or dead tissue on about ${pct(s.brown + s.dark)}.`);
    if (s.orange > 0.02) notes.push(`Orange powder-coloured patches (${pct(s.orange)}).`);
    if (s.white > 0.03) notes.push(`White mould-like areas (${pct(s.white)}).`);
    if (s.purple > 0.06) notes.push(`Purple colouring (${pct(s.purple)}).`);
    if (m.spots >= 5) notes.push(`${m.spots} separate spots found.`);
    if (m.streaks >= 2) notes.push(`${m.streaks} long streaks or stripes.`);
    if (m.mosaic) notes.push('Patchy yellow-green mosaic pattern.');
  }
  switch (subject) {
    case 'coffee':
      if (s.orange > 0.02) signs.add('orange_powder');
      if (m.spots >= 4 && s.yellow > 0.03) signs.add('yellow_spots_top');
      if (s.yellow > 0.25) signs.add('yellow_general');
      if (s.brown + s.dark > 0.35 && s.green < 0.4) signs.add('wilt_whole');
      if (sick > 0.5) signs.add('leaf_drop');
      break;
    case 'banana':
      if (s.yellow > 0.15) signs.add('yellow_leaves');
      if (s.yellow > 0.08 && s.brown > 0.1) signs.add('old_leaves_yellow_edge');
      break;
    case 'maize':
      if (m.streaks >= 2 && s.yellow > 0.04) signs.add('streaks_yellow');
      if (m.mosaic) signs.add('mottled');
      if (s.purple > 0.08) signs.add('purple_leaves');
      if (s.brown > 0.12 && m.bigPatches >= 1) signs.add('leaf_edge_dry');
      break;
    case 'cassava':
      if (m.mosaic || (s.yellow > 0.12 && s.green > 0.3)) signs.add('mosaic');
      if (s.yellow > 0.05 && m.streaks >= 1) signs.add('vein_yellow');
      break;
    case 'beans':
      if (m.spots >= 6 && (s.brown + s.orange) > 0.02 && m.bigPatches === 0) signs.add('rust_pustules');
      if (m.spots >= 4 && s.yellow > 0.04) signs.add('yellow_halo');
      if (m.spots >= 3 && m.bigPatches >= 1) signs.add('angular_spots');
      if (sick > 0.55) signs.add('leaf_drop');
      break;
    case 'tomato':
      if (m.spots >= 3 && s.brown > 0.04 && m.bigPatches <= 2) signs.add('target_rings');
      if (s.yellow > 0.06 && m.spots >= 2) signs.add('yellow_around');
      if ((s.dark + s.brown) > 0.12 && m.bigPatches >= 1) signs.add('water_patches');
      if (s.white > 0.025) signs.add('white_mould');
      break;
    case 'poultry': {
      // Droppings colour check: only meaningful if the photo shows droppings
      const all = countAll(px, cls);
      if (all.red > 0.03) { signs.add('bloody_droppings'); notes.push('Red colour found — possible blood in droppings.'); }
      if (all.white > 0.25) { signs.add('white_diarrhoea'); notes.push('Mostly white, chalky droppings.'); }
      if (all.green > 0.2) { signs.add('green_diarrhoea'); notes.push('Greenish droppings.'); }
      notes.push('For chickens, Kungula reads droppings colour. Tick the other signs you see.');
      break;
    }
    default:
      if (ANIMALS.includes(subject)) notes.push('Photo saved with your record. For animals, tick the signs you see — a vet can review the photo.');
  }
  return { signs: [...signs], notes };
}

function countAll(px: Pixels, cls: Uint8Array) {
  const n = px.width * px.height; const c = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) c[cls[i]]++;
  return { green: c[GREEN] / n, white: c[WHITE] / n, red: c[RED] / n };
}

const OVERLAY: Record<number, [number, number, number]> = {
  [YELLOW]: [242, 169, 0], [BROWN]: [211, 47, 47], [DARK]: [211, 47, 47], [ORANGE]: [255, 112, 0], [WHITE]: [33, 150, 243], [PURPLE]: [156, 39, 176], [RED]: [211, 47, 47],
};

/** Decode a photo, analyse it and draw a highlight overlay. Browser/WebView only. */
export async function analysePhoto(dataUrl: string, subject: string, maxSide = 220): Promise<VisionResult> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Could not open the photo')); i.src = dataUrl;
  });
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const W = Math.max(8, Math.round(img.width * scale)), H = Math.max(8, Math.round(img.height * scale));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  const id = ctx.getImageData(0, 0, W, H);
  const r = analysePixels({ data: id.data, width: W, height: H }, subject);

  // Overlay: dim healthy tissue and background, colour affected areas
  const out = ctx.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const k = r.cls[i]; const col = r.plant[i] ? OVERLAY[k] : undefined;
    const o = i * 4;
    if (col) { out.data[o] = col[0]; out.data[o + 1] = col[1]; out.data[o + 2] = col[2]; out.data[o + 3] = 200; }
    else { out.data[o + 3] = 0; }
  }
  const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
  oc.getContext('2d')!.putImageData(out, 0, 0);
  const { cls, plant, ...rest } = r; void cls; void plant;
  return { ...rest, overlay: oc.toDataURL('image/png') };
}
