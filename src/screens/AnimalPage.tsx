import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trash2, Syringe, Baby, ScanLine, Mic } from 'lucide-react';
import { useStore, uid, today } from '../lib/store';
import { subjectIcon, subjectName } from '../data/catalog';
import { fmtDate, fmtDay, num, ugx, addDays, isoDate } from '../lib/util';
import { scheduleReminder } from '../lib/native';
import { TopBar, Empty, Sheet } from '../components/ui';
import { QuickRecord, kindLabel } from './Farm';

const GESTATION: Record<string, number> = { cattle: 283, pigs: 114, goats: 150, sheep: 147 };
const VACCINES: Record<string, { name: string; repeatDays?: number }[]> = {
  poultry: [{ name: 'Newcastle (I-2 / LaSota)', repeatDays: 90 }, { name: 'Gumboro (IBD)' }, { name: 'Fowl pox' }, { name: 'Fowl typhoid' }],
  cattle: [{ name: 'Lumpy skin disease', repeatDays: 365 }, { name: 'Foot-and-mouth', repeatDays: 180 }, { name: 'Anthrax / blackquarter', repeatDays: 365 }, { name: 'Brucellosis (heifers)' }, { name: 'ECF (ITM)' }],
  goats: [{ name: 'PPR' }, { name: 'CCPP', repeatDays: 365 }, { name: 'Enterotoxaemia', repeatDays: 180 }],
  sheep: [{ name: 'PPR' }, { name: 'Enterotoxaemia', repeatDays: 180 }],
  pigs: [{ name: 'Swine erysipelas', repeatDays: 180 }],
  fish: [],
};

export default function AnimalPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const animal = useStore((s) => s.animals.find((a) => a.id === id));
  const allVaccines = useStore((s) => s.vaccines);
  const allActivities = useStore((s) => s.activities);
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const [vacOpen, setVacOpen] = useState(false);
  const [breedOpen, setBreedOpen] = useState(false);
  const [rec, setRec] = useState(false);
  const [vName, setVName] = useState('');
  const [vDate, setVDate] = useState(today());
  const [vNext, setVNext] = useState('');
  const [bDate, setBDate] = useState(today());

  if (!animal) return (<><TopBar title="Animals" /><main className="page"><Empty emoji="🐄" title="Not found" /></main></>);
  const vaccines = allVaccines.filter((v) => v.animalId === animal.id).sort((a, b) => b.date.localeCompare(a.date));
  const acts = allActivities.filter((a) => a.animalId === animal.id).sort((a, b) => b.date.localeCompare(a.date));
  const income = acts.reduce((s, a) => s + (a.income ?? 0), 0);
  const cost = acts.reduce((s, a) => s + (a.cost ?? 0), 0);
  const gest = GESTATION[animal.kind];
  const production = acts.filter((a) => a.quantity && (a.kind === 'harvest' || a.kind === 'sale'));

  const saveVaccine = async () => {
    const rec = { id: uid(), animalId: animal.id, vaccine: vName.trim(), date: vDate, nextDue: vNext || undefined };
    upsert('vaccines', rec);
    upsert('activities', { id: uid(), date: vDate, kind: 'vaccination', animalId: animal.id, description: `Vaccinated ${animal.name}: ${rec.vaccine}`, createdAt: Date.now() });
    if (vNext) {
      const due = new Date(`${vNext}T08:00:00`);
      const title = `Vaccinate ${animal.name}: ${rec.vaccine}`;
      const notifId = await scheduleReminder('Vaccination due', title, due);
      upsert('reminders', { id: uid(), title, due: due.toISOString(), done: false, source: 'vaccine', notifId });
    }
    setVacOpen(false); setVName(''); setVNext('');
  };

  const saveBreeding = async () => {
    const birth = addDays(new Date(bDate), gest);
    upsert('activities', { id: uid(), date: bDate, kind: 'other', animalId: animal.id, description: `Served/bred — expected birth ${fmtDate(birth)}`, createdAt: Date.now() });
    const checkDue = addDays(new Date(bDate), 21); checkDue.setHours(8);
    const birthDue = addDays(birth, -7); birthDue.setHours(8);
    for (const [title, due] of [[`Check ${animal.name} for return to heat`, checkDue], [`Prepare for birth: ${animal.name} (due ${fmtDate(birth)})`, birthDue]] as const) {
      const notifId = await scheduleReminder('Breeding reminder', title, due);
      upsert('reminders', { id: uid(), title, due: due.toISOString(), done: false, source: 'manual', notifId });
    }
    setBreedOpen(false);
  };

  return (
    <>
      <TopBar title={animal.name} right={
        <button className="icon-btn" aria-label="Delete" onClick={() => { if (confirm('Remove these animals from your book?')) { remove('animals', animal.id); nav('/farm?tab=animals', { replace: true }); } }}><Trash2 size={20} /></button>
      } />
      <main className="page">
        <div className="card row">
          <div className="avatar" style={{ width: 60, height: 60, fontSize: '2rem' }}>{subjectIcon(animal.kind)}</div>
          <div className="grow">
            <b style={{ fontSize: '1.1rem' }}>{animal.count} × {subjectName(animal.kind)}</b>
            <div className="small muted">{[animal.breed, animal.ageMonths ? `${animal.ageMonths} months` : '', animal.value ? `value ${ugx(animal.value)}` : ''].filter(Boolean).join(' · ') || 'No details'}</div>
          </div>
          <div className="stack" style={{ textAlign: 'right' }}>
            <button className="btn sm soft" onClick={() => upsert('animals', { ...animal, count: animal.count + 1 })}>+1</button>
            <button className="btn sm soft" onClick={() => upsert('animals', { ...animal, count: Math.max(0, animal.count - 1) })}>−1</button>
          </div>
        </div>

        <div className="grid3 mt">
          <button className="tile" onClick={() => setVacOpen(true)}><Syringe size={26} color="#1F6B3A" />Vaccinate</button>
          {gest ? <button className="tile" onClick={() => setBreedOpen(true)}><Baby size={26} color="#1F6B3A" />Breeding</button> : <Link to={`/scan?subject=${animal.kind}`} className="tile"><ScanLine size={26} color="#1F6B3A" />Health check</Link>}
          <button className="tile" onClick={() => setRec(true)}><Mic size={26} color="#1F6B3A" />Record</button>
        </div>

        <div className="card mt">
          <div className="grid3">
            <div className="stat"><span className="l">Money in</span><span className="v" style={{ fontSize: '1.1rem', color: 'var(--green)' }}>{num(income)}</span></div>
            <div className="stat"><span className="l">Money out</span><span className="v" style={{ fontSize: '1.1rem', color: 'var(--murram)' }}>{num(cost)}</span></div>
            <div className="stat"><span className="l">Per animal</span><span className="v" style={{ fontSize: '1.1rem' }}>{animal.count ? num((income - cost) / animal.count) : '—'}</span></div>
          </div>
          {production.length > 0 && <div className="small muted mt">Production recorded: {num(production.reduce((s, a) => s + (a.quantity ?? 0), 0))} {production[0].unit}</div>}
        </div>

        <div className="section-title">Vaccinations</div>
        <div className="card">
          {vaccines.length === 0 && <p className="small muted" style={{ margin: 0 }}>No vaccinations recorded.</p>}
          <ul className="list">
            {vaccines.map((v) => (
              <li key={v.id}><span style={{ fontSize: '1.3rem' }}>💉</span>
                <div className="grow"><b>{v.vaccine}</b><div className="small muted">{fmtDate(v.date)}{v.nextDue ? ` · next ${fmtDate(v.nextDue)}` : ''}</div></div>
                {v.nextDue && new Date(v.nextDue) < new Date() && <span className="badge red">Due</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="section-title">Records</div>
        <div className="card">
          {acts.length === 0 && <p className="small muted" style={{ margin: 0 }}>No records yet. Record feed, treatments, eggs or milk.</p>}
          <ul className="list">
            {acts.slice(0, 30).map((a) => (
              <li key={a.id}><div className="avatar">{kindLabel(a.kind).icon}</div>
                <div className="grow"><div style={{ fontWeight: 600 }}>{a.description}</div><div className="small muted">{fmtDay(a.date)}</div></div>
                {a.income ? <b style={{ color: 'var(--green)' }}>+{num(a.income)}</b> : a.cost ? <b style={{ color: 'var(--murram)' }}>−{num(a.cost)}</b> : null}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Sheet open={vacOpen} onClose={() => setVacOpen(false)} title="Record vaccination">
        <div className="chips mt">
          {(VACCINES[animal.kind] ?? []).map((v) => (
            <button key={v.name} className={'chip' + (vName === v.name ? ' on' : '')} onClick={() => { setVName(v.name); setVNext(v.repeatDays ? isoDate(addDays(new Date(vDate), v.repeatDays)) : ''); }}>{v.name}</button>
          ))}
        </div>
        <label className="field"><span>Vaccine</span><input className="input" value={vName} onChange={(e) => setVName(e.target.value)} /></label>
        <div className="grid2">
          <label className="field"><span>Date given</span><input className="input" type="date" value={vDate} onChange={(e) => setVDate(e.target.value)} /></label>
          <label className="field"><span>Next due (reminder)</span><input className="input" type="date" value={vNext} onChange={(e) => setVNext(e.target.value)} /></label>
        </div>
        <p className="tiny muted">Schedules vary by product and area. Follow your vet's advice.</p>
        <button className="btn block mt" disabled={!vName.trim()} onClick={saveVaccine}>Save</button>
      </Sheet>

      <Sheet open={breedOpen} onClose={() => setBreedOpen(false)} title="Record breeding / service">
        <label className="field"><span>Date served (bull, boar, buck or AI)</span><input className="input" type="date" value={bDate} onChange={(e) => setBDate(e.target.value)} /></label>
        {gest && <div className="alert mt"><span className="a-ico">🍼</span><div><b>Expected birth: {fmtDate(addDays(new Date(bDate), gest))}</b><span className="small">Kungula will remind you to check for heat after 21 days and one week before birth.</span></div></div>}
        <button className="btn block mt2" onClick={saveBreeding}>Save</button>
      </Sheet>
      <QuickRecord open={rec} onClose={() => setRec(false)} animalId={animal.id} />
    </>
  );
}
