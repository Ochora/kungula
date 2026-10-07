import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2 } from 'lucide-react';
import type { LatLng } from '../lib/types';
import { speak } from '../lib/native';
import { useStore } from '../lib/store';

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="50" fill="#FBF6EA" />
      <path d="M22 52 A28 28 0 0 1 78 52 Z" fill="#F2A900" />
      <path d="M50 52 V30" stroke="#1F6B3A" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 40 C42 36 38 38 35 34 C42 32 47 34 50 40Z" fill="#1F6B3A" />
      <path d="M50 38 C57 33 62 34 66 30 C60 28 54 31 50 38Z" fill="#1F6B3A" />
      <circle cx="50" cy="28" r="3.2" fill="#1F6B3A" />
      <path d="M8 66 Q50 40 92 66 L92 74 Q50 50 8 74Z" fill="#1F6B3A" />
      <path d="M16 78 Q50 58 84 78 L80 84 Q50 66 20 84Z" fill="#1F6B3A" />
      <path d="M28 89 Q50 76 72 89 L66 94 Q50 85 34 94Z" fill="#1F6B3A" />
    </svg>
  );
}

export function TopBar({ title, back = true, right }: { title: string; back?: boolean; right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="topbar">
      {back ? (
        <button className="icon-btn" aria-label="Back" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}>
          <ArrowLeft size={24} />
        </button>
      ) : (
        <span style={{ marginLeft: 4 }}><Logo size={34} /></span>
      )}
      <h1>{title}</h1>
      {right}
    </header>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function SpeakBtn({ text, label = 'Listen' }: { text: string; label?: string }) {
  const lang = useStore((s) => s.settings.lang);
  return (
    <button className="btn sm soft" onClick={() => speak(text, lang)} aria-label={label}>
      <Volume2 size={18} /> {label}
    </button>
  );
}

export function DemoNote({ children }: { children: ReactNode }) {
  return <div className="demo-note">ⓘ {children}</div>;
}

export function Empty({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="emoji">{emoji}</div>
      <p style={{ fontWeight: 700, color: 'var(--ink)', margin: '8px 0 4px' }}>{title}</p>
      {children}
    </div>
  );
}

export function Sparkline({ values, width = 300, height = 80, color = 'var(--green)', fill = true }: { values: number[]; width?: number; height?: number; color?: string; fill?: boolean }) {
  if (values.length < 2) return null;
  const min = Math.min(...values); const max = Math.max(...values);
  const pad = 4; const span = max - min || 1;
  const pts = values.map((v, i) => [pad + (i / (values.length - 1)) * (width - pad * 2), pad + (1 - (v - min) / span) * (height - pad * 2)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Price trend">
      {fill && <path d={`${d} L${width - pad},${height} L${pad},${height} Z`} fill={color} opacity={0.12} />}
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={4} fill={color} />
    </svg>
  );
}

/** Draw a GPS polygon as a simple shape (no map tiles needed — works offline). */
export function PlotShape({ points, size = 180, live }: { points: LatLng[]; size?: number; live?: LatLng }) {
  const all = live ? [...points, live] : points;
  if (!all.length) {
    return <div style={{ width: size, height: size, borderRadius: 16, background: 'var(--green-soft)', display: 'grid', placeItems: 'center' }} className="muted small">No points yet</div>;
  }
  const lat0 = all[0].lat * Math.PI / 180;
  const xy = all.map((p) => ({ x: p.lng * Math.cos(lat0), y: -p.lat }));
  const minX = Math.min(...xy.map((p) => p.x)); const maxX = Math.max(...xy.map((p) => p.x));
  const minY = Math.min(...xy.map((p) => p.y)); const maxY = Math.max(...xy.map((p) => p.y));
  const span = Math.max(maxX - minX, maxY - minY) || 1e-6;
  const pad = 16;
  const s = (p: { x: number; y: number }) => [pad + ((p.x - minX) / span) * (size - pad * 2), pad + ((p.y - minY) / span) * (size - pad * 2)];
  const scr = xy.map(s);
  const poly = scr.slice(0, points.length);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ background: 'var(--green-soft)', borderRadius: 16 }}>
      <defs>
        <pattern id="furrow" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="#1F6B3A" strokeOpacity=".25" strokeWidth="3" />
        </pattern>
      </defs>
      {poly.length >= 3 && <polygon points={poly.map((p) => p.join(',')).join(' ')} fill="url(#furrow)" stroke="#1F6B3A" strokeWidth={3} strokeLinejoin="round" />}
      {poly.length === 2 && <line x1={poly[0][0]} y1={poly[0][1]} x2={poly[1][0]} y2={poly[1][1]} stroke="#1F6B3A" strokeWidth={3} />}
      {poly.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === 0 ? 6 : 4} fill={i === 0 ? '#F2A900' : '#1F6B3A'} />)}
      {live && <circle cx={scr[scr.length - 1][0]} cy={scr[scr.length - 1][1]} r={8} fill="#D32F2F" opacity={0.85} />}
    </svg>
  );
}

export function ScoreRing({ score, label }: { score: number; label?: string }) {
  return (
    <div className="score-ring" style={{ ['--p' as string]: score }}>
      <div><span><b>{score}</b><br /><span className="tiny muted">{label ?? 'of 100'}</span></span></div>
    </div>
  );
}

export function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="row" style={{ padding: '10px 0', cursor: 'pointer' }}>
      <div className="grow">
        <div style={{ fontWeight: 600 }}>{label}</div>
        {hint && <div className="small muted">{hint}</div>}
      </div>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} style={{ width: 24, height: 24, accentColor: '#1F6B3A' }} />
    </label>
  );
}
