import { describe, expect, it } from 'vitest';
import { parseRecord } from './parse';
import { rankConditions } from './diagnose';
import { loanReadiness } from './score';
import { offlineReply, detectSubject } from './jjajja';
import { polygonAreaM2, m2ToAcres, toGeoJSON, toCSV } from './util';
import { priceAdvice, priceOn, priceSeries, MARKETS } from '../data/market';
import { CONDITIONS, SYMPTOMS } from '../data/conditions';
import { farmAlerts } from './weather';
import type { Plot, WeatherCache } from './types';

const plot = (name: string): Plot => ({ id: name, name, crop: 'maize', boundary: [], createdAt: 0 });

describe('voice record parser', () => {
  it('understands the blueprint example', () => {
    const r = parseRecord('I paid two workers 10,000 each to weed the north plot', [plot('North plot'), plot('Hill plot')]);
    expect(r.kind).toBe('weeding');
    expect(r.cost).toBe(20000);
    expect(r.plotId).toBe('North plot');
  });
  it('turns a sale with price per kg into income', () => {
    const r = parseRecord('Sold 200 kg of maize at 1,100 per kg');
    expect(r.kind).toBe('sale');
    expect(r.income).toBe(220000);
    expect(r.quantity).toBe(200);
    expect(r.crop).toBe('maize');
  });
  it('handles k suffix and inputs', () => {
    const r = parseRecord('bought mancozeb for 22k');
    expect(r.kind).toBe('inputs');
    expect(r.cost).toBe(22000);
  });
  it('records harvest quantity without treating it as money', () => {
    const r = parseRecord('harvested 15 bags of beans');
    expect(r.kind).toBe('harvest');
    expect(r.quantity).toBe(15);
    expect(r.cost).toBeUndefined();
  });
});

describe('scan diagnosis', () => {
  it('every condition references real symptoms', () => {
    for (const c of CONDITIONS) {
      const ids = (SYMPTOMS[c.subject] ?? []).map((s) => s.id);
      for (const s of Object.keys(c.signs)) expect(ids, `${c.id}:${s}`).toContain(s);
    }
  });
  it('ranks Newcastle for classic signs', () => {
    const r = rankConditions('poultry', ['twisted_neck', 'green_diarrhoea', 'sudden_deaths']);
    expect(r[0].condition.id).toBe('poultry_newcastle');
    expect(r[0].confidence).toBeGreaterThan(0.6);
  });
  it('ranks BXW for ooze and early ripening', () => {
    const r = rankConditions('banana', ['yellow_ooze', 'uneven_ripen', 'male_bud_shrivel']);
    expect(r[0].condition.id).toBe('banana_bxw');
  });
  it('returns nothing without signs', () => {
    expect(rankConditions('maize', [])).toEqual([]);
  });
});

describe('loan readiness', () => {
  it('starts at zero and rises with records', () => {
    const empty = loanReadiness({ activities: [], plots: [], tracePlots: [], lessons: [], scans: [], loans: [] });
    expect(empty.score).toBe(0);
    const now = Date.now();
    const acts = Array.from({ length: 12 }, (_, i) => ({
      id: String(i), date: new Date(now - i * 7 * 86400000).toISOString().slice(0, 10), kind: i % 4 === 0 ? 'sale' as const : 'weeding' as const,
      description: 'x', cost: i % 4 ? 10000 : undefined, income: i % 4 === 0 ? 50000 : undefined, createdAt: 0,
    }));
    const r = loanReadiness({ activities: acts, plots: [{ ...plot('a'), boundary: [{ lat: 0, lng: 0 }] }], tracePlots: [], lessons: [{ lessonId: 'l', completedAt: 1 }], scans: [], loans: [], now });
    expect(r.score).toBeGreaterThan(50);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

describe('Jjajja offline', () => {
  it('detects Luganda subjects', () => {
    expect(detectSubject('Enkoko zange zifa mangu')).toBe('poultry');
    expect(detectSubject('emmwanyi yange')).toBe('coffee');
  });
  it('asks follow-up questions for sick chickens (blueprint flow)', () => {
    const r = offlineReply('Enkoko zange zifa mangu', {});
    expect(r.next?.pendingSubject).toBe('poultry');
    expect(r.chips?.length).toBeGreaterThan(2);
  });
  it('completes a diagnosis from chips', () => {
    const ctx = { pendingSubject: 'poultry', pendingSigns: ['sudden_deaths', 'twisted_neck'] };
    const r = offlineReply('done', ctx);
    expect(r.text).toMatch(/Newcastle/);
    expect(r.text).toMatch(/veterinary/);
  });
  it('answers prices and admits uncertainty', () => {
    expect(offlineReply('what is the price of maize', {}).text).toMatch(/UGX/);
    const r = offlineReply('how do I fix my motorbike carburettor', {});
    expect(r.escalate).toBe(true);
  });
});

describe('geo and exports', () => {
  it('computes the area of a ~1 acre square near Masaka', () => {
    const d = 63.6 / 111320; // ~63.6 m in degrees latitude
    const lat = -0.33; const lng = 31.73; const dl = d / Math.cos(lat * Math.PI / 180);
    const sq = [{ lat, lng }, { lat: lat + d, lng }, { lat: lat + d, lng: lng + dl }, { lat, lng: lng + dl }];
    expect(m2ToAcres(polygonAreaM2(sq))).toBeCloseTo(1, 1);
  });
  it('writes valid GeoJSON with closed rings and points', () => {
    const g = JSON.parse(toGeoJSON([
      { id: 'a', name: 'A', boundary: [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 1, lng: 1 }] },
      { id: 'b', name: 'B', boundary: [{ lat: 2, lng: 2 }] },
    ]));
    expect(g.features[0].geometry.type).toBe('Polygon');
    expect(g.features[0].geometry.coordinates[0]).toHaveLength(4);
    expect(g.features[1].geometry.type).toBe('Point');
  });
  it('escapes CSV', () => {
    expect(toCSV([{ a: 'x,y', b: 'say "hi"' }])).toBe('a,b\n"x,y","say ""hi"""');
  });
});

describe('market model', () => {
  it('gives stable positive prices and advice', () => {
    const d = new Date('2026-07-15');
    const p1 = priceOn('maize', 'masaka', d); const p2 = priceOn('maize', 'masaka', d);
    expect(p1).toBe(p2);
    expect(p1!).toBeGreaterThan(0);
    expect(priceSeries('coffee', 'owino', 52)).toHaveLength(52);
    for (const m of MARKETS) expect(priceAdvice('beans', m.id)?.text.length).toBeGreaterThan(10);
  });
});

describe('weather alerts', () => {
  it('warns not to spray before heavy rain', () => {
    const w: WeatherCache = { fetchedAt: 0, location: { lat: 0, lng: 0 }, daily: [
      { date: '2026-10-07', tMax: 27, tMin: 17, rain: 18, rainProb: 90, wind: 10, code: 63 },
      { date: '2026-10-08', tMax: 27, tMin: 17, rain: 2, rainProb: 40, wind: 10, code: 3 },
    ] };
    expect(farmAlerts(w, ['tomato'], []).some((a) => /spray/i.test(a.text))).toBe(true);
  });
});
