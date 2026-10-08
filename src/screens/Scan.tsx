import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Camera, Image as ImageIcon, CheckSquare, Square, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useStore, uid } from '../lib/store';
import { SYMPTOMS } from '../data/conditions';
import { subjectIcon, subjectName } from '../data/catalog';
import { rankConditions } from '../lib/diagnose';
import { takePhoto, scheduleReminder, PhotoError } from '../lib/native';
import { compressImage, ago } from '../lib/util';
import { analysePhoto, type VisionResult } from '../lib/vision';
import { onlinePhotoOpinion } from '../lib/jjajja';
import { TopBar, Empty } from '../components/ui';
import { useT } from '../lib/i18n';

const SUPPORTED = Object.keys(SYMPTOMS);
const ANIMAL = ['poultry', 'cattle', 'goats', 'pigs'];

export default function Scan({ online }: { online: boolean }) {
  const t = useT();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const profile = useStore((s) => s.profile)!;
  const plots = useStore((s) => s.plots);
  const scans = useStore((s) => s.scans);
  const settings = useStore((s) => s.settings);
  const upsert = useStore((s) => s.upsert);
  const initial = params.get('subject') ?? undefined;
  const [subject, setSubject] = useState<string | undefined>(initial && SUPPORTED.includes(initial) ? initial : undefined);
  const [photo, setPhoto] = useState<string>();
  const [vision, setVision] = useState<VisionResult>();
  const [showOverlay, setShowOverlay] = useState(true);
  const [signs, setSigns] = useState<string[]>([]);
  const [plotId, setPlotId] = useState('');
  const [step, setStep] = useState<0 | 1 | 'analysing' | 2>(initial && SUPPORTED.includes(initial) ? 1 : 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const mine = [...profile.crops, ...profile.animals].filter((x) => SUPPORTED.includes(x));
  const others = SUPPORTED.filter((x) => !mine.includes(x));

  const getPhoto = async (src: 'camera' | 'gallery') => {
    setErr('');
    let p: string | undefined;
    try { p = await takePhoto(src); }
    catch (e) { setErr(e instanceof PhotoError ? e.message : 'Could not get a photo. Try the gallery instead.'); return; }
    if (!p || !subject) return;
    const small = await compressImage(p, 720, 0.7);
    setPhoto(small); setStep('analysing');
    const started = Date.now();
    try {
      const v = await analysePhoto(small, subject);
      setVision(v);
      setSigns(v.signs);
    } catch {
      setVision(undefined);
    }
    // let the farmer see the scan happen
    const wait = Math.max(0, 1600 - (Date.now() - started));
    setTimeout(() => setStep(2), wait);
  };

  const analyse = async () => {
    if (!subject) return;
    setBusy(true);
    const ranked = rankConditions(subject, signs);
    const rec = {
      id: uid(), date: Date.now(), subject, photo, symptoms: signs,
      results: ranked.map((r) => ({ conditionId: r.condition.id, confidence: Math.round(r.confidence * 100) / 100 })),
      plotId: plotId || undefined,
      vision: vision ? { health: vision.health, notes: vision.notes, auto: vision.signs, overlay: vision.overlay } : undefined,
    };
    upsert('scans', rec);
    const due = new Date(Date.now() + 7 * 86400000); due.setHours(8, 0, 0, 0);
    const title = `Check ${subjectName(subject).toLowerCase()} — did treatment work?`;
    const notifId = await scheduleReminder('Kungula follow-up', title, due);
    useStore.getState().set({ reminders: [{ id: uid(), title, due: due.toISOString(), done: false, source: 'scan', notifId }, ...useStore.getState().reminders] });
    if (photo && online && settings.aiKey) {
      try {
        const aiText = await onlinePhotoOpinion(photo, subject, signs, settings.aiKey, settings.aiModel || undefined);
        upsert('scans', { ...rec, aiText });
      } catch { /* the offline result stands */ }
    }
    setBusy(false);
    nav(`/scan/${rec.id}`, { replace: true });
  };

  const choose = (id: string) => { setSubject(id); setStep(1); setPhoto(undefined); setVision(undefined); setSigns([]); setErr(''); };

  return (
    <>
      <TopBar title={t('scanMyFarm')} back={step !== 0 || !!initial} />
      <main className="page">
        {step === 0 && (
          <>
            <div className="hero">
              <div className="sun" />
              <div className="display" style={{ fontSize: '1.5rem' }}>What looks sick?</div>
              <p className="small muted" style={{ margin: '4px 0 0' }}>Take a photo. Kungula checks the leaf colours and spots on your phone, even without internet, then asks you a few questions.</p>
            </div>
            {mine.length > 0 && <div className="section-title">On your farm</div>}
            <div className="grid3">
              {mine.map((id) => <button key={id} className="tile" onClick={() => choose(id)}><span className="emoji">{subjectIcon(id)}</span>{subjectName(id)}</button>)}
            </div>
            <div className="section-title">Other crops and animals</div>
            <div className="grid3">
              {others.map((id) => <button key={id} className="tile" onClick={() => choose(id)}><span className="emoji">{subjectIcon(id)}</span>{subjectName(id)}</button>)}
            </div>
            {scans.length > 0 && (
              <>
                <div className="section-title">Past checks</div>
                <div className="card">
                  <ul className="list">
                    {scans.slice(0, 8).map((s) => (
                      <li key={s.id}>
                        <Link to={`/scan/${s.id}`} className="row grow" style={{ textDecoration: 'none', color: 'inherit' }}>
                          {s.photo ? <img src={s.photo} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} /> : <div className="avatar">{subjectIcon(s.subject)}</div>}
                          <div className="grow">
                            <b>{subjectName(s.subject)}</b>
                            <div className="small muted">{s.results[0] ? `${Math.round(s.results[0].confidence * 100)}% match` : 'No clear match'} · {ago(s.date)}</div>
                          </div>
                          {!s.followUpDone && Date.now() - s.date > 6 * 86400000 && <span className="badge gold">Check</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </>
        )}

        {step === 1 && subject && (
          <>
            <div className="row"><span style={{ fontSize: '2.2rem' }}>{subjectIcon(subject)}</span><h2 className="display" style={{ fontSize: '1.4rem' }}>Photograph the sick {ANIMAL.includes(subject) ? 'animal' : 'leaves'}</h2></div>
            <div className="card flat mt">
              <b>For a good result</b>
              <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {ANIMAL.includes(subject)
                  ? <><li>Show the sick sign closely: eyes, mouth, skin or droppings.</li><li>{subject === 'poultry' ? 'A photo of fresh droppings lets Kungula check their colour.' : 'Kungula keeps the photo with your record so a vet can see it.'}</li></>
                  : <><li>Go close: one or two leaves should fill the screen.</li><li>Use daylight, not the flash. Avoid strong shadows.</li><li>Hold still so the photo is sharp.</li></>}
              </ul>
            </div>
            <div className="grid2 mt2">
              <button className="btn" style={{ minHeight: 96, flexDirection: 'column' }} onClick={() => getPhoto('camera')}><Camera size={30} />Take photo</button>
              <button className="btn soft" style={{ minHeight: 96, flexDirection: 'column' }} onClick={() => getPhoto('gallery')}><ImageIcon size={30} />From gallery</button>
            </div>
            {err && <div className="alert urgent mt"><span className="a-ico">📷</span><div><b>Photo problem</b><span className="small">{err}</span></div></div>}
            <button className="btn ghost block mt" onClick={() => setStep(2)}>Answer questions without a photo</button>
          </>
        )}

        {step === 'analysing' && photo && (
          <>
            <div className="photo-frame"><img src={photo} alt="Your photo" /><div className="scanline" /></div>
            <div className="center mt2"><div className="display" style={{ fontSize: '1.3rem' }}><span className="sprout">🌱</span> Checking your photo…</div><p className="small muted">Looking at colours, spots and streaks on the leaf.</p></div>
          </>
        )}

        {step === 2 && subject && (
          <>
            {photo && (
              <div className="photo-frame mb">
                <img src={photo} alt="Your photo" />
                {vision?.overlay && showOverlay && <img className="overlay" src={vision.overlay} alt="Affected areas highlighted" />}
                {vision?.overlay && (
                  <button className="btn sm glass" style={{ position: 'absolute', right: 10, bottom: 10, background: 'rgba(0,0,0,.45)' }} onClick={() => setShowOverlay(!showOverlay)}>
                    {showOverlay ? <EyeOff size={16} /> : <Eye size={16} />} {showOverlay ? 'Hide marks' : 'Show marks'}
                  </button>
                )}
              </div>
            )}
            {vision && <VisionCard v={vision} subject={subject} />}

            <h2 className="display mt2" style={{ fontSize: '1.3rem' }}>Which of these do you see?</h2>
            <p className="small muted" style={{ marginTop: 2 }}>{vision?.signs.length ? 'Signs found in your photo are already ticked. Untick any that are wrong and tick anything else you see.' : 'Tick every sign that matches. More signs give a better answer.'}</p>
            <div className="card">
              {(SYMPTOMS[subject] ?? []).map((s) => {
                const on = signs.includes(s.id);
                const auto = vision?.signs.includes(s.id);
                return (
                  <button key={s.id} className="row" style={{ width: '100%', background: 'none', border: 'none', padding: '12px 2px', textAlign: 'left', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
                    onClick={() => setSigns(on ? signs.filter((x) => x !== s.id) : [...signs, s.id])}>
                    {on ? <CheckSquare className="tint" size={26} /> : <Square style={{ color: 'var(--muted)' }} size={26} />}
                    <span className="grow" style={{ fontWeight: on ? 700 : 500 }}>{s.label}</span>
                    {auto && <span className="badge gold"><Sparkles size={12} /> In photo</span>}
                  </button>
                );
              })}
            </div>
            {plots.filter((p) => p.crop === subject).length > 0 && (
              <label className="field"><span>Which plot? (optional)</span>
                <select className="input" value={plotId} onChange={(e) => setPlotId(e.target.value)}>
                  <option value="">—</option>
                  {plots.filter((p) => p.crop === subject).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            )}
            <button className="btn block gold mt2" disabled={!signs.length || busy} onClick={analyse}>
              {busy ? <><span className="spinner" /> Working…</> : 'Get diagnosis'}
            </button>
            {!signs.length && <p className="small muted center">{vision && vision.health >= 85 ? 'Your plant looks healthy. If you still see a problem, tick it above.' : 'Tick at least one sign.'}</p>}
            {online && settings.aiKey && photo && <p className="tiny muted center">Your photo will also get an online AI second opinion.</p>}
          </>
        )}
        {step === 2 && !subject && <Empty emoji="🤔" title="Choose what is affected first" />}
      </main>
    </>
  );
}

function VisionCard({ v, subject }: { v: VisionResult; subject: string }) {
  const animal = ANIMAL.includes(subject);
  return (
    <div className="card">
      <div className="row between"><h2><Sparkles size={18} className="tint" /> Photo check</h2>{!animal && <span className={'badge ' + (v.health >= 80 ? '' : v.health >= 55 ? 'gold' : 'red')}>{v.health}% healthy</span>}</div>
      {!v.quality.ok && <div className="alert warn mt"><span className="a-ico">📷</span><div><b>Retake for a better result</b><span className="small">{v.quality.issue}</span></div></div>}
      {!animal && (
        <div className="row mt" style={{ gap: 4, height: 12, borderRadius: 6, overflow: 'hidden' }}>
          {([['green', '#43a047'], ['yellow', '#f2a900'], ['orange', '#ff7000'], ['brown', '#c62828'], ['dark', '#5d1a1a'], ['white', '#2196f3'], ['purple', '#9c27b0']] as const).map(([k, c]) => {
            const w = v.share[k]; return w > 0.005 ? <span key={k} title={k} style={{ flex: w, background: c, height: '100%' }} /> : null;
          })}
        </div>
      )}
      <ul className="small" style={{ margin: '10px 0 0', paddingLeft: 18 }}>{v.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      {!animal && <p className="tiny muted" style={{ marginBottom: 0 }}>Marks on the photo: gold = yellowing, red = brown or dead tissue, orange = rust-like powder, blue = white mould.</p>}
    </div>
  );
}
