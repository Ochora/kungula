import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, Share2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { lessonById } from '../data/lessons';
import { TopBar, SpeakBtn, Empty, Logo } from '../components/ui';
import { shareText, stopSpeaking } from '../lib/native';
import { fmtDate } from '../lib/util';

export default function LessonPage() {
  const { id } = useParams();
  const l = id ? lessonById(id) : undefined;
  const profile = useStore((s) => s.profile)!;
  const progress = useStore((s) => s.lessons);
  const set = useStore((s) => s.set);
  const [page, setPage] = useState(0); // 0..sections-1, then quiz
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  if (!l) return (<><TopBar title="Lesson" /><main className="page"><Empty emoji="📚" title="Lesson not found" /></main></>);

  const prev = progress.find((p) => p.lessonId === l.id);
  const inQuiz = page >= l.sections.length;
  const score = l.quiz.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
  const passed = score >= Math.ceil(l.quiz.length * 0.66);

  const submit = () => {
    setSubmitted(true);
    if (passed) {
      const others = progress.filter((p) => p.lessonId !== l.id);
      set({ lessons: [...others, { lessonId: l.id, completedAt: prev?.completedAt ?? Date.now(), score: Math.max(score, prev?.score ?? 0) }] });
    }
  };

  return (
    <>
      <TopBar title={l.title} />
      <main className="page">
        <div className="progress mb"><i style={{ width: `${((Math.min(page, l.sections.length) + (submitted ? 1 : 0)) / (l.sections.length + 1)) * 100}%` }} /></div>
        {!inQuiz && (
          <div className="card">
            <div className="small muted">Part {page + 1} of {l.sections.length}</div>
            <h2 style={{ fontSize: '1.25rem', margin: '4px 0 10px' }}>{l.sections[page].heading}</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>{l.sections[page].body}</p>
            <SpeakBtn text={`${l.sections[page].heading}. ${l.sections[page].body}`} />
          </div>
        )}
        {!inQuiz && (
          <div className="row mt">
            <button className="btn ghost" disabled={page === 0} onClick={() => { stopSpeaking(); setPage(page - 1); }}>Back</button>
            <button className="btn grow" onClick={() => { stopSpeaking(); setPage(page + 1); }}>{page === l.sections.length - 1 ? 'Take the quiz' : 'Next'}</button>
          </div>
        )}

        {inQuiz && !submitted && (
          <>
            <h2 style={{ fontSize: '1.2rem' }}>Quick quiz</h2>
            <div className="stack mt">
              {l.quiz.map((q, i) => (
                <div key={i} className="card">
                  <b>{i + 1}. {q.q}</b>
                  <div className="stack mt">
                    {q.options.map((o, j) => (
                      <button key={j} className={'chip big' + (answers[i] === j ? ' on' : '')} style={{ width: '100%', justifyContent: 'flex-start' }}
                        onClick={() => { const a = [...answers]; a[i] = j; setAnswers(a); }}>{o}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn block gold mt" disabled={answers.filter((a) => a !== undefined).length < l.quiz.length} onClick={submit}>Check my answers</button>
          </>
        )}

        {submitted && (
          <>
            <div className="card center">
              <div style={{ fontSize: '3rem' }}>{passed ? '🎉' : '💪'}</div>
              <h2 style={{ justifyContent: 'center' }}>{score} of {l.quiz.length} correct</h2>
              <p className="small muted">{passed ? 'Well done! Your certificate is saved and your loan score went up.' : 'Almost there. Read the lesson again and retry.'}</p>
            </div>
            <div className="stack mt">
              {l.quiz.map((q, i) => (
                <div key={i} className="alert" style={{ background: answers[i] === q.answer ? 'var(--green-soft)' : 'var(--alert-soft)' }}>
                  <span className="a-ico">{answers[i] === q.answer ? '✅' : '❌'}</span>
                  <div><b>{q.q}</b><span className="small">Answer: {q.options[q.answer]}. {q.why}</span></div>
                </div>
              ))}
            </div>
            {passed ? (
              <div className="card mt2 center" style={{ border: '3px double var(--gold)', background: 'var(--cream)', color: '#16261C' }}>
                <div className="row" style={{ justifyContent: 'center' }}><Logo size={44} /><Award size={36} color="#F2A900" /></div>
                <div className="tiny" style={{ letterSpacing: '.15em', textTransform: 'uppercase', marginTop: 8 }}>Certificate of completion</div>
                <div className="display" style={{ fontSize: '1.4rem', margin: '6px 0' }}>{profile.name}</div>
                <div className="small">completed <b>{l.title}</b><br />Kungula Academy · {fmtDate(prev?.completedAt ?? Date.now())}</div>
                <button className="btn sm mt" onClick={() => shareText('Kungula certificate', `${profile.name} completed "${l.title}" on Kungula Academy (${fmtDate(Date.now())}), score ${score}/${l.quiz.length}.`)}><Share2 size={16} /> Share</button>
              </div>
            ) : (
              <button className="btn block mt" onClick={() => { setPage(0); setAnswers([]); setSubmitted(false); }}>Read again</button>
            )}
            <Link to="/academy" className="btn ghost block mt">Back to lessons</Link>
          </>
        )}
      </main>
    </>
  );
}
