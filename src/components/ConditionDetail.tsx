import { Link } from 'react-router-dom';
import { ShoppingCart, ShieldAlert } from 'lucide-react';
import { URGENCY_LABEL, type Condition } from '../data/conditions';
import { productsFor, cheapest, dealerById } from '../data/duka';
import { ugx } from '../lib/util';
import { SpeakBtn } from './ui';

const TYPE_LABEL = { cultural: '🧑‍🌾 Do this', organic: '🌿 Organic', chemical: '🧪 Chemical', vet: '🩺 Vet' } as const;

export function UrgencyBadge({ c }: { c: Condition }) {
  const cls = c.urgency === 'act24' ? 'red' : c.urgency === 'watch3' ? 'gold' : '';
  return <span className={'badge ' + cls}>⏱ {URGENCY_LABEL[c.urgency]}</span>;
}

export default function ConditionDetail({ c, hideUrgency }: { c: Condition; hideUrgency?: boolean }) {
  const spoken = `${c.name}. ${c.explain} What to do: ${c.treatments.map((t) => t.text + (t.dose ? ` Dose: ${t.dose}.` : '')).join(' ')}`;
  return (
    <div className="stack">
      <div className="card">
        <div className="row wrap" style={{ gap: 6 }}>
          {!hideUrgency && <UrgencyBadge c={c} />}
          <span className="badge grey">{c.kind}</span>
          {c.notifiable && <span className="badge red">Report to district vet</span>}
        </div>
        <p style={{ margin: '10px 0 6px' }}>{c.explain}</p>
        <p className="small muted" style={{ margin: 0 }}>Cause: {c.cause}. {c.spreads}</p>
        <div className="mt"><SpeakBtn text={spoken} /></div>
      </div>

      {c.notifiable && (
        <div className="alert urgent">
          <span className="a-ico"><ShieldAlert color="#D32F2F" /></span>
          <div><b>This is a controlled disease</b><span className="small">Contact your district veterinary officer today. Do not move, sell or slaughter animals until advised.</span></div>
        </div>
      )}

      <div className="card">
        <h2>What to do</h2>
        <ol style={{ paddingLeft: 0, listStyle: 'none', margin: '8px 0 0' }}>
          {c.treatments.map((t, i) => {
            const prods = productsFor(t.product);
            return (
              <li key={i} style={{ padding: '10px 0', borderBottom: i < c.treatments.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <div className="tiny" style={{ fontWeight: 700, color: 'var(--muted)' }}>{TYPE_LABEL[t.type]}</div>
                <div>{t.text}</div>
                {t.dose && <div className="small mt" style={{ background: 'var(--gold-soft)', padding: '6px 10px', borderRadius: 10 }}><b>Dose:</b> {t.dose}</div>}
                {t.phi && <div className="small muted" style={{ marginTop: 4 }}>⏳ Wait before harvest/sale: {t.phi}</div>}
                {prods.length > 0 && (
                  <div className="mt">
                    {prods.slice(0, 2).map((p) => {
                      const ch = cheapest(p); const d = dealerById(ch.dealerId);
                      return (
                        <Link key={p.id} to={`/duka?product=${p.id}`} className="row small" style={{ textDecoration: 'none', color: 'inherit', padding: '6px 0' }}>
                          <ShoppingCart size={18} className="tint" />
                          <span className="grow">{p.name} · from {ugx(ch.price)} at {d?.name} ({d?.distanceKm} km)</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <p className="tiny muted" style={{ marginBottom: 0 }}>Always read the product label, wear gloves and a mask, and keep chemicals away from children and water.</p>
      </div>

      <div className="card">
        <h2>Stop it coming back</h2>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          {c.prevention.map((p) => <li key={p} style={{ marginBottom: 4 }}>{p}</li>)}
        </ul>
      </div>
      <p className="tiny muted center">Kungula gives guidance, not a guarantee. For serious cases, involve an agronomist or vet.</p>
    </div>
  );
}
