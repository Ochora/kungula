import { useState } from 'react';
import { MapPin, Volume2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { LANGS } from '../lib/i18n';
import { CROPS, ANIMALS, DISTRICTS } from '../data/catalog';
import { Logo } from '../components/ui';
import { getPosition, speak } from '../lib/native';
import type { Lang, LatLng } from '../lib/types';

const GREETINGS: Record<Lang, string> = {
  en: 'Welcome to Kungula. Farm smarter, harvest more.',
  lg: 'Tukwaniriza ku Kungula. Lima n’amagezi, kungula bingi.',
  sw: 'Karibu Kungula. Lima kwa akili, vuna zaidi.',
};

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const setSettings = useStore((s) => s.setSettings);
  const lang = useStore((s) => s.settings.lang);
  const setProfile = useStore((s) => s.setProfile);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [crops, setCrops] = useState<string[]>([]);
  const [animals, setAnimals] = useState<string[]>([]);
  const [loc, setLoc] = useState<LatLng>();
  const [locMsg, setLocMsg] = useState('');
  const [champion, setChampion] = useState(false);

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const finish = () => {
    setProfile({
      name: name.trim(), phone: phone.trim(), district, village: village.trim(), crops, animals,
      isChampion: champion, location: loc, createdAt: Date.now(),
    });
  };

  const locate = async () => {
    setLocMsg('Finding your location…');
    try {
      const p = await getPosition(false);
      setLoc({ lat: p.lat, lng: p.lng });
      setLocMsg(`Location saved (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`);
    } catch {
      setLocMsg('Could not get location. You can add it later in Settings.');
    }
  };

  const phoneOk = /^(\+?256|0)?7\d{8}$/.test(phone.replace(/\s/g, ''));

  return (
    <div className="app" style={{ minHeight: '100vh' }}>
      <div className="page" style={{ paddingBottom: 40, paddingTop: 'calc(var(--safe-top) + 24px)' }}>
        <div className="row" style={{ gap: 12 }}>
          <Logo size={52} />
          <div>
            <div className="display" style={{ fontSize: '2rem', color: 'var(--green)' }}>kungula</div>
            <div className="small" style={{ color: 'var(--murram)', fontWeight: 600 }}>Farm smarter. Harvest more.</div>
          </div>
        </div>
        <div className="progress mt2"><i style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>

        {step === 0 && (
          <div className="mt2">
            <h2 style={{ fontSize: '1.3rem' }}>Choose your language</h2>
            <p className="muted small">Tap to hear the greeting. Acholi/Luo and Runyankore are coming soon.</p>
            <div className="stack mt">
              {LANGS.map((l) => (
                <button key={l.id} className={'tile' + (lang === l.id ? ' on' : '')} style={{ flexDirection: 'row', justifyContent: 'flex-start', padding: 16, minHeight: 64, width: '100%' }}
                  onClick={() => { setSettings({ lang: l.id }); speak(GREETINGS[l.id], l.id); }}>
                  <Volume2 size={22} color="#1F6B3A" />
                  <span style={{ fontSize: '1.05rem' }}><b>{l.hello}</b> · {l.name}</span>
                </button>
              ))}
            </div>
            <button className="btn block mt2" onClick={() => setStep(1)}>Continue</button>
          </div>
        )}

        {step === 1 && (
          <div className="mt2">
            <h2 style={{ fontSize: '1.3rem' }}>About you</h2>
            <label className="field"><span>Your name</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nakato Sarah" autoComplete="name" />
            </label>
            <label className="field"><span>Phone number (for SMS alerts and mobile money)</span>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" inputMode="tel" autoComplete="tel" />
            </label>
            <label className="field"><span>District</span>
              <select className="input" value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="">Choose district</option>
                {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
            <label className="field"><span>Village / parish</span>
              <input className="input" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="e.g. Kalungu, Bukulula" />
            </label>
            <div className="row mt2">
              <button className="btn ghost" onClick={() => setStep(0)}>Back</button>
              <button className="btn grow" disabled={!name.trim() || !district || (phone !== '' && !phoneOk)} onClick={() => setStep(2)}>Continue</button>
            </div>
            {phone !== '' && !phoneOk && <p className="small" style={{ color: 'var(--alert)' }}>Enter a Ugandan mobile number, e.g. 0772 123 456.</p>}
          </div>
        )}

        {step === 2 && (
          <div className="mt2">
            <h2 style={{ fontSize: '1.3rem' }}>What do you grow and keep?</h2>
            <p className="muted small">Tap all that apply.</p>
            <div className="section-title">Crops</div>
            <div className="grid3">
              {CROPS.map((c) => (
                <button key={c.id} className={'tile' + (crops.includes(c.id) ? ' on' : '')} onClick={() => toggle(crops, setCrops, c.id)}>
                  <span className="emoji">{c.icon}</span>{lang === 'lg' ? c.lg : lang === 'sw' ? c.sw : c.name}
                </button>
              ))}
            </div>
            <div className="section-title">Animals</div>
            <div className="grid3">
              {ANIMALS.map((a) => (
                <button key={a.id} className={'tile' + (animals.includes(a.id) ? ' on' : '')} onClick={() => toggle(animals, setAnimals, a.id)}>
                  <span className="emoji">{a.icon}</span>{lang === 'lg' ? a.lg : lang === 'sw' ? a.sw : a.name}
                </button>
              ))}
            </div>
            <div className="row mt2">
              <button className="btn ghost" onClick={() => setStep(1)}>Back</button>
              <button className="btn grow" disabled={!crops.length && !animals.length} onClick={() => setStep(3)}>Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt2">
            <h2 style={{ fontSize: '1.3rem' }}>Your farm location</h2>
            <p className="muted small">Used for weather at your farm and nearby markets and dealers. It stays on your phone.</p>
            <button className="btn soft block mt" onClick={locate}><MapPin size={20} /> Use my current location</button>
            {locMsg && <p className="small muted">{locMsg}</p>}
            <label className="card row mt2" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={champion} onChange={(e) => setChampion(e.target.checked)} style={{ width: 22, height: 22, accentColor: '#1F6B3A' }} />
              <div>
                <b>I am a Kungula Champion</b>
                <div className="small muted">Shows tools for registering farmers, mapping plots for exporters and co-operative collection days.</div>
              </div>
            </label>
            <div className="card mt2" style={{ background: 'var(--green-soft)' }}>
              <b>Your data belongs to you.</b>
              <p className="small" style={{ margin: '6px 0 0' }}>Everything you record is saved on this phone. Nothing is shared with a lender, buyer or government body unless you switch it on in Settings.</p>
            </div>
            <div className="row mt2">
              <button className="btn ghost" onClick={() => setStep(2)}>Back</button>
              <button className="btn grow gold" onClick={finish}>Start farming smarter</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
