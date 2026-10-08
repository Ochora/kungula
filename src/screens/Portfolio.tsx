import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useStore } from '../lib/store';
import { farmById, project, vitals, FARMS } from '../data/farms';
import { subjectIcon } from '../data/catalog';
import { ugx, num, fmtDate, ago } from '../lib/util';
import { TopBar, Empty, DemoNote, Seal } from '../components/ui';
import { Avatar, FarmScene } from '../components/Art';

export default function Portfolio() {
  const investments = useStore((s) => s.investments);
  const follows = useStore((s) => s.follows);
  const localUpdates = useStore((s) => s.updates);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 3000); return () => clearInterval(t); }, []);

  const rows = investments.map((inv) => {
    const f = farmById(inv.farmId);
    const o = f?.opportunities.find((x) => x.id === inv.opportunityId);
    const p = o ? project(o, inv.units) : undefined;
    const months = (Date.now() - inv.createdAt) / (30.4 * 86400000);
    const progress = o ? Math.min(1, months / o.months) : 0;
    return { inv, f, o, p, progress };
  });
  const total = rows.reduce((s, r) => s + r.inv.amount, 0);
  const expected = rows.reduce((s, r) => s + (r.p?.mid ?? r.inv.amount), 0);
  const low = rows.reduce((s, r) => s + (r.p?.low ?? r.inv.amount), 0);
  const high = rows.reduce((s, r) => s + (r.p?.high ?? r.inv.amount), 0);
  const watched = new Set([...follows, ...investments.map((i) => i.farmId)]);
  const feed = [
    ...FARMS.filter((f) => watched.has(f.id)).flatMap((f) => f.updates.map((u, i) => ({ key: f.id + i, f, at: Date.now() - u.daysAgo * 86400000, text: u.text, photo: undefined as string | undefined }))),
    ...localUpdates.filter((u) => watched.has(u.farmId)).map((u) => ({ key: u.id, f: farmById(u.farmId)!, at: u.at, text: u.text, photo: u.photo })),
  ].filter((x) => x.f).sort((a, b) => b.at - a.at).slice(0, 12);
  const herd = rows.flatMap((r) => (r.o?.kind === 'livestock' && r.f?.animals ? r.f.animals.filter((a) => a.kind === r.o!.subject).slice(0, r.inv.units).map((a) => ({ a, f: r.f! })) : []));

  return (
    <>
      <TopBar title="My portfolio" />
      <main className="page">
        <div className="hero">
          <div className="sun" />
          <div className="small muted">Invested</div>
          <div className="display" style={{ fontSize: '2.2rem' }}>{ugx(total)}</div>
          <div className="small muted mt">Expected back: <b style={{ color: '#ffd36b' }}>{ugx(expected)}</b></div>
          <div className="tiny muted">Range {ugx(low)} – {ugx(high)} · {rows.length} investment{rows.length === 1 ? '' : 's'} · {watched.size} farms watched</div>
        </div>

        {!rows.length && (
          <Empty emoji="🌱" title="No investments yet">
            <p className="small">Browse verified farms, follow a few, then back one you trust.</p>
            <Link to="/invest" className="btn mt">Discover farms</Link>
          </Empty>
        )}

        {rows.length > 0 && <div className="section-title">Your investments</div>}
        <div className="stack">
          {rows.map(({ inv, f, o, p, progress }) => f && o && (
            <Link key={inv.id} to={`/invest/farm/${f.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div className="row">
                <Avatar name={f.farmer} size={48} />
                <div className="grow"><b>{f.farmName}</b><div className="small muted">{subjectIcon(o.subject)} {inv.units} × {o.unitLabel}</div></div>
                <Seal status={f.verification.status} />
              </div>
              <div className="grid3 mt">
                <div className="stat"><span className="l">Invested</span><span className="v" style={{ fontSize: '1rem' }}>{num(inv.amount)}</span></div>
                <div className="stat"><span className="l">Expected</span><span className="v" style={{ fontSize: '1rem', color: 'var(--green)' }}>{num(p?.mid)}</span></div>
                <div className="stat"><span className="l">Since</span><span className="v" style={{ fontSize: '1rem' }}>{fmtDate(inv.createdAt).replace(/ \d{4}$/, '')}</span></div>
              </div>
              <div className="progress mt" style={{ height: 8 }}><i style={{ width: `${Math.max(3, progress * 100)}%`, background: 'var(--gold)' }} /></div>
              <div className="tiny muted" style={{ marginTop: 4 }}>{Math.round(progress * 100)}% of the {o.months}-month period · payout {o.kind === 'livestock' ? 'monthly from sales' : 'after harvest'}</div>
            </Link>
          ))}
        </div>

        {herd.length > 0 && (
          <>
            <div className="section-title">Your animals right now</div>
            <div className="card">
              {herd.map(({ a, f }) => {
                const v = vitals(a);
                return (
                  <div key={a.tag} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                    <div className="avatar">{subjectIcon(a.kind)}</div>
                    <div className="grow"><b className="small">{a.name} · {a.tag}</b><div className="tiny muted">{f.farmName}</div></div>
                    <div style={{ textAlign: 'right' }} className="small">
                      <div><HeartPulse size={14} style={{ color: 'var(--alert)', verticalAlign: -2 }} /> <b>{v.hr}</b> bpm · <b>{v.temp}°</b></div>
                      <span className={'badge ' + (v.ok ? '' : 'red')}>{v.ok ? 'Healthy' : 'Check'}</span>
                    </div>
                  </div>
                );
              })}
              <p className="tiny muted" style={{ marginBottom: 0 }}>Demo collar readings, refreshed every few seconds.</p>
            </div>
          </>
        )}

        <div className="section-title">From farms you follow <Link to="/invest">Find more</Link></div>
        {!feed.length && <p className="small muted">Follow farms to see their updates here.</p>}
        <div className="stack">
          {feed.map((u) => (
            <Link key={u.key} to={`/invest/farm/${u.f.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div className="row"><Avatar name={u.f.farmer} size={36} /><div className="grow"><b className="small">{u.f.farmer}</b><div className="tiny muted">{u.f.farmName} · {ago(u.at)}</div></div></div>
              <p className="small" style={{ margin: '8px 0 0' }}>{u.text}</p>
              {u.photo ? <img src={u.photo} className="mt" style={{ borderRadius: 12, maxHeight: 200, width: '100%', objectFit: 'cover' }} /> : null}
            </Link>
          ))}
        </div>
        {rows.length > 0 && <div className="mt2" style={{ borderRadius: 20, overflow: 'hidden' }}><FarmScene things={rows.flatMap((r) => r.f?.things ?? []).slice(0, 5)} seed="portfolio" height={120} /></div>}
        <DemoNote>Demo portfolio: no money has moved. Values are projections based on each farm’s plan, not guarantees.</DemoNote>
      </main>
    </>
  );
}
