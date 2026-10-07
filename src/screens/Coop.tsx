import { useState } from 'react';
import { Plus, MessageSquare, Download, Search } from 'lucide-react';
import { useStore, uid, today } from '../lib/store';
import { CROPS, subjectIcon, subjectName } from '../data/catalog';
import { BUYERS } from '../data/market';
import { ugx, num, fmtDay, toCSV } from '../lib/util';
import { smsNumber, saveAndShareFile } from '../lib/native';
import { TopBar, Sheet, Empty, DemoNote } from '../components/ui';
import type { Delivery } from '../lib/types';

type Tab = 'collect' | 'members' | 'payouts' | 'bulk';

export default function Coop() {
  const [tab, setTab] = useState<Tab>('collect');
  const members = useStore((s) => s.members);
  const deliveries = useStore((s) => s.deliveries);
  const owed = deliveries.filter((d) => !d.paid && d.grade !== 'Reject').reduce((s, d) => s + d.weightKg * d.pricePerKg, 0);
  return (
    <>
      <TopBar title="Kungula Co-op" />
      <main className="page">
        <div className="card grid3">
          <div className="stat"><span className="l">Members</span><span className="v">{members.length}</span></div>
          <div className="stat"><span className="l">Collected (kg)</span><span className="v">{num(deliveries.reduce((s, d) => s + d.weightKg, 0))}</span></div>
          <div className="stat"><span className="l">To pay (UGX)</span><span className="v" style={{ color: 'var(--murram)' }}>{num(owed)}</span></div>
        </div>
        <div className="tabs mt">
          {([['collect', 'Collection'], ['members', 'Members'], ['payouts', 'Payouts'], ['bulk', 'Bulk sale']] as [Tab, string][]).map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
        </div>
        <div className="mt">
          {tab === 'collect' && <Collect />}
          {tab === 'members' && <Members />}
          {tab === 'payouts' && <Payouts />}
          {tab === 'bulk' && <Bulk />}
        </div>
      </main>
    </>
  );
}

function Collect() {
  const members = useStore((s) => s.members);
  const deliveries = useStore((s) => s.deliveries);
  const upsert = useStore((s) => s.upsert);
  const [memberId, setMemberId] = useState('');
  const [crop, setCrop] = useState('coffee');
  const [weight, setWeight] = useState('');
  const [grade, setGrade] = useState<Delivery['grade']>('FAQ');
  const [price, setPrice] = useState('');
  const [q, setQ] = useState('');
  const [last, setLast] = useState<Delivery>();
  const todayList = deliveries.filter((d) => d.date === today());
  const member = members.find((m) => m.id === memberId);
  const found = q ? members.filter((m) => (m.name + m.phone + m.village).toLowerCase().includes(q.toLowerCase())).slice(0, 5) : [];

  const record = () => {
    const d: Delivery = { id: uid(), memberId, date: today(), crop, weightKg: parseFloat(weight), grade, pricePerKg: parseFloat(price.replace(/,/g, '')) || 0, paid: false };
    upsert('deliveries', d); setLast(d); setWeight('');
  };
  const receipt = (d: Delivery) => {
    const m = members.find((x) => x.id === d.memberId);
    return `Kungula Co-op receipt: ${m?.name}, ${fmtDay(d.date)}. ${subjectName(d.crop)} ${num(d.weightKg)} kg, grade ${d.grade}, UGX ${num(d.pricePerKg)}/kg = UGX ${num(d.weightKg * d.pricePerKg)}. Ref ${d.id.slice(-6).toUpperCase()}.`;
  };

  if (!members.length) return <Empty emoji="👥" title="Add members first">Go to the Members tab to register your co-operative or group members.</Empty>;
  return (
    <>
      <div className="card">
        <h2>⚖️ Record a delivery</h2>
        {!member ? (
          <>
            <div className="row mt" style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, color: 'var(--muted)' }} />
              <input className="input" style={{ paddingLeft: 38 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search member name or phone" />
            </div>
            <ul className="list">{found.map((m) => <li key={m.id} onClick={() => { setMemberId(m.id); setQ(''); }} style={{ cursor: 'pointer' }}><div className="avatar">🧑‍🌾</div><div className="grow"><b>{m.name}</b><div className="small muted">{m.village} · {m.phone}</div></div></li>)}</ul>
            {!q && <select className="input mt" value={memberId} onChange={(e) => setMemberId(e.target.value)}><option value="">…or choose from list</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}
          </>
        ) : (
          <>
            <div className="row mt"><div className="avatar">🧑‍🌾</div><div className="grow"><b>{member.name}</b><div className="small muted">{member.village}</div></div><button className="btn sm ghost" onClick={() => setMemberId('')}>Change</button></div>
            <div className="grid2">
              <label className="field"><span>Crop</span><select className="input" value={crop} onChange={(e) => setCrop(e.target.value)}>{CROPS.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></label>
              <label className="field"><span>Weight (kg)</span><input className="input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
              <label className="field"><span>Grade</span><select className="input" value={grade} onChange={(e) => setGrade(e.target.value as Delivery['grade'])}><option>FAQ</option><option>A</option><option>B</option><option>Reject</option></select></label>
              <label className="field"><span>Price per kg</span><input className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
            </div>
            {weight && price && <div className="small mt">Value: <b>{ugx(parseFloat(weight) * parseFloat(price.replace(/,/g, '')))}</b></div>}
            <button className="btn block mt" disabled={!weight || !price} onClick={record}>Save delivery</button>
          </>
        )}
      </div>
      {last && (
        <div className="alert mt"><span className="a-ico">🧾</span><div><b>Saved</b><span className="small">{receipt(last)}</span>
          <button className="btn sm mt" onClick={() => { const m = members.find((x) => x.id === last.memberId); if (m) smsNumber(m.phone, receipt(last)); }}><MessageSquare size={16} /> Send SMS receipt</button></div></div>
      )}
      <div className="section-title">Today ({todayList.length})</div>
      <div className="card" style={{ display: todayList.length ? 'block' : 'none' }}>
        <ul className="list">{todayList.map((d) => <li key={d.id}><span style={{ fontSize: '1.3rem' }}>{subjectIcon(d.crop)}</span><div className="grow"><b>{members.find((m) => m.id === d.memberId)?.name}</b><div className="small muted">{num(d.weightKg)} kg · {d.grade}</div></div><b>{num(d.weightKg * d.pricePerKg)}</b></li>)}</ul>
      </div>
    </>
  );
}

function Members() {
  const members = useStore((s) => s.members);
  const deliveries = useStore((s) => s.deliveries);
  const upsert = useStore((s) => s.upsert);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', phone: '', village: '', acres: '', crops: 'Coffee' });
  return (
    <>
      {!members.length && <Empty emoji="👥" title="No members yet" />}
      <div className="card" style={{ display: members.length ? 'block' : 'none' }}>
        <ul className="list">
          {members.map((m) => {
            const kg = deliveries.filter((d) => d.memberId === m.id).reduce((s, d) => s + d.weightKg, 0);
            return <li key={m.id}><div className="avatar">🧑‍🌾</div><div className="grow"><b>{m.name}</b><div className="small muted">{m.village} · {m.phone}{m.acres ? ` · ${m.acres} ac` : ''} · {m.crops}</div></div><span className="small">{num(kg)} kg</span></li>;
          })}
        </ul>
      </div>
      <div className="row mt">
        <button className="btn grow" onClick={() => setOpen(true)}><Plus size={18} /> Add member</button>
        <button className="btn soft" disabled={!members.length} onClick={() => saveAndShareFile(`coop-members-${today()}.csv`, toCSV(members.map((m) => ({ name: m.name, phone: m.phone, village: m.village, acres: m.acres ?? '', crops: m.crops }))), 'text/csv')}><Download size={18} /></button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="New member">
        <label className="field"><span>Name</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <div className="grid2">
          <label className="field"><span>Phone</span><input className="input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
          <label className="field"><span>Village</span><input className="input" value={f.village} onChange={(e) => setF({ ...f, village: e.target.value })} /></label>
          <label className="field"><span>Acres</span><input className="input" inputMode="decimal" value={f.acres} onChange={(e) => setF({ ...f, acres: e.target.value })} /></label>
          <label className="field"><span>Crops</span><input className="input" value={f.crops} onChange={(e) => setF({ ...f, crops: e.target.value })} /></label>
        </div>
        <button className="btn block mt2" disabled={!f.name.trim() || !f.phone.trim()} onClick={() => { upsert('members', { id: uid(), name: f.name.trim(), phone: f.phone.trim(), village: f.village.trim(), acres: f.acres ? parseFloat(f.acres) : undefined, crops: f.crops, createdAt: Date.now() }); setF({ name: '', phone: '', village: '', acres: '', crops: f.crops }); setOpen(false); }}>Save member</button>
      </Sheet>
    </>
  );
}

function Payouts() {
  const members = useStore((s) => s.members);
  const deliveries = useStore((s) => s.deliveries);
  const set = useStore((s) => s.set);
  const rows = members.map((m) => {
    const ds = deliveries.filter((d) => d.memberId === m.id && !d.paid && d.grade !== 'Reject');
    return { m, ds, amount: ds.reduce((s, d) => s + d.weightKg * d.pricePerKg, 0) };
  }).filter((r) => r.amount > 0);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const payAll = () => {
    if (!confirm(`Mark ${rows.length} members as paid, total ${ugx(total)}?`)) return;
    const ids = new Set(rows.flatMap((r) => r.ds.map((d) => d.id)));
    set({ deliveries: useStore.getState().deliveries.map((d) => (ids.has(d.id) ? { ...d, paid: true } : d)) });
  };
  return (
    <>
      {!rows.length && <Empty emoji="✅" title="Everyone is paid" />}
      <div className="card" style={{ display: rows.length ? 'block' : 'none' }}>
        <table className="table">
          <thead><tr><th>Member</th><th className="r">kg</th><th className="r">UGX</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.m.id}><td>{r.m.name}<div className="tiny muted">{r.m.phone}</div></td><td className="r">{num(r.ds.reduce((s, d) => s + d.weightKg, 0))}</td><td className="r"><b>{num(r.amount)}</b></td></tr>)}</tbody>
        </table>
        <div className="row between mt"><b>Total</b><b>{ugx(total)}</b></div>
      </div>
      {rows.length > 0 && (
        <div className="row mt">
          <button className="btn soft" onClick={() => saveAndShareFile(`payout-list-${today()}.csv`, toCSV(rows.map((r) => ({ name: r.m.name, phone: r.m.phone, amount_ugx: Math.round(r.amount) }))), 'text/csv')}><Download size={18} /> Payout file</button>
          <button className="btn grow gold" onClick={payAll}>Mark all paid</button>
        </div>
      )}
      <DemoNote>Bulk mobile money payouts go through a licensed payment partner in V1. Today, export the payout file for your bank or MoMo bulk-pay portal, then mark members as paid.</DemoNote>
    </>
  );
}

function Bulk() {
  const deliveries = useStore((s) => s.deliveries);
  const byCrop = CROPS.map((c) => ({ c, kg: deliveries.filter((d) => d.crop === c.id && d.grade !== 'Reject').reduce((s, d) => s + d.weightKg, 0) })).filter((x) => x.kg > 0);
  if (!byCrop.length) return <Empty emoji="🤝" title="Nothing bulked yet">Deliveries recorded on collection day add up here so you can meet big buyers' volumes.</Empty>;
  return (
    <div className="stack">
      {byCrop.map(({ c, kg }) => {
        const buyers = BUYERS.filter((b) => b.crops.includes(c.id)).sort((a, b) => a.minKg - b.minKg);
        return (
          <div key={c.id} className="card">
            <div className="row between"><b>{c.icon} {c.name}</b><b>{num(kg)} kg</b></div>
            {buyers.map((b) => (
              <div key={b.id} className="mt">
                <div className="row between small"><span>{b.name}</span><span>{kg >= b.minKg ? '✅ Ready' : `${num(b.minKg - kg)} kg to go`}</span></div>
                <div className="progress"><i style={{ width: `${Math.min(100, (kg / b.minKg) * 100)}%`, background: kg >= b.minKg ? 'var(--green)' : 'var(--gold)' }} /></div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
