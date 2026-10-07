import { CONDITIONS, type Condition } from '../data/conditions';

export interface Ranked { condition: Condition; confidence: number }

/**
 * Rank likely conditions for a crop/animal from the signs the farmer ticked.
 * Confidence blends how much of the condition's picture is present (recall)
 * with how many of the ticked signs the condition explains (precision).
 */
export function rankConditions(subject: string, ticked: string[]): Ranked[] {
  if (!ticked.length) return [];
  const set = new Set(ticked);
  return CONDITIONS.filter((c) => c.subject === subject)
    .map((c) => {
      const entries = Object.entries(c.signs);
      const total = entries.reduce((a, [, w]) => a + w, 0);
      const matched = entries.filter(([s]) => set.has(s)).reduce((a, [, w]) => a + w, 0);
      const explained = ticked.filter((s) => s in c.signs).length;
      const recall = total ? matched / total : 0;
      const precision = explained / ticked.length;
      // A strongly characteristic sign (weight 3) alone should still rank well.
      const keyHit = entries.some(([s, w]) => w === 3 && set.has(s)) ? 0.15 : 0;
      const confidence = Math.min(0.97, 0.55 * recall + 0.3 * precision + keyHit);
      return { condition: c, confidence };
    })
    .filter((r) => r.confidence >= 0.2)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

export const CONFIDENT = 0.6;

export function confidenceWord(c: number) {
  if (c >= 0.8) return 'High';
  if (c >= CONFIDENT) return 'Fair';
  return 'Low';
}
