import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { useT } from '../lib/i18n';
import { TopBar, Logo } from '../components/ui';

export default function More() {
  const t = useT();
  const profile = useStore((s) => s.profile)!;
  const items: [string, string, string, string][] = [
    ['/weather', '🌦️', t('weather'), 'Farm forecast and action alerts'],
    ['/market', '📈', t('market'), 'Prices, selling and buyers'],
    ['/duka', '🛒', 'Kungula Duka', 'Verified seeds, chemicals, feed, tools'],
    ['/finance', '💰', t('finance'), 'Loan score, loans, insurance, savings'],
    ['/academy', '🎓', t('academy'), 'Lessons, quizzes and certificates'],
    ['/community', '👥', t('community'), 'Groups, events and Champions'],
    ['/trace', '🗺️', 'Kungula Trace', 'Coffee plot mapping for EU (EUDR)'],
    ['/coop', '🤝', 'Kungula Co-op', 'Members, collection day, payouts'],
    ['/farm?tab=reminders', '⏰', t('reminders'), 'Tasks and notifications'],
    ['/settings', '⚙️', t('settings'), 'Language, privacy, backup, AI'],
  ];
  return (
    <>
      <TopBar title={t('more')} back={false} />
      <main className="page">
        <Link to="/settings" className="card row" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Logo size={48} />
          <div className="grow"><b>{profile.name}</b><div className="small muted">{profile.village ? `${profile.village}, ` : ''}{profile.district}{profile.isChampion ? ' · Champion' : ''}</div></div>
        </Link>
        <div className="card mt">
          <ul className="list">
            {items.map(([to, icon, title, sub]) => (
              <li key={to}><Link to={to} className="row grow" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="avatar">{icon}</div><div className="grow"><b>{title}</b><div className="small muted">{sub}</div></div>
              </Link></li>
            ))}
          </ul>
        </div>
        <p className="tiny muted center mt2">Kungula v{__APP_VERSION__} · Farm smarter. Harvest more.</p>
      </main>
    </>
  );
}
