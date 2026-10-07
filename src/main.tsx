import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import './styles.css';
import App from './App';
import { isNative } from './lib/native';

if (isNative()) {
  StatusBar.setBackgroundColor({ color: '#1F6B3A' }).catch(() => {});
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  setTimeout(() => SplashScreen.hide().catch(() => {}), 300);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
