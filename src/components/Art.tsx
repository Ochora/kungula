// Hand-built SVG illustrations. They need no internet, weigh almost nothing,
// and give every farm and farmer a recognisable picture until real photos
// are added.
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { levelOf, BADGES } from '../lib/game';

function hash(s: string) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h); }
const pick = <T,>(arr: T[], n: number) => arr[n % arr.length];

/* ---------------- Farmer portrait ---------------- */
const SKIN = ['#5a3825', '#6b4430', '#7c4f35', '#8d5b3d', '#4a2e1f', '#9b6a48'];
const BG = ['#f2b31c', '#2b7a46', '#c86a3c', '#3d6e8f', '#8a5a3b', '#6a8f2e'];
const CLOTH = ['#1f6b3a', '#b5502c', '#2d4f7a', '#f2a900', '#7a2e5a', '#3a3a3a', '#e7e1d2'];
const WRAP = ['#d6402b', '#f2a900', '#2d6fb3', '#7a2e5a', '#1f6b3a'];

export function Avatar({ name, photo, size = 48, round = false, style }: { name: string; photo?: string; size?: number; round?: boolean; style?: React.CSSProperties }) {
  const r = round ? size / 2 : size * 0.32;
  if (photo) return <img src={photo} alt={name} width={size} height={size} style={{ width: size, height: size, borderRadius: r, objectFit: 'cover', flex: 'none', ...style }} />;
  const h = hash(name || 'farmer');
  const skin = pick(SKIN, h); const bg = pick(BG, h >> 3); const cloth = pick(CLOTH, h >> 5);
  const head = h % 4; // 0 headwrap, 1 short hair, 2 cap, 3 hat
  const wrap = pick(WRAP, h >> 7);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ borderRadius: r, flex: 'none', ...style }} role="img" aria-label={name}>
      <rect width="100" height="100" fill={bg} />
      <circle cx="80" cy="18" r="22" fill="#fff" opacity=".12" />
      <path d="M14 104 C16 76 30 68 50 68 C70 68 84 76 86 104Z" fill={cloth} />
      <path d="M40 66 L50 78 L60 66" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="3" />
      <rect x="43" y="56" width="14" height="14" rx="5" fill={skin} />
      <ellipse cx="50" cy="44" rx="17" ry="20" fill={skin} />
      <ellipse cx="33.5" cy="46" rx="3" ry="4.5" fill={skin} /><ellipse cx="66.5" cy="46" rx="3" ry="4.5" fill={skin} />
      <circle cx="43.5" cy="45" r="2.2" fill="#1b120c" /><circle cx="56.5" cy="45" r="2.2" fill="#1b120c" />
      <path d="M44 54 Q50 58.5 56 54" fill="none" stroke="#1b120c" strokeWidth="2" strokeLinecap="round" />
      {head === 0 && (<><path d="M31 40 C30 20 70 20 69 40 C66 31 34 31 31 40Z" fill={wrap} /><path d="M33 34 C34 14 66 14 67 34 C72 26 66 8 50 10 C34 8 27 24 33 34Z" fill={wrap} /><path d="M38 22 Q50 14 62 22" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2.5" /></>)}
      {head === 1 && <path d="M32 42 C30 24 42 20 50 20 C58 20 70 24 68 42 C66 32 60 28 50 28 C40 28 34 32 32 42Z" fill="#1b120c" />}
      {head === 2 && (<><path d="M32 38 C32 22 68 22 68 38Z" fill={cloth} /><path d="M58 36 L80 38 L68 32Z" fill={cloth} /><circle cx="50" cy="24" r="2" fill="rgba(255,255,255,.4)" /></>)}
      {head === 3 && (<><ellipse cx="50" cy="31" rx="30" ry="6" fill="#c9a35a" /><path d="M36 31 C36 16 64 16 64 31Z" fill="#d9b66a" /><rect x="36" y="26" width="28" height="4" fill="#7a4e2d" /></>)}
    </svg>
  );
}

/* ---------------- Little farm sprites ---------------- */
function Banana({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-2" y="-22" width="4" height="22" rx="2" fill="#5b7a2a" />
      <path d="M0 -20 C-14 -30 -26 -24 -30 -16 C-20 -20 -10 -20 0 -18Z" fill="#3f8f3a" />
      <path d="M0 -20 C14 -32 26 -26 30 -18 C20 -22 10 -22 0 -18Z" fill="#4ea445" />
      <path d="M0 -22 C-6 -38 -2 -46 4 -48 C2 -38 4 -30 0 -22Z" fill="#5cb350" />
      <path d="M2 -16 q6 2 4 10 q-5 -2 -4 -10z" fill="#e8c43a" />
    </g>
  );
}
function Coffee({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="-10" rx="11" ry="12" fill="#1f5a2f" />
      <ellipse cx="-4" cy="-14" rx="6" ry="6" fill="#2f7a40" />
      <circle cx="4" cy="-8" r="1.8" fill="#c62828" /><circle cx="-3" cy="-5" r="1.8" fill="#c62828" /><circle cx="6" cy="-14" r="1.6" fill="#e04b3a" />
    </g>
  );
}
function Maize({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 V-30" stroke="#6c9a2f" strokeWidth="2.5" />
      <path d="M0 -10 q-10 -4 -14 -12 q8 2 14 8z M0 -18 q10 -4 14 -12 q-8 2 -14 8z M0 -24 q-8 -4 -10 -10 q6 2 10 6z" fill="#7cb342" />
      <path d="M1 -28 l3 -6 l-1 6 z" fill="#d8b23a" /><ellipse cx="3" cy="-14" rx="2.5" ry="5" fill="#f2c64a" />
    </g>
  );
}
function Cow({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <rect x="-14" y="-15" width="26" height="12" rx="6" fill="#f3efe6" />
      <circle cx="-6" cy="-11" r="3.5" fill="#3b2a20" /><circle cx="5" cy="-8" r="2.6" fill="#3b2a20" />
      <rect x="-12" y="-5" width="3" height="7" fill="#e6dfd2" /><rect x="7" y="-5" width="3" height="7" fill="#e6dfd2" />
      <path d="M12 -16 h9 a3 3 0 0 1 3 3 v4 a3 3 0 0 1 -3 3 h-7z" fill="#f3efe6" />
      <path d="M14 -17 q-3 -6 -8 -6 M21 -17 q3 -6 8 -6" stroke="#d9cbb0" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx="22" cy="-8" rx="3" ry="2" fill="#e8a0a0" />
    </g>
  );
}
function Chicken({ x, y, s = 1, peck = false }: { x: number; y: number; s?: number; peck?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className={peck ? 'peck' : undefined}>
        <ellipse cx="0" cy="-7" rx="8" ry="6.5" fill="#c9733a" />
        <circle cx="7" cy="-13" r="4" fill="#d9844a" />
        <path d="M6 -18 q1 -3 3 -1 q1 -3 3 0 q0 3 -3 2z" fill="#d32f2f" />
        <path d="M11 -13 l4 1 l-4 1z" fill="#f2a900" /><circle cx="8" cy="-14" r=".9" fill="#1b120c" />
        <path d="M-8 -9 q-6 -6 -4 -10 q3 4 6 5z" fill="#7a3d1d" />
      </g>
      <path d="M-2 -1 v3 M2 -1 v3" stroke="#f2a900" strokeWidth="1.4" />
    </g>
  );
}
function Goat({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-11" y="-13" width="20" height="9" rx="4.5" fill="#6d4c33" />
      <rect x="-9" y="-5" width="2.5" height="6" fill="#5a3d28" /><rect x="5" y="-5" width="2.5" height="6" fill="#5a3d28" />
      <path d="M8 -12 l7 -6 l3 3 l-4 6z" fill="#6d4c33" /><path d="M14 -18 q1 -5 -3 -6" stroke="#3b2a20" strokeWidth="1.6" fill="none" />
      <path d="M17 -11 l1 4" stroke="#e9e1d0" strokeWidth="2" />
    </g>
  );
}
function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.8" y="-14" width="3.6" height="14" fill="#5a3d28" />
      <path d="M-20 -14 C-18 -26 -6 -30 0 -30 C8 -30 18 -26 20 -14 Z" fill="#2c6b34" />
      <path d="M-14 -20 C-8 -26 6 -27 14 -20" stroke="#3f8a45" strokeWidth="3" fill="none" />
    </g>
  );
}

/* ---------------- The growing plant (gamification) ---------------- */
export function GrowingPlant({ stage, x = 0, y = 0, s = 1, animate = false }: { stage: number; x?: number; y?: number; s?: number; animate?: boolean }) {
  const a = (cls: string) => (animate ? cls : undefined);
  const h = [6, 16, 26, 36, 44, 50, 56, 62][Math.max(0, Math.min(7, stage))];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="18" ry="4.5" fill="#6b3f22" />
      <path d="M-14 0 h28 l-3 12 h-22z" fill="#b5502c" /><rect x="-16" y="-3" width="32" height="5" rx="2" fill="#c86a3c" />
      {stage === 0 && <ellipse cx="0" cy="-3" rx="4" ry="3" fill="#7a4e2d" />}
      {stage >= 1 && (
        <>
          <path className={a('g-stem')} d={`M0 -2 C ${stage > 3 ? -3 : -1} ${-h / 2} ${stage > 3 ? 3 : 1} ${-h * 0.8} 0 ${-h}`} stroke="#2f8a3f" strokeWidth={2.4 + stage * 0.35} fill="none" strokeLinecap="round" />
          <path className={a('g-leaf l1')} d={`M0 ${-h * 0.45} C -10 ${-h * 0.5} -16 ${-h * 0.62} -18 ${-h * 0.75} C -8 ${-h * 0.75} -3 ${-h * 0.62} 0 ${-h * 0.5}Z`} fill="#4caf50" />
          <path className={a('g-leaf l2')} d={`M0 ${-h * 0.62} C 10 ${-h * 0.66} 16 ${-h * 0.78} 18 ${-h * 0.92} C 8 ${-h * 0.92} 3 ${-h * 0.78} 0 ${-h * 0.67}Z`} fill="#66bb6a" />
        </>
      )}
      {stage >= 3 && <path className={a('g-leaf l1')} d={`M0 ${-h * 0.25} C -9 ${-h * 0.25} -14 ${-h * 0.34} -15 ${-h * 0.44} C -7 ${-h * 0.44} -2 ${-h * 0.36} 0 ${-h * 0.3}Z`} fill="#388e3c" />}
      {stage >= 4 && <g className={a('g-bud')}><circle cx="0" cy={-h - 3} r="5" fill="#f2a900" /><circle cx="0" cy={-h - 3} r="2.2" fill="#b5502c" /></g>}
      {stage >= 5 && <g className={a('g-bud')}><circle cx="-7" cy={-h * 0.72} r="3.6" fill="#e53935" /><circle cx="8" cy={-h * 0.86} r="3.4" fill="#e53935" /></g>}
      {stage >= 7 && <g className={a('g-bud')}><circle cx="-12" cy={-h * 0.5} r="3" fill="#ffb300" /><circle cx="12" cy={-h * 0.55} r="3" fill="#ffb300" /></g>}
    </g>
  );
}

function WateringCan({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="can">
        <path d="M0 0 h22 l-2 16 h-18z" fill="#3d6e8f" />
        <path d="M22 4 l16 -10 l2 3 l-15 11z" fill="#3d6e8f" />
        <ellipse cx="39" cy="-6" rx="3.5" ry="2" fill="#2d5675" transform="rotate(-30 39 -6)" />
        <path d="M3 0 q8 -12 16 0" stroke="#2d5675" strokeWidth="3" fill="none" />
        {[0, 1, 2, 3].map((i) => <circle key={i} className="g-drop" cx={40 + (i % 2) * 3} cy={-2} r="1.6" fill="#64b5f6" style={{ animationDelay: `${0.35 + i * 0.12}s` }} />)}
      </g>
    </g>
  );
}

/* ---------------- Farm landscape ---------------- */
type Tod = 'dawn' | 'day' | 'dusk' | 'night';
export function timeOfDay(d = new Date()): Tod {
  const h = d.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'dusk';
  return 'night';
}
const SKY: Record<Tod, [string, string]> = {
  dawn: ['#f6b26b', '#fde3a7'], day: ['#6fb7d9', '#cfeaf2'], dusk: ['#c8553d', '#f3a65a'], night: ['#0b1f33', '#24405a'],
};

export function useDark() {
  const theme = useStore((s) => s.settings.theme ?? 'system');
  const [sysDark, setSysDark] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const f = () => setSysDark(mq.matches);
    mq.addEventListener?.('change', f);
    return () => mq.removeEventListener?.('change', f);
  }, []);
  return theme === 'dark' || (theme === 'system' && sysDark);
}

/**
 * A terraced Ugandan hillside showing the things on this farm.
 * Sky follows the time of day; dark theme turns it to night.
 */
export function FarmScene({ things = [], seed = 'kungula', plantStage, plantAt = 'corner', height = 210, tod, className = 'scene' }: { things?: string[]; seed?: string; plantStage?: number; plantAt?: 'corner' | 'hill'; height?: number; tod?: Tod; className?: string }) {
  const dark = useDark();
  const t: Tod = tod ?? (dark ? 'night' : timeOfDay());
  const [s1, s2] = SKY[t];
  const night = t === 'night';
  const h = hash(seed);
  const W = 400, H = height;
  const id = useMemo(() => 'sky' + (h % 100000) + t, [h, t]);
  const hill = (c: string) => (night ? shade(c, -0.45) : c);
  const mid: React.ReactNode[] = [];
  const near: React.ReactNode[] = [];
  const crops = things.filter((x) => ['banana', 'coffee', 'maize', 'beans', 'cassava', 'tomato', 'soya', 'sesame', 'groundnuts', 'rice', 'cabbage', 'onion'].includes(x));
  const animals = things.filter((x) => ['cattle', 'poultry', 'goats', 'pigs', 'sheep'].includes(x));
  const midY = H * 0.62;
  // crops on the middle terrace
  const pasture = !crops.length && animals.length > 0;
  const cropList = crops.length ? crops : ['banana', 'coffee'];
  if (pasture) {
    // grazing land: animals on the terrace, grass tufts instead of crops
    for (let i = 0; i < 9; i++) mid.push(<path key={'g' + i} d={`M${20 + i * 44 + ((h >> i) % 10)} ${midY + (i % 2) * 5} q2 -8 4 0 q2 -6 4 0`} stroke="#2f6b25" strokeWidth="2" fill="none" />);
    animals.forEach((a, i) => {
      const x = 90 + i * 120 + ((h >> (i + 2)) % 30); const y = midY + 4;
      if (a === 'cattle') { mid.push(<Cow key={'m' + i} x={x} y={y} s={0.9} />); mid.push(<Cow key={'n' + i} x={x + 60} y={y + 6} s={0.8} flip />); }
      else if (a === 'poultry') mid.push(<Chicken key={'m' + i} x={x} y={y} s={0.9} peck />);
      else mid.push(<Goat key={'m' + i} x={x} y={y} s={0.9} />);
    });
  }
  for (let i = 0; i < (pasture ? 0 : 7); i++) {
    const c = cropList[i % cropList.length];
    const x = 30 + i * 52 + ((h >> i) % 14);
    const y = midY + ((i % 2) * 6);
    if (c === 'banana' || c === 'cassava') mid.push(<Banana key={'c' + i} x={x} y={y} s={0.9} />);
    else if (c === 'coffee') mid.push(<Coffee key={'c' + i} x={x} y={y} s={1} />);
    else mid.push(<Maize key={'c' + i} x={x} y={y} s={0.95} />);
  }
  const fy = H * 0.86;
  animals.slice(0, 3).forEach((a, i) => {
    const x = 70 + i * 95 + ((h >> (i + 3)) % 20);
    if (a === 'cattle') near.push(<Cow key={'a' + i} x={x} y={fy} s={1.05} flip={i % 2 === 1} />);
    else if (a === 'poultry') { near.push(<Chicken key={'a' + i} x={x} y={fy} s={1} />); near.push(<Chicken key={'b' + i} x={x + 18} y={fy + 4} s={0.85} />); }
    else near.push(<Goat key={'a' + i} x={x} y={fy} s={1.05} />);
  });
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Farm illustration">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={s1} /><stop offset="1" stopColor={s2} /></linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} />
      {night ? (
        <>
          {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(h * (i + 3) * 7) % W} cy={((h >> 2) * (i + 1) * 13) % (H * 0.45)} r={i % 5 ? 0.9 : 1.6} fill="#fff" opacity={0.5 + (i % 3) * 0.2} />)}
          <circle cx={W * 0.8} cy={H * 0.2} r="16" fill="#f5edd0" /><circle cx={W * 0.8 + 7} cy={H * 0.2 - 4} r="14" fill={s1} />
        </>
      ) : (
        <circle cx={W * 0.8} cy={t === 'day' ? H * 0.2 : H * 0.36} r={t === 'day' ? 22 : 28} fill={t === 'day' ? '#ffd54f' : '#ffcc66'} opacity=".95" />
      )}
      {/* far hills */}
      <path d={`M0 ${H * 0.48} C ${W * 0.2} ${H * 0.3} ${W * 0.35} ${H * 0.42} ${W * 0.5} ${H * 0.36} S ${W * 0.85} ${H * 0.28} ${W} ${H * 0.42} V ${H} H0Z`} fill={hill('#7fa86a')} />
      {/* terraced middle hill */}
      <path d={`M0 ${H * 0.58} C ${W * 0.25} ${H * 0.46} ${W * 0.55} ${H * 0.5} ${W} ${H * 0.52} V ${H} H0Z`} fill={hill('#4f8d3c')} />
      {[0, 1, 2].map((i) => <path key={i} d={`M0 ${H * (0.62 + i * 0.05)} C ${W * 0.3} ${H * (0.52 + i * 0.05)} ${W * 0.6} ${H * (0.56 + i * 0.05)} ${W} ${H * (0.57 + i * 0.05)}`} stroke={hill('#3c7a2e')} strokeWidth="2" fill="none" opacity=".7" />)}
      <Tree x={W * 0.08} y={H * 0.56} s={0.9} />
      <Tree x={W * 0.92} y={H * 0.55} s={1.1} />
      <g opacity={night ? 0.75 : 1}>{mid}</g>
      {/* near field: murram path */}
      <path d={`M0 ${H * 0.76} C ${W * 0.3} ${H * 0.7} ${W * 0.7} ${H * 0.74} ${W} ${H * 0.72} V ${H} H0Z`} fill={hill('#356e2a')} />
      <path d={`M${W * 0.52} ${H} C ${W * 0.5} ${H * 0.9} ${W * 0.62} ${H * 0.82} ${W * 0.7} ${H * 0.74} L ${W * 0.74} ${H * 0.74} C ${W * 0.68} ${H * 0.84} ${W * 0.6} ${H * 0.92} ${W * 0.64} ${H}Z`} fill={hill('#b5502c')} opacity=".9" />
      <g opacity={night ? 0.8 : 1}>{pasture ? null : near}</g>
      {plantStage !== undefined && (plantAt === 'hill' ? <GrowingPlant stage={plantStage} x={W * 0.56} y={H * 0.66} s={0.85} /> : <GrowingPlant stage={plantStage} x={W * 0.12} y={H * 0.96} s={0.95} />)}
    </svg>
  );
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 + amt))));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map((c) => c.toString(16).padStart(2, '0')).join('');
}

/* ---------------- Opening animation ---------------- */
const SCENES = ['sprout', 'chick', 'cow', 'sunrise'] as const;

export function Intro({ onDone }: { onDone: () => void }) {
  const [scene] = useState(() => SCENES[Math.floor(Math.random() * SCENES.length)]);
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="intro" onClick={onDone} role="presentation">
      <div>
        <svg viewBox="-60 -90 120 110" aria-hidden="true">
          <ellipse cx="0" cy="12" rx="56" ry="8" fill="rgba(0,0,0,.2)" />
          {scene === 'sprout' && (
            <>
              <WateringCan x={-58} y={-70} s={1} />
              <GrowingPlant stage={4} s={1.25} animate />
            </>
          )}
          {scene === 'chick' && (
            <>
              <path d="M-16 6 C-16 -26 16 -26 16 6 Z" fill="#f5ead7" />
              <g className="chick-in"><circle cx="0" cy="-16" r="10" fill="#ffd54f" /><circle cx="3" cy="-18" r="1.4" fill="#1b120c" /><path d="M8 -16 l5 2 l-5 2z" fill="#f2a900" /></g>
              <path className="hatch-top" d="M-16 -8 C-14 -30 14 -30 16 -8 L10 -12 L4 -6 L-2 -12 L-8 -6Z" fill="#f5ead7" />
              <Chicken x={34} y={10} s={1.5} peck />
            </>
          )}
          {scene === 'cow' && (
            <>
              <circle className="g-sun" cx="22" cy="-50" r="18" fill="#ffc23d" />
              <path d="M-60 10 C-30 -10 30 -10 60 10Z" fill="#4f8d3c" />
              <g className="walk"><Cow x={0} y={6} s={2} /></g>
            </>
          )}
          {scene === 'sunrise' && (
            <>
              <circle className="g-sun" cx="0" cy="-30" r="26" fill="#ffc23d" />
              <path d="M-60 12 C-30 -14 30 -14 60 12Z" fill="#4f8d3c" />
              <g className="g-bud"><Banana x={-26} y={4} s={1.3} /><Coffee x={4} y={6} s={1.4} /><Maize x={30} y={6} s={1.4} /></g>
            </>
          )}
        </svg>
        <div className="word">kungula</div>
        <div className="tag">Lima n’amagezi, kungula bingi</div>
      </div>
    </div>
  );
}

/* ---------------- Reward when the farmer enters information ---------------- */
export function RewardLayer() {
  const ev = useStore((s) => s.lastReward);
  const gamify = useStore((s) => s.settings.gamify ?? true);
  const xp = useStore((s) => s.game.xp);
  const [shown, setShown] = useState<typeof ev>();
  useEffect(() => {
    if (!ev || !gamify || Date.now() - ev.at > 4000) return;
    setShown(ev);
    const t = setTimeout(() => setShown(undefined), ev.kind === 'water' || ev.kind === 'grow' ? 2600 : 3100);
    return () => clearTimeout(t);
  }, [ev, gamify]);
  if (!shown) return null;
  const lv = levelOf(xp);
  const big = shown.kind === 'level' || shown.kind === 'badge';
  return (
    <div className={'reward' + (big ? ' big' : '')} key={shown.id} role="status" aria-live="polite">
      <svg viewBox="-34 -70 80 84" aria-hidden="true">
        {shown.kind === 'badge' && shown.badge
          ? <text x="6" y="-14" fontSize="48" textAnchor="middle">{BADGES[shown.badge]?.icon}</text>
          : <><GrowingPlant stage={lv.index} s={0.9} animate={big} />{!big && <WateringCan x={-30} y={-62} s={0.8} />}</>}
      </svg>
      <div>
        <div className="xpnum">+{shown.xp} XP</div>
        <div className="small" style={{ fontWeight: 700 }}>{shown.label}</div>
        {!big && <div className="tiny muted">You watered your plant 💧</div>}
        {big && shown.kind === 'level' && <div className="small muted">Keep recording to reach {lv.next?.name ?? 'the top'}.</div>}
      </div>
    </div>
  );
}
