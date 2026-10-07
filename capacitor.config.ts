import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ug.kungula.app',
  appName: 'Kungula',
  webDir: 'dist',
  android: { backgroundColor: '#1F6B3A' },
  plugins: {
    SplashScreen: { launchShowDuration: 1500, backgroundColor: '#1F6B3A', showSpinner: false, androidScaleType: 'CENTER_INSIDE' },
    LocalNotifications: { smallIcon: 'ic_stat_kungula', iconColor: '#1F6B3A' },
  },
};

export default config;
