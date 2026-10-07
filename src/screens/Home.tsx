import { Link } from 'react-router-dom';
import { Mic, ScanLine, Bell, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { useStore } from '../lib/store';
import { useT } from '../lib/i18n';
import { useScore, useWeather } from '../lib/hooks';
import { farmAlerts, weatherIcon, weatherWord } from '../lib/weather';
import { TopBar, Sparkline } from '../components/ui';
import { MARKETS, PRICED, priceSeries, priceUnit } from '../data/market';
import { subjectIcon, subjectName } from '../data/catalog';
import { ugx, fmtDay } from '../lib/util';
import { cancelReminder } from '../lib/native';

export default function Home({ online }: { online: boolean }) {
  const t = useT();
  const profile = useStore((s) => s.profile)!;
  const lang = useStore((s) => s.settings.lang);
  const reminders = useStore((s) => s.reminders);
  const scans = useStore((s) => s.scans);
  const plots = useStore((s) => s.plots);
  const animals = useStore((s) => s.animals);
  const upsert = useStore((s) => s.upsert);
  const { weather } = useWeather(online);
  const { score, band } = useScore();

  const first = profile.name.split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const due = reminders
    .filter((r) => !r.done && new Date(r.due).getTime() < Date.now() + 7 * 86400000)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 4);
  const alerts = farmAlerts(weather, profile.crops, profile.animals).slice(0, 3);
  const followUps = scans.filter((s) => !s.followUpDone && Date.now() - s.date >= 6 * 86400000).slice(0, 2);

  const market = MARKETS.find((m) => m.town.toLowerCase() === profile.district.toLowerCase()) ?? MARKETS[0];
  const myPriced = [...profile.crops, ...(profile.animals.includes('cattle') ? ['milk'] : []), ...(profile.animals.includes('poultry') ? ['eggs'] : [])]
    .filter((c) => PRICED.includes(c)).slice(0, 3);
  const today = weather?.daily[0];

  return (
    <>
      <TopBar title="Kungula" back={false} right={
        <Link to="/farm?tab=reminders" className="icon-btn" aria-label="Reminders" style={{ position: 'relative' }}>
          <Bell size={22} />
          {due.length > 0 && <span style={{ position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 5, background: 'var(--gold)' }} />}
        </Link>
      } />
      <main className="page">
        <section className="hero">
          <div className="sun" />
          <div className="muted small">{profile.village ? `${profile.village}, ` : ''}{profile.district}</div>
          <div className="display" style={{ fontSize: '1.6rem', margin: '2px 0 10px' }}>{`${lang === 'en' ? greet : t('greeting')}${first ? `, ${first}` : ''}`}</div>
          <div className="row" style={{ gap: 8 }}>
            <Link to="/jjajja" className="btn gold grow"><Mic size={20} /> {t('askJjajja')}</Link>
            <Link to="/scan" className="btn" style={{ background: 'rgba(255,255,255,.16)' }}><ScanLine size={20} /> {t('scan')}</Link>
          </div>
        </section>

        {/* Today */}
        <div className="section-title">{t('today')}</div>
        <Link to="/weather" className="card row" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: '2.2rem' }}>{today ? weatherIcon(today.code) : '🌦️'}</div>
          <div className="grow">
            {today ? (
              <>
                <b>{weatherWord(today.code)} · {Math.round(today.tMin)}–{Math.round(today.tMax)}°C</b>
                <div className="small muted">Rain {today.rain.toFixed(0)} mm ({today.rainProb}% chance){weather && Date.now() - weather.fetchedAt > 6 * 3600000 ? ` · saved ${fmtDay(weather.fetchedAt)}` : ''}</div>
              </>
            ) : (
              <>
                <b>{t('weather')}</b>
                <div className="small muted">{online ? 'Tap to get the forecast for your farm' : 'Connect once to download your forecast'}</div>
              </>
            )}
          </div>
          <ChevronRight size={20} className="muted" />
        </Link>

        <div className="card">
          <div className="card-title"><h2>✅ {t('tasks')}</h2><Link to="/farm?tab=reminders" className="small">All</Link></div>
          {due.length === 0 && <p className="small muted" style={{ margin: 0 }}>{t('noTasks')}</p>}
          <ul className="list">
            {due.map((r) => {
              const late = new Date(r.due).getTime() < Date.now();
              return (
                <li key={r.id}>
                  <button className="icon-btn" aria-label="Mark done" onClick={() => { upsert('reminders', { ...r, done: true }); cancelReminder(r.notifId); }}>
                    {r.done ? <CheckCircle2 color="#1F6B3A" /> : <Circle color="#5d6b61" />}
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

        {/* Alerts */}
        <div className="section-title">{t('alerts')}</div>
        <div className="stack">
          {followUps.map((s) => (
            <Link key={s.id} to={`/scan/${s.id}`} className="alert warn" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="a-ico">🔁</span>
              <div><b>7-day check: {subjectName(s.subject)}</b><span className="small">Did the treatment work? Take a new photo.</span></div>
            </Link>
          ))}
          {alerts.map((a, i) => (
            <div key={i} className={'alert ' + a.level}>
              <span className="a-ico">{a.icon}</span>
              <div><b>{a.title}</b><span className="small">{a.text}</span></div>
            </div>
          ))}
          {!alerts.length && !followUps.length && <p className="small muted">Open Weather once while online to get farm alerts.</p>}
        </div>

        {/* My farm */}
        <div className="section-title">{t('myFarm')}</div>
        <Link to="/farm" className="card row" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="grow">
            <div className="row" style={{ gap: 6, fontSize: '1.5rem' }}>
              {[...profile.crops, ...profile.animals].slice(0, 6).map((c) => <span key={c}>{subjectIcon(c)}</span>)}
            </div>
            <div className="small muted mt">{plots.length} plot{plots.length === 1 ? '' : 's'} · {animals.reduce((a, x) => a + x.count, 0)} animals recorded</div>
          </div>
          <ChevronRight size={20} className="muted" />
        </Link>

        {/* Money */}
        <div className="section-title">{t('money')}</div>
        <div className="grid2">
          <Link to="/finance" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="small muted" style={{ fontWeight: 600 }}>{t('loanScore')}</div>
            <div className="display" style={{ fontSize: '2rem', color: 'var(--green)' }}>{score}<span className="small muted">/100</span></div>
            <span className="badge gold">{band}</span>
          </Link>
          <Link to="/market" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="small muted" style={{ fontWeight: 600 }}>{t('prices')} · {market.town}</div>
            {myPriced.length === 0 && <div className="small mt">See market prices</div>}
            {myPriced.slice(0, 2).map((c) => {
              const s = priceSeries(c, market.id, 8);
              return (
                <div key={c} className="mt">
                  <div className="row between small"><span>{subjectIcon(c)} {subjectName(c)}</span><b>{ugx(s[s.length - 1]?.price).replace('UGX ', '')}</b></div>
                  <Sparkline values={s.map((x) => x.price)} height={22} fill={false} color="#F2A900" />
                  <div className="tiny muted">per {priceUnit(c)}</div>
                </div>
              );
            })}
          </Link>
        </div>

        <div className="section-title">Kungula</div>
        <div className="grid3">
          <Link to="/market" className="tile"><span className="emoji">📈</span>{t('market')}</Link>
          <Link to="/duka" className="tile"><span className="emoji">🛒</span>Duka</Link>
          <Link to="/academy" className="tile"><span className="emoji">🎓</span>{t('academy')}</Link>
          <Link to="/finance" className="tile"><span className="emoji">💰</span>{t('finance')}</Link>
          <Link to="/community" className="tile"><span className="emoji">👥</span>{t('community')}</Link>
          <Link to={profile.crops.includes('coffee') || profile.isChampion ? '/trace' : '/weather'} className="tile">
            <span className="emoji">{profile.crops.includes('coffee') || profile.isChampion ? '🗺️' : '🌦️'}</span>
            {profile.crops.includes('coffee') || profile.isChampion ? 'Trace' : t('weather')}
          </Link>
        </div>
      </main>
    </>
  );
}
