import { useCallback, useEffect, useState } from 'react';
import { HashRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIco, ScanLine, Mic, Sprout, LayoutGrid, Sprout as Leaf, BookOpen, Wallet } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useStore, isFarmer, isInvestor } from './lib/store';
import { useT } from './lib/i18n';
import { isNative } from './lib/native';
import { Intro, RewardLayer, useDark } from './components/Art';
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
import Profile from './screens/Profile';
import Invest from './screens/Invest';
import FarmProfile from './screens/FarmProfile';
import Portfolio from './screens/Portfolio';
import Learn, { ArticlePage } from './screens/Learn';

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
      const sheet = document.querySelector('.sheet-backdrop') as HTMLElement | null;
      if (sheet) { sheet.click(); return; }
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
  const profile = useStore((s) => s.profile)!;
  const farmer = isFarmer(profile);
  const investor = isInvestor(profile);
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');
  return (
    <nav className="bottomnav" aria-label="Main">
      <NavLink to="/" end className={cls}><HomeIco size={24} />{t('home')}</NavLink>
      {farmer
        ? <NavLink to="/scan" className={cls}><ScanLine size={24} />{t('scan')}</NavLink>
        : investor ? <NavLink to="/invest" className={cls}><Leaf size={24} />Farms</NavLink>
          : <NavLink to="/learn" className={cls}><BookOpen size={24} />Learn</NavLink>}
      <NavLink to="/jjajja" className={({ isActive }) => 'jj ' + (isActive ? 'active' : '')}>
        <span className="mic"><Mic size={28} /></span>
        <span>{t('askJjajja')}</span>
      </NavLink>
      {farmer
        ? <NavLink to="/farm" className={cls}><Sprout size={24} />{t('myFarm')}</NavLink>
        : investor ? <NavLink to="/portfolio" className={cls}><Wallet size={24} />Portfolio</NavLink>
          : <NavLink to="/invest" className={cls}><Leaf size={24} />Farms</NavLink>}
      <NavLink to="/more" className={cls}><LayoutGrid size={24} />{t('more')}</NavLink>
    </nav>
  );
}

function useTheme() {
  const theme = useStore((s) => s.settings.theme ?? 'system');
  const large = useStore((s) => s.settings.largeText);
  const dark = useDark();
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', theme);
    root.classList.toggle('large-text', large);
  }, [theme, large]);
  useEffect(() => {
    if (!isNative()) return;
    StatusBar.setBackgroundColor({ color: dark ? '#0f2a1a' : '#1f6b3a' }).catch(() => {});
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    const meta = document.querySelector('meta[name=theme-color]');
    meta?.setAttribute('content', dark ? '#0f2a1a' : '#1f6b3a');
  }, [dark]);
}

export default function App() {
  const profile = useStore((s) => s.profile);
  const introOn = useStore((s) => s.settings.intro ?? true);
  const dailyVisit = useStore((s) => s.dailyVisit);
  const [intro, setIntro] = useState(introOn);
  const online = useOnline();
  const t = useT();
  useTheme();
  const endIntro = useCallback(() => setIntro(false), []);

  useEffect(() => {
    if (!profile) return;
    dailyVisit();
    if (!isNative()) return;
    // play the opening animation again when the app comes back after a while
    let hiddenAt = 0;
    const h = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 5 * 60000) { if (useStore.getState().settings.intro ?? true) setIntro(true); dailyVisit(); }
    });
    return () => { h.then((x) => x.remove()); };
  }, [profile?.createdAt]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {intro && <Intro onDone={endIntro} />}
      {!profile ? <Onboarding /> : (
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
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/:id" element={<ArticlePage />} />
              <Route path="/trace" element={<Trace />} />
              <Route path="/coop" element={<Coop />} />
              <Route path="/community" element={<Community />} />
              <Route path="/invest" element={<Invest />} />
              <Route path="/invest/farm/:id" element={<FarmProfile />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/more" element={<More />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Home online={online} />} />
            </Routes>
            <BottomNav />
          </div>
          <RewardLayer />
        </HashRouter>
      )}
      {!profile && <RewardLayer />}
    </>
  );
}
