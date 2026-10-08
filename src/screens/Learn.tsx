import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ARTICLES, type Topic } from '../data/knowledge';
import { LESSONS } from '../data/lessons';
import { CONDITIONS } from '../data/conditions';
import { CROPS, ANIMALS, subjectIcon, subjectName } from '../data/catalog';
import { searchArticles } from '../lib/jjajja';
import { TopBar, SpeakBtn, Empty } from '../components/ui';
import { FarmScene } from '../components/Art';

const TOPICS: { id: Topic | 'all' | 'pests'; label: string; icon: string }[] = [
  { id: 'all', label: 'Everything', icon: '📚' },
  { id: 'crops', label: 'Growing crops', icon: '🌱' },
  { id: 'animals', label: 'Keeping animals', icon: '🐄' },
  { id: 'pests', label: 'Pests & diseases', icon: '🐛' },
  { id: 'soil', label: 'Soil & water', icon: '💧' },
  { id: 'money', label: 'Money & markets', icon: '💰' },
  { id: 'invest', label: 'Investing in farms', icon: '💚' },
  { id: 'safety', label: 'Staying safe', icon: '🛡️' },
];

export default function Learn() {
  const [params, setParams] = useSearchParams();
  const topic = (params.get('topic') as (typeof TOPICS)[number]['id']) || 'all';
  const [q, setQ] = useState('');
  const results = useMemo(() => (q.trim() ? searchArticles(q).map((r) => r.article) : null), [q]);
  const articles = results ?? ARTICLES.filter((a) => topic === 'all' || a.topic === topic);
  const showPests = !results && (topic === 'all' || topic === 'pests');
  const lessons = LESSONS.filter((l) => topic === 'all' || (topic === 'pests' && l.track === 'Pests & diseases') || (topic === 'animals' && l.track === 'Animals') || (topic === 'crops' && (l.track === 'Crops' || l.track === 'After harvest')) || (topic === 'money' && (l.track === 'Farm business' || l.track === 'Export ready')) || (topic === 'safety' && l.id === 'l-safe-spray'));

  return (
    <>
      <TopBar title="Farming library" back={false} />
      <main className="page">
        <div className="hero-scene">
          <FarmScene things={['coffee', 'banana', 'maize', 'cattle', 'poultry']} seed="library" height={150} />
          <div className="over">
            <div className="greet">Learn farming</div>
            <div className="sub">Practical guides from Ugandan farms — free, offline, read aloud.</div>
          </div>
        </div>
        <div className="row mt" style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, color: 'var(--muted)' }} />
          <input className="input" style={{ paddingLeft: 40 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: planting maize, ticks, investing…" />
        </div>
        {!results && (
          <div className="chips mt" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
            {TOPICS.map((t) => <button key={t.id} className={'chip' + (topic === t.id ? ' on' : '')} onClick={() => setParams({ topic: t.id }, { replace: true })}>{t.icon} {t.label}</button>)}
          </div>
        )}

        {!results && lessons.length > 0 && (
          <>
            <div className="section-title">Short courses <Link to="/academy">All</Link></div>
            <div className="hscroll">
              {lessons.map((l) => (
                <Link key={l.id} to={`/academy/${l.id}`} className="card" style={{ width: 210, textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ fontSize: '2rem' }}>{l.icon}</div>
                  <b className="small" style={{ display: 'block', marginTop: 6 }}>{l.title}</b>
                  <div className="tiny muted">{l.minutes} min · quiz · certificate</div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="section-title">{results ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Guides'}</div>
        {!articles.length && <Empty emoji="🔍" title="Nothing found">Try another word, or ask Jjajja.</Empty>}
        <div className="card" style={{ display: articles.length ? 'block' : 'none' }}>
          <ul className="list">
            {articles.map((a) => (
              <li key={a.id}>
                <Link to={`/learn/${a.id}`} className="row grow" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="avatar">{TOPICS.find((t) => t.id === a.topic)?.icon ?? '📄'}</div>
                  <div className="grow"><b>{a.title}</b><div className="small muted ellipsis">{a.body.slice(0, 80)}…</div></div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {showPests && (
          <>
            <div className="section-title">Disease guide</div>
            {[...CROPS, ...ANIMALS].filter((c) => CONDITIONS.some((x) => x.subject === c.id)).map((c) => (
              <details key={c.id} className="card" style={{ marginTop: 10 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700, listStyle: 'none' }} className="row"><span style={{ fontSize: '1.4rem' }}>{subjectIcon(c.id)}</span> {subjectName(c.id)} <span className="muted small">({CONDITIONS.filter((x) => x.subject === c.id).length})</span></summary>
                <ul className="list mt">{CONDITIONS.filter((x) => x.subject === c.id).map((x) => <li key={x.id}><Link to={`/condition/${x.id}`} className="grow" style={{ textDecoration: 'none', color: 'inherit' }}>{x.name}<div className="tiny muted">{x.cause}</div></Link></li>)}</ul>
              </details>
            ))}
          </>
        )}
        <Link to="/jjajja" className="btn soft block mt2">Ask Jjajja a question</Link>
      </main>
    </>
  );
}

export function ArticlePage() {
  const { id } = useParams();
  const a = ARTICLES.find((x) => x.id === id);
  if (!a) return (<><TopBar title="Guide" /><main className="page"><Empty emoji="📄" title="Guide not found" /></main></>);
  const related = searchArticles(a.title + ' ' + a.keywords.slice(0, 3).join(' ')).map((r) => r.article).filter((x) => x.id !== a.id).slice(0, 3);
  return (
    <>
      <TopBar title={a.title} />
      <main className="page">
        <h1 className="display" style={{ fontSize: '1.8rem' }}>{a.title}</h1>
        <p style={{ fontSize: '1.08rem', lineHeight: 1.7, maxWidth: '62ch' }}>{a.body}</p>
        <SpeakBtn text={`${a.title}. ${a.body}`} />
        <p className="tiny muted mt">Source: {a.source}</p>
        {a.link && <Link to={a.link} className="btn soft mt">Open in Kungula</Link>}
        {related.length > 0 && (
          <>
            <div className="section-title">Read next</div>
            <div className="card"><ul className="list">{related.map((r) => <li key={r.id}><Link to={`/learn/${r.id}`} style={{ textDecoration: 'none', color: 'inherit' }} className="grow"><b className="small">{r.title}</b></Link></li>)}</ul></div>
          </>
        )}
      </main>
    </>
  );
}
