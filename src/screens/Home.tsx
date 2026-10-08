import { Link } from 'react-router-dom';
import { Mic, ScanLine, Bell, ChevronRight, CheckCircle2, Circle, Sun, Moon } from 'lucide-react';
import { useStore, isFarmer, isInvestor } from '../lib/store';
import { useT } from '../lib/i18n';
import { useScore, useWeather } from '../lib/hooks';
import { farmAlerts, weatherIcon, weatherWord } from '../lib/weather';
import { levelOf } from '../lib/game';
import { Sparkline, Seal } from '../components/ui';
import { Avatar, FarmScene, useDark } from '../components/Art';
import { MARKETS, PRICED, priceSeries, priceUnit } from '../data/market';
import { FARMS, project, trustScore } from '../data/farms';
import { ARTICLES } from '../data/knowledge';
import { LESSONS } from '../data/lessons';
import { subjectIcon, subjectName } from '../data/catalog';
import { ugx, fmtDay, num, ago } from '../lib/util';
import { cancelReminder } from '../lib/native';

export default function Home({ online }: { online: boolean }) {
  const t = useT();
  const profile = useStore((s) => s.profile)!;
  const lang = useStore((s) => s.settings.lang);
  const gamify = useStore((s) => s.settings.gamify ?? true);
  const setSettings = useStore((s) => s.setSettings);
  const game = useStore((s) => s.game);
  const reminders = useStore((s) => s.reminders);
  const dark = useDark();
  const farmer = isFarmer(profile);
  const investor = isInvestor(profile);
  const learnerOnly = !farmer && !investor;
  const lv = levelOf(game.xp);
  const due = reminders.filter((r) => !r.done && new Date(r.due).getTime() < Date.now() + 7 * 86400000);

  const first = profile.name.split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const things = [...profile.crops, ...profile.animals, ...(profile.interests ?? [])];

  return (
    <>
      <main className="page" style={{ paddingTop: 'calc(var(--safe-top) + 12px)' }}>
        <div className="hero-scene">
          <FarmScene things={things.length ? things : ['banana', 'coffee', 'cattle']} seed={profile.name} plantStage={gamify ? lv.index : undefined} plantAt="hill" height={250} />
          <div className="over row top">
            <div className="grow">
              <div className="sub">{profile.village ? `${profile.village}, ` : ''}{profile.district}</div>
              <div className="sub" style={{ fontWeight: 700, marginTop: 6 }}>{lang === 'en' ? greet : t('greeting')},</div>
              <div className="greet">{first || 'friend'}</div>
            </div>
            <button className="icon-btn" style={{ color: '#fff', background: 'rgba(0,0,0,.18)' }} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setSettings({ theme: dark ? 'light' : 'dark' })}>
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {farmer && (
              <Link to="/farm?tab=reminders" className="icon-btn" style={{ color: '#fff', background: 'rgba(0,0,0,.18)', position: 'relative' }} aria-label="Reminders">
                <Bell size={20} />{due.length > 0 && <span style={{ position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: 5, background: 'var(--gold)' }} />}
              </Link>
            )}
            <Link to="/profile" aria-label="My profile" style={{ borderRadius: 16, border: '2px solid rgba(255,255,255,.8)', overflow: 'hidden', display: 'block', lineHeight: 0 }}>
              <Avatar name={profile.name} photo={profile.photo} size={42} />
            </Link>
          </div>
          <div className="bottom">
            {farmer ? (
              <>
                <Link to="/jjajja" className="btn gold grow"><Mic size={20} /> {t('askJjajja')}</Link>
                <Link to="/scan" className="btn glass" style={{ backdropFilter: 'blur(6px)', background: 'rgba(10,30,18,.45)' }}><ScanLine size={20} /> {t('scan')}</Link>
              </>
            ) : investor ? (
              <>
                <Link to="/invest" className="btn gold grow">Discover farms</Link>
                <Link to="/portfolio" className="btn glass" style={{ background: 'rgba(10,30,18,.45)' }}>Portfolio</Link>
              </>
            ) : (
              <>
                <Link to="/learn" className="btn gold grow">Start learning</Link>
                <Link to="/jjajja" className="btn glass" style={{ background: 'rgba(10,30,18,.45)' }}><Mic size={20} /> Ask Jjajja</Link>
              </>
            )}
          </div>
        </div>

        {gamify && (
          <Link to="/profile" className="card row mt" style={{ textDecoration: 'none', color: 'inherit', padding: '10px 14px' }}>
            <span style={{ fontSize: '1.6rem' }}>{lv.icon}</span>
            <div className="grow">
              <div className="row between small"><b>{lv.name}</b><span className="muted">{game.streak > 0 ? `🔥 ${game.streak} day${game.streak > 1 ? 's' : ''}` : ''} · {game.xp} XP</span></div>
              <div className="progress" style={{ height: 7, marginTop: 4 }}><i style={{ width: `${lv.pct * 100}%`, background: 'var(--gold)' }} /></div>
            </div>
          </Link>
        )}

        {farmer && <FarmerHome online={online} />}
        {investor && <InvestorHome compact={farmer} />}
        {learnerOnly && <LearnerHome />}
        {farmer && !investor && (
          <Link to="/invest" className="card row mt2" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span style={{ fontSize: '1.8rem' }}>💚</span>
            <div className="grow"><b>Need money to grow?</b><div className="small muted">Get verified and show your farm to investors.</div></div>
            <ChevronRight size={20} className="muted" />
          </Link>
        )}
      </main>
    </>
  );
}

function FarmerHome({ online }: { online: boolean }) {
  const t = useT();
  const profile = useStore((s) => s.profile)!;
  const reminders = useStore((s) => s.reminders);
  const scans = useStore((s) => s.scans);
  const plots = useStore((s) => s.plots);
  const animals = useStore((s) => s.animals);
  const upsert = useStore((s) => s.upsert);
  const { weather } = useWeather(online);
  const { score, band } = useScore();
  const due = reminders.filter((r) => !r.done && new Date(r.due).getTime() < Date.now() + 7 * 86400000).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
  const alerts = farmAlerts(weather, profile.crops, profile.animals).slice(0, 3);
  const followUps = scans.filter((s) => !s.followUpDone && Date.now() - s.date >= 6 * 86400000).slice(0, 2);
  const market = MARKETS.find((m) => m.town.toLowerCase() === profile.district.toLowerCase()) ?? MARKETS[0];
  const myPriced = [...profile.crops, ...(profile.animals.includes('cattle') ? ['milk'] : []), ...(profile.animals.includes('poultry') ? ['eggs'] : [])].filter((c) => PRICED.includes(c)).slice(0, 2);
  const today = weather?.daily[0];
  const coffee = profile.crops.includes('coffee') || profile.isChampion;

  return (
    <>
      <div className="section-title">{t('today')}</div>
      <div className="grid2">
        <Link to="/weather" className="card" style={{ textDecoration: 'none', background: 'linear-gradient(160deg, #3d6e8f, #1f3f57)', color: '#fff', border: 'none' }}>
          <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>{today ? weatherIcon(today.code) : '🌦️'}</div>
          {today ? (
            <>
              <div className="display" style={{ fontSize: '1.6rem', marginTop: 6 }}>{Math.round(today.tMax)}°</div>
              <div className="small" style={{ opacity: .9 }}>{weatherWord(today.code)} · rain {today.rain.toFixed(0)} mm</div>
            </>
          ) : <div className="small" style={{ marginTop: 8, opacity: .9 }}>{online ? 'Tap for your farm forecast' : 'Connect once to get the forecast'}</div>}
        </Link>
        <Link to="/finance" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="small muted" style={{ fontWeight: 600 }}>{t('loanScore')}</div>
          <div className="display" style={{ fontSize: '2.1rem', color: 'var(--green)', marginTop: 4 }}>{score}<span className="small muted">/100</span></div>
          <span className="badge gold">{band}</span>
        </Link>
      </div>

      <div className="card mt">
        <div className="card-title"><h2>✅ {t('tasks')}</h2><Link to="/farm?tab=reminders" className="small">All</Link></div>
        {due.length === 0 && <p className="small muted" style={{ margin: 0 }}>{t('noTasks')}</p>}
        <ul className="list">
          {due.map((r) => {
            const late = new Date(r.due).getTime() < Date.now();
            return (
              <li key={r.id}>
                <button className="icon-btn" aria-label="Mark done" onClick={() => { upsert('reminders', { ...r, done: true }); cancelReminder(r.notifId); }}>
                  {r.done ? <CheckCircle2 className="tint" /> : <Circle style={{ color: 'var(--muted)' }} />}
                </button>
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  <div className="small" style={{ color: late ? 'var(--alert)' : 'var(--muted)' }}>{late ? 'Overdue · ' : ''}{fmtDay(r.due)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {(alerts.length > 0 || followUps.length > 0) && <div className="section-title">{t('alerts')}</div>}
      <div className="stack">
        {followUps.map((s) => (
          <Link key={s.id} to={`/scan/${s.id}`} className="alert warn" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="a-ico">🔁</span><div><b>7-day check: {subjectName(s.subject)}</b><span className="small">Did the treatment work? Take a new photo.</span></div>
          </Link>
        ))}
        {alerts.map((a, i) => <div key={i} className={'alert ' + a.level}><span className="a-ico">{a.icon}</span><div><b>{a.title}</b><span className="small">{a.text}</span></div></div>)}
      </div>

      <div className="section-title">{t('myFarm')} <Link to="/farm">Open</Link></div>
      <Link to="/farm" className="card row" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="grow">
          <div className="row" style={{ gap: 6, fontSize: '1.6rem' }}>{[...profile.crops, ...profile.animals].slice(0, 6).map((c) => <span key={c}>{subjectIcon(c)}</span>)}</div>
          <div className="small muted mt">{plots.length} plot{plots.length === 1 ? '' : 's'} · {animals.reduce((a, x) => a + x.count, 0)} animals recorded</div>
        </div>
        <ChevronRight size={20} className="muted" />
      </Link>

      {myPriced.length > 0 && (
        <>
          <div className="section-title">{t('prices')} near {market.town} <Link to="/market">All</Link></div>
          <div className="grid2">
            {myPriced.map((c) => {
              const s = priceSeries(c, market.id, 10);
              const last = s[s.length - 1]?.price; const prev = s[s.length - 2]?.price;
              return (
                <Link key={c} to={`/market?crop=${c}`} className="card" style={{ textDecoration: 'none', color: 'inherit', padding: 12 }}>
                  <div className="small">{c === 'milk' ? '🥛' : c === 'eggs' ? '🥚' : subjectIcon(c)} {c === 'milk' ? 'Milk' : c === 'eggs' ? 'Eggs' : subjectName(c)}</div>
                  <div className="display" style={{ fontSize: '1.3rem' }}>{num(last)}</div>
                  <Sparkline values={s.map((x) => x.price)} height={26} fill={false} color="var(--gold)" />
                  <div className="tiny muted">per {priceUnit(c)} · {last >= prev ? '▲' : '▼'} week</div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <div className="section-title">Kungula</div>
      <div className="grid3">
        <Link to="/market" className="tile mod m2"><span className="emoji">📈</span><b>{t('market')}</b><span className="sub">Sell & prices</span></Link>
        <Link to="/duka" className="tile mod m3"><span className="emoji">🛒</span><b>Duka</b><span className="sub">Seeds & inputs</span></Link>
        <Link to="/academy" className="tile mod m4"><span className="emoji">🎓</span><b>{t('academy')}</b><span className="sub">Learn & earn</span></Link>
        <Link to="/invest" className="tile mod m1"><span className="emoji">💚</span><b>Invest</b><span className="sub">Farms & investors</span></Link>
        <Link to="/community" className="tile mod m5"><span className="emoji">👥</span><b>{t('community')}</b><span className="sub">Groups & events</span></Link>
        <Link to={coffee ? '/trace' : '/weather'} className="tile mod m6"><span className="emoji">{coffee ? '🗺️' : '🌦️'}</span><b>{coffee ? 'Trace' : t('weather')}</b><span className="sub">{coffee ? 'EUDR mapping' : '14-day forecast'}</span></Link>
      </div>
    </>
  );
}

function InvestorHome({ compact }: { compact: boolean }) {
  const investments = useStore((s) => s.investments);
  const follows = useStore((s) => s.follows);
  const total = investments.reduce((s, i) => s + i.amount, 0);
  const expected = investments.reduce((s, i) => {
    const f = FARMS.find((x) => x.id === i.farmId); const o = f?.opportunities.find((x) => x.id === i.opportunityId);
    return s + (o ? project(o, i.units).mid : i.amount);
  }, 0);
  const featured = FARMS.filter((f) => f.verification.status === 'verified').sort((a, b) => trustScore(b) - trustScore(a)).slice(0, 5);
  const feed = FARMS.filter((f) => follows.includes(f.id) || investments.some((i) => i.farmId === f.id))
    .flatMap((f) => f.updates.map((u) => ({ f, u }))).sort((a, b) => a.u.daysAgo - b.u.daysAgo).slice(0, 3);
  return (
    <>
      <div className="section-title">{compact ? 'My investments' : 'Portfolio'} <Link to="/portfolio">Open</Link></div>
      <Link to="/portfolio" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div className="grid2">
          <div className="stat"><span className="l">Invested</span><span className="v">{ugx(total)}</span></div>
          <div className="stat"><span className="l">Expected back</span><span className="v" style={{ color: 'var(--green)' }}>{ugx(expected)}</span></div>
        </div>
        <div className="tiny muted mt">{investments.length} investment{investments.length === 1 ? '' : 's'} · following {follows.length} farm{follows.length === 1 ? '' : 's'}</div>
      </Link>

      <div className="section-title">Verified farms <Link to="/invest">See all</Link></div>
      <div className="hscroll">
        {featured.map((f) => {
          const o = f.opportunities[0];
          return (
            <Link key={f.id} to={`/invest/farm/${f.id}`} className="card" style={{ width: 236, padding: 0, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
              <FarmScene things={f.things} seed={f.id} height={96} />
              <div style={{ padding: 12 }}>
                <div className="row"><Avatar name={f.farmer} size={34} /><div className="grow"><b className="small ellipsis" style={{ display: 'block' }}>{f.farmName}</b><div className="tiny muted">{f.district}</div></div></div>
                <div className="mt"><Seal status={f.verification.status} /></div>
                {o && <div className="tiny mt"><b style={{ color: 'var(--green)' }}>{o.returnLow}–{o.returnHigh}%</b> <span className="muted">projected · {o.months} months</span></div>}
              </div>
            </Link>
          );
        })}
      </div>

      {feed.length > 0 && (
        <>
          <div className="section-title">From farms you follow</div>
          <div className="stack">
            {feed.map(({ f, u }, i) => (
              <Link key={i} to={`/invest/farm/${f.id}`} className="card row top" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Avatar name={f.farmer} size={40} />
                <div className="grow"><b className="small">{f.farmer}</b> <span className="tiny muted">· {ago(Date.now() - u.daysAgo * 86400000)}</span><div className="small">{u.text}</div></div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function LearnerHome() {
  const picks = ARTICLES.filter((a) => ['seasons', 'compost', 'layers', 'inv-how', 'storage-sell'].includes(a.id));
  return (
    <>
      <div className="section-title">Start here <Link to="/learn">Library</Link></div>
      <div className="card"><ul className="list">{picks.map((a) => <li key={a.id}><Link to={`/learn/${a.id}`} className="grow" style={{ textDecoration: 'none', color: 'inherit' }}><b>{a.title}</b><div className="small muted ellipsis">{a.body.slice(0, 70)}…</div></Link></li>)}</ul></div>
      <div className="section-title">Short courses <Link to="/academy">All</Link></div>
      <div className="hscroll">
        {LESSONS.slice(0, 6).map((l) => (
          <Link key={l.id} to={`/academy/${l.id}`} className="card" style={{ width: 190, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '2rem' }}>{l.icon}</div><b className="small" style={{ display: 'block', marginTop: 6 }}>{l.title}</b><div className="tiny muted">{l.minutes} min</div>
          </Link>
        ))}
      </div>
      <div className="section-title">Meet real farms <Link to="/invest">See all</Link></div>
      <div className="stack">
        {FARMS.filter((f) => f.verification.status === 'verified').slice(0, 2).map((f) => (
          <Link key={f.id} to={`/invest/farm/${f.id}`} className="card row" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Avatar name={f.farmer} size={48} /><div className="grow"><b>{f.farmName}</b><div className="small muted">{f.farmer} · {f.district}</div></div><ChevronRight size={18} className="muted" />
          </Link>
        ))}
      </div>
    </>
  );
}
