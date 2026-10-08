import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Image as ImageIcon, Pencil, Phone, MessageCircle, Mail, MapPin, Share2, Trash2 } from 'lucide-react';
import { useStore, uid, rolesOf, isFarmer, isInvestor } from '../lib/store';
import { useScore } from '../lib/hooks';
import { LEVELS, BADGES, levelOf } from '../lib/game';
import { DISTRICTS, CROPS, ANIMALS, subjectIcon, subjectName } from '../data/catalog';
import { takePhoto, shareText, PhotoError } from '../lib/native';
import { compressImage, ugx, ago } from '../lib/util';
import { TopBar, Sheet, Seal } from '../components/ui';
import { Avatar, FarmScene, GrowingPlant } from '../components/Art';
import { useShallow } from 'zustand/react/shallow';
import type { Role } from '../lib/types';

export const ROLE_LABEL: Record<Role, { label: string; icon: string; hint: string }> = {
  farmer: { label: 'Farmer', icon: '🧑‍🌾', hint: 'I grow crops or keep animals' },
  investor: { label: 'Investor', icon: '💚', hint: 'I want to put money into farms' },
  learner: { label: 'Learner', icon: '📖', hint: 'I want to read and learn about farming' },
};

export default function Profile() {
  const loc = useLocation();
  const profile = useStore((s) => s.profile)!;
  const update = useStore((s) => s.updateProfile);
  const game = useStore((s) => s.game);
  const counts = useStore(useShallow((s) => ({ a: s.activities.length, p: s.plots.length, n: s.animals.reduce((x, y) => x + y.count, 0), l: s.lessons.filter((x) => x.completedAt).length, i: s.investments.length })));
  const { score } = useScore();
  const [edit, setEdit] = useState(false);
  const [photoErr, setPhotoErr] = useState('');
  const lv = levelOf(game.xp);
  const roles = rolesOf(profile);

  useEffect(() => { if (loc.hash === '#invest') setTimeout(() => document.getElementById('invest')?.scrollIntoView({ behavior: 'smooth' }), 150); }, [loc.hash]);

  const changePhoto = async (src: 'camera' | 'gallery') => {
    setPhotoErr('');
    try { const p = await takePhoto(src); if (p) update({ photo: await compressImage(p, 480, 0.75) }); }
    catch (e) { setPhotoErr(e instanceof PhotoError ? e.message : 'Could not get a photo.'); }
  };

  return (
    <>
      <TopBar title="My profile" right={<button className="icon-btn" aria-label="Edit profile" onClick={() => setEdit(true)}><Pencil size={20} /></button>} />
      <main className="page">
        <div className="cover">
          <FarmScene things={[...profile.crops, ...profile.animals]} seed={profile.name} plantStage={lv.index} height={170} />
          {isFarmer(profile) && <div style={{ position: 'absolute', right: 12, top: 12 }}><Seal status={profile.verification ?? 'none'} /></div>}
          <div className="cover-avatar"><Avatar name={profile.name} photo={profile.photo} size={92} /></div>
        </div>
        <div style={{ paddingLeft: 122, minHeight: 50, marginTop: 6 }}>
          <div className="display" style={{ fontSize: '1.5rem' }}>{profile.name}</div>
          <div className="small muted">{roles.map((r) => ROLE_LABEL[r].label).join(' · ')}{profile.farmName ? ` · ${profile.farmName}` : ''}</div>
        </div>
        <div className="row mt" style={{ gap: 8 }}>
          <button className="btn sm soft" onClick={() => changePhoto('camera')}><Camera size={16} /> {profile.photo ? 'New photo' : 'Add your photo'}</button>
          <button className="btn sm ghost" onClick={() => changePhoto('gallery')}><ImageIcon size={16} /> Gallery</button>
          {profile.photo && <button className="icon-btn" aria-label="Remove photo" onClick={() => update({ photo: undefined })}><Trash2 size={18} /></button>}
        </div>
        {photoErr && <p className="small" style={{ color: 'var(--alert)' }}>{photoErr}</p>}

        {/* Garden / gamification */}
        <div className="card mt" style={{ background: 'linear-gradient(150deg, #1f6b3a, #0f3d22)', color: '#fff', border: 'none' }}>
          <div className="row">
            <svg viewBox="-30 -66 60 82" width="70" height="90" aria-hidden="true">
              <GrowingPlant stage={lv.index} />
            </svg>
            <div className="grow">
              <div className="tiny" style={{ opacity: .8 }}>Your Kungula plant</div>
              <div className="display" style={{ fontSize: '1.5rem' }}>{lv.icon} {lv.name}</div>
              <div className="xp mt"><div className="progress"><i style={{ width: `${lv.pct * 100}%` }} /></div><span className="tiny">{game.xp} XP</span></div>
              <div className="tiny" style={{ opacity: .85, marginTop: 4 }}>{lv.next ? `${lv.toNext} XP to ${lv.next.name}` : 'Fully grown!'} · 🔥 {game.streak}-day streak · 💧 watered {game.waterings}×</div>
            </div>
          </div>
        </div>

        <div className="section-title">Badges <span className="more muted">{game.badges.length}/{Object.keys(BADGES).length}</span></div>
        <div className="grid3">
          {Object.entries(BADGES).map(([id, b]) => {
            const got = game.badges.includes(id) || (id === 'verified' && profile.verification === 'verified');
            return (
              <div key={id} className="tile" style={{ minHeight: 92, opacity: got ? 1 : 0.45, filter: got ? 'none' : 'grayscale(1)' }} title={b.how}>
                <span className="emoji" style={{ fontSize: '1.6rem' }}>{b.icon}</span>
                <span style={{ fontSize: '.78rem' }}>{b.name}</span>
                {!got && <span className="tiny muted" style={{ fontWeight: 500 }}>{b.how}</span>}
              </div>
            );
          })}
        </div>
        <p className="tiny muted center">Levels: {LEVELS.map((l) => l.icon).join(' → ')}</p>

        <div className="section-title">Contact details</div>
        <div className="card">
          <ul className="list">
            <li><Phone size={18} className="tint" /><span className="grow">{profile.phone || <span className="muted">Add phone</span>}</span></li>
            <li><MessageCircle size={18} className="tint" /><span className="grow">{profile.whatsapp || profile.phone || <span className="muted">Add WhatsApp</span>}</span></li>
            <li><Mail size={18} className="tint" /><span className="grow">{profile.email || <span className="muted">Add email</span>}</span></li>
            <li><MapPin size={18} className="tint" /><span className="grow">{profile.village ? `${profile.village}, ` : ''}{profile.district}</span></li>
          </ul>
          <button className="btn sm soft mt" onClick={() => setEdit(true)}><Pencil size={16} /> Edit details</button>
        </div>

        {profile.bio && (<><div className="section-title">About me</div><div className="card"><p style={{ margin: 0 }}>{profile.bio}</p></div></>)}

        {isFarmer(profile) && (
          <>
            <div className="section-title">My farm</div>
            <div className="card">
              <div className="row wrap" style={{ gap: 6 }}>{[...profile.crops, ...profile.animals].map((t) => <span key={t} className="badge grey">{subjectIcon(t)} {subjectName(t)}</span>)}</div>
              <div className="grid3 mt">
                <div className="stat"><span className="v">{counts.a}</span><span className="l">records</span></div>
                <div className="stat"><span className="v">{counts.p}</span><span className="l">plots</span></div>
                <div className="stat"><span className="v">{counts.n}</span><span className="l">animals</span></div>
              </div>
              <div className="grid3 mt">
                <div className="stat"><span className="v">{score}</span><span className="l">loan score</span></div>
                <div className="stat"><span className="v">{counts.l}</span><span className="l">lessons</span></div>
                <div className="stat"><span className="v">{profile.yearsFarming ?? '—'}</span><span className="l">years farming</span></div>
              </div>
            </div>
            <InvestorListing />
          </>
        )}

        {isInvestor(profile) && (
          <>
            <div className="section-title">Investing</div>
            <Link to="/portfolio" className="card row" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span style={{ fontSize: '1.8rem' }}>💚</span>
              <div className="grow"><b>My portfolio</b><div className="small muted">{counts.i} investment{counts.i === 1 ? '' : 's'} · farms you follow</div></div>
            </Link>
          </>
        )}

        <button className="btn ghost block mt2" onClick={() => shareText('My Kungula profile', `${profile.name} — ${roles.map((r) => ROLE_LABEL[r].label).join(', ')} in ${profile.district}. ${profile.phone ? `Call ${profile.phone}. ` : ''}Find me on Kungula.`)}>
          <Share2 size={18} /> Share my profile
        </button>
      </main>
      <EditProfile open={edit} onClose={() => setEdit(false)} />
    </>
  );
}

function InvestorListing() {
  const profile = useStore((s) => s.profile)!;
  const update = useStore((s) => s.updateProfile);
  const updates = useStore((s) => s.updates).filter((u) => u.farmId === 'me');
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string>();
  const v = profile.verification ?? 'none';
  return (
    <div id="invest">
      <div className="section-title">Get investors</div>
      <div className="card">
        <div className="row between"><b>Kungula verification</b><Seal status={v} /></div>
        <p className="small muted" style={{ margin: '6px 0 10px' }}>Investors can only back farms a Kungula officer has visited. The officer checks your ID, land documents, farm size, crops and animals, and talks to your LC1 chairperson.</p>
        {v === 'none' && <button className="btn block" onClick={() => update({ verification: 'requested', verificationRequestedAt: Date.now() })}>Request a farm visit</button>}
        {v === 'requested' && <div className="alert warn"><span className="a-ico">⏳</span><div><b>Visit requested {profile.verificationRequestedAt ? ago(profile.verificationRequestedAt) : ''}</b><span className="small">A field officer will call {profile.phone || 'you'} to agree a date. Keep your ID and land documents ready.</span></div></div>}
        {v === 'verified' && <div className="alert"><span className="a-ico">✅</span><div><b>Your farm is verified</b><span className="small">Investors can now back you.</span></div></div>}
      </div>

      <div className="card mt">
        <label className="row" style={{ cursor: 'pointer' }}>
          <div className="grow"><b>Show my farm to investors</b><div className="small muted">Your profile, farm records summary and updates become visible.</div></div>
          <input type="checkbox" checked={!!profile.seekingInvestment} onChange={(e) => update({ seekingInvestment: e.target.checked })} style={{ width: 24, height: 24, accentColor: 'var(--green)' }} />
        </label>
        {profile.seekingInvestment && (
          <>
            <label className="field"><span>What do you need money for?</span><input className="input" value={profile.investmentPitch ?? ''} onChange={(e) => update({ investmentPitch: e.target.value })} placeholder="e.g. Drip irrigation for 2 acres of tomatoes" /></label>
            <label className="field"><span>How much (UGX)?</span><input className="input" inputMode="numeric" value={profile.investmentNeed ?? ''} onChange={(e) => update({ investmentNeed: parseFloat(e.target.value.replace(/,/g, '')) || undefined })} placeholder="e.g. 3,000,000" /></label>
            {profile.investmentNeed ? <p className="small muted">Shown as {Math.max(1, Math.round(profile.investmentNeed / 250000))} shares of {ugx(250000)}.</p> : null}
          </>
        )}
        <Link to="/invest/farm/me" className="btn sm soft mt">See how investors see me</Link>
      </div>

      <div className="card mt">
        <b>Post a farm update</b>
        <p className="small muted" style={{ margin: '4px 0 8px' }}>Followers and investors see your updates. Photos build trust.</p>
        <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Maize is knee-high, weeded the north plot this week." />
        <div className="row mt">
          <button className="btn sm soft" onClick={async () => { try { const p = await takePhoto('camera'); if (p) setPhoto(await compressImage(p, 720, 0.65)); } catch { /* shown elsewhere */ } }}><Camera size={16} /> {photo ? 'Retake' : 'Photo'}</button>
          {photo && <img src={photo} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />}
          <button className="btn sm grow" disabled={text.trim().length < 5} onClick={() => { upsert('updates', { id: uid(), farmId: 'me', text: text.trim(), photo, at: Date.now(), kind: 'update' }); setText(''); setPhoto(undefined); }}>Post update</button>
        </div>
        {updates.length > 0 && (
          <ul className="list mt">
            {updates.slice(0, 5).map((u) => (
              <li key={u.id}>{u.photo ? <img src={u.photo} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} /> : <div className="avatar">🌱</div>}
                <div className="grow small">{u.text}<div className="tiny muted">{ago(u.at)}</div></div>
                <button className="icon-btn" aria-label="Delete update" onClick={() => remove('updates', u.id)}><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EditProfile({ open, onClose }: { open: boolean; onClose: () => void }) {
  const p = useStore((s) => s.profile)!;
  const update = useStore((s) => s.updateProfile);
  const roles = rolesOf(p);
  const toggleRole = (r: Role) => {
    const next = roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r];
    if (next.length) update({ roles: next });
  };
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return (
    <Sheet open={open} onClose={onClose} title="Edit profile">
      <div className="field"><span>I am a…</span>
        <div className="chips">{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <button key={r} className={'chip' + (roles.includes(r) ? ' on' : '')} onClick={() => toggleRole(r)}>{ROLE_LABEL[r].icon} {ROLE_LABEL[r].label}</button>)}</div>
      </div>
      <label className="field"><span>Full name</span><input className="input" value={p.name} onChange={(e) => update({ name: e.target.value })} /></label>
      <div className="grid2">
        <label className="field"><span>Phone</span><input className="input" inputMode="tel" value={p.phone} onChange={(e) => update({ phone: e.target.value })} /></label>
        <label className="field"><span>WhatsApp</span><input className="input" inputMode="tel" value={p.whatsapp ?? ''} onChange={(e) => update({ whatsapp: e.target.value })} placeholder="Same as phone" /></label>
      </div>
      <label className="field"><span>Email</span><input className="input" type="email" value={p.email ?? ''} onChange={(e) => update({ email: e.target.value })} /></label>
      <div className="grid2">
        <label className="field"><span>District</span><select className="input" value={p.district} onChange={(e) => update({ district: e.target.value })}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></label>
        <label className="field"><span>Village</span><input className="input" value={p.village} onChange={(e) => update({ village: e.target.value })} /></label>
      </div>
      {roles.includes('farmer') && (
        <>
          <label className="field"><span>Farm name</span><input className="input" value={p.farmName ?? ''} onChange={(e) => update({ farmName: e.target.value })} placeholder="e.g. Kalungu Hill Coffee" /></label>
          <div className="grid2">
            <label className="field"><span>Years farming</span><input className="input" inputMode="numeric" value={p.yearsFarming ?? ''} onChange={(e) => update({ yearsFarming: parseInt(e.target.value) || undefined })} /></label>
            <label className="field"><span>Farm size (acres)</span><input className="input" inputMode="decimal" value={p.farmAcres ?? ''} onChange={(e) => update({ farmAcres: parseFloat(e.target.value) || undefined })} /></label>
          </div>
          <div className="field"><span>Crops</span><div className="chips">{CROPS.map((c) => <button key={c.id} className={'chip' + (p.crops.includes(c.id) ? ' on' : '')} onClick={() => update({ crops: toggle(p.crops, c.id) })}>{c.icon} {c.name}</button>)}</div></div>
          <div className="field"><span>Animals</span><div className="chips">{ANIMALS.map((a) => <button key={a.id} className={'chip' + (p.animals.includes(a.id) ? ' on' : '')} onClick={() => update({ animals: toggle(p.animals, a.id) })}>{a.icon} {a.name}</button>)}</div></div>
        </>
      )}
      <label className="field"><span>About me</span><textarea className="input" value={p.bio ?? ''} onChange={(e) => update({ bio: e.target.value })} placeholder={roles.includes('farmer') ? 'Your farm story: what you grow, how long, what you are proud of.' : 'Why you are interested in farming.'} /></label>
      <button className="btn block mt2" onClick={onClose}>Done</button>
      <p className="tiny muted center">Changes save as you type.</p>
    </Sheet>
  );
}
