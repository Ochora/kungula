import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useStore, isFarmer, isInvestor, rolesOf } from '../lib/store';
import { useT } from '../lib/i18n';
import { levelOf } from '../lib/game';
import { TopBar } from '../components/ui';
import { Avatar } from '../components/Art';
import { ROLE_LABEL } from './Profile';

export default function More() {
  const t = useT();
  const profile = useStore((s) => s.profile)!;
  const xp = useStore((s) => s.game.xp);
  const farmer = isFarmer(profile);
  const investor = isInvestor(profile);
  const lv = levelOf(xp);
  const groups: { title: string; items: [string, string, string, string][] }[] = [
    {
      title: 'Farm', items: farmer ? [
        ['/farm', '📒', 'Kungula Book', 'Plots, animals, records, profit'],
        ['/weather', '🌦️', t('weather'), 'Farm forecast and action alerts'],
        ['/market', '📈', t('market'), 'Prices, selling and buyers'],
        ['/duka', '🛒', 'Kungula Duka', 'Verified seeds, chemicals, feed, tools'],
        ['/finance', '💰', t('finance'), 'Loan score, loans, insurance, savings'],
        ['/farm?tab=reminders', '⏰', t('reminders'), 'Tasks and notifications'],
      ] : [],
    },
    {
      title: 'Invest', items: [
        ['/invest', '💚', 'Kungula Invest', 'Verified farms to follow and back'],
        ...(investor ? [['/portfolio', '📊', 'My portfolio', 'Investments, animals, farm updates'] as [string, string, string, string]] : []),
        ...(farmer ? [['/profile#invest', '🤝', 'Get investors', 'Verification and your farm listing'] as [string, string, string, string]] : []),
      ],
    },
    {
      title: 'Learn', items: [
        ['/learn', '📚', 'Farming library', 'Guides on crops, animals, money, investing'],
        ['/academy', '🎓', t('academy'), 'Short courses with certificates'],
        ['/community', '👥', t('community'), 'Groups, events and Champions'],
      ],
    },
    {
      title: 'Exporters & co-operatives', items: farmer || profile.isChampion ? [
        ['/trace', '🗺️', 'Kungula Trace', 'Coffee plot mapping for EU (EUDR)'],
        ['/coop', '⚖️', 'Kungula Co-op', 'Members, collection day, payouts'],
      ] : [],
    },
    { title: 'You', items: [['/settings', '⚙️', t('settings'), 'Theme, language, privacy, backup']] },
  ];
  return (
    <>
      <TopBar title={t('more')} back={false} />
      <main className="page">
        <Link to="/profile" className="card row" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Avatar name={profile.name} photo={profile.photo} size={58} />
          <div className="grow">
            <b style={{ fontSize: '1.1rem' }}>{profile.name}</b>
            <div className="small muted">{rolesOf(profile).map((r) => ROLE_LABEL[r].label).join(' · ')} · {profile.district}</div>
            <div className="tiny" style={{ color: 'var(--green)', fontWeight: 700 }}>{lv.icon} {lv.name} · {xp} XP</div>
          </div>
          <ChevronRight size={20} className="muted" />
        </Link>
        {groups.filter((g) => g.items.length).map((g) => (
          <div key={g.title}>
            <div className="section-title">{g.title}</div>
            <div className="card" style={{ padding: '4px 14px' }}>
              <ul className="list">
                {g.items.map(([to, icon, title, sub]) => (
                  <li key={to}><Link to={to} className="row grow" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="avatar">{icon}</div><div className="grow"><b>{title}</b><div className="small muted">{sub}</div></div><ChevronRight size={18} className="muted" />
                  </Link></li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        <p className="tiny muted center mt2">Kungula v{__APP_VERSION__} · Farm smarter. Harvest more.</p>
      </main>
    </>
  );
}
