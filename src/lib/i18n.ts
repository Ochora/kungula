import { useStore } from './store';
import type { Lang } from './types';

// UI strings. Luganda and Kiswahili are first drafts and must be reviewed by
// native-speaker copywriters before launch (blueprint: never ship machine
// translation). Acholi/Luo and Runyankore-Rukiga are added after review.
const S = {
  home: { en: 'Home', lg: 'Ewaka', sw: 'Nyumbani' },
  askJjajja: { en: 'Ask Jjajja', lg: 'Buuza Jjajja', sw: 'Muulize Jjajja' },
  scan: { en: 'Scan', lg: 'Kebera', sw: 'Pima' },
  myFarm: { en: 'My farm', lg: 'Ffaamu yange', sw: 'Shamba langu' },
  more: { en: 'More', lg: 'Ebirala', sw: 'Zaidi' },
  today: { en: 'Today', lg: 'Leero', sw: 'Leo' },
  alerts: { en: 'Alerts', lg: 'Okulabula', sw: 'Tahadhari' },
  money: { en: 'Money', lg: 'Ensimbi', sw: 'Pesa' },
  weather: { en: 'Weather', lg: 'Obudde', sw: 'Hali ya hewa' },
  market: { en: 'Market', lg: 'Akatale', sw: 'Soko' },
  prices: { en: 'Prices', lg: 'Emiwendo', sw: 'Bei' },
  inputs: { en: 'Inputs (Duka)', lg: 'Eddagala n’ensigo', sw: 'Pembejeo (Duka)' },
  finance: { en: 'Finance', lg: 'Ebyensimbi', sw: 'Fedha' },
  academy: { en: 'Academy', lg: 'Essomero', sw: 'Mafunzo' },
  trace: { en: 'Trace (EUDR)', lg: 'Trace (EUDR)', sw: 'Trace (EUDR)' },
  coop: { en: 'Co-op', lg: 'Ekibiina', sw: 'Ushirika' },
  community: { en: 'Community', lg: 'Bannaffe', sw: 'Jumuiya' },
  settings: { en: 'Settings', lg: 'Enteekateeka', sw: 'Mipangilio' },
  save: { en: 'Save', lg: 'Tereka', sw: 'Hifadhi' },
  cancel: { en: 'Cancel', lg: 'Sazaamu', sw: 'Ghairi' },
  add: { en: 'Add', lg: 'Yongerako', sw: 'Ongeza' },
  next: { en: 'Next', lg: 'Ekiddako', sw: 'Endelea' },
  back: { en: 'Back', lg: 'Ddayo', sw: 'Rudi' },
  done: { en: 'Done', lg: 'Kiwedde', sw: 'Imekamilika' },
  tasks: { en: 'Tasks', lg: 'Emirimu', sw: 'Kazi' },
  noTasks: { en: 'No tasks due. Add a reminder in My farm.', lg: 'Tewali mirimu. Yongerako ekijjukizo mu Ffaamu yange.', sw: 'Hakuna kazi. Ongeza kikumbusho kwenye Shamba langu.' },
  loanScore: { en: 'Loan readiness', lg: 'Okwetegekera looni', sw: 'Utayari wa mkopo' },
  scanMyFarm: { en: 'Scan my farm', lg: 'Kebera ffaamu yange', sw: 'Pima shamba langu' },
  typeQuestion: { en: 'Type or speak your question…', lg: 'Wandiika oba yogera ekibuuzo kyo…', sw: 'Andika au sema swali lako…' },
  offline: { en: 'Offline — your work is saved on this phone', lg: 'Tewali yintaneti — byonna bikuumiddwa ku ssimu', sw: 'Nje ya mtandao — kazi yako imehifadhiwa kwenye simu' },
  greeting: { en: 'Good day', lg: 'Gyebale ko', sw: 'Habari' },
  records: { en: 'Records', lg: 'Ebiwandiiko', sw: 'Kumbukumbu' },
  plots: { en: 'Plots', lg: 'Ennimiro', sw: 'Mashamba' },
  animals: { en: 'Animals', lg: 'Ebisolo', sw: 'Mifugo' },
  profit: { en: 'Profit', lg: 'Amagoba', sw: 'Faida' },
  reminders: { en: 'Reminders', lg: 'Ebijjukizo', sw: 'Vikumbusho' },
} satisfies Record<string, Record<Lang, string>>;

export type StrKey = keyof typeof S;

export const LANGS: { id: Lang; name: string; hello: string }[] = [
  { id: 'en', name: 'English', hello: 'Hello' },
  { id: 'lg', name: 'Luganda', hello: 'Gyebale ko' },
  { id: 'sw', name: 'Kiswahili', hello: 'Habari' },
];

export function tr(key: StrKey, lang: Lang) {
  return S[key][lang] ?? S[key].en;
}

export function useT() {
  const lang = useStore((s) => s.settings.lang);
  return (key: StrKey) => tr(key, lang);
}
