import { useState } from 'react';
import { MapPin, Volume2, Camera } from 'lucide-react';
import { useStore } from '../lib/store';
import { LANGS } from '../lib/i18n';
import { CROPS, ANIMALS, DISTRICTS } from '../data/catalog';
import { Logo } from '../components/ui';
import { Avatar, FarmScene } from '../components/Art';
import { getPosition, speak, takePhoto } from '../lib/native';
import { compressImage } from '../lib/util';
import { ROLE_LABEL } from './Profile';
import type { Lang, LatLng, Role } from '../lib/types';

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
  const reward = useStore((s) => s.reward);
  const [roles, setRoles] = useState<Role[]>(['farmer']);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [photo, setPhoto] = useState<string>();
  const [crops, setCrops] = useState<string[]>([]);
  const [animals, setAnimals] = useState<string[]>([]);
  const [loc, setLoc] = useState<LatLng>();
  const [locMsg, setLocMsg] = useState('');
  const [champion, setChampion] = useState(false);

  const farmer = roles.includes('farmer');
  const steps = 5;
  const toggle = (arr: string[], set: (v: string[]) => void, id: string) => set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const finish = () => {
    setProfile({
      name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, district, village: village.trim(), crops, animals,
      isChampion: champion, location: loc, createdAt: Date.now(), roles, photo, verification: 'none',
      interests: farmer ? undefined : [...crops, ...animals],
    });
    setTimeout(() => reward('plots', 'Welcome! Your seed is planted'), 3200);
  };

  const locate = async () => {
    setLocMsg('Finding your location…');
    try { const p = await getPosition(false); setLoc({ lat: p.lat, lng: p.lng }); setLocMsg(`Location saved (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`); }
    catch { setLocMsg('Could not get location. You can add it later in Settings.'); }
  };

  const phoneOk = /^(\+?256|0)?7\d{8}$/.test(phone.replace(/\s/g, ''));
  const next = () => setStep(step + 1);
  const back = () => setStep(step - 1);
  const page = step;

  return (
    <div className="app" style={{ minHeight: '100vh' }}>
      <div style={{ position: 'relative' }}>
        <FarmScene things={[...crops, ...animals, ...(crops.length || animals.length ? [] : ['banana', 'coffee', 'cattle'])]} seed="welcome" height={190} />
        <div style={{ position: 'absolute', left: 16, top: 'calc(var(--safe-top) + 14px)' }} className="row">
          <Logo size={46} />
          <div>
            <div className="display" style={{ fontSize: '2rem', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,.3)' }}>kungula</div>
          </div>
        </div>
      </div>
      <div className="page" style={{ paddingBottom: 40, marginTop: -18, background: 'var(--bg)', borderRadius: '24px 24px 0 0', position: 'relative' }}>
        <div className="progress"><i style={{ width: `${((step + 1) / steps) * 100}%`, background: 'var(--gold)' }} /></div>

        {page === 0 && (
          <div className="mt2">
            <h2 className="display" style={{ fontSize: '1.6rem' }}>Choose your language</h2>
            <p className="muted small">Tap to hear the greeting. Acholi/Luo and Runyankore are coming soon.</p>
            <div className="stack mt">
              {LANGS.map((l) => (
                <button key={l.id} className={'tile' + (lang === l.id ? ' on' : '')} style={{ flexDirection: 'row', justifyContent: 'flex-start', padding: 16, minHeight: 64, width: '100%' }}
                  onClick={() => { setSettings({ lang: l.id }); speak(GREETINGS[l.id], l.id); }}>
                  <Volume2 size={22} className="tint" />
                  <span style={{ fontSize: '1.05rem' }}><b>{l.hello}</b> · {l.name}</span>
                </button>
              ))}
            </div>
            <button className="btn block mt2" onClick={next}>Continue</button>
          </div>
        )}

        {page === 1 && (
          <div className="mt2">
            <h2 className="display" style={{ fontSize: '1.6rem' }}>How will you use Kungula?</h2>
            <p className="muted small">Choose one or more. You can change this later in your profile.</p>
            <div className="stack mt">
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => {
                const on = roles.includes(r);
                return (
                  <button key={r} className={'tile' + (on ? ' on' : '')} style={{ flexDirection: 'row', justifyContent: 'flex-start', padding: 16, minHeight: 76, width: '100%', textAlign: 'left' }}
                    onClick={() => setRoles(on ? roles.filter((x) => x !== r) : [...roles, r])}>
                    <span style={{ fontSize: '2rem' }}>{ROLE_LABEL[r].icon}</span>
                    <span className="grow"><b style={{ fontSize: '1.05rem' }}>{ROLE_LABEL[r].label}</b><br /><span className="small muted" style={{ fontWeight: 500 }}>{ROLE_LABEL[r].hint}</span></span>
                    <input type="checkbox" readOnly checked={on} style={{ width: 22, height: 22, accentColor: 'var(--green)' }} />
                  </button>
                );
              })}
            </div>
            <div className="row mt2"><button className="btn ghost" onClick={back}>Back</button><button className="btn grow" disabled={!roles.length} onClick={next}>Continue</button></div>
          </div>
        )}

        {page === 2 && (
          <div className="mt2">
            <h2 className="display" style={{ fontSize: '1.6rem' }}>About you</h2>
            <div className="row mt">
              <button className="icon-btn" style={{ width: 84, height: 84, padding: 0, borderRadius: 26, overflow: 'hidden', position: 'relative' }} aria-label="Add your photo"
                onClick={async () => { try { const p = await takePhoto('camera'); if (p) setPhoto(await compressImage(p, 480, 0.75)); } catch { /* skip */ } }}>
                <Avatar name={name || 'You'} photo={photo} size={84} />
                <span style={{ position: 'absolute', right: 4, bottom: 4, background: 'var(--gold)', color: '#1d1503', borderRadius: 10, padding: 4, display: 'grid' }}><Camera size={14} /></span>
              </button>
              <div className="small muted">{photo ? 'Looking good.' : 'Add a photo so buyers, investors and neighbours know who you are. You can skip this.'}</div>
            </div>
            <label className="field"><span>Your name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nakato Sarah" autoComplete="name" /></label>
            <label className="field"><span>Phone number</span><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" inputMode="tel" autoComplete="tel" /></label>
            {!farmer && <label className="field"><span>Email (optional)</span><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>}
            <div className="grid2">
              <label className="field"><span>District</span>
                <select className="input" value={district} onChange={(e) => setDistrict(e.target.value)}>
                  <option value="">Choose</option>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
              <label className="field"><span>Village / town</span><input className="input" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="e.g. Kalungu" /></label>
            </div>
            {phone !== '' && !phoneOk && <p className="small" style={{ color: 'var(--alert)' }}>Enter a Ugandan mobile number, e.g. 0772 123 456.</p>}
            <div className="row mt2"><button className="btn ghost" onClick={back}>Back</button><button className="btn grow" disabled={!name.trim() || !district || (phone !== '' && !phoneOk)} onClick={next}>Continue</button></div>
          </div>
        )}

        {page === 3 && (
          <div className="mt2">
            <h2 className="display" style={{ fontSize: '1.6rem' }}>{farmer ? 'What do you grow and keep?' : 'What interests you?'}</h2>
            <p className="muted small">Tap all that apply.</p>
            <div className="section-title">Crops</div>
            <div className="grid3">
              {CROPS.map((c) => <button key={c.id} className={'tile' + (crops.includes(c.id) ? ' on' : '')} onClick={() => toggle(crops, setCrops, c.id)}><span className="emoji">{c.icon}</span>{lang === 'lg' ? c.lg : lang === 'sw' ? c.sw : c.name}</button>)}
            </div>
            <div className="section-title">Animals</div>
            <div className="grid3">
              {ANIMALS.map((a) => <button key={a.id} className={'tile' + (animals.includes(a.id) ? ' on' : '')} onClick={() => toggle(animals, setAnimals, a.id)}><span className="emoji">{a.icon}</span>{lang === 'lg' ? a.lg : lang === 'sw' ? a.sw : a.name}</button>)}
            </div>
            <div className="row mt2"><button className="btn ghost" onClick={back}>Back</button><button className="btn grow" disabled={farmer && !crops.length && !animals.length} onClick={next}>Continue</button></div>
          </div>
        )}

        {page === 4 && (
          <div className="mt2">
            {farmer ? (
              <>
                <h2 className="display" style={{ fontSize: '1.6rem' }}>Your farm location</h2>
                <p className="muted small">Used for weather at your farm and nearby markets and dealers. It stays on your phone.</p>
                <button className="btn soft block mt" onClick={locate}><MapPin size={20} /> Use my current location</button>
                {locMsg && <p className="small muted">{locMsg}</p>}
                <label className="card row mt2" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={champion} onChange={(e) => setChampion(e.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--green)' }} />
                  <div><b>I am a Kungula Champion</b><div className="small muted">Shows tools for registering farmers, mapping plots and co-operative collection days.</div></div>
                </label>
              </>
            ) : (
              <>
                <h2 className="display" style={{ fontSize: '1.6rem' }}>You’re all set</h2>
                <p className="muted">{roles.includes('investor') ? 'Browse farms Kungula has visited and verified, follow farmers you like, and see their progress before you invest.' : 'Read practical farming guides, take short courses and ask Jjajja anything about farming.'}</p>
              </>
            )}
            <div className="card flat mt2">
              <b>Your data belongs to you.</b>
              <p className="small" style={{ margin: '6px 0 0' }}>Everything you record is saved on this phone. Nothing is shared with a lender, buyer, investor or government body unless you switch it on.</p>
            </div>
            <div className="row mt2"><button className="btn ghost" onClick={back}>Back</button><button className="btn grow gold" onClick={finish}>Start</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
