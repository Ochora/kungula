import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Camera, Image as ImageIcon, CheckSquare, Square } from 'lucide-react';
import { useStore, uid } from '../lib/store';
import { SYMPTOMS } from '../data/conditions';
import { subjectIcon, subjectName } from '../data/catalog';
import { rankConditions } from '../lib/diagnose';
import { takePhoto, scheduleReminder } from '../lib/native';
import { compressImage, ago } from '../lib/util';
import { onlinePhotoOpinion } from '../lib/jjajja';
import { TopBar, Empty } from '../components/ui';
import { useT } from '../lib/i18n';

const SUPPORTED = Object.keys(SYMPTOMS);

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
  const [signs, setSigns] = useState<string[]>([]);
  const [plotId, setPlotId] = useState('');
  const [step, setStep] = useState(initial ? 1 : 0);
  const [busy, setBusy] = useState(false);

  const mine = [...profile.crops, ...profile.animals].filter((x) => SUPPORTED.includes(x));
  const others = SUPPORTED.filter((x) => !mine.includes(x));

  const getPhoto = async (src: 'camera' | 'gallery') => {
    try {
      const p = await takePhoto(src);
      if (p) { setPhoto(await compressImage(p, 640, 0.65)); setStep(2); }
    } catch { /* cancelled */ }
  };

  const analyse = async () => {
    if (!subject) return;
    setBusy(true);
    const ranked = rankConditions(subject, signs);
    const rec = {
      id: uid(), date: Date.now(), subject, photo, symptoms: signs,
      results: ranked.map((r) => ({ conditionId: r.condition.id, confidence: Math.round(r.confidence * 100) / 100 })),
      plotId: plotId || undefined,
    };
    upsert('scans', rec);
    // Automatic 7-day follow-up reminder
    const due = new Date(Date.now() + 7 * 86400000); due.setHours(8, 0, 0, 0);
    const title = `Check ${subjectName(subject).toLowerCase()} — did treatment work?`;
    const notifId = await scheduleReminder('Kungula follow-up', title, due);
    upsert('reminders', { id: uid(), title, due: due.toISOString(), done: false, source: 'scan', notifId });
    // Optional online second opinion from the photo
    if (photo && online && settings.aiKey) {
      try {
        const aiText = await onlinePhotoOpinion(photo, subject, signs, settings.aiKey, settings.aiModel || undefined);
        upsert('scans', { ...rec, aiText });
      } catch { /* offline result stands */ }
    }
    setBusy(false);
    nav(`/scan/${rec.id}`, { replace: true });
  };

  return (
    <>
      <TopBar title={t('scanMyFarm')} back={step > 0 || !!initial} />
      <main className="page">
        {step === 0 && (
          <>
            <h2 style={{ fontSize: '1.2rem' }}>What is affected?</h2>
            {mine.length > 0 && <div className="section-title">Your farm</div>}
            <div className="grid3">
              {mine.map((id) => (
                <button key={id} className="tile" onClick={() => { setSubject(id); setStep(1); }}>
                  <span className="emoji">{subjectIcon(id)}</span>{subjectName(id)}
                </button>
              ))}
            </div>
            <div className="section-title">Others</div>
            <div className="grid3">
              {others.map((id) => (
                <button key={id} className="tile" onClick={() => { setSubject(id); setStep(1); }}>
                  <span className="emoji">{subjectIcon(id)}</span>{subjectName(id)}
                </button>
              ))}
            </div>

            {scans.length > 0 && (
              <>
                <div className="section-title">Past scans</div>
                <div className="card">
                  <ul className="list">
                    {scans.slice(0, 8).map((s) => (
                      <li key={s.id}>
                        <Link to={`/scan/${s.id}`} className="row grow" style={{ textDecoration: 'none', color: 'inherit' }}>
                          {s.photo ? <img src={s.photo} style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover' }} /> : <div className="avatar">{subjectIcon(s.subject)}</div>}
                          <div className="grow">
                            <b>{subjectName(s.subject)}</b>
                            <div className="small muted">{s.results[0] ? `${Math.round(s.results[0].confidence * 100)}% match` : 'No match'} · {ago(s.date)}</div>
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
            <div className="row"><span style={{ fontSize: '2rem' }}>{subjectIcon(subject)}</span><h2 style={{ fontSize: '1.2rem' }}>Take a clear photo of the {subjectName(subject).toLowerCase()}</h2></div>
            <div className="card mt" style={{ background: 'var(--green-soft)' }}>
              <b>Tips for a good photo</b>
              <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                <li>Go close — fill the screen with the sick part.</li>
                <li>Use daylight; avoid shadows.</li>
                <li>{SYMPTOMS[subject] && ['poultry', 'cattle', 'pigs', 'goats'].includes(subject) ? 'Show the sick sign: eyes, mouth, skin or droppings.' : 'Show both sides of the leaf if you can.'}</li>
              </ul>
            </div>
            <div className="grid2 mt2">
              <button className="btn" style={{ minHeight: 84, flexDirection: 'column' }} onClick={() => getPhoto('camera')}><Camera size={28} />Camera</button>
              <button className="btn soft" style={{ minHeight: 84, flexDirection: 'column' }} onClick={() => getPhoto('gallery')}><ImageIcon size={28} />Gallery</button>
            </div>
            <button className="btn ghost block mt" onClick={() => setStep(2)}>Continue without a photo</button>
          </>
        )}

        {step === 2 && subject && (
          <>
            {photo && <div className="photo-frame mb"><img src={photo} alt="Your photo" /></div>}
            <h2 style={{ fontSize: '1.15rem' }}>What do you see?</h2>
            <p className="small muted">Tick every sign that matches. The more you tick, the better the result.</p>
            <div className="card">
              {(SYMPTOMS[subject] ?? []).map((s) => {
                const on = signs.includes(s.id);
                return (
                  <button key={s.id} className="row" style={{ width: '100%', background: 'none', border: 'none', padding: '12px 2px', textAlign: 'left', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
                    onClick={() => setSigns(on ? signs.filter((x) => x !== s.id) : [...signs, s.id])}>
                    {on ? <CheckSquare color="#1F6B3A" size={26} /> : <Square color="#9aa59d" size={26} />}
                    <span style={{ fontWeight: on ? 700 : 500 }}>{s.label}</span>
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
              {busy ? <><span className="spinner" /> Analysing…</> : 'Get diagnosis'}
            </button>
            {!signs.length && <p className="small muted center">Tick at least one sign.</p>}
            <p className="tiny muted center">
              {online && settings.aiKey && photo ? 'Your photo will also get an online AI second opinion.' : 'Works offline. Photo-recognition model ships in the next version; photos are kept with your record.'}
            </p>
          </>
        )}
        {step === 2 && !subject && <Empty emoji="🤔" title="Choose what is affected first" />}
      </main>
    </>
  );
}
