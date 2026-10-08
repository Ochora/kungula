import { describe, expect, it } from 'vitest';
import { analysePixels, classify } from './vision';
import { levelOf, touchStreak, badgesEarned, emptyGame } from './game';
import { FARMS, trustScore, project, vitals } from '../data/farms';

function img(W: number, H: number, paint: (x: number, y: number) => [number, number, number]) {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [r, g, b] = paint(x, y); const o = (y * W + x) * 4;
    // add texture so the photo is not "blurry"
    const n = ((x * 7 + y * 13) % 5) * 6;
    data[o] = Math.min(255, r + n); data[o + 1] = Math.min(255, g + n); data[o + 2] = Math.min(255, b + n); data[o + 3] = 255;
  }
  return { data, width: W, height: H };
}
const LEAF: [number, number, number] = [52, 130, 48];

describe('Kungula Vision', () => {
  it('classifies basic colours', () => {
    expect(classify(52, 130, 48)).toBe(1); // green
    expect(classify(230, 200, 40)).toBe(2); // yellow
    expect(classify(120, 70, 30)).toBe(3); // brown
    expect(classify(240, 120, 20)).toBe(4); // orange
  });
  it('sees a healthy leaf as healthy with no signs', () => {
    const r = analysePixels(img(120, 90, () => LEAF), 'coffee');
    expect(r.health).toBeGreaterThan(85);
    expect(r.signs).toEqual([]);
    expect(r.quality.ok).toBe(true);
  });
  it('finds orange rust powder on coffee', () => {
    const r = analysePixels(img(120, 90, (x, y) => ((x % 14 < 4) && (y % 12 < 4) ? [240, 120, 20] : LEAF)), 'coffee');
    expect(r.share.orange).toBeGreaterThan(0.02);
    expect(r.signs).toContain('orange_powder');
  });
  it('finds yellow streaks on maize', () => {
    const r = analysePixels(img(160, 120, (x) => (x % 30 < 3 ? [235, 205, 50] : LEAF)), 'maize');
    expect(r.streaks).toBeGreaterThanOrEqual(2);
    expect(r.signs).toContain('streaks_yellow');
  });
  it('finds large dark patches and white mould on tomato', () => {
    const r = analysePixels(img(140, 100, (x, y) => (x > 20 && x < 70 && y > 20 && y < 70 ? (y < 30 ? [235, 235, 232] : [70, 45, 25]) : LEAF)), 'tomato');
    expect(r.signs).toContain('water_patches');
    expect(r.signs).toContain('white_mould');
  });
  it('warns about dark photos', () => {
    const r = analysePixels(img(60, 60, () => [20, 25, 18]), 'beans');
    expect(r.quality.ok).toBe(false);
  });
});

describe('gamification', () => {
  it('levels up with xp', () => {
    expect(levelOf(0).name).toBe('Seed');
    expect(levelOf(200).name).toBe('Seedling');
    expect(levelOf(99999).next).toBeUndefined();
  });
  it('counts streaks across days', () => {
    const d1 = new Date('2026-10-01T09:00:00Z'); const d2 = new Date('2026-10-02T09:00:00Z'); const d4 = new Date('2026-10-04T09:00:00Z');
    let g = touchStreak(emptyGame(), d1).g; expect(g.streak).toBe(1);
    g = touchStreak(g, d2).g; expect(g.streak).toBe(2);
    expect(touchStreak(g, d2).bonus).toBe(0); // same day
    expect(touchStreak(g, d4).g.streak).toBe(1); // broken
  });
  it('awards badges once', () => {
    const g = { ...emptyGame(), badges: ['first_record'] };
    expect(badgesEarned({ activities: 3, scans: 1 }, g)).toEqual(['doctor']);
  });
});

describe('Kungula Invest', () => {
  it('verified farms are more trusted than unverified', () => {
    const v = FARMS.find((f) => f.verification.status === 'verified')!;
    const u = FARMS.find((f) => f.verification.status === 'unverified')!;
    expect(trustScore(v)).toBeGreaterThan(trustScore(u));
    for (const f of FARMS) { const t = trustScore(f); expect(t).toBeGreaterThanOrEqual(0); expect(t).toBeLessThanOrEqual(100); }
  });
  it('projects money back in order bad < expected < good', () => {
    const o = FARMS[0].opportunities[0];
    const p = project(o, 2);
    expect(p.invested).toBe(o.unitPrice * 2);
    expect(p.low).toBeLessThanOrEqual(p.mid);
    expect(p.mid).toBeLessThanOrEqual(p.high);
  });
  it('produces believable animal vitals', () => {
    const a = FARMS.find((f) => f.animals)!.animals![0];
    for (let t = 0; t < 10; t++) {
      const v = vitals(a, Date.now() + t * 600000);
      expect(v.hr).toBeGreaterThan(40); expect(v.hr).toBeLessThan(100);
      expect(v.temp).toBeGreaterThan(37.5); expect(v.temp).toBeLessThan(40);
    }
  });
});
