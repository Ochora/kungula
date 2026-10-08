import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ShoppingCart, Star, ShieldCheck, Minus, Plus, Trash2 } from 'lucide-react';
import { useStore, uid, today } from '../lib/store';
import { PRODUCTS, DEALERS, productById, dealerById, cheapest, type Product } from '../data/duka';
import { ugx, fmtDate } from '../lib/util';
import { TopBar, Sheet, DemoNote, Empty } from '../components/ui';
import type { Order } from '../lib/types';

const CATS: [Product['category'] | 'all', string][] = [
  ['all', 'All'], ['seed', '🌱 Seed'], ['fungicide', '🧪 Fungicides'], ['insecticide', '🐛 Insecticides'],
  ['fertiliser', '🧺 Fertiliser'], ['vet', '💉 Vet'], ['feed', '🌾 Feed'], ['tool', '🧰 Tools'],
];
const STATUS_LABEL: Record<Order['status'], string> = { placed: 'Placed', confirmed: 'Confirmed by dealer', 'on-the-way': 'On the way', delivered: 'Delivered' };

// Simulated order progress for the demo: advances with time since ordering.
function liveStatus(o: Order): Order['status'] {
  if (o.status === 'delivered') return 'delivered';
  const mins = (Date.now() - o.createdAt) / 60000;
  if (mins > 120) return 'delivered';
  if (mins > 20) return 'on-the-way';
  if (mins > 2) return 'confirmed';
  return 'placed';
}

export default function Duka() {
  const [params, setParams] = useSearchParams();
  const cart = useStore((s) => s.cart);
  const orders = useStore((s) => s.orders);
  const set = useStore((s) => s.set);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Product['category'] | 'all'>('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const productId = params.get('product');
  const product = productId ? productById(productId) : undefined;

  const list = useMemo(() => PRODUCTS.filter((p) => (cat === 'all' || p.category === cat) && (!q || (p.name + ' ' + (p.active ?? '')).toLowerCase().includes(q.toLowerCase()))), [q, cat]);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  const addToCart = (productId: string, dealerId: string) => {
    const cur = useStore.getState().cart;
    const i = cur.findIndex((c) => c.productId === productId && c.dealerId === dealerId);
    set({ cart: i >= 0 ? cur.map((c, j) => (j === i ? { ...c, qty: c.qty + 1 } : c)) : [...cur, { productId, dealerId, qty: 1 }] });
  };

  return (
    <>
      <TopBar title="Kungula Duka" right={
        <>
          <button className="icon-btn" style={{ width: 'auto', padding: '0 8px', color: '#fff', fontWeight: 700, fontSize: '.85rem' }} onClick={() => setOrdersOpen(true)}>Orders</button>
          <button className="icon-btn" aria-label="Cart" style={{ position: 'relative' }} onClick={() => setCartOpen(true)}>
            <ShoppingCart size={22} />
            {count > 0 && <span style={{ position: 'absolute', top: 4, right: 2, background: 'var(--gold)', color: 'var(--soil)', borderRadius: 10, fontSize: '.7rem', fontWeight: 800, padding: '0 5px' }}>{count}</span>}
          </button>
        </>
      } />
      <main className="page">
        <div className="row" style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, color: 'var(--muted)' }} />
          <input className="input" style={{ paddingLeft: 38 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search seeds, chemicals, feed…" />
        </div>
        <div className="chips mt" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
          {CATS.map(([k, l]) => <button key={k} className={'chip' + (cat === k ? ' on' : '')} onClick={() => setCat(k)}>{l}</button>)}
        </div>
        <div className="alert mt"><span className="a-ico"><ShieldCheck className="tint" /></span><div><b>Verified dealers only</b><span className="small">Every dealer is checked for a trading licence, URA TIN and MAAIF registration. Only registered products are listed.</span></div></div>
        <div className="stack mt">
          {list.map((p) => {
            const ch = cheapest(p); const d = dealerById(ch.dealerId);
            return (
              <button key={p.id} className="card row" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => setParams({ product: p.id })}>
                <div className="avatar">{p.icon}</div>
                <div className="grow">
                  <b>{p.name}</b>
                  <div className="small muted">{p.pack} · {Object.keys(p.prices).length} dealer{Object.keys(p.prices).length > 1 ? 's' : ''} · nearest {d?.distanceKm} km</div>
                </div>
                <div style={{ textAlign: 'right' }}><div className="tiny muted">from</div><b style={{ color: 'var(--green)' }}>{ugx(ch.price)}</b></div>
              </button>
            );
          })}
          {!list.length && <Empty emoji="🔍" title="Nothing found" />}
        </div>
        <DemoNote>Demonstration catalogue: dealer names, prices and registration numbers are placeholders. Orders and payments are simulated until real dealers and payment partners are connected.</DemoNote>
      </main>

      <Sheet open={!!product} onClose={() => setParams({}, { replace: true })} title={product?.name}>
        {product && <ProductDetail p={product} onAdd={(d) => { addToCart(product.id, d); setParams({}, { replace: true }); setCartOpen(true); }} />}
      </Sheet>
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} onOrdered={() => { setCartOpen(false); setOrdersOpen(true); }} />
      <Sheet open={ordersOpen} onClose={() => setOrdersOpen(false)} title="My orders">
        {!orders.length && <Empty emoji="📦" title="No orders yet" />}
        <ul className="list">
          {orders.map((o) => {
            const st = liveStatus(o);
            const steps: Order['status'][] = ['placed', 'confirmed', 'on-the-way', 'delivered'];
            return (
              <li key={o.id} style={{ display: 'block' }}>
                <div className="row between"><b>{fmtDate(o.createdAt)}</b><span className={'badge ' + (st === 'delivered' ? '' : 'gold')}>{STATUS_LABEL[st]}</span></div>
                <div className="small muted">{o.items.map((i) => `${i.qty} × ${productById(i.productId)?.name}`).join(', ')}</div>
                <div className="progress mt"><i style={{ width: `${((steps.indexOf(st) + 1) / 4) * 100}%` }} /></div>
                <div className="small mt">{ugx(o.total)} · {o.delivery === 'boda' ? 'Boda delivery' : 'Pick-up'} · {o.payment === 'mtn' ? 'MTN MoMo' : o.payment === 'airtel' ? 'Airtel Money' : 'Cash on delivery'}</div>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </>
  );
}

function ProductDetail({ p, onAdd }: { p: Product; onAdd: (dealerId: string) => void }) {
  const [code, setCode] = useState('');
  const [verify, setVerify] = useState<string>();
  const dealers = Object.entries(p.prices).sort((a, b) => a[1] - b[1]);
  return (
    <div>
      <div className="row mt"><span style={{ fontSize: '2.4rem' }}>{p.icon}</span><div><div className="small muted">{p.pack}</div><div className="small">Registration no. <b>{p.regNo}</b></div></div></div>
      <div className="section-title">Compare dealers</div>
      <div className="card">
        <ul className="list">
          {dealers.map(([dId, price], i) => {
            const d = DEALERS.find((x) => x.id === dId)!;
            return (
              <li key={dId}>
                <div className="grow">
                  <b>{d.name}</b> {i === 0 && <span className="badge gold">Best price</span>}
                  <div className="small muted"><Star size={12} fill="currentColor" style={{ color: 'var(--gold)' }} /> {d.rating} · {d.district} · {d.distanceKm} km</div>
                </div>
                <div style={{ textAlign: 'right' }}><b>{ugx(price)}</b><br /><button className="btn sm" onClick={() => onAdd(dId)}>Add</button></div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="section-title">Check it is genuine</div>
      <div className="card">
        <p className="small" style={{ marginTop: 0 }}>Scratch the label and enter the code, or check that the seal is unbroken and the registration number matches.</p>
        <div className="row">
          <input className="input grow" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Scratch code" />
          <button className="btn" onClick={() => setVerify(/^[A-Z0-9]{8,12}$/.test(code) ? 'ok' : 'bad')}>Check</button>
        </div>
        {verify === 'ok' && <p className="small" style={{ color: 'var(--green)' }}>✓ Code format valid. (Live manufacturer verification connects with MAAIF/manufacturer partners.)</p>}
        {verify === 'bad' && <p className="small" style={{ color: 'var(--alert)' }}>✗ That code does not look right. Do not use the product — report the shop to MAAIF.</p>}
      </div>
    </div>
  );
}

function CartSheet({ open, onClose, onOrdered }: { open: boolean; onClose: () => void; onOrdered: () => void }) {
  const cart = useStore((s) => s.cart);
  const set = useStore((s) => s.set);
  const upsert = useStore((s) => s.upsert);
  const profile = useStore((s) => s.profile)!;
  const [delivery, setDelivery] = useState<Order['delivery']>('boda');
  const [payment, setPayment] = useState<Order['payment']>('mtn');
  const [placed, setPlaced] = useState(false);
  const items = cart.map((c) => ({ ...c, product: productById(c.productId)!, price: productById(c.productId)!.prices[c.dealerId] }));
  const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = delivery === 'boda' ? 5000 : 0;
  const setQty = (i: number, qty: number) => set({ cart: qty <= 0 ? cart.filter((_, j) => j !== i) : cart.map((c, j) => (j === i ? { ...c, qty } : c)) });

  const place = () => {
    const total = sub + deliveryFee;
    upsert('orders', { id: uid(), items: items.map((i) => ({ productId: i.productId, dealerId: i.dealerId, qty: i.qty, price: i.price })), total, delivery, payment, status: 'placed', createdAt: Date.now() });
    upsert('activities', { id: uid(), date: today(), kind: 'inputs', description: `Bought ${items.map((i) => `${i.qty} × ${i.product.name}`).join(', ')} (Duka)`, cost: total, createdAt: Date.now() });
    set({ cart: [] });
    setPlaced(true);
    setTimeout(() => { setPlaced(false); onOrdered(); }, 1800);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Your cart">
      {placed ? (
        <div className="empty"><div className="emoji">✅</div><b>Order placed!</b><p className="small">{payment === 'cash' ? 'Pay the rider when it arrives.' : `You will receive a ${payment === 'mtn' ? 'MTN MoMo' : 'Airtel Money'} prompt on ${profile.phone || 'your phone'} — enter your PIN only on that prompt.`}</p></div>
      ) : !items.length ? <Empty emoji="🛒" title="Your cart is empty" /> : (
        <>
          <ul className="list">
            {items.map((i, idx) => (
              <li key={idx}>
                <div className="avatar">{i.product.icon}</div>
                <div className="grow"><b className="small">{i.product.name}</b><div className="tiny muted">{dealerById(i.dealerId)?.name} · {ugx(i.price)}</div></div>
                <div className="row" style={{ gap: 4 }}>
                  <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setQty(idx, i.qty - 1)}>{i.qty === 1 ? <Trash2 size={16} /> : <Minus size={16} />}</button>
                  <b>{i.qty}</b>
                  <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setQty(idx, i.qty + 1)}><Plus size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
          <div className="section-title">Delivery</div>
          <div className="grid2">
            <button className={'tile' + (delivery === 'boda' ? ' on' : '')} onClick={() => setDelivery('boda')}><span className="emoji">🛵</span>Boda delivery<span className="tiny muted">{ugx(5000)}</span></button>
            <button className={'tile' + (delivery === 'pickup' ? ' on' : '')} onClick={() => setDelivery('pickup')}><span className="emoji">🏪</span>Pick up<span className="tiny muted">Free</span></button>
          </div>
          <div className="section-title">Payment</div>
          <div className="grid3">
            <button className={'tile' + (payment === 'mtn' ? ' on' : '')} onClick={() => setPayment('mtn')}><span className="emoji">🟡</span>MTN MoMo</button>
            <button className={'tile' + (payment === 'airtel' ? ' on' : '')} onClick={() => setPayment('airtel')}><span className="emoji">🔴</span>Airtel Money</button>
            <button className={'tile' + (payment === 'cash' ? ' on' : '')} onClick={() => setPayment('cash')}><span className="emoji">💵</span>Cash</button>
          </div>
          <div className="card mt">
            <div className="row between small"><span>Items</span><span>{ugx(sub)}</span></div>
            <div className="row between small"><span>Delivery</span><span>{ugx(deliveryFee)}</span></div>
            <div className="row between mt"><b>Total</b><b>{ugx(sub + deliveryFee)}</b></div>
          </div>
          <button className="btn gold block mt" onClick={place}>Place order</button>
          <p className="tiny muted center">Kungula will never ask for your mobile money PIN. (Demo: no real payment is taken.)</p>
        </>
      )}
    </Sheet>
  );
}
