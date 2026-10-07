import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { LESSONS } from '../data/lessons';
import { TopBar } from '../components/ui';

export default function Academy() {
  const profile = useStore((s) => s.profile)!;
  const progress = useStore((s) => s.lessons);
  const done = (id: string) => progress.find((p) => p.lessonId === id && p.completedAt);
  const mine = [...profile.crops, ...profile.animals];
  const recommended = LESSONS.filter((l) => !done(l.id) && (!l.crops || l.crops.some((c) => mine.includes(c))));
  const tracks = Array.from(new Set(LESSONS.map((l) => l.track)));
  const completed = LESSONS.filter((l) => done(l.id)).length;

  return (
    <>
      <TopBar title="Kungula Academy" />
      <main className="page">
        <div className="hero">
          <div className="sun" />
          <div className="display" style={{ fontSize: '1.4rem' }}>🎓 {completed} of {LESSONS.length} lessons done</div>
          <div className="progress mt" style={{ background: 'rgba(255,255,255,.2)' }}><i style={{ width: `${(completed / LESSONS.length) * 100}%`, background: 'var(--gold)' }} /></div>
          <p className="small muted" style={{ marginBottom: 0 }}>Each certificate adds 3 points to your Loan Readiness Score. Lessons work offline and can be read aloud.</p>
        </div>

        {recommended.length > 0 && (
          <>
            <div className="section-title">For your farm</div>
            <div className="stack">{recommended.slice(0, 3).map((l) => <LessonRow key={l.id} id={l.id} />)}</div>
          </>
        )}

        {tracks.map((t) => (
          <div key={t}>
            <div className="section-title">{t}</div>
            <div className="stack">{LESSONS.filter((l) => l.track === t).map((l) => <LessonRow key={l.id} id={l.id} />)}</div>
          </div>
        ))}
        <p className="tiny muted center mt2">Video and voice-call lessons in Luganda, Luo and Runyankore are being recorded with native speakers.</p>
      </main>
    </>
  );
}

function LessonRow({ id }: { id: string }) {
  const l = LESSONS.find((x) => x.id === id)!;
  const p = useStore((s) => s.lessons.find((x) => x.lessonId === id));
  return (
    <Link to={`/academy/${l.id}`} className="card row" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="avatar">{l.icon}</div>
      <div className="grow"><b>{l.title}</b><div className="small muted">{l.minutes} min · {l.sections.length} parts · quiz</div></div>
      {p?.completedAt ? <span className="badge">✓ {p.score}/{l.quiz.length}</span> : <span className="badge gold">Start</span>}
    </Link>
  );
}
