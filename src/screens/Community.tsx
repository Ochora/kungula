import { useState } from 'react';
import { Camera, Plus, Phone, MessageCircle } from 'lucide-react';
import { useStore, uid } from '../lib/store';
import { GROUPS, EVENTS, CHAMPIONS } from '../data/community';
import { ago, compressImage } from '../lib/util';
import { takePhoto, callNumber, whatsapp } from '../lib/native';
import { searchArticles } from '../lib/jjajja';
import { TopBar, Sheet, DemoNote, Empty } from '../components/ui';

type Tab = 'feed' | 'groups' | 'events' | 'people';

export default function Community() {
  const [tab, setTab] = useState<Tab>('feed');
  return (
    <>
      <TopBar title="Community" />
      <main className="page">
        <div className="tabs">
          {([['feed', 'Feed'], ['groups', 'Groups'], ['events', 'Events'], ['people', 'Champions']] as [Tab, string][]).map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
        </div>
        <div className="mt">
          {tab === 'feed' && <Feed />}
          {tab === 'groups' && <Groups />}
          {tab === 'events' && <Events />}
          {tab === 'people' && <People />}
        </div>
      </main>
    </>
  );
}

function Feed() {
  const posts = useStore((s) => s.posts);
  const joined = useStore((s) => s.joinedGroups);
  const profile = useStore((s) => s.profile)!;
  const upsert = useStore((s) => s.upsert);
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(joined[0] ?? GROUPS[0].id);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string>();
  const [reply, setReply] = useState<Record<string, string>>({});
  const list = [...posts].filter((p) => !joined.length || joined.includes(p.group) || p.mine).sort((a, b) => b.at - a.at);

  const post = () => {
    const id = uid();
    const hint = searchArticles(text)[0];
    upsert('posts', {
      id, group, author: `${profile.name.split(' ')[0]} (${profile.district})`, text: text.trim(), photo, at: Date.now(), mine: true,
      replies: hint && hint.score >= 2 ? [{ author: '🌱 Jjajja (suggested answer)', text: hint.article.body, at: Date.now() }] : [],
    });
    setText(''); setPhoto(undefined); setOpen(false);
  };

  return (
    <>
      {!list.length && <Empty emoji="💬" title="No posts in your groups yet" />}
      <div className="stack">
        {list.map((p) => (
          <div key={p.id} className="card">
            <div className="row between"><b>{p.author}</b><span className="tiny muted">{ago(p.at)}</span></div>
            <div className="tiny muted">{GROUPS.find((g) => g.id === p.group)?.icon} {GROUPS.find((g) => g.id === p.group)?.name}</div>
            <p style={{ margin: '8px 0' }}>{p.text}</p>
            {p.photo && <img src={p.photo} style={{ borderRadius: 12, maxHeight: 220, width: '100%', objectFit: 'cover' }} />}
            {p.replies.map((r, i) => (
              <div key={i} style={{ borderLeft: '3px solid var(--green-soft)', paddingLeft: 10, marginTop: 8 }}>
                <div className="small"><b>{r.author}</b> <span className="muted tiny">{ago(r.at)}</span></div>
                <div className="small">{r.text}</div>
              </div>
            ))}
            <div className="row mt">
              <input className="input grow" style={{ minHeight: 40 }} placeholder="Reply…" value={reply[p.id] ?? ''} onChange={(e) => setReply({ ...reply, [p.id]: e.target.value })} />
              <button className="btn sm" disabled={!reply[p.id]?.trim()} onClick={() => { upsert('posts', { ...p, replies: [...p.replies, { author: profile.name.split(' ')[0], text: reply[p.id].trim(), at: Date.now() }] }); setReply({ ...reply, [p.id]: '' }); }}>Send</button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn fab" onClick={() => setOpen(true)}><Plus size={20} /> Post</button>
      <DemoNote>Example posts are included. Your posts are saved on this phone; sharing with other farmers starts when the Kungula community server goes live.</DemoNote>
      <Sheet open={open} onClose={() => setOpen(false)} title="Ask the community">
        <label className="field"><span>Group</span><select className="input" value={group} onChange={(e) => setGroup(e.target.value)}>{GROUPS.map((g) => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}</select></label>
        <label className="field"><span>Your question or tip</span><textarea className="input" value={text} onChange={(e) => setText(e.target.value)} /></label>
        <button className="btn soft block mt" onClick={async () => { const p = await takePhoto('camera').catch(() => undefined); if (p) setPhoto(await compressImage(p, 640, 0.6)); }}><Camera size={18} /> {photo ? 'Retake photo' : 'Add photo'}</button>
        {photo && <img src={photo} className="mt" style={{ borderRadius: 12, maxHeight: 160, width: '100%', objectFit: 'cover' }} />}
        <button className="btn block mt2" disabled={!text.trim()} onClick={post}>Post</button>
      </Sheet>
    </>
  );
}

function Groups() {
  const joined = useStore((s) => s.joinedGroups);
  const set = useStore((s) => s.set);
  return (
    <div className="card">
      <ul className="list">
        {GROUPS.map((g) => {
          const on = joined.includes(g.id);
          return (
            <li key={g.id}><div className="avatar">{g.icon}</div><div className="grow"><b>{g.name}</b></div>
              <button className={'btn sm ' + (on ? 'soft' : '')} onClick={() => set({ joinedGroups: on ? joined.filter((x) => x !== g.id) : [...joined, g.id] })}>{on ? 'Joined ✓' : 'Join'}</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Events() {
  return (
    <div className="stack">
      {EVENTS.map((e) => (
        <div key={e.id} className="card row">
          <div className="avatar">{e.kind === 'Collection' ? '⚖️' : e.kind === 'Training' ? '🎓' : e.kind === 'Show' ? '🎪' : e.kind === 'Vet' ? '💉' : '💰'}</div>
          <div className="grow"><b>{e.title}</b><div className="small muted">{e.where} · {e.when}</div></div>
          <span className="badge grey">{e.kind}</span>
        </div>
      ))}
      <DemoNote>Sample events. District and co-operative calendars are added by Champions.</DemoNote>
    </div>
  );
}

function People() {
  return (
    <>
      <div className="card" style={{ background: 'var(--green-soft)' }}>
        <b>Kungula Champions</b>
        <p className="small" style={{ margin: '6px 0 0' }}>Trusted local people who register farmers, map plots, scan crops for farmers without smartphones, take input orders and run group lessons.</p>
      </div>
      <div className="stack mt">
        {CHAMPIONS.map((c) => (
          <div key={c.phone} className="card row">
            <div className="avatar">🧑‍🌾</div>
            <div className="grow"><b>{c.name}</b><div className="small muted">{c.parish} · {c.crops}</div></div>
            <button className="icon-btn" aria-label="Call" onClick={() => callNumber(c.phone)}><Phone size={20} className="tint" /></button>
            <button className="icon-btn" aria-label="WhatsApp" onClick={() => whatsapp(c.phone)}><MessageCircle size={20} className="tint" /></button>
          </div>
        ))}
      </div>
      <DemoNote>Demo Champions with placeholder numbers. Real Champions are listed by parish during the pilot.</DemoNote>
    </>
  );
}
