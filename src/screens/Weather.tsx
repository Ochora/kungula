import { RefreshCw, MapPin } from 'lucide-react';
import { useStore } from '../lib/store';
import { useWeather } from '../lib/hooks';
import { farmAlerts, outlook, weatherIcon, weatherWord } from '../lib/weather';
import { fmtDay, ago } from '../lib/util';
import { TopBar, Empty, SpeakBtn } from '../components/ui';
import { useT } from '../lib/i18n';

export default function Weather({ online }: { online: boolean }) {
  const t = useT();
  const profile = useStore((s) => s.profile)!;
  const { weather, loading, error, refresh } = useWeather(online);
  const alerts = farmAlerts(weather, profile.crops, profile.animals);
  const out = outlook(weather);
  const maxRain = Math.max(10, ...(weather?.daily.map((d) => d.rain) ?? [0]));

  return (
    <>
      <TopBar title={`Kungula ${t('weather')}`} right={
        <button className="icon-btn" aria-label="Refresh" disabled={!online || loading} onClick={() => refresh(false)}>
          {loading ? <span className="spinner" /> : <RefreshCw size={20} />}
        </button>
      } />
      <main className="page">
        {!weather && (
          <Empty emoji="🌦️" title="Get the forecast for your farm">
            <p className="small">Kungula uses your GPS location for a farm-level forecast and saves it for offline use.</p>
            <button className="btn mt" disabled={!online || loading} onClick={() => refresh(true)}><MapPin size={18} /> {loading ? 'Loading…' : 'Use my location'}</button>
            {!online && <p className="small">You are offline. Connect to download the forecast.</p>}
          </Empty>
        )}
        {error && <div className="alert urgent mb"><span className="a-ico">⚠️</span><div><b>Could not update</b><span className="small">{error}</span></div></div>}

        {weather && (
          <>
            <section className="hero">
              <div className="sun" />
              <div className="row">
                <div style={{ fontSize: '3rem' }}>{weatherIcon(weather.current?.code ?? weather.daily[0].code)}</div>
                <div className="grow">
                  <div className="display" style={{ fontSize: '2.2rem' }}>{Math.round(weather.current?.temp ?? weather.daily[0].tMax)}°C</div>
                  <div>{weatherWord(weather.current?.code ?? weather.daily[0].code)}{weather.current ? ` · humidity ${weather.current.humidity}%` : ''}</div>
                </div>
              </div>
              <div className="small muted mt">{profile.village || profile.district} · updated {ago(weather.fetchedAt)}</div>
              <button className="btn sm mt" style={{ background: 'rgba(255,255,255,.18)' }} onClick={() => refresh(true)} disabled={!online || loading}><MapPin size={16} /> Update my location</button>
            </section>

            <div className="section-title">What to do on the farm</div>
            <div className="stack">
              {alerts.map((a, i) => (
                <div key={i} className={'alert ' + a.level}><span className="a-ico">{a.icon}</span><div><b>{a.title}</b><span className="small">{a.text}</span></div></div>
              ))}
            </div>
            <div className="mt"><SpeakBtn text={alerts.map((a) => `${a.title}. ${a.text}`).join(' ')} label="Listen to farm advice" /></div>

            {out && (
              <div className="card mt">
                <h2>14-day outlook: {out.word}</h2>
                <p className="small muted" style={{ marginBottom: 0 }}>About {out.total} mm of rain over {out.rainyDays} rainy days. {out.word === 'Wet' ? 'Good for planting; watch for fungal diseases.' : out.word === 'Mostly dry' ? 'Hold planting until rains settle; mulch and water vegetables.' : 'Moderate rain — plant if the soil is moist a hand-deep.'}</p>
              </div>
            )}

            <div className="section-title">Daily forecast</div>
            <div className="card">
              <ul className="list">
                {weather.daily.map((d) => (
                  <li key={d.date}>
                    <span style={{ fontSize: '1.6rem', width: 36 }}>{weatherIcon(d.code)}</span>
                    <div style={{ width: 96 }}><b className="small">{fmtDay(d.date)}</b><div className="tiny muted">{weatherWord(d.code)}</div></div>
                    <div className="grow">
                      <div className="progress" style={{ height: 8, background: 'rgba(31,107,58,.08)' }}><i style={{ width: `${(d.rain / maxRain) * 100}%`, background: '#3b82c4' }} /></div>
                      <div className="tiny muted">{d.rain.toFixed(0)} mm · {d.rainProb}% · wind {Math.round(d.wind)} km/h</div>
                    </div>
                    <div className="small" style={{ textAlign: 'right', width: 62 }}><b>{Math.round(d.tMax)}°</b> <span className="muted">{Math.round(d.tMin)}°</span></div>
                  </li>
                ))}
              </ul>
            </div>
            <p className="tiny muted center">Forecast: Open-Meteo global models. UNMA seasonal outlooks will be added with the Kungula server.</p>
          </>
        )}
      </main>
    </>
  );
}
