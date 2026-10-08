import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, MapPin, Mic, CheckCircle2, Circle, Trash2, Download } from 'lucide-react';
import { useStore, uid, today } from '../lib/store';
import { useT } from '../lib/i18n';
import { CROPS, ANIMALS, subjectIcon, subjectName } from '../data/catalog';
import { parseRecord } from '../lib/parse';
import { ugx, num, fmtDay, fmtDate, toCSV } from '../lib/util';
import { scheduleReminder, cancelReminder, saveAndShareFile } from '../lib/native';
import { TopBar, Sheet, Empty } from '../components/ui';
import type { Activity, ActivityKind } from '../lib/types';

type Tab = 'plots' | 'animals' | 'records' | 'profit' | 'reminders';

export const KINDS: { id: ActivityKind; label: string; icon: string }[] = [
  { id: 'planting', label: 'Planting', icon: '🌱' }, { id: 'weeding', label: 'Weeding', icon: '🪓' },
  { id: 'spraying', label: 'Spraying', icon: '💦' }, { id: 'fertilising', label: 'Fertilising', icon: '🧺' },
  { id: 'irrigation', label: 'Watering', icon: '🚿' }, { id: 'harvest', label: 'Harvest', icon: '🧺' },
  { id: 'sale', label: 'Sale', icon: '💵' }, { id: 'labour', label: 'Labour', icon: '👷' },
  { id: 'transport', label: 'Transport', icon: '🛵' }, { id: 'inputs', label: 'Inputs bought', icon: '🛒' },
  { id: 'feeding', label: 'Feeding', icon: '🌾' }, { id: 'treatment', label: 'Treatment', icon: '💊' },
  { id: 'vaccination', label: 'Vaccination', icon: '💉' }, { id: 'other', label: 'Other', icon: '📝' },
];
export const kindLabel = (k: ActivityKind) => KINDS.find((x) => x.id === k)!;

export default function Farm() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'plots';
  const setTab = (x: Tab) => setParams({ tab: x }, { replace: true });
  const [quick, setQuick] = useState(false);

  return (
    <>
      <TopBar title={`Kungula Book · ${t('myFarm')}`} back={false} />
      <main className="page">
        <div className="tabs">
          {(['plots', 'animals', 'records', 'profit', 'reminders'] as Tab[]).map((x) => (
            <button key={x} className={tab === x ? 'on' : ''} onClick={() => setTab(x)}>{t(x)}</button>
          ))}
        </div>
        <div className="mt">
          {tab === 'plots' && <Plots />}
          {tab === 'animals' && <Animals />}
          {tab === 'records' && <Records onQuick={() => setQuick(true)} />}
          {tab === 'profit' && <Profit />}
          {tab === 'reminders' && <Reminders />}
        </div>
      </main>
      {tab === 'records' && <button className="btn fab" onClick={() => setQuick(true)}><Mic size={20} /> Record</button>}
      <QuickRecord open={quick} onClose={() => setQuick(false)} />
    </>
  );
}

function Plots() {
  const plots = useStore((s) => s.plots);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <>
      {plots.length === 0 && <Empty emoji="🗺️" title="No plots yet">Add each garden or field. Walk its boundary to measure the acres.</Empty>}
      <div className="stack">
        {plots.map((p) => (
          <Link key={p.id} to={`/farm/plot/${p.id}`} className="card row" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="avatar">{subjectIcon(p.crop)}</div>
            <div className="grow">
              <b>{p.name}</b>
              <div className="small muted">{subjectName(p.crop)}{p.variety ? ` · ${p.variety}` : ''} · {p.areaAcres ? `${num(p.areaAcres, 2)} acres (GPS)` : p.manualAcres ? `${num(p.manualAcres, 2)} acres` : 'size not set'}</div>
            </div>
            {p.boundary.length >= 3 ? <span className="badge">Mapped</span> : <MapPin size={18} style={{ color: 'var(--muted)' }} />}
          </Link>
        ))}
      </div>
      <button className="btn block mt" onClick={() => setOpen(true)}><Plus size={20} /> Add plot</button>
      <PlotForm open={open} onClose={() => setOpen(false)} onSaved={(id, map) => { setOpen(false); if (map) nav(`/farm/map/${id}`); }} />
    </>
  );
}

export function PlotForm({ open, onClose, onSaved, editId }: { open: boolean; onClose: () => void; onSaved: (id: string, map: boolean) => void; editId?: string }) {
  const profile = useStore((s) => s.profile)!;
  const existing = useStore((s) => s.plots.find((p) => p.id === editId));
  const upsert = useStore((s) => s.upsert);
  const [name, setName] = useState(existing?.name ?? '');
  const [crop, setCrop] = useState(existing?.crop ?? profile.crops[0] ?? 'maize');
  const [variety, setVariety] = useState(existing?.variety ?? '');
  const [seedSource, setSeedSource] = useState(existing?.seedSource ?? '');
  const [plantedOn, setPlantedOn] = useState(existing?.plantedOn ?? '');
  const [expectedHarvest, setExpectedHarvest] = useState(existing?.expectedHarvest ?? '');
  const [acres, setAcres] = useState(existing?.manualAcres?.toString() ?? '');
  const save = (map: boolean) => {
    const id = existing?.id ?? uid();
    upsert('plots', {
      id, name: name.trim() || `${subjectName(crop)} plot`, crop, variety: variety || undefined, seedSource: seedSource || undefined,
      plantedOn: plantedOn || undefined, expectedHarvest: expectedHarvest || undefined, manualAcres: acres ? parseFloat(acres) : undefined,
      boundary: existing?.boundary ?? [], areaAcres: existing?.areaAcres, notes: existing?.notes, createdAt: existing?.createdAt ?? Date.now(),
    });
    if (!existing && plantedOn) {
      // seed a planting record so profit and loan score start counting
      upsert('activities', { id: uid(), date: plantedOn, kind: 'planting', plotId: id, description: `Planted ${subjectName(crop).toLowerCase()}${variety ? ` (${variety})` : ''}`, createdAt: Date.now() });
    }
    onSaved(id, map);
  };
  return (
    <Sheet open={open} onClose={onClose} title={existing ? 'Edit plot' : 'New plot'}>
      <label className="field"><span>Plot name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. North field, Hill plot" /></label>
      <label className="field"><span>Crop</span>
        <select className="input" value={crop} onChange={(e) => setCrop(e.target.value)}>
          {CROPS.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </label>
      <div className="grid2">
        <label className="field"><span>Variety</span><input className="input" value={variety} onChange={(e) => setVariety(e.target.value)} placeholder="e.g. Longe 5" /></label>
        <label className="field"><span>Seed source</span><input className="input" value={seedSource} onChange={(e) => setSeedSource(e.target.value)} placeholder="Dealer / own" /></label>
        <label className="field"><span>Planted on</span><input className="input" type="date" value={plantedOn} onChange={(e) => setPlantedOn(e.target.value)} /></label>
        <label className="field"><span>Expected harvest</span><input className="input" type="date" value={expectedHarvest} onChange={(e) => setExpectedHarvest(e.target.value)} /></label>
      </div>
      <label className="field"><span>Size in acres (if you know it)</span><input className="input" inputMode="decimal" value={acres} onChange={(e) => setAcres(e.target.value)} placeholder="Or walk the boundary to measure" /></label>
      <div className="grid2 mt2">
        <button className="btn soft" onClick={() => save(false)}>Save</button>
        <button className="btn" onClick={() => save(true)}><MapPin size={18} /> Save & map</button>
      </div>
    </Sheet>
  );
}

function Animals() {
  const animals = useStore((s) => s.animals);
  const profile = useStore((s) => s.profile)!;
  const upsert = useStore((s) => s.upsert);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(profile.animals[0] ?? 'poultry');
  const [name, setName] = useState('');
  const [count, setCount] = useState('1');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [value, setValue] = useState('');
  const save = () => {
    upsert('animals', { id: uid(), kind, name: name.trim() || `${subjectName(kind)} group`, count: Math.max(1, parseInt(count) || 1), breed: breed || undefined, ageMonths: age ? parseFloat(age) : undefined, value: value ? parseFloat(value.replace(/,/g, '')) : undefined, createdAt: Date.now() });
    setOpen(false); setName(''); setCount('1'); setBreed(''); setAge(''); setValue('');
  };
  return (
    <>
      {animals.length === 0 && <Empty emoji="🐄" title="No animals yet">Register cows by name or tag, and birds, goats or pigs as a group.</Empty>}
      <div className="stack">
        {animals.map((a) => (
          <Link key={a.id} to={`/farm/animal/${a.id}`} className="card row" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="avatar">{subjectIcon(a.kind)}</div>
            <div className="grow"><b>{a.name}</b><div className="small muted">{a.count} × {subjectName(a.kind)}{a.breed ? ` · ${a.breed}` : ''}{a.ageMonths ? ` · ${a.ageMonths} months` : ''}</div></div>
          </Link>
        ))}
      </div>
      <button className="btn block mt" onClick={() => setOpen(true)}><Plus size={20} /> Add animals</button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add animals">
        <div className="grid3 mt">
          {ANIMALS.map((a) => <button key={a.id} className={'tile' + (kind === a.id ? ' on' : '')} onClick={() => setKind(a.id)}><span className="emoji">{a.icon}</span>{a.name}</button>)}
        </div>
        <label className="field"><span>Name, tag or batch</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'cattle' ? 'e.g. Nalongo (tag 014)' : 'e.g. Layers batch March'} /></label>
        <div className="grid2">
          <label className="field"><span>How many</span><input className="input" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} /></label>
          <label className="field"><span>Breed</span><input className="input" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Friesian, Kuroiler" /></label>
          <label className="field"><span>Age (months)</span><input className="input" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value)} /></label>
          <label className="field"><span>Value / price paid (UGX)</span><input className="input" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} /></label>
        </div>
        <button className="btn block mt2" onClick={save}>Save</button>
      </Sheet>
    </>
  );
}

function Records({ onQuick }: { onQuick: () => void }) {
  const activities = useStore((s) => s.activities);
  const plots = useStore((s) => s.plots);
  const animals = useStore((s) => s.animals);
  const remove = useStore((s) => s.remove);
  const [filter, setFilter] = useState('');
  const list = activities.filter((a) => !filter || a.plotId === filter || a.animalId === filter).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const exportCsv = () => saveAndShareFile(`kungula-records-${today()}.csv`, toCSV(activities.map((a) => ({
    date: a.date, type: a.kind, plot: plots.find((p) => p.id === a.plotId)?.name ?? '', animals: animals.find((x) => x.id === a.animalId)?.name ?? '',
    description: a.description, money_out_ugx: a.cost ?? '', money_in_ugx: a.income ?? '', quantity: a.quantity ?? '', unit: a.unit ?? '',
  }))), 'text/csv');
  return (
    <>
      <div className="row">
        <select className="input grow" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All plots and animals</option>
          {plots.map((p) => <option key={p.id} value={p.id}>{subjectIcon(p.crop)} {p.name}</option>)}
          {animals.map((a) => <option key={a.id} value={a.id}>{subjectIcon(a.kind)} {a.name}</option>)}
        </select>
        <button className="icon-btn" aria-label="Export CSV" onClick={exportCsv} disabled={!activities.length}><Download size={22} /></button>
      </div>
      {list.length === 0 && <Empty emoji="📒" title="No records yet"><button className="btn mt" onClick={onQuick}><Mic size={18} /> Record your first activity</button></Empty>}
      <div className="card mt" style={{ display: list.length ? 'block' : 'none' }}>
        <ul className="list">
          {list.map((a) => {
            const k = kindLabel(a.kind);
            const where = plots.find((p) => p.id === a.plotId)?.name ?? animals.find((x) => x.id === a.animalId)?.name;
            return (
              <li key={a.id}>
                <div className="avatar">{k.icon}</div>
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{a.description}</div>
                  <div className="small muted">{fmtDay(a.date)} · {k.label}{where ? ` · ${where}` : ''}{a.quantity ? ` · ${num(a.quantity)} ${a.unit ?? ''}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {a.income ? <div style={{ color: 'var(--green)', fontWeight: 700 }}>+{num(a.income)}</div> : null}
                  {a.cost ? <div style={{ color: 'var(--murram)', fontWeight: 700 }}>−{num(a.cost)}</div> : null}
                  <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Delete" onClick={() => confirm('Delete this record?') && remove('activities', a.id)}><Trash2 size={15} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export function QuickRecord({ open, onClose, plotId, animalId }: { open: boolean; onClose: () => void; plotId?: string; animalId?: string }) {
  const plots = useStore((s) => s.plots);
  const animals = useStore((s) => s.animals);
  const upsert = useStore((s) => s.upsert);
  const [text, setText] = useState('');
  const parsed = useMemo(() => (text.trim() ? parseRecord(text, plots) : undefined), [text, plots]);
  const [kind, setKind] = useState<ActivityKind | ''>('');
  const [date, setDate] = useState(today());
  const [cost, setCost] = useState('');
  const [income, setIncome] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('kg');
  const [pid, setPid] = useState(plotId ?? '');
  const [aid, setAid] = useState(animalId ?? '');

  const effKind = (kind || parsed?.kind || 'other') as ActivityKind;
  const effCost = cost ? parseFloat(cost.replace(/,/g, '')) : parsed?.cost;
  const effIncome = income ? parseFloat(income.replace(/,/g, '')) : parsed?.income;
  const effQty = qty ? parseFloat(qty) : parsed?.quantity;
  const effPlot = pid || parsed?.plotId || '';

  const save = () => {
    const a: Activity = {
      id: uid(), date, kind: effKind, plotId: effPlot || undefined, animalId: aid || undefined,
      description: parsed?.description || kindLabel(effKind).label,
      cost: effCost || undefined, income: effIncome || undefined, quantity: effQty || undefined,
      unit: effQty ? (qty ? unit : parsed?.unit ?? unit) : undefined, createdAt: Date.now(),
    };
    upsert('activities', a);
    setText(''); setKind(''); setCost(''); setIncome(''); setQty(''); setPid(plotId ?? ''); setAid(animalId ?? '');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Record an activity">
      <p className="small muted" style={{ marginTop: 0 }}>Say or type what happened. Tap the 🎤 on your keyboard to speak.</p>
      <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. I paid two workers 10,000 each to weed the north plot" />
      {parsed && (
        <div className="card mt" style={{ background: 'var(--green-soft)' }}>
          <div className="small"><b>Kungula understood:</b> {kindLabel(effKind).icon} {kindLabel(effKind).label}
            {effCost ? <> · money out <b>{ugx(effCost)}</b></> : null}
            {effIncome ? <> · money in <b>{ugx(effIncome)}</b></> : null}
            {effQty ? <> · {num(effQty)} {parsed.unit ?? ''}</> : null}
            {effPlot ? <> · {plots.find((p) => p.id === effPlot)?.name}</> : null}
          </div>
          <div className="tiny muted">Correct anything below if it is wrong.</div>
        </div>
      )}
      <div className="chips mt">
        {KINDS.map((k) => <button key={k.id} className={'chip' + (effKind === k.id ? ' on' : '')} onClick={() => setKind(k.id)}>{k.icon} {k.label}</button>)}
      </div>
      <div className="grid2">
        <label className="field"><span>Date</span><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="field"><span>Plot</span>
          <select className="input" value={effPlot} onChange={(e) => setPid(e.target.value)}>
            <option value="">—</option>{plots.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Money out (UGX)</span><input className="input" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} placeholder={parsed?.cost ? num(parsed.cost) : '0'} /></label>
        <label className="field"><span>Money in (UGX)</span><input className="input" inputMode="numeric" value={income} onChange={(e) => setIncome(e.target.value)} placeholder={parsed?.income ? num(parsed.income) : '0'} /></label>
        <label className="field"><span>Quantity</span><input className="input" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={parsed?.quantity ? String(parsed.quantity) : ''} /></label>
        <label className="field"><span>Unit</span>
          <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
            {['kg', 'bag', 'bunch', 'litre', 'tray', 'crate', 'birds', 'animals'].map((u) => <option key={u}>{u}</option>)}
          </select>
        </label>
      </div>
      {animals.length > 0 && (
        <label className="field"><span>Animals</span>
          <select className="input" value={aid} onChange={(e) => setAid(e.target.value)}>
            <option value="">—</option>{animals.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
      )}
      <button className="btn block mt2" onClick={save} disabled={!text.trim() && !kind}>Save record</button>
    </Sheet>
  );
}

function Profit() {
  const activities = useStore((s) => s.activities);
  const plots = useStore((s) => s.plots);
  const animals = useStore((s) => s.animals);
  const [period, setPeriod] = useState<'season' | 'year' | 'all'>('season');
  const since = period === 'season' ? Date.now() - 183 * 86400000 : period === 'year' ? Date.now() - 365 * 86400000 : 0;
  const list = activities.filter((a) => new Date(a.date).getTime() >= since);
  const totalIn = list.reduce((s, a) => s + (a.income ?? 0), 0);
  const totalOut = list.reduce((s, a) => s + (a.cost ?? 0), 0);
  const groups = [
    ...plots.map((p) => ({ id: p.id, name: p.name, icon: subjectIcon(p.crop), acres: p.areaAcres ?? p.manualAcres })),
    ...animals.map((a) => ({ id: a.id, name: a.name, icon: subjectIcon(a.kind), acres: undefined as number | undefined })),
  ].map((g) => {
    const its = list.filter((a) => a.plotId === g.id || a.animalId === g.id);
    const i = its.reduce((s, a) => s + (a.income ?? 0), 0); const o = its.reduce((s, a) => s + (a.cost ?? 0), 0);
    return { ...g, i, o, p: i - o };
  }).filter((g) => g.i || g.o);
  const byKind = KINDS.map((k) => ({ k, v: list.filter((a) => a.kind === k.id).reduce((s, a) => s + (a.cost ?? 0), 0) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
  const maxK = Math.max(1, ...byKind.map((x) => x.v));
  return (
    <>
      <div className="tabs">
        {(['season', 'year', 'all'] as const).map((p) => <button key={p} className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>{p === 'season' ? 'This season' : p === 'year' ? '12 months' : 'All time'}</button>)}
      </div>
      <div className="card mt">
        <div className="grid3">
          <div className="stat"><span className="l">Money in</span><span className="v" style={{ color: 'var(--green)' }}>{num(totalIn)}</span></div>
          <div className="stat"><span className="l">Money out</span><span className="v" style={{ color: 'var(--murram)' }}>{num(totalOut)}</span></div>
          <div className="stat"><span className="l">Profit</span><span className="v" style={{ color: totalIn - totalOut >= 0 ? 'var(--green)' : 'var(--alert)' }}>{num(totalIn - totalOut)}</span></div>
        </div>
        <div className="tiny muted mt">All amounts in UGX</div>
      </div>
      {groups.length > 0 && (
        <div className="card mt">
          <h2>By plot and animals</h2>
          <table className="table mt">
            <thead><tr><th></th><th className="r">In</th><th className="r">Out</th><th className="r">Profit</th></tr></thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id}>
                  <td>{g.icon} {g.name}{g.acres ? <div className="tiny muted">{num(g.p / g.acres)} per acre</div> : null}</td>
                  <td className="r">{num(g.i)}</td><td className="r">{num(g.o)}</td>
                  <td className="r" style={{ fontWeight: 700, color: g.p >= 0 ? 'var(--green)' : 'var(--alert)' }}>{num(g.p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {byKind.length > 0 && (
        <div className="card mt">
          <h2>Where the money goes</h2>
          {byKind.map(({ k, v }) => (
            <div key={k.id} className="mt">
              <div className="row between small"><span>{k.icon} {k.label}</span><b>{ugx(v)}</b></div>
              <div className="progress"><i style={{ width: `${(v / maxK) * 100}%`, background: 'var(--murram)' }} /></div>
            </div>
          ))}
        </div>
      )}
      {!list.length && <Empty emoji="📊" title="No money records yet">Record costs and sales to see your profit.</Empty>}
      <ProfitInsights />
    </>
  );
}

function ProfitInsights() {
  const activities = useStore((s) => s.activities);
  const scans = useStore((s) => s.scans);
  const tips: string[] = [];
  const recent = activities.filter((a) => Date.now() - new Date(a.date).getTime() < 120 * 86400000);
  if (recent.length && !recent.some((a) => a.kind === 'sale')) tips.push('No sales recorded in the last 4 months. Record every sale so your profit and loan score are correct.');
  if (recent.some((a) => a.kind === 'planting') && !recent.some((a) => a.kind === 'spraying' || a.kind === 'treatment') && !scans.length) tips.push('No pest or disease checks recorded this season. Use Scan to check your crops are healthy.');
  const labour = recent.filter((a) => a.kind === 'labour' || a.kind === 'weeding').reduce((s, a) => s + (a.cost ?? 0), 0);
  const all = recent.reduce((s, a) => s + (a.cost ?? 0), 0);
  if (all > 0 && labour / all > 0.5) tips.push(`Labour is ${Math.round((labour / all) * 100)}% of your costs. Mulching and herbicide-free weeding schedules can reduce weeding days.`);
  if (!tips.length) return null;
  return (
    <div className="card mt" style={{ background: 'var(--gold-soft)' }}>
      <h2>💡 Insights</h2>
      <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>{tips.map((t) => <li key={t} className="small" style={{ marginBottom: 6 }}>{t}</li>)}</ul>
    </div>
  );
}

function Reminders() {
  const reminders = useStore((s) => s.reminders);
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('08:00');
  const [repeat, setRepeat] = useState('0');
  const sorted = [...reminders].sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));
  const add = async () => {
    const n = parseInt(repeat) || 0;
    const base = new Date(`${date}T${time}:00`);
    const count = n ? n + 1 : 1;
    for (let i = 0; i < count; i++) {
      const due = new Date(base.getTime() + i * 7 * 86400000);
      const notifId = await scheduleReminder('Kungula reminder', title, due);
      upsert('reminders', { id: uid(), title: title.trim(), due: due.toISOString(), done: false, source: 'manual', notifId });
    }
    setTitle(''); setOpen(false);
  };
  return (
    <>
      {!reminders.length && <Empty emoji="⏰" title="No reminders">Add reminders for spraying, vaccinations, feeding or loan repayments.</Empty>}
      <div className="card" style={{ display: reminders.length ? 'block' : 'none' }}>
        <ul className="list">
          {sorted.map((r) => (
            <li key={r.id} style={{ opacity: r.done ? 0.55 : 1 }}>
              <button className="icon-btn" onClick={() => { upsert('reminders', { ...r, done: !r.done }); if (!r.done) cancelReminder(r.notifId); }}>
                {r.done ? <CheckCircle2 className="tint" /> : <Circle style={{ color: 'var(--muted)' }} />}
              </button>
              <div className="grow">
                <div style={{ fontWeight: 600, textDecoration: r.done ? 'line-through' : 'none' }}>{r.title}</div>
                <div className="small muted">{fmtDate(r.due)} · {new Date(r.due).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <button className="icon-btn" aria-label="Delete" onClick={() => { cancelReminder(r.notifId); remove('reminders', r.id); }}><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      </div>
      <button className="btn block mt" onClick={() => setOpen(true)}><Plus size={20} /> Add reminder</button>
      <Sheet open={open} onClose={() => setOpen(false)} title="New reminder">
        <label className="field"><span>What to do</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Spray tomatoes with mancozeb" /></label>
        <div className="chips mt">
          {['Spray crops', 'Vaccinate chickens', 'Deworm goats', 'Tick spray cattle', 'Weed maize', 'Repay loan'].map((s) => <button key={s} className="chip" onClick={() => setTitle(s)}>{s}</button>)}
        </div>
        <div className="grid2">
          <label className="field"><span>Date</span><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="field"><span>Time</span><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
        </div>
        <label className="field"><span>Repeat weekly</span>
          <select className="input" value={repeat} onChange={(e) => setRepeat(e.target.value)}>
            <option value="0">No</option><option value="3">For 4 weeks</option><option value="7">For 8 weeks</option><option value="12">For 13 weeks</option>
          </select>
        </label>
        <button className="btn block mt2" disabled={!title.trim()} onClick={add}>Save reminder</button>
        <p className="tiny muted center">Your phone will notify you even when Kungula is closed.</p>
      </Sheet>
    </>
  );
}
