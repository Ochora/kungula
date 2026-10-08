import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Phone, MessageCircle, Mail, Heart, Share2, Check, X, HeartPulse, Thermometer, Activity as ActIco } from 'lucide-react';
import { useStore, uid } from '../lib/store';
import { useScore } from '../lib/hooks';
import { farmById, trustScore, avgStars, project, vitals, greenness, type Farm, type Opportunity } from '../data/farms';
import { subjectIcon, subjectName } from '../data/catalog';
import { ugx, num, fmtDate, ago } from '../lib/util';
import { callNumber, whatsapp, shareText } from '../lib/native';
import { myFarm } from '../lib/myfarm';
import { TopBar, Stars, Seal, Sheet, Empty, Sparkline, DemoNote } from '../components/ui';
import { Avatar, FarmScene } from '../components/Art';
import { useAllReviews } from './Invest';

type Tab = 'overview' | 'invest' | 'updates' | 'monitor' | 'reviews';

export default function FarmProfile() {
  const { id = '' } = useParams();
  const profile = useStore((s) => s.profile)!;
  const plots = useStore((s) => s.plots);
  const activities = useStore((s) => s.activities);
  const updatesAll = useStore((s) => s.updates);
  const { score } = useScore();
  const farm = useMemo(() => (id === 'me' ? myFarm(profile, plots, activities, updatesAll, score) : farmById(id)), [id, profile, plots, activities, updatesAll, score]);
  const [tab, setTab] = useState<Tab>('overview');
  if (!farm) return (<><TopBar title="Farm" /><main className="page"><Empty emoji="🌾" title="Farm not found" /></main></>);
  return <FarmView farm={farm} tab={tab} setTab={setTab} isMe={id === 'me'} photo={id === 'me' ? profile.photo : undefined} />;
}

function FarmView({ farm: f, tab, setTab, isMe, photo }: { farm: Farm; tab: Tab; setTab: (t: Tab) => void; isMe: boolean; photo?: string }) {
  const follows = useStore((s) => s.follows);
  const set = useStore((s) => s.set);
  const reviews = useAllReviews(f);
  const localUpdates = useStore((s) => s.updates).filter((u) => u.farmId === f.id);
  const following = follows.includes(f.id);
  const trust = trustScore({ ...f, reviews });
  const genuinePct = reviews.length ? Math.round((reviews.filter((r) => r.genuine).length / reviews.length) * 100) : undefined;
  const hasAnimals = !!f.animals?.length;

  return (
    <>
      <TopBar title={isMe ? 'How investors see you' : f.farmName} right={
        <button className="icon-btn" aria-label="Share" onClick={() => shareText(f.farmName, `${f.farmName} — ${f.farmer}, ${f.district}. ${f.verification.status === 'verified' ? 'Verified by Kungula.' : ''} Follow this farm on Kungula.`)}><Share2 size={20} /></button>
      } />
      <main className="page">
        <div className="cover">
          <FarmScene things={f.things} seed={f.id} height={170} />
          <div style={{ position: 'absolute', right: 12, top: 12 }}><Seal status={f.verification.status} /></div>
          <div className="cover-avatar"><Avatar name={f.farmer} photo={photo} size={92} /></div>
        </div>
        <div style={{ paddingLeft: 122, minHeight: 50, marginTop: 6 }}>
          <div className="display" style={{ fontSize: '1.45rem' }}>{f.farmer}</div>
          <div className="small muted">{f.farmName} · {f.village}, {f.district}</div>
        </div>

        <div className="row wrap mt" style={{ gap: 8 }}>
          {!isMe && (
            <button className={'btn sm ' + (following ? 'soft' : '')} onClick={() => set({ follows: following ? follows.filter((x) => x !== f.id) : [...follows, f.id] })}>
              <Heart size={16} fill={following ? 'currentColor' : 'none'} /> {following ? 'Following' : 'Follow farm'}
            </button>
          )}
          <button className="btn sm ghost" onClick={() => callNumber(f.phone)}><Phone size={16} /> Call</button>
          <button className="btn sm ghost" onClick={() => whatsapp(f.whatsapp, `Hello ${f.farmer.split(' ')[0]}, I found your farm on Kungula.`)}><MessageCircle size={16} /> WhatsApp</button>
          {f.email && <a className="btn sm ghost" href={`mailto:${f.email}`}><Mail size={16} /> Email</a>}
        </div>

        <div className="card mt">
          <div className="grid3">
            <div className="stat"><span className="v">{trust}</span><span className="l">Trust score</span></div>
            <div className="stat"><span className="v">{reviews.length ? avgStars(reviews).toFixed(1) : '—'}</span><span className="l"><Stars value={avgStars(reviews)} size={11} /> {reviews.length} reviews</span></div>
            <div className="stat"><span className="v">{genuinePct !== undefined ? `${genuinePct}%` : '—'}</span><span className="l">say genuine</span></div>
          </div>
          <div className="grid3 mt">
            <div className="stat"><span className="v" style={{ fontSize: '1.15rem' }}>{num(f.acres, 1)}</span><span className="l">acres</span></div>
            <div className="stat"><span className="v" style={{ fontSize: '1.15rem' }}>{f.yearsFarming || '—'}</span><span className="l">years farming</span></div>
            <div className="stat"><span className="v" style={{ fontSize: '1.15rem' }}>{f.recordsKept}</span><span className="l">records kept</span></div>
          </div>
        </div>

        <div className="tabs mt">
          {(['overview', 'invest', 'updates', ...(hasAnimals || !isMe ? ['monitor'] : []), 'reviews'] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t === 'monitor' ? 'Health' : t[0].toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        <div className="mt">
          {tab === 'overview' && <Overview f={f} />}
          {tab === 'invest' && <Opportunities f={f} isMe={isMe} />}
          {tab === 'updates' && <Updates f={f} local={localUpdates} />}
          {tab === 'monitor' && <Monitor f={f} />}
          {tab === 'reviews' && <Reviews f={f} isMe={isMe} />}
        </div>
        {!isMe && f.id.startsWith('f-') && <DemoNote>Demonstration farm: the farmer, contacts and figures are fictional.</DemoNote>}
      </main>
    </>
  );
}

function Overview({ f }: { f: Farm }) {
  const maxY = Math.max(1, ...f.yieldHistory.map((y) => y.amount));
  return (
    <div className="stack">
      <div className="card">
        <h2>About the farm</h2>
        <p style={{ margin: '8px 0' }}>{f.bio}</p>
        <div className="row wrap" style={{ gap: 6 }}>{f.things.map((t) => <span key={t} className="badge grey">{subjectIcon(t)} {subjectName(t)}</span>)}</div>
        <p className="tiny muted" style={{ marginBottom: 0 }}>On Kungula since {fmtDate(f.joined)} · loan readiness {f.loanScore}/100</p>
      </div>
      <div className="card">
        <div className="row between"><h2>Kungula verification</h2><Seal status={f.verification.status} /></div>
        {f.verification.visitedOn && <p className="small muted" style={{ margin: '6px 0' }}>{f.verification.status === 'verified' ? `Visited ${fmtDate(f.verification.visitedOn)} by ${f.verification.officer}.` : `Visit booked for ${fmtDate(f.verification.visitedOn)}.`}</p>}
        <ul className="list">
          {f.verification.checks.map((c) => (
            <li key={c.label} style={{ padding: '9px 2px' }}>
              {c.ok ? <Check size={20} className="tint" /> : <X size={20} style={{ color: 'var(--muted)' }} />}
              <div className="grow small" style={{ color: c.ok ? 'var(--ink)' : 'var(--muted)' }}>{c.label}{c.note ? <div className="tiny muted">{c.note}</div> : null}</div>
            </li>
          ))}
        </ul>
        <p className="tiny muted" style={{ marginBottom: 0 }}>Kungula officers check documents in person and do not publish ID or land document numbers.</p>
      </div>
      {f.yieldHistory.length > 0 && (
        <div className="card">
          <h2>Harvest record</h2>
          <div className="row top mt" style={{ alignItems: 'flex-end', gap: 12, height: 140 }}>
            {f.yieldHistory.map((y) => (
              <div key={y.season} className="grow center" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <div className="tiny" style={{ fontWeight: 700 }}>{num(y.amount)}</div>
                <div style={{ height: `${(y.amount / maxY) * 100}px`, background: 'linear-gradient(var(--gold), var(--murram))', borderRadius: '10px 10px 4px 4px', marginTop: 4 }} />
                <div className="tiny muted" style={{ marginTop: 4 }}>{y.season}</div>
              </div>
            ))}
          </div>
          <p className="tiny muted" style={{ marginBottom: 0 }}>{subjectIcon(f.yieldHistory[0].subject)} {f.yieldHistory[0].unit}, from the farmer’s Kungula records.</p>
        </div>
      )}
    </div>
  );
}

function Opportunities({ f, isMe }: { f: Farm; isMe: boolean }) {
  const [sel, setSel] = useState<Opportunity>();
  if (!f.opportunities.length) return <Empty emoji="🌱" title={isMe ? 'You are not asking for investment yet' : 'No open opportunities'}>{isMe ? <Link to="/profile#invest" className="btn sm mt">Set up in your profile</Link> : 'Follow the farm to hear when one opens.'}</Empty>;
  return (
    <div className="stack">
      {f.opportunities.map((o) => {
        const left = o.unitsTotal - o.unitsTaken;
        return (
          <div key={o.id} className="card">
            <div className="row top">
              <div className="avatar" style={{ fontSize: '1.6rem' }}>{subjectIcon(o.subject)}</div>
              <div className="grow"><b>{o.title}</b><div className="small muted">{o.unitLabel}</div></div>
            </div>
            <div className="grid3 mt">
              <div className="stat"><span className="v" style={{ fontSize: '1.05rem' }}>{num(o.unitPrice / 1000)}k</span><span className="l">per share</span></div>
              <div className="stat"><span className="v" style={{ fontSize: '1.05rem' }}>{o.months} mo</span><span className="l">period</span></div>
              <div className="stat"><span className="v" style={{ fontSize: '1.05rem', color: 'var(--green)' }}>{o.returnMid}%</span><span className="l">expected</span></div>
            </div>
            <div className="progress mt" style={{ height: 6 }}><i style={{ width: `${(o.unitsTaken / o.unitsTotal) * 100}%`, background: 'var(--gold)' }} /></div>
            <div className="tiny muted" style={{ marginTop: 4 }}>{left} of {o.unitsTotal} shares left</div>
            <p className="small" style={{ margin: '10px 0' }}>{o.howItWorks}</p>
            <button className="btn block" disabled={isMe || left <= 0} onClick={() => setSel(o)}>{isMe ? 'Investors will see this' : f.verification.status !== 'verified' ? 'See projection' : 'See projection & invest'}</button>
          </div>
        );
      })}
      <InvestSheet f={f} o={sel} onClose={() => setSel(undefined)} />
    </div>
  );
}

function InvestSheet({ f, o, onClose }: { f: Farm; o?: Opportunity; onClose: () => void }) {
  const upsert = useStore((s) => s.upsert);
  const follows = useStore((s) => s.follows);
  const set = useStore((s) => s.set);
  const [units, setUnits] = useState(1);
  const [ack, setAck] = useState([false, false]);
  const [done, setDone] = useState(false);
  if (!o) return null;
  const p = project(o, units);
  const left = o.unitsTotal - o.unitsTaken;
  const verified = f.verification.status === 'verified';
  const close = () => { setDone(false); setUnits(1); setAck([false, false]); onClose(); };
  return (
    <Sheet open={!!o} onClose={close} title={o.title}>
      {done ? (
        <div className="empty">
          <div className="emoji">💚</div>
          <b style={{ color: 'var(--ink)' }}>You are backing {f.farmer.split(' ')[0]}</b>
          <p className="small">Your investment is in your portfolio. You now follow this farm and will see every update.</p>
          <Link to="/portfolio" className="btn" onClick={close}>Open my portfolio</Link>
        </div>
      ) : (
        <>
          <div className="row between mt">
            <span className="small muted">Shares</span>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn sm soft" onClick={() => setUnits(Math.max(1, units - 1))}>−</button>
              <b style={{ minWidth: 28, textAlign: 'center', fontSize: '1.2rem' }}>{units}</b>
              <button className="btn sm soft" onClick={() => setUnits(Math.min(left, units + 1))}>+</button>
            </div>
          </div>
          <div className="card mt">
            <div className="row between"><span>You invest</span><b>{ugx(p.invested)}</b></div>
            {p.output && <div className="row between small mt"><span className="muted">Expected output</span><span>{num(p.output)} {o.yieldUnit}</span></div>}
            {p.grossValue && <div className="row between small"><span className="muted">Worth at today’s price</span><span>{ugx(p.grossValue)}</span></div>}
            <div className="section-title" style={{ margin: '14px 0 6px', fontSize: '1rem' }}>Money back after {o.months} months</div>
            {([['Bad season', p.low, o.returnLow], ['Expected', p.mid, o.returnMid], ['Good season', p.high, o.returnHigh]] as const).map(([l, v, r]) => (
              <div key={l} className="row between small" style={{ padding: '4px 0' }}>
                <span>{l}</span><span><b>{ugx(v)}</b> <span className="muted">({r >= 0 ? '+' : ''}{r}%)</span></span>
              </div>
            ))}
          </div>
          <div className="alert warn mt"><span className="a-ico">⚠️</span><div><b>Main risks</b><span className="small">{o.risks.join(' · ')}</span></div></div>
          {!verified ? (
            <div className="alert urgent mt"><span className="a-ico">🔒</span><div><b>Not open yet</b><span className="small">Investing opens only after Kungula has visited and verified this farm. Follow the farm to be told when it is verified.</span></div></div>
          ) : (
            <>
              {['I understand returns are projections and I could get back less than I invest.', 'I have read the farm’s verification report and reviews.'].map((t, i) => (
                <label key={t} className="row small mt" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={ack[i]} onChange={(e) => setAck(ack.map((a, j) => (j === i ? e.target.checked : a)))} style={{ width: 22, height: 22, accentColor: 'var(--green)', flex: 'none' }} />
                  {t}
                </label>
              ))}
              <button className="btn gold block mt2" disabled={!ack.every(Boolean)} onClick={() => {
                upsert('investments', { id: uid(), farmId: f.id, opportunityId: o.id, units, amount: p.invested, createdAt: Date.now(), status: 'active' });
                if (!follows.includes(f.id)) set({ follows: [...follows, f.id] });
                setDone(true);
              }}>Invest {ugx(p.invested)}</button>
              <p className="tiny muted center">Demo: no payment is taken. Live investing will be handled by a licensed partner.</p>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}

function Updates({ f, local }: { f: Farm; local: { id: string; text: string; photo?: string; at: number; kind: string }[] }) {
  const items = [
    ...local.map((u) => ({ key: u.id, at: u.at, text: u.text, kind: u.kind, photo: u.photo, scene: undefined as string[] | undefined })),
    ...f.updates.map((u, i) => ({ key: 'd' + i, at: Date.now() - u.daysAgo * 86400000, text: u.text, kind: u.kind, photo: undefined, scene: u.scene })),
  ].sort((a, b) => b.at - a.at);
  const ICON: Record<string, string> = { update: '🌱', harvest: '🧺', health: '🩺', verification: '✅' };
  if (!items.length) return <Empty emoji="📷" title="No updates yet" />;
  return (
    <div className="stack">
      {items.map((u) => (
        <div key={u.key} className="card">
          <div className="row"><span style={{ fontSize: '1.3rem' }}>{ICON[u.kind] ?? '🌱'}</span><b className="grow small">{u.kind === 'verification' ? 'Verification' : u.kind === 'harvest' ? 'Harvest' : u.kind === 'health' ? 'Farm health' : 'Farm update'}</b><span className="tiny muted">{ago(u.at)}</span></div>
          <p style={{ margin: '8px 0 0' }}>{u.text}</p>
          {u.photo && <img src={u.photo} className="mt" style={{ borderRadius: 14, width: '100%', maxHeight: 260, objectFit: 'cover' }} />}
          {!u.photo && u.scene && <div className="mt" style={{ borderRadius: 14, overflow: 'hidden' }}><FarmScene things={u.scene} seed={u.key + f.id} height={120} /></div>}
        </div>
      ))}
    </div>
  );
}

function Monitor({ f }: { f: Farm }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 2000); return () => clearInterval(t); }, []);
  const g = greenness(f.id);
  const crops = f.things.some((t) => !['cattle', 'goats', 'pigs', 'poultry', 'sheep', 'fish'].includes(t));
  return (
    <div className="stack">
      {f.animals?.length ? (
        <div className="card">
          <div className="row between"><h2><HeartPulse size={20} className="tint" /> Animal health monitor</h2><span className="badge gold">Demo sensors</span></div>
          <p className="small muted" style={{ margin: '6px 0 4px' }}>Live readings from smart collars and ear tags. Kungula alerts the farmer, vet and investors if an animal leaves its normal range.</p>
          {f.animals.map((a) => {
            const v = vitals(a);
            return (
              <div key={a.tag} className="vital mt">
                <div className="row between"><b>{subjectIcon(a.kind)} {a.name} <span className="muted tiny">· {a.tag}</span></b><span className={'badge ' + (v.ok ? '' : 'red')}>{v.ok ? 'Normal' : 'Check animal'}</span></div>
                <div className="grid3 mt">
                  <div><div className="tiny muted"><HeartPulse size={12} /> Heart rate</div><div className="v"><span className="pulse" style={{ color: 'var(--alert)', fontSize: '1rem' }}>♥</span> {v.hr}</div><div className="tiny muted">bpm ({v.normalHr[0]}–{v.normalHr[1]})</div></div>
                  <div><div className="tiny muted"><Thermometer size={12} /> Temperature</div><div className="v">{v.temp}°</div><div className="tiny muted">°C ({v.normalT[0]}–{v.normalT[1]})</div></div>
                  <div><div className="tiny muted"><ActIco size={12} /> Activity</div><div className="v">{v.activity}</div><div className="tiny muted">{v.rumination ? `${v.rumination} min chewing` : 'index'}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {crops && (
        <div className="card">
          <div className="row between"><h2>🛰️ Crop health from space</h2><span className="badge gold">Demo</span></div>
          <p className="small muted" style={{ margin: '6px 0' }}>Greenness of the mapped plots over the last 16 weeks. A sudden drop can mean drought, pests or disease.</p>
          <Sparkline values={g} height={80} />
          <div className="row between tiny muted"><span>16 weeks ago</span><span>Now: {Math.round(g[g.length - 1] * 100)}/100</span></div>
        </div>
      )}
      <p className="tiny muted center">Sensor and satellite feeds connect in a future version. Readings shown here are simulated so you can see how monitoring will work.</p>
    </div>
  );
}

function Reviews({ f, isMe }: { f: Farm; isMe: boolean }) {
  const reviews = useAllReviews(f);
  const profile = useStore((s) => s.profile)!;
  const investments = useStore((s) => s.investments);
  const upsert = useStore((s) => s.upsert);
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [genuine, setGenuine] = useState<boolean>();
  const backer = investments.some((i) => i.farmId === f.id);
  return (
    <>
      {!isMe && <button className="btn block" onClick={() => setOpen(true)}>Rate and review this farmer</button>}
      {!reviews.length && <Empty emoji="⭐" title="No reviews yet">{isMe ? 'Buyers, investors and your co-operative can review you once you are verified.' : 'Be the first to review.'}</Empty>}
      <div className="stack mt">
        {reviews.map((r, i) => (
          <div key={i} className="card">
            <div className="row between"><b className="small">{r.author}{r.mine ? ' (you)' : ''}</b><span className="tiny muted">{r.daysAgo === 0 ? 'today' : `${r.daysAgo} d ago`}</span></div>
            <div className="row" style={{ gap: 8 }}><Stars value={r.stars} /> {r.genuine ? <span className="badge">✓ Genuine</span> : <span className="badge red">Doubts genuineness</span>}</div>
            <p className="small" style={{ margin: '6px 0 0' }}>{r.text}</p>
          </div>
        ))}
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={`Review ${f.farmer.split(' ')[0]}`}>
        <div className="center mt"><Stars value={stars} size={34} onPick={setStars} /></div>
        <div className="field"><span>Is this farmer genuine?</span>
          <div className="grid2">
            <button className={'chip big' + (genuine === true ? ' on' : '')} style={{ justifyContent: 'center' }} onClick={() => setGenuine(true)}>✓ Yes, genuine</button>
            <button className={'chip big' + (genuine === false ? ' on' : '')} style={{ justifyContent: 'center' }} onClick={() => setGenuine(false)}>⚠ I have doubts</button>
          </div>
        </div>
        <label className="field"><span>Your experience</span><textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Did you visit? Were updates honest? Were payments on time?" /></label>
        <p className="tiny muted">Reviews show your name. False or abusive reviews are removed.</p>
        <button className="btn block mt" disabled={!stars || genuine === undefined || text.trim().length < 10} onClick={() => {
          upsert('reviews', { id: uid(), farmId: f.id, author: `${profile.name}${backer ? ' (backer)' : ''}`, stars, text: text.trim(), genuine: !!genuine, at: Date.now(), mine: true });
          setOpen(false); setStars(0); setText(''); setGenuine(undefined);
        }}>Post review</button>
      </Sheet>
    </>
  );
}
