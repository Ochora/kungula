import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trash2, Share2 } from 'lucide-react';
import { useStore, uid, today } from '../lib/store';
import { conditionById, SYMPTOMS } from '../data/conditions';
import { subjectIcon, subjectName } from '../data/catalog';
import { confidenceWord, CONFIDENT } from '../lib/diagnose';
import { fmtDate } from '../lib/util';
import { shareText } from '../lib/native';
import { TopBar, Empty, Sheet } from '../components/ui';
import ConditionDetail, { UrgencyBadge } from '../components/ConditionDetail';

export default function ScanResult({ online }: { online: boolean }) {
  const { id } = useParams();
  const nav = useNavigate();
  const scan = useStore((s) => s.scans.find((x) => x.id === id));
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const [followSheet, setFollowSheet] = useState(false);
  const [recorded, setRecorded] = useState(false);
  void online;

  if (!scan) return (<><TopBar title="Scan result" /><main className="page"><Empty emoji="🔍" title="Scan not found" /></main></>);

  const top = scan.results[0];
  const c = top ? conditionById(top.conditionId) : undefined;
  const pct = top ? Math.round(top.confidence * 100) : 0;
  const lowConf = !top || top.confidence < CONFIDENT;
  const signs = scan.symptoms.map((sid) => SYMPTOMS[scan.subject]?.find((s) => s.id === sid)?.label).filter(Boolean);

  const recordTreatment = () => {
    upsert('activities', {
      id: uid(), date: today(), kind: ['poultry', 'cattle', 'goats', 'pigs'].includes(scan.subject) ? 'treatment' : 'spraying',
      plotId: scan.plotId, description: `Treated for ${c?.name ?? 'problem'} (from Scan)`, createdAt: Date.now(),
    });
    setRecorded(true);
  };

  return (
    <>
      <TopBar title="Diagnosis" right={
        <>
          <button className="icon-btn" aria-label="Share" onClick={() => shareText('Kungula diagnosis', `${subjectName(scan.subject)}: ${c?.name ?? 'unclear'} (${pct}% match). ${c?.explain ?? ''} — via Kungula`)}><Share2 size={20} /></button>
          <button className="icon-btn" aria-label="Delete" onClick={() => { if (confirm('Delete this scan?')) { remove('scans', scan.id); nav('/scan', { replace: true }); } }}><Trash2 size={20} /></button>
        </>
      } />
      <main className="page">
        {scan.photo && <div className="photo-frame mb"><img src={scan.photo} alt="Scan" />{scan.vision?.overlay && <img className="overlay" src={scan.vision.overlay} alt="Affected areas" />}</div>}
        {scan.vision && (
          <div className="card mb">
            <div className="row between"><b>📷 Photo check</b>{!['poultry', 'cattle', 'goats', 'pigs'].includes(scan.subject) && <span className={'badge ' + (scan.vision.health >= 80 ? '' : scan.vision.health >= 55 ? 'gold' : 'red')}>{scan.vision.health}% healthy</span>}</div>
            <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>{scan.vision.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        )}
        <div className="card">
          <div className="row">
            <span style={{ fontSize: '2rem' }}>{subjectIcon(scan.subject)}</span>
            <div className="grow">
              <div className="small muted">{subjectName(scan.subject)} · {fmtDate(scan.date)}</div>
              <h2 style={{ fontSize: '1.25rem' }}>{c ? (lowConf ? `Possibly ${c.name}` : ['poultry', 'cattle', 'goats', 'pigs'].includes(scan.subject) ? `Likely ${c.name}` : c.name) : 'No clear match'}</h2>
            </div>
          </div>
          {top && (
            <>
              <div className="row mt" style={{ gap: 10 }}>
                <div className="progress grow"><i style={{ width: `${pct}%`, background: pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--gold)' : 'var(--murram)' }} /></div>
                <b>{pct}%</b>
              </div>
              <div className="small muted">{confidenceWord(top.confidence)} confidence, from {scan.symptoms.length} sign{scan.symptoms.length === 1 ? '' : 's'} you ticked</div>
              {c && <div className="mt"><UrgencyBadge c={c} /></div>}
            </>
          )}
          {signs.length > 0 && <p className="small" style={{ marginBottom: 0 }}><b>Signs:</b> {signs.join('; ')}</p>}
        </div>

        {lowConf && (
          <div className="alert warn mt">
            <span className="a-ico">🤔</span>
            <div><b>I am not fully sure</b><span className="small">Tick more signs, take a closer photo, or ask a Champion, agronomist or vet to look. Do not spray until you are sure.</span>
              <div className="row mt" style={{ gap: 6 }}>
                <Link className="btn sm" to={`/scan?subject=${scan.subject}`}>Scan again</Link>
                <Link className="btn sm soft" to="/jjajja">Ask Jjajja</Link>
              </div>
            </div>
          </div>
        )}

        {scan.aiText && (
          <div className="card mt" style={{ borderColor: 'var(--gold)' }}>
            <h2>🤖 Online AI second opinion</h2>
            <p className="small" style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{scan.aiText}</p>
          </div>
        )}

        {c && <div className="mt"><ConditionDetail c={c} hideUrgency /></div>}

        {scan.results.length > 1 && (
          <div className="card mt">
            <h2>It could also be</h2>
            <ul className="list">
              {scan.results.slice(1).map((r) => {
                const oc = conditionById(r.conditionId);
                return oc && (
                  <li key={r.conditionId}>
                    <Link to={`/condition/${oc.id}`} className="row grow" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <span className="grow">{oc.name}</span><span className="badge grey">{Math.round(r.confidence * 100)}%</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="grid2 mt">
          <button className="btn soft" onClick={recordTreatment} disabled={recorded || !c}>{recorded ? '✓ Recorded' : 'Record treatment'}</button>
          <button className="btn ghost" onClick={() => setFollowSheet(true)} disabled={scan.followUpDone}>{scan.followUpDone ? '✓ Followed up' : '7-day check'}</button>
        </div>
      </main>

      <Sheet open={followSheet} onClose={() => setFollowSheet(false)} title="Did the treatment work?">
        <p className="small muted">Look at the {subjectName(scan.subject).toLowerCase()} again.</p>
        <div className="stack">
          <button className="btn block" onClick={() => { upsert('scans', { ...scan, followUpDone: true }); setFollowSheet(false); }}>😊 Yes, it is getting better</button>
          <button className="btn block gold" onClick={() => { upsert('scans', { ...scan, followUpDone: true }); setFollowSheet(false); nav(`/scan?subject=${scan.subject}`); }}>😟 No — scan again</button>
          <button className="btn block ghost" onClick={() => { upsert('scans', { ...scan, followUpDone: true }); setFollowSheet(false); nav('/jjajja'); }}>Ask an expert</button>
        </div>
      </Sheet>
    </>
  );
}
