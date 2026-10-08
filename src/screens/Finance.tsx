import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Unlock, Plus, PiggyBank } from 'lucide-react';
import { useStore, uid } from '../lib/store';
import { useScore } from '../lib/hooks';
import { topTips } from '../lib/score';
import { FINANCE_PRODUCTS, type FinanceProduct } from '../data/duka';
import { ugx, num, fmtDate } from '../lib/util';
import { TopBar, ScoreRing, Sheet, Toggle, DemoNote, SpeakBtn } from '../components/ui';

export default function Finance() {
  const { score, parts, band } = useScore();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const loans = useStore((s) => s.loans);
  const savings = useStore((s) => s.savings);
  const upsert = useStore((s) => s.upsert);
  const [apply, setApply] = useState<FinanceProduct>();
  const [goalOpen, setGoalOpen] = useState(false);
  const tips = topTips(parts, 3);
  const spoken = `Your loan readiness score is ${score} out of 100. ${tips.map((t) => t.tip).join(' ')}`;

  return (
    <>
      <TopBar title="Kungula Finance" />
      <main className="page">
        <div className="card row" style={{ gap: 16 }}>
          <ScoreRing score={score} />
          <div className="grow">
            <div className="small muted" style={{ fontWeight: 600 }}>Loan Readiness Score</div>
            <div className="display" style={{ fontSize: '1.4rem' }}>{band}</div>
            <p className="small muted" style={{ margin: '4px 0 8px' }}>Built only from your own Kungula records.</p>
            <SpeakBtn text={spoken} />
          </div>
        </div>

        <div className="card mt">
          <h2>Why your score is {score}</h2>
          {parts.map((p) => (
            <div key={p.key} className="mt">
              <div className="row between small"><span>{p.label}</span><b>{p.points}/{p.max}</b></div>
              <div className="progress"><i style={{ width: `${(p.points / p.max) * 100}%` }} /></div>
            </div>
          ))}
        </div>

        {tips.length > 0 && (
          <div className="card mt" style={{ background: 'var(--gold-soft)' }}>
            <h2>📈 Raise your score</h2>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              {tips.map((t) => <li key={t.key} className="small" style={{ marginBottom: 4 }}>{t.tip} <span className="muted">(up to +{t.max - t.points})</span></li>)}
            </ul>
            <div className="row mt" style={{ gap: 6 }}>
              <Link to="/farm?tab=records" className="btn sm">Record activity</Link>
              <Link to="/academy" className="btn sm soft">Take a lesson</Link>
            </div>
          </div>
        )}

        <div className="card mt">
          <div className="row">{settings.consentLenders ? <Unlock className="tint" /> : <Lock style={{ color: 'var(--muted)' }} />}<h2 className="grow">Share with lenders</h2></div>
          <Toggle on={settings.consentLenders} onChange={(v) => setSettings({ consentLenders: v })}
            label={settings.consentLenders ? 'Lenders you apply to can see your score and records' : 'Your score is private'}
            hint="You can switch this off any time. Kungula records every consent." />
        </div>

        <div className="section-title">Loans from licensed partners</div>
        <div className="stack">
          {FINANCE_PRODUCTS.filter((f) => f.kind === 'loan').map((f) => {
            const ok = score >= f.minScore;
            return (
              <div key={f.id} className="card">
                <div className="row between"><b>{f.name}</b>{ok ? <span className="badge">You qualify</span> : <span className="badge grey">Needs {f.minScore}+</span>}</div>
                <div className="small muted">{f.partnerType} · up to {ugx(f.maxAmount)} · {f.termMonths} month{f.termMonths > 1 ? 's' : ''}</div>
                <p className="small" style={{ margin: '6px 0' }}>{f.how}</p>
                <button className="btn sm" disabled={!ok} onClick={() => setApply(f)}>Apply</button>
              </div>
            );
          })}
        </div>

        <div className="section-title">Insurance</div>
        <div className="stack">
          {FINANCE_PRODUCTS.filter((f) => f.kind === 'insurance').map((f) => (
            <div key={f.id} className="card">
              <b>{f.name}</b>
              <div className="small muted">{f.partnerType}</div>
              <p className="small" style={{ margin: '6px 0' }}>{f.how}</p>
              <button className="btn sm soft" onClick={() => setApply(f)}>Request a quote</button>
            </div>
          ))}
        </div>

        {loans.length > 0 && (
          <>
            <div className="section-title">My applications</div>
            <div className="card">
              <ul className="list">
                {loans.map((l) => {
                  const p = FINANCE_PRODUCTS.find((x) => x.id === l.productId);
                  return (
                    <li key={l.id}>
                      <div className="grow"><b>{p?.name}</b><div className="small muted">{l.amount ? ugx(l.amount) + ' · ' : ''}{fmtDate(l.createdAt)} · score {l.scoreAtApply}</div></div>
                      <span className="badge gold">{l.status === 'submitted' ? 'Submitted' : l.status}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

        <div className="section-title">Savings for next season</div>
        <div className="stack">
          {savings.map((g) => (
            <div key={g.id} className="card">
              <div className="row between"><b><PiggyBank size={18} style={{ verticalAlign: -3 }} /> {g.name}</b><span className="small">{ugx(g.saved)} / {num(g.target)}</span></div>
              <div className="progress mt"><i style={{ width: `${Math.min(100, (g.saved / g.target) * 100)}%`, background: 'var(--gold)' }} /></div>
              <div className="row mt" style={{ gap: 6 }}>
                {[5000, 10000, 50000].map((a) => <button key={a} className="chip" onClick={() => upsert('savings', { ...g, saved: g.saved + a })}>+{num(a)}</button>)}
              </div>
            </div>
          ))}
          <button className="btn soft block" onClick={() => setGoalOpen(true)}><Plus size={18} /> New savings goal</button>
        </div>
        <DemoNote>Kungula never lends or holds money. Loans, insurance and savings are provided by licensed SACCOs, MFIs, banks, insurers and mobile money partners. Partner integrations go live in V1; applications here are recorded on your phone.</DemoNote>
      </main>

      <ApplySheet product={apply} score={score} onClose={() => setApply(undefined)} />
      <GoalSheet open={goalOpen} onClose={() => setGoalOpen(false)} />
    </>
  );
}

function ApplySheet({ product, score, onClose }: { product?: FinanceProduct; score: number; onClose: () => void }) {
  const upsert = useStore((s) => s.upsert);
  const consent = useStore((s) => s.settings.consentLenders);
  const setSettings = useStore((s) => s.setSettings);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [done, setDone] = useState(false);
  const a = parseFloat(amount.replace(/,/g, '')) || 0;
  const interest = product ? a * (product.monthlyRatePct / 100) * product.termMonths : 0;
  const isLoan = product?.kind === 'loan';
  const close = () => { setDone(false); setAmount(''); setPurpose(''); onClose(); };
  return (
    <Sheet open={!!product} onClose={close} title={product?.name}>
      {done ? (
        <div className="empty"><div className="emoji">📨</div><b>Application recorded</b><p className="small">A licensed partner will contact you on your phone number. Never pay anyone to "speed up" a loan.</p><button className="btn" onClick={close}>Close</button></div>
      ) : product && (
        <>
          {isLoan && (
            <>
              <label className="field"><span>Amount (UGX, up to {num(product.maxAmount)})</span><input className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
              <label className="field"><span>What is it for?</span>
                <select className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                  <option value="">Choose</option>
                  {['Seed and fertiliser', 'Pesticides / vet drugs', 'Animal feed', 'Hired labour', 'Storage bags / equipment', 'Buying animals'].map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              {a > 0 && (
                <div className="card mt" style={{ background: 'var(--gold-soft)' }}>
                  <b>Full cost in shillings</b>
                  <div className="row between small mt"><span>You receive</span><span>{ugx(a)}</span></div>
                  <div className="row between small"><span>Interest ({product.monthlyRatePct}% × {product.termMonths} months)</span><span>{ugx(interest)}</span></div>
                  <div className="row between mt"><b>You pay back</b><b>{ugx(a + interest)}</b></div>
                  <div className="tiny muted">Illustrative. The partner confirms final terms and any fees before you accept.</div>
                </div>
              )}
            </>
          )}
          <label className="row mt small" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={consent} onChange={(e) => setSettings({ consentLenders: e.target.checked })} style={{ width: 22, height: 22, accentColor: 'var(--green)' }} />
            I agree to share my Kungula score ({score}) and farm records with this partner.
          </label>
          <button className="btn block mt2" disabled={!consent || (isLoan && (!a || a > product.maxAmount || !purpose))}
            onClick={() => { upsert('loans', { id: uid(), productId: product.id, amount: a, purpose, scoreAtApply: score, status: 'submitted', createdAt: Date.now() }); setDone(true); }}>
            {isLoan ? 'Submit application' : 'Request quote'}
          </button>
        </>
      )}
    </Sheet>
  );
}

function GoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const upsert = useStore((s) => s.upsert);
  const [name, setName] = useState('Inputs for next season');
  const [target, setTarget] = useState('');
  return (
    <Sheet open={open} onClose={onClose} title="New savings goal">
      <label className="field"><span>Saving for</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="field"><span>Target (UGX)</span><input className="input" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 300,000" /></label>
      <p className="tiny muted">Track savings you keep on mobile money or with your SACCO. Locked savings with partners come in V1.</p>
      <button className="btn block mt" disabled={!target} onClick={() => { upsert('savings', { id: uid(), name, target: parseFloat(target.replace(/,/g, '')), saved: 0 }); onClose(); setTarget(''); }}>Save goal</button>
    </Sheet>
  );
}
