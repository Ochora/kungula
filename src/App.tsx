import { useEffect, useState } from 'react';
import { HashRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIco, ScanLine, Mic, Sprout, LayoutGrid } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { useStore } from './lib/store';
import { useT } from './lib/i18n';
import { isNative } from './lib/native';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Jjajja from './screens/Jjajja';
import Scan from './screens/Scan';
import ScanResult from './screens/ScanResult';
import ConditionPage from './screens/ConditionPage';
import Farm from './screens/Farm';
import PlotPage from './screens/PlotPage';
import MapPlot from './screens/MapPlot';
import AnimalPage from './screens/AnimalPage';
import Weather from './screens/Weather';
import Market from './screens/Market';
import Duka from './screens/Duka';
import Finance from './screens/Finance';
import Academy from './screens/Academy';
import LessonPage from './screens/LessonPage';
import Trace from './screens/Trace';
import Coop from './screens/Coop';
import Community from './screens/Community';
import More from './screens/More';
import SettingsPage from './screens/Settings';

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    let remove: (() => void) | undefined;
    if (isNative()) {
      Network.getStatus().then((s) => setOnline(s.connected)).catch(() => {});
      Network.addListener('networkStatusChange', (s) => setOnline(s.connected)).then((h) => { remove = () => h.remove(); });
    }
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); remove?.(); };
  }, []);
  return online;
}

function BackButton() {
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    if (!isNative()) return;
    const h = CapApp.addListener('backButton', () => {
      if (document.querySelector('.sheet-backdrop')) {
        (document.querySelector('.sheet-backdrop') as HTMLElement).click();
        return;
      }
      if (loc.pathname === '/' || loc.pathname === '') CapApp.exitApp();
      else nav(-1);
    });
    return () => { h.then((x) => x.remove()); };
  }, [loc.pathname, nav]);
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  return null;
}

function BottomNav() {
  const t = useT();
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');
  return (
    <nav className="bottomnav" aria-label="Main">
      <NavLink to="/" end className={cls}><HomeIco size={24} />{t('home')}</NavLink>
      <NavLink to="/scan" className={cls}><ScanLine size={24} />{t('scan')}</NavLink>
      <NavLink to="/jjajja" className={({ isActive }) => 'jj ' + (isActive ? 'active' : '')}>
        <span className="mic"><Mic size={28} /></span>
        <span>{t('askJjajja')}</span>
      </NavLink>
      <NavLink to="/farm" className={cls}><Sprout size={24} />{t('myFarm')}</NavLink>
      <NavLink to="/more" className={cls}><LayoutGrid size={24} />{t('more')}</NavLink>
    </nav>
  );
}

export default function App() {
  const profile = useStore((s) => s.profile);
  const large = useStore((s) => s.settings.largeText);
  const online = useOnline();
  const t = useT();

  useEffect(() => { document.documentElement.classList.toggle('large-text', large); }, [large]);

  if (!profile) return <Onboarding />;

  return (
    <HashRouter>
      <BackButton />
      <div className="app">
        {!online && <div className="offline-bar" style={{ paddingTop: 'calc(var(--safe-top) + 6px)' }}>📴 {t('offline')}</div>}
        <Routes>
          <Route path="/" element={<Home online={online} />} />
          <Route path="/jjajja" element={<Jjajja online={online} />} />
          <Route path="/scan" element={<Scan online={online} />} />
          <Route path="/scan/:id" element={<ScanResult online={online} />} />
          <Route path="/condition/:id" element={<ConditionPage />} />
          <Route path="/farm" element={<Farm />} />
          <Route path="/farm/plot/:id" element={<PlotPage />} />
          <Route path="/farm/map/:id?" element={<MapPlot />} />
          <Route path="/farm/animal/:id" element={<AnimalPage />} />
          <Route path="/weather" element={<Weather online={online} />} />
          <Route path="/market" element={<Market />} />
          <Route path="/duka" element={<Duka />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/academy/:id" element={<LessonPage />} />
          <Route path="/trace" element={<Trace />} />
          <Route path="/coop" element={<Coop />} />
          <Route path="/community" element={<Community />} />
          <Route path="/more" element={<More />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Home online={online} />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  );
}
