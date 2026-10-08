import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, ShieldCheck } from 'lucide-react';
import { useStore, isFarmer } from '../lib/store';
import { FARMS, trustScore, avgStars, type Farm } from '../data/farms';
import { subjectIcon, subjectName } from '../data/catalog';
import { ugx, num } from '../lib/util';
import { TopBar, Stars, Seal, DemoNote, Empty } from '../components/ui';
import { Avatar, FarmScene } from '../components/Art';

type Kind = 'all' | 'crop' | 'livestock' | 'equipment';

export function useAllReviews(f: Farm) {
  const mine = useStore((s) => s.reviews);
  return useMemo(() => [
    ...mine.filter((r) => r.farmId === f.id).map((r) => ({ author: r.author, stars: r.stars, text: r.text, genuine: r.genuine, daysAgo: Math.floor((Date.now() - r.at) / 86400000), mine: true })),
    ...f.reviews.map((r) => ({ ...r, mine: false })),
  ], [mine, f]);
}

export function FarmCard({ f }: { f: Farm }) {
  const reviews = useAllReviews(f);
  const follows = useStore((s) => s.follows);
  const set = useStore((s) => s.set);
  const following = follows.includes(f.id);
  const trust = trustScore({ ...f, reviews });
  const top = f.opportunities[0];
  const pct = top ? top.unitsTaken / top.unitsTotal : 0;
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <Link to={`/invest/farm/${f.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={{ position: 'relative' }}>
          <FarmScene things={f.things} seed={f.id} height={130} />
          <div style={{ position: 'absolute', left: 12, top: 12 }}><Seal status={f.verification.status} /></div>
        </div>
        <div style={{ padding: '0 14px 14px' }}>
          <div className="row top" style={{ marginTop: -26 }}>
            <Avatar name={f.farmer} size={58} style={{ border: '3px solid var(--card)', boxShadow: 'var(--shadow)' }} />
            <div className="grow" style={{ paddingTop: 30 }}>
              <b style={{ fontSize: '1.05rem' }}>{f.farmName}</b>
              <div className="small muted">{f.farmer}, {f.village}, {f.district}</div>
            </div>
          </div>
          <div className="row wrap mt" style={{ gap: 6 }}>
            {f.things.slice(0, 4).map((t) => <span key={t} className="badge grey">{subjectIcon(t)} {subjectName(t)}</span>)}
          </div>
          <div className="row between mt small">
            <span className="row" style={{ gap: 6 }}><Stars value={avgStars(reviews)} /> <span className="muted">{reviews.length ? `${avgStars(reviews).toFixed(1)} (${reviews.length})` : 'No reviews yet'}</span></span>
            <span><b>{trust}</b><span className="muted">/100 trust</span></span>
          </div>
          {top && (
            <div className="card flat mt" style={{ padding: 12 }}>
              <div className="small" style={{ fontWeight: 700 }}>{top.title}</div>
              <div className="row between tiny muted" style={{ marginTop: 4 }}>
                <span>{ugx(top.unitPrice)} per share · {top.months} months</span>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>{top.returnLow}–{top.returnHigh}% projected</span>
              </div>
              <div className="progress mt" style={{ height: 6 }}><i style={{ width: `${pct * 100}%`, background: 'var(--gold)' }} /></div>
              <div className="tiny muted" style={{ marginTop: 4 }}>{top.unitsTaken} of {top.unitsTotal} shares taken</div>
            </div>
          )}
        </div>
      </Link>
      <div className="row" style={{ padding: '0 14px 14px', gap: 8 }}>
        <button className={'btn sm ' + (following ? 'soft' : 'ghost')} onClick={() => set({ follows: following ? follows.filter((x) => x !== f.id) : [...follows, f.id] })}>
          <Heart size={16} fill={following ? 'currentColor' : 'none'} /> {following ? 'Following' : 'Follow'}
        </button>
        <Link to={`/invest/farm/${f.id}`} className="btn sm grow">View farm</Link>
      </div>
    </div>
  );
}

export default function Invest() {
  const profile = useStore((s) => s.profile)!;
  const follows = useStore((s) => s.follows);
  const investments = useStore((s) => s.investments);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Kind>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<'trust' | 'return' | 'new'>('trust');
  const [tab, setTab] = useState<'discover' | 'following'>('discover');

  const list = FARMS
    .filter((f) => tab === 'discover' || follows.includes(f.id))
    .filter((f) => !verifiedOnly || f.verification.status === 'verified')
    .filter((f) => kind === 'all' || f.opportunities.some((o) => o.kind === kind))
    .filter((f) => !q || `${f.farmName} ${f.farmer} ${f.district} ${f.things.map(subjectName).join(' ')}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === 'return' ? (b.opportunities[0]?.returnMid ?? 0) - (a.opportunities[0]?.returnMid ?? 0)
      : sort === 'new' ? b.joined.localeCompare(a.joined) : trustScore(b) - trustScore(a));
  const invested = investments.reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <TopBar title="Kungula Invest" back={false} />
      <main className="page">
        <div className="hero">
          <div className="sun" />
          <div className="display" style={{ fontSize: '1.55rem' }}>Back a real farm. Watch it grow.</div>
          <p className="small muted" style={{ margin: '6px 0 12px' }}>Every farm open for investment has been visited and checked by Kungula in person.</p>
          <div className="row" style={{ gap: 8 }}>
            <Link to="/portfolio" className="btn gold grow">My portfolio{invested ? ` · ${num(invested / 1e6, 1)}M` : ''}</Link>
            {isFarmer(profile) && <Link to="/profile#invest" className="btn glass">List my farm</Link>}
          </div>
        </div>

        <div className="tabs mt">
          <button className={tab === 'discover' ? 'on' : ''} onClick={() => setTab('discover')}>Discover farms</button>
          <button className={tab === 'following' ? 'on' : ''} onClick={() => setTab('following')}>Following ({follows.length})</button>
        </div>

        <div className="row mt" style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, color: 'var(--muted)' }} />
          <input className="input" style={{ paddingLeft: 40 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search farms, crops, districts" />
        </div>
        <div className="chips mt" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
          {([['all', 'All'], ['crop', '🌱 Crops'], ['livestock', '🐄 Animals'], ['equipment', '🚿 Equipment']] as [Kind, string][]).map(([k, l]) => (
            <button key={k} className={'chip' + (kind === k ? ' on' : '')} onClick={() => setKind(k)}>{l}</button>
          ))}
          <button className={'chip' + (verifiedOnly ? ' on' : '')} onClick={() => setVerifiedOnly(!verifiedOnly)}><ShieldCheck size={16} /> Verified only</button>
        </div>
        <div className="row between mt small">
          <span className="muted">{list.length} farm{list.length === 1 ? '' : 's'}</span>
          <select className="input" style={{ width: 'auto', minHeight: 38, padding: '4px 10px' }} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="trust">Most trusted</option><option value="return">Highest projected return</option><option value="new">Newest</option>
          </select>
        </div>

        {!list.length && <Empty emoji={tab === 'following' ? '💚' : '🔍'} title={tab === 'following' ? 'You are not following any farms yet' : 'No farms match'}>{tab === 'following' ? 'Tap Follow on a farm to see its updates here.' : 'Try another filter.'}</Empty>}
        <div className="stack mt">{list.map((f) => <FarmCard key={f.id} f={f} />)}</div>

        <div className="card flat mt2">
          <b>Before you invest</b>
          <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            <li>Returns are projections, not promises. Weather, disease and prices can reduce them, and you can lose money.</li>
            <li>Only invest in farms with the green “Verified by Kungula” seal, and only money you can leave in for the full period.</li>
            <li>Read the reviews, follow the farm for a while, and visit if you can.</li>
          </ul>
          <Link to="/learn?topic=invest" className="btn sm soft mt">Learn how farm investing works</Link>
        </div>
        <DemoNote>Demonstration farms with fictional farmers and numbers. No money moves in this version — investments are recorded on your phone only. Live investing will run through licensed partners once regulatory approval is in place.</DemoNote>
      </main>
    </>
  );
}
