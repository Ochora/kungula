import { useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useStore, exportData, importData, today } from '../lib/store';
import { LANGS } from '../lib/i18n';
import { CROPS, ANIMALS, DISTRICTS } from '../data/catalog';
import { getPosition, saveAndShareFile } from '../lib/native';
import { TopBar, Toggle } from '../components/ui';

export default function SettingsPage() {
  const profile = useStore((s) => s.profile)!;
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const updateProfile = useStore((s) => s.updateProfile);
  const resetAll = useStore((s) => s.resetAll);
  const [msg, setMsg] = useState('');
  const [key, setKey] = useState(settings.aiKey ?? '');
  const file = useRef<HTMLInputElement>(null);

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <>
      <TopBar title="Settings" />
      <main className="page">
        <div className="section-title">Language</div>
        <div className="chips">
          {LANGS.map((l) => <button key={l.id} className={'chip big' + (settings.lang === l.id ? ' on' : '')} onClick={() => setSettings({ lang: l.id })}>{l.name}</button>)}
        </div>
        <p className="tiny muted">Luganda and Kiswahili screens are first drafts awaiting native-speaker review. Acholi/Luo and Runyankore-Rukiga next.</p>

        <div className="section-title">Profile</div>
        <div className="card">
          <label className="field" style={{ marginTop: 0 }}><span>Name</span><input className="input" value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} /></label>
          <label className="field"><span>Phone</span><input className="input" inputMode="tel" value={profile.phone} onChange={(e) => updateProfile({ phone: e.target.value })} /></label>
          <div className="grid2">
            <label className="field"><span>District</span><select className="input" value={profile.district} onChange={(e) => updateProfile({ district: e.target.value })}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></label>
            <label className="field"><span>Village</span><input className="input" value={profile.village} onChange={(e) => updateProfile({ village: e.target.value })} /></label>
          </div>
          <button className="btn soft block mt" onClick={async () => { try { const p = await getPosition(false); updateProfile({ location: { lat: p.lat, lng: p.lng } }); setMsg('Farm location updated.'); } catch { setMsg('Could not get location.'); } }}>
            <MapPin size={18} /> {profile.location ? 'Update farm location' : 'Set farm location'}
          </button>
          {profile.location && <p className="tiny muted center">{profile.location.lat.toFixed(4)}, {profile.location.lng.toFixed(4)}</p>}
          <div className="section-title">Crops</div>
          <div className="chips">{CROPS.map((c) => <button key={c.id} className={'chip' + (profile.crops.includes(c.id) ? ' on' : '')} onClick={() => updateProfile({ crops: toggle(profile.crops, c.id) })}>{c.icon} {c.name}</button>)}</div>
          <div className="section-title">Animals</div>
          <div className="chips">{ANIMALS.map((a) => <button key={a.id} className={'chip' + (profile.animals.includes(a.id) ? ' on' : '')} onClick={() => updateProfile({ animals: toggle(profile.animals, a.id) })}>{a.icon} {a.name}</button>)}</div>
          <Toggle on={profile.isChampion} onChange={(v) => updateProfile({ isChampion: v })} label="I am a Kungula Champion" hint="Shows Trace and Co-op tools on the home screen." />
        </div>

        <div className="section-title">Display & voice</div>
        <div className="card">
          <Toggle on={settings.largeText} onChange={(v) => setSettings({ largeText: v })} label="Larger text" />
          <Toggle on={settings.voiceReplies} onChange={(v) => setSettings({ voiceReplies: v })} label="Jjajja reads answers aloud" />
        </div>

        <div className="section-title">Your data, your choice</div>
        <div className="card">
          <p className="small muted" style={{ marginTop: 0 }}>Nothing leaves your phone unless you switch it on. Every change is recorded and you can switch off at any time.</p>
          <Toggle on={settings.consentLenders} onChange={(v) => setSettings({ consentLenders: v })} label="Share my score and records with lenders I apply to" />
          <Toggle on={settings.consentBuyers} onChange={(v) => setSettings({ consentBuyers: v })} label="Let verified buyers see my listings and location" />
          <Toggle on={settings.consentResearch} onChange={(v) => setSettings({ consentResearch: v })} label="Include my anonymous data in district reports" hint="Helps government and NGOs plan extension and outbreak response." />
          <Toggle on={settings.consentDataDonation} onChange={(v) => setSettings({ consentDataDonation: v })} label="Donate my Scan photos to improve the AI" hint="Agronomists label photos to train Ugandan crop models." />
        </div>

        <div className="section-title">Backup</div>
        <div className="card">
          <p className="small muted" style={{ marginTop: 0 }}>Save a backup file to WhatsApp, Google Drive or email, and restore it on a new phone.</p>
          <div className="grid2">
            <button className="btn soft" onClick={() => saveAndShareFile(`kungula-backup-${today()}.json`, exportData(), 'application/json')}>Back up</button>
            <button className="btn ghost" onClick={() => file.current?.click()}>Restore</button>
          </div>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            try { importData(await f.text()); setMsg('Backup restored.'); } catch (err) { setMsg(err instanceof Error ? err.message : 'Could not restore'); }
          }} />
          {msg && <p className="small center">{msg}</p>}
        </div>

        <div className="section-title">Online AI (optional)</div>
        <div className="card">
          <p className="small muted" style={{ marginTop: 0 }}>Jjajja and Scan work fully offline. For trials, you can connect an Anthropic API key so Jjajja answers open questions and reviews Scan photos when you have internet. In production this runs through the Kungula server instead.</p>
          <label className="field"><span>API key</span><input className="input" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" autoComplete="off" /></label>
          <label className="field"><span>Model</span><input className="input" value={settings.aiModel ?? ''} onChange={(e) => setSettings({ aiModel: e.target.value })} placeholder="claude-sonnet-5-5" /></label>
          <div className="grid2 mt">
            <button className="btn soft" onClick={() => { setSettings({ aiKey: key.trim() || undefined }); setMsg(key.trim() ? 'AI key saved on this phone.' : 'AI key removed.'); }}>Save key</button>
            <button className="btn ghost" onClick={() => { setKey(''); setSettings({ aiKey: undefined }); }}>Remove</button>
          </div>
          <p className="tiny muted">The key is stored only on this phone and is never included in backups.</p>
        </div>

        <div className="section-title">About</div>
        <div className="card small">
          <p style={{ marginTop: 0 }}><b>Kungula v{__APP_VERSION__}</b> — from the Luganda <i>okukungula</i>, "to harvest".</p>
          <p className="muted">Advice follows MAAIF, NARO and extension guidance and is reviewed by agronomists and vets. Kungula gives guidance, not a guarantee — involve a professional for serious cases. Kungula never lends money or holds your funds; financial products come from licensed partners.</p>
        </div>

        <button className="btn danger block mt2" onClick={() => { if (confirm('Delete ALL Kungula data on this phone? Make a backup first.') && confirm('Are you sure? This cannot be undone.')) resetAll(); }}>Delete all my data</button>
      </main>
    </>
  );
}
