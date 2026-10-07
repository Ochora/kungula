import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Send, Volume2, VolumeX, Trash2, Phone, Camera } from 'lucide-react';
import { useStore, uid } from '../lib/store';
import { useT } from '../lib/i18n';
import { useScore } from '../lib/hooks';
import { offlineReply, onlineReply, type JjajjaContext } from '../lib/jjajja';
import { speak, stopSpeaking, takePhoto, callNumber } from '../lib/native';
import { compressImage } from '../lib/util';
import { TopBar, Sheet } from '../components/ui';
import { CHAMPIONS } from '../data/community';
import type { ChatMsg } from '../lib/types';

export default function Jjajja({ online }: { online: boolean }) {
  const t = useT();
  const nav = useNavigate();
  const chat = useStore((s) => s.chat);
  const set = useStore((s) => s.set);
  const profile = useStore((s) => s.profile);
  const weather = useStore((s) => s.weather);
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const { score } = useScore();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [chips, setChips] = useState<{ label: string; value: string }[]>([]);
  const [ctx, setCtx] = useState<Pick<JjajjaContext, 'pendingSubject' | 'pendingSigns'>>({});
  const [expert, setExpert] = useState(false);
  const [photo, setPhoto] = useState<string>();
  const end = useRef<HTMLDivElement>(null);
  const useAI = online && !!settings.aiKey;

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat.length, busy, chips.length]);
  useEffect(() => () => { stopSpeaking(); }, []);

  useEffect(() => {
    if (chat.length === 0) {
      const r = offlineReply('hello', { profile });
      push({ from: 'jjajja', text: r.text, source: r.source });
      setChips(r.chips ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function push(m: Omit<ChatMsg, 'id' | 'at'>) {
    const msg: ChatMsg = { ...m, id: uid(), at: Date.now() };
    set({ chat: [...useStore.getState().chat, msg].slice(-200) });
    return msg;
  }

  async function ask(raw: string, label?: string) {
    const q = raw.trim();
    if (!q || busy) return;
    setText(''); setChips([]);
    push({ from: 'me', text: label ?? q });
    setBusy(true);
    const fullCtx: JjajjaContext = { profile, weather, score, ...ctx };
    const isChip = q.startsWith('sign:') || q === 'done';
    if (useAI && !isChip) {
      try {
        const history = [...useStore.getState().chat].slice(-10).map((m) => ({ role: m.from === 'me' ? 'user' as const : 'assistant' as const, content: m.text }));
        // the API needs the conversation to start with a user turn
        while (history.length && history[0].role !== 'user') history.shift();
        const answer = await onlineReply(history, fullCtx, settings.aiKey!, settings.aiModel || undefined, photo);
        setPhoto(undefined);
        push({ from: 'jjajja', text: answer, source: 'Jjajja online (AI) — grounded in the Kungula library' });
        if (settings.voiceReplies) speak(answer, settings.lang);
        setBusy(false);
        return;
      } catch {
        // fall back to the offline brain below
      }
    }
    const r = offlineReply(q, fullCtx);
    push({ from: 'jjajja', text: r.text, source: r.source, links: r.links });
    setChips(r.chips ?? []);
    if (r.next) setCtx((c) => ({ ...c, ...r.next }));
    if (r.escalate) setChips((c) => [...c, { label: '🧑‍🌾 Talk to a human expert', value: '__expert' }]);
    if (settings.voiceReplies) speak(r.text, settings.lang);
    setBusy(false);
  }

  const onChip = (c: { label: string; value: string }) => {
    if (c.value === '__expert') return setExpert(true);
    ask(c.value, c.value.startsWith('sign:') || c.value === 'done' ? c.label : undefined);
  };

  return (
    <>
      <TopBar title={`Jjajja ${useAI ? '· online' : '· offline'}`} right={
        <>
          <button className="icon-btn" aria-label="Voice replies" onClick={() => { setSettings({ voiceReplies: !settings.voiceReplies }); if (settings.voiceReplies) stopSpeaking(); }}>
            {settings.voiceReplies ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </button>
          <button className="icon-btn" aria-label="Clear chat" onClick={() => { if (confirm('Clear this conversation?')) { set({ chat: [] }); setCtx({}); setChips([]); } }}>
            <Trash2 size={20} />
          </button>
        </>
      } />
      <div className="chat">
        {chat.map((m) => (
          <div key={m.id} className={'bubble ' + (m.from === 'me' ? 'me' : 'jj')}>
            {m.text}
            {m.links && (
              <div className="row wrap" style={{ marginTop: 8, gap: 6 }}>
                {m.links.map((l) => <Link key={l.to} to={l.to} className="btn sm soft">{l.label}</Link>)}
              </div>
            )}
            {m.from === 'jjajja' && (
              <div className="row between src">
                <span>{m.source}</span>
                <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Listen" onClick={() => speak(m.text, settings.lang)}><Volume2 size={16} /></button>
              </div>
            )}
          </div>
        ))}
        {busy && <div className="bubble jj row"><span className="sprout">🌱</span> <span className="muted small">Jjajja is thinking…</span></div>}
        {chips.length > 0 && !busy && (
          <div className="chips">
            {chips.map((c) => <button key={c.value} className="chip" onClick={() => onChip(c)}>{c.label}</button>)}
          </div>
        )}
        <div ref={end} />
      </div>

      <div className="composer">
        {photo && <div className="row small" style={{ maxWidth: 720, margin: '0 auto 6px' }}><img src={photo} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} /> Photo attached <button className="chip" onClick={() => setPhoto(undefined)}>Remove</button></div>}
        <div className="inner">
          <button className="send" style={{ background: 'var(--green-soft)', color: 'var(--green)' }} aria-label="Photo"
            onClick={async () => {
              if (!useAI) { nav('/scan'); return; }
              const p = await takePhoto('camera').catch(() => undefined);
              if (p) setPhoto(await compressImage(p, 800, 0.7));
            }}>
            <Camera size={22} />
          </button>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('typeQuestion')} rows={1}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(text); } }} />
          <button className="send" aria-label="Send" onClick={() => ask(text)} disabled={!text.trim()}><Send size={20} /></button>
        </div>
        <div className="tiny muted center" style={{ marginTop: 4 }}>🎤 Tap the keyboard mic to speak</div>
      </div>

      <Sheet open={expert} onClose={() => setExpert(false)} title="Talk to a human expert">
        <p className="small muted">The Kungula expert call-back line opens with the pilot. Until then, contact a Champion or your district officers directly.</p>
        <ul className="list">
          {CHAMPIONS.map((c) => (
            <li key={c.phone}>
              <div className="avatar">🧑‍🌾</div>
              <div className="grow"><b>{c.name}</b><div className="small muted">{c.parish} · {c.crops} · demo contact</div></div>
              <button className="btn sm" onClick={() => callNumber(c.phone)}><Phone size={16} /> Call</button>
            </li>
          ))}
        </ul>
        <div className="alert warn mt"><span className="a-ico">🩺</span><div><b>Sick or dying animals?</b><span className="small">Call your district veterinary officer. Diseases like FMD, lumpy skin, ASF, PPR and Newcastle outbreaks must be reported.</span></div></div>
        <button className="btn block mt" onClick={() => setExpert(false)}>Close</button>
      </Sheet>
    </>
  );
}
