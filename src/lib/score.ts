import type { Activity, LessonProgress, LoanApplication, Plot, ScanRecord, TracePlot, Profile } from './types';

export interface ScoreInput {
  profile?: Profile;
  activities: Activity[];
  plots: Plot[];
  tracePlots: TracePlot[];
  lessons: LessonProgress[];
  scans: ScanRecord[];
  loans: LoanApplication[];
  now?: number;
}

export interface ScorePart { key: string; label: string; points: number; max: number; tip?: string }

/**
 * Loan Readiness Score (0–100), built only from the farmer's own Kungula
 * activity. Explainable by design: every point has a reason and a tip.
 */
export function loanReadiness(i: ScoreInput): { score: number; parts: ScorePart[]; band: string } {
  const now = i.now ?? Date.now();
  const day = 86400000;
  const recent = i.activities.filter((a) => now - new Date(a.date).getTime() <= 180 * day);

  // 1. Record keeping consistency — distinct weeks with records in last 26 weeks
  const weeks = new Set(recent.map((a) => Math.floor(new Date(a.date).getTime() / (7 * day))));
  const consistency = Math.min(25, Math.round((weeks.size / 12) * 25));

  // 2. Money records — costs and income both tracked
  const hasCost = recent.filter((a) => (a.cost ?? 0) > 0).length;
  const hasIncome = recent.filter((a) => (a.income ?? 0) > 0).length;
  const money = Math.min(10, hasCost) + Math.min(10, hasIncome * 3);
  const moneyPts = Math.min(20, money);

  // 3. Harvests and sales recorded
  const harvests = i.activities.filter((a) => a.kind === 'harvest' || a.kind === 'sale').length;
  const harvestPts = Math.min(15, harvests * 5);

  // 4. Land mapped
  const mapped = i.plots.filter((p) => p.boundary.length >= 1).length + i.tracePlots.length;
  const landPts = Math.min(10, mapped * 5);

  // 5. Learning
  const done = i.lessons.filter((l) => l.completedAt).length;
  const learnPts = Math.min(15, done * 3);

  // 6. Repayment / credit history
  const approved = i.loans.filter((l) => l.status === 'approved').length;
  const repayPts = Math.min(10, approved * 5);

  // 7. Farm care — scans with follow-up completed
  const followed = i.scans.filter((s) => s.followUpDone).length;
  const carePts = Math.min(5, followed * 2 + (i.scans.length ? 1 : 0));

  const parts: ScorePart[] = [
    { key: 'consistency', label: 'Records kept regularly', points: consistency, max: 25, tip: 'Record at least one activity every week.' },
    { key: 'money', label: 'Costs and sales recorded', points: moneyPts, max: 20, tip: 'Log what you spend and every sale you make.' },
    { key: 'harvest', label: 'Harvests recorded', points: harvestPts, max: 15, tip: 'Record your harvest quantity at each harvest.' },
    { key: 'learning', label: 'Lessons completed', points: learnPts, max: 15, tip: 'Finish lessons in Kungula Academy (3 points each).' },
    { key: 'land', label: 'Land mapped', points: landPts, max: 10, tip: 'Map your plots by walking the boundary.' },
    { key: 'repay', label: 'Loan repayment history', points: repayPts, max: 10, tip: 'Repay partner loans on time to build history.' },
    { key: 'care', label: 'Farm problems followed up', points: carePts, max: 5, tip: 'Complete the 7-day follow-up after a Scan.' },
  ];
  const score = Math.max(0, Math.min(100, parts.reduce((a, p) => a + p.points, 0)));
  const band = score >= 70 ? 'Strong' : score >= 45 ? 'Good' : score >= 25 ? 'Building' : 'Starting';
  return { score, parts, band };
}

export function topTips(parts: ScorePart[], n = 2) {
  return parts
    .filter((p) => p.points < p.max)
    .sort((a, b) => (b.max - b.points) - (a.max - a.points))
    .slice(0, n);
}
