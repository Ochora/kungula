import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Phone, MessageCircle, Plus, Camera, Share2 } from 'lucide-react';
import { useStore, uid, today } from '../lib/store';
import { MARKETS, PRICED, BUYERS, priceAdvice, priceOn, priceSeries, priceUnit } from '../data/market';
import { subjectIcon, subjectName } from '../data/catalog';
import { ugx, num, fmtDate } from '../lib/util';
import { callNumber, whatsapp, takePhoto, shareText } from '../lib/native';
import { compressImage } from '../lib/util';
import { TopBar, Sparkline, Sheet, DemoNote, Empty, SpeakBtn } from '../components/ui';
import type { Listing } from '../lib/types';

type Tab = 'prices' | 'sell' | 'buyers';
const label = (c: string) => (c === 'milk' ? 'Milk' : c === 'eggs' ? 'Eggs' : subjectName(c));
const icon = (c: string) => (c === 'milk' ? '🥛' : c === 'eggs' ? '🥚' : subjectIcon(c));

export default function Market() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'prices';
  return (
    <>
      <TopBar title="Kungula Market" />
      <main className="page">
        <div className="tabs">
          {([['prices', 'Prices'], ['sell', 'Sell'], ['buyers', 'Buyers']] as [Tab, string][]).map(([k, l]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setParams({ tab: k }, { replace: true })}>{l}</button>
          ))}
        </div>
        <div className="mt">
          {tab === 'prices' && <Prices initialCrop={params.get('crop') ?? undefined} />}
          {tab === 'sell' && <Sell />}
          {tab === 'buyers' && <Buyers />}
        </div>
      </main>
    </>
  );
}

function Prices({ initialCrop }: { initialCrop?: string }) {
  const profile = useStore((s) => s.profile)!;
  const mine = [...profile.crops, ...(profile.animals.includes('cattle') ? ['milk'] : []), ...(profile.animals.includes('poultry') ? ['eggs'] : [])].filter((c) => PRICED.includes(c));
  const order = [...mine, ...PRICED.filter((c) => !mine.includes(c))];
  const [crop, setCrop] = useState(initialCrop && PRICED.includes(initialCrop) ? initialCrop : order[0]);
  const home = MARKETS.find((m) => m.town.toLowerCase() === profile.district.toLowerCase()) ?? MARKETS[3];
  const [market, setMarket] = useState(home.id);
  const series = useMemo(() => priceSeries(crop, market, 52), [crop, market]);
  const now = series[series.length - 1]?.price;
  const week = series[series.length - 2]?.price;
  const season = priceOn(crop, market, new Date(Date.now() - 182 * 86400000));
  const lastYear = priceOn(crop, market, new Date(Date.now() - 365 * 86400000));
  const adv = priceAdvice(crop, market);
  const change = now && week ? ((now - week) / week) * 100 : 0;

  return (
    <>
      <div className="chips" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
        {order.map((c) => <button key={c} className={'chip' + (crop === c ? ' on' : '')} onClick={() => setCrop(c)}>{icon(c)} {label(c)}</button>)}
      </div>
      <select className="input mt" value={market} onChange={(e) => setMarket(e.target.value)}>
        {MARKETS.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.town}</option>)}
      </select>

      <div className="card mt">
        <div className="row between">
          <div>
            <div className="small muted">{icon(crop)} {label(crop)} · per {priceUnit(crop)}</div>
            <div className="display" style={{ fontSize: '2rem' }}>{ugx(now)}</div>
          </div>
          <span className={'badge ' + (change >= 0 ? '' : 'murram')}>{change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% this week</span>
        </div>
        <Sparkline values={series.map((s) => s.price)} height={90} />
        <div className="row between tiny muted"><span>{fmtDate(series[0].date)}</span><span>Today</span></div>
        <div className="grid3 mt">
          <div className="stat"><span className="l">Last week</span><span className="v" style={{ fontSize: '1rem' }}>{num(week)}</span></div>
          <div className="stat"><span className="l">6 months ago</span><span className="v" style={{ fontSize: '1rem' }}>{num(season)}</span></div>
          <div className="stat"><span className="l">A year ago</span><span className="v" style={{ fontSize: '1rem' }}>{num(lastYear)}</span></div>
        </div>
      </div>

      {adv && (
        <div className={'alert mt ' + (adv.action === 'store' ? 'warn' : '')}>
          <span className="a-ico">{adv.action === 'store' ? '📦' : '💵'}</span>
          <div><b>{adv.action === 'store' ? 'Consider storing' : 'Good time to sell'}</b><span className="small">{adv.text}</span>
            <div className="mt"><SpeakBtn text={adv.text} /></div>
          </div>
        </div>
      )}

      <div className="card mt">
        <h2>Compare markets</h2>
        <table className="table mt">
          <tbody>
            {MARKETS.map((m) => {
              const p = priceOn(crop, m.id, new Date());
              return <tr key={m.id}><td>{m.name}<div className="tiny muted">{m.town}</div></td><td className="r"><b>{num(p)}</b></td></tr>;
            })}
          </tbody>
        </table>
        <p className="tiny muted" style={{ marginBottom: 0 }}>Remember transport costs when comparing distant markets.</p>
      </div>
      <DemoNote>Sample prices from seasonal models, for trying out the app. Live prices from Champions and market reporters arrive with the Kungula server.</DemoNote>
    </>
  );
}

function Sell() {
  const listings = useStore((s) => s.listings);
  const profile = useStore((s) => s.profile)!;
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const [open, setOpen] = useState(false);
  const [crop, setCrop] = useState(profile.crops.find((c) => PRICED.includes(c)) ?? 'maize');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [grade, setGrade] = useState<Listing['grade']>('A');
  const [harvestDate, setHarvestDate] = useState(today());
  const [photo, setPhoto] = useState<string>();
  const suggested = priceOn(crop, (MARKETS.find((m) => m.town.toLowerCase() === profile.district.toLowerCase()) ?? MARKETS[3]).id, new Date());

  const save = () => {
    upsert('listings', { id: uid(), crop, quantityKg: parseFloat(qty), pricePerKg: parseFloat(price.replace(/,/g, '')) || suggested || 0, grade, location: `${profile.village ? profile.village + ', ' : ''}${profile.district}`, harvestDate, photo, status: 'open', createdAt: Date.now() });
    setOpen(false); setQty(''); setPrice(''); setPhoto(undefined);
  };
  const markSold = (l: Listing) => {
    upsert('listings', { ...l, status: 'sold' });
    upsert('activities', { id: uid(), date: today(), kind: 'sale', description: `Sold ${num(l.quantityKg)} ${priceUnit(l.crop)} of ${label(l.crop).toLowerCase()} (listing)`, income: l.quantityKg * l.pricePerKg, quantity: l.quantityKg, unit: priceUnit(l.crop).split(' ')[0], createdAt: Date.now() });
  };
  const shareListing = (l: Listing) => shareText('Produce for sale', `For sale: ${num(l.quantityKg)} ${priceUnit(l.crop)} of ${label(l.crop)} (grade ${l.grade}) at UGX ${num(l.pricePerKg)} per ${priceUnit(l.crop)}. Location: ${l.location}. Contact ${profile.name} ${profile.phone}. — via Kungula`);

  return (
    <>
      {!listings.length && <Empty emoji="🧺" title="Nothing listed yet">List your produce and share it with buyers on WhatsApp or SMS.</Empty>}
      <div className="stack">
        {listings.map((l) => (
          <div key={l.id} className="card">
            <div className="row">
              {l.photo ? <img src={l.photo} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} /> : <div className="avatar" style={{ width: 64, height: 64, fontSize: '1.8rem' }}>{icon(l.crop)}</div>}
              <div className="grow">
                <b>{num(l.quantityKg)} {priceUnit(l.crop)} {label(l.crop)}</b>
                <div className="small muted">Grade {l.grade} · {ugx(l.pricePerKg)} each · {l.location}</div>
                <div className="small">Total ≈ <b>{ugx(l.quantityKg * l.pricePerKg)}</b></div>
              </div>
              <span className={'badge ' + (l.status === 'sold' ? 'grey' : 'gold')}>{l.status === 'sold' ? 'Sold' : 'For sale'}</span>
            </div>
            {l.status !== 'sold' && (
              <div className="row mt" style={{ gap: 6 }}>
                <button className="btn sm grow" onClick={() => shareListing(l)}><Share2 size={16} /> Share</button>
                <button className="btn sm soft grow" onClick={() => markSold(l)}>Mark sold</button>
                <button className="btn sm ghost" onClick={() => confirm('Remove listing?') && remove('listings', l.id)}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button className="btn block mt" onClick={() => setOpen(true)}><Plus size={20} /> List produce for sale</button>
      <div className="card mt" style={{ background: 'var(--green-soft)' }}>
        <b>🤝 Sell together, earn more</b>
        <p className="small" style={{ margin: '6px 0 8px' }}>Big buyers want big volumes. Bulk your produce with your group or co-operative.</p>
        <Link to="/coop" className="btn sm">Open Kungula Co-op</Link>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="List produce">
        <div className="chips mt">
          {PRICED.map((c) => <button key={c} className={'chip' + (crop === c ? ' on' : '')} onClick={() => setCrop(c)}>{icon(c)} {label(c)}</button>)}
        </div>
        <div className="grid2">
          <label className="field"><span>Quantity ({priceUnit(crop)})</span><input className="input" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} /></label>
          <label className="field"><span>Asking price per {priceUnit(crop)}</span><input className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={suggested ? num(suggested) : ''} /></label>
          <label className="field"><span>Harvest date</span><input className="input" type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} /></label>
          <label className="field"><span>Quality grade</span>
            <select className="input" value={grade} onChange={(e) => setGrade(e.target.value as Listing['grade'])}>
              <option value="A">A — clean, dry, sorted</option><option value="B">B — some broken/mixed</option><option value="C">C — needs sorting</option>
            </select>
          </label>
        </div>
        {suggested && <p className="small muted">Market price near you today: about {ugx(suggested)} (sample).</p>}
        <button className="btn soft block mt" onClick={async () => { const p = await takePhoto('camera').catch(() => undefined); if (p) setPhoto(await compressImage(p, 480, 0.6)); }}>
          <Camera size={18} /> {photo ? 'Retake photo' : 'Add a photo'}
        </button>
        {photo && <img src={photo} className="mt" style={{ borderRadius: 12, maxHeight: 160, objectFit: 'cover', width: '100%' }} />}
        <button className="btn block mt2" disabled={!qty} onClick={save}>Publish listing</button>
        <p className="tiny muted center">Listings are saved on your phone and shared by you. The public buyer marketplace opens with the Kungula server.</p>
      </Sheet>
    </>
  );
}

function Buyers() {
  const profile = useStore((s) => s.profile)!;
  const [all, setAll] = useState(false);
  const list = BUYERS.filter((b) => all || b.crops.some((c) => profile.crops.includes(c)));
  const TYPE: Record<string, string> = { trader: '🧑‍💼 Trader', processor: '🏭 Processor', supermarket: '🏬 Supermarket', exporter: '🚢 Exporter', institution: '🏛️ Institution' };
  return (
    <>
      <label className="row small"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} style={{ width: 20, height: 20, accentColor: '#1F6B3A' }} /> Show buyers for all crops</label>
      {!list.length && <Empty emoji="🔍" title="No buyers for your crops yet" />}
      <div className="stack mt">
        {list.map((b) => (
          <div key={b.id} className="card">
            <div className="row between"><b>{b.name}</b><span className="badge">✓ Verified</span></div>
            <div className="small muted">{TYPE[b.type]} · {b.location} · min {num(b.minKg)} kg</div>
            <div className="row wrap mt" style={{ gap: 4 }}>{b.crops.map((c) => <span key={c} className="badge grey">{subjectIcon(c)} {subjectName(c)}</span>)}</div>
            <p className="small" style={{ margin: '8px 0' }}>{b.note}</p>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn sm grow" onClick={() => callNumber(b.phone)}><Phone size={16} /> Call</button>
              <button className="btn sm soft grow" onClick={() => whatsapp(b.phone, `Hello, I am ${profile.name}, a farmer in ${profile.district}. I found you on Kungula.`)}><MessageCircle size={16} /> WhatsApp</button>
            </div>
          </div>
        ))}
      </div>
      <DemoNote>Demonstration buyers with placeholder numbers. The verified buyer registry and safe escrow payments (through licensed partners) launch in V1.</DemoNote>
    </>
  );
}
