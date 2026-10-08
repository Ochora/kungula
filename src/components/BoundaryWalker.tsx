import { useEffect, useRef, useState } from 'react';
import { Footprints, MapPin, Undo2, Square, Play } from 'lucide-react';
import type { LatLng } from '../lib/types';
import { watchPosition, getPosition } from '../lib/native';
import { distanceM, polygonAreaM2, m2ToAcres, m2ToHa, num } from '../lib/util';
import { PlotShape } from './ui';

/**
 * Walk a field boundary with GPS. Points are added automatically every few
 * metres while walking, or by tapping "Add corner" at each corner. Works with
 * no data connection — GPS does not need internet.
 */
export default function BoundaryWalker({ initial = [], onSave, allowPoint = true }: {
  initial?: LatLng[];
  onSave: (pts: LatLng[], areaM2: number) => void;
  allowPoint?: boolean;
}) {
  const [pts, setPts] = useState<LatLng[]>(initial);
  const [live, setLive] = useState<(LatLng & { accuracy?: number })>();
  const [walking, setWalking] = useState(false);
  const [auto, setAuto] = useState(true);
  const [err, setErr] = useState('');
  const stopRef = useRef<() => void>(undefined);
  const autoRef = useRef(auto);
  autoRef.current = auto;

  useEffect(() => () => stopRef.current?.(), []);

  const start = async () => {
    setErr(''); setWalking(true);
    stopRef.current = await watchPosition((p) => {
      setLive(p);
      if (!autoRef.current) return;
      if ((p.accuracy ?? 99) > 25) return; // ignore poor fixes
      setPts((cur) => (cur.length === 0 || distanceM(cur[cur.length - 1], p) >= 4 ? [...cur, { lat: p.lat, lng: p.lng }] : cur));
    }, (e) => setErr(e));
  };
  const stop = () => { stopRef.current?.(); stopRef.current = undefined; setWalking(false); };

  const addCorner = async () => {
    try {
      const p = live ?? await getPosition(true);
      setPts((c) => [...c, { lat: p.lat, lng: p.lng }]);
    } catch (e) { setErr(e instanceof Error ? e.message : 'No GPS'); }
  };

  const area = polygonAreaM2(pts);
  const acc = live?.accuracy;

  return (
    <div>
      <div className="row" style={{ justifyContent: 'center' }}><PlotShape points={pts} live={walking ? live : undefined} size={240} /></div>
      <div className="grid3 mt">
        <div className="stat center"><span className="v">{pts.length}</span><span className="l">points</span></div>
        <div className="stat center"><span className="v">{num(m2ToAcres(area), 2)}</span><span className="l">acres</span></div>
        <div className="stat center"><span className="v">{num(m2ToHa(area), 2)}</span><span className="l">hectares</span></div>
      </div>
      {walking && (
        <div className="small center mt" style={{ color: acc && acc > 15 ? 'var(--murram)' : 'var(--green)' }}>
          GPS accuracy: {acc ? `±${Math.round(acc)} m` : 'waiting…'} {acc && acc > 15 ? '— stand in the open and wait a moment' : ''}
        </div>
      )}
      {err && <p className="small center" style={{ color: 'var(--alert)' }}>{err}. Check that location is switched on.</p>}

      <div className="card mt" style={{ background: 'var(--green-soft)' }}>
        <b>How to map</b>
        <ol className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          <li>Stand at one corner of the plot and tap <b>Start walking</b>.</li>
          <li>Walk slowly along the boundary. Points are added every 4 m{auto ? '' : ' — or tap Add corner at each corner'}.</li>
          <li>Return to where you started and tap <b>Stop</b>, then <b>Save</b>.</li>
        </ol>
      </div>

      <label className="row mt small" style={{ cursor: 'pointer' }}>
        <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--green)' }} />
        Add points automatically while I walk
      </label>

      <div className="grid2 mt">
        {!walking
          ? <button className="btn" onClick={start}><Play size={18} /> Start walking</button>
          : <button className="btn danger" onClick={stop}><Square size={18} /> Stop</button>}
        <button className="btn soft" onClick={addCorner}><MapPin size={18} /> Add corner</button>
        <button className="btn ghost" onClick={() => setPts((c) => c.slice(0, -1))} disabled={!pts.length}><Undo2 size={18} /> Undo</button>
        <button className="btn ghost" onClick={() => confirm('Clear all points?') && setPts([])} disabled={!pts.length}>Clear</button>
      </div>
      <button className="btn gold block mt2" disabled={pts.length < (allowPoint ? 1 : 3)} onClick={() => { stop(); onSave(pts, area); }}>
        <Footprints size={18} /> Save {pts.length >= 3 ? 'boundary' : pts.length ? 'location point' : ''}
      </button>
      {allowPoint && pts.length > 0 && pts.length < 3 && <p className="tiny muted center">With fewer than 3 points the plot is saved as a single location point (allowed for small plots under 4 ha under EUDR).</p>}
    </div>
  );
}
