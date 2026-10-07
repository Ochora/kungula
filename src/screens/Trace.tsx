import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Plus, Download, QrCode, MapPin, Trash2 } from 'lucide-react';
import { useStore, uid } from '../lib/store';
import { fmtDate, num, m2ToHa, toGeoJSON, toCSV, polygonAreaM2 } from '../lib/util';
import { saveAndShareFile, shareText } from '../lib/native';
import { TopBar, Sheet, Empty, PlotShape, DemoNote } from '../components/ui';
import BoundaryWalker from '../components/BoundaryWalker';
import type { TracePlot, LatLng } from '../lib/types';

type Tab = 'plots' | 'lots' | 'about';

function statusFor(p: Pick<TracePlot, 'forestBefore2021' | 'consent' | 'boundary' | 'areaHa'>): TracePlot['status'] {
  if (p.forestBefore2021 === 'yes') return 'red';
  if (!p.consent || !p.boundary.length || p.forestBefore2021 === 'unsure') return 'amber';
  if (p.boundary.length < 3 && (p.areaHa ?? 0) >= 4) return 'amber'; // plots ≥4 ha need a polygon
  return 'green';
}
const STATUS = { green: { label: 'Ready', cls: '' }, amber: { label: 'Check', cls: 'gold' }, red: { label: 'At risk', cls: 'red' } };

export default function Trace() {
  const [tab, setTab] = useState<Tab>('plots');
  const plots = useStore((s) => s.tracePlots);
  const lots = useStore((s) => s.lots);
  const counts = { green: plots.filter((p) => p.status === 'green').length, amber: plots.filter((p) => p.status === 'amber').length, red: plots.filter((p) => p.status === 'red').length };

  return (
    <>
      <TopBar title="Kungula Trace" />
      <main className="page">
        <div className="card">
          <div className="small muted" style={{ fontWeight: 600 }}>EU Deforestation Regulation readiness</div>
          <div className="grid3 mt">
            <div className="stat"><span className="v" style={{ color: 'var(--green)' }}>{counts.green}</span><span className="l">🟢 Ready</span></div>
            <div className="stat"><span className="v" style={{ color: '#a07000' }}>{counts.amber}</span><span className="l">🟡 Check</span></div>
            <div className="stat"><span className="v" style={{ color: 'var(--alert)' }}>{counts.red}</span><span className="l">🔴 At risk</span></div>
          </div>
          <div className="small muted mt">{plots.length} plots · {num(plots.reduce((s, p) => s + (p.areaHa ?? 0), 0), 2)} ha mapped · {lots.length} lots</div>
        </div>
        <div className="tabs mt">
          {([['plots', 'Farm plots'], ['lots', 'Lots & QR'], ['about', 'About EUDR']] as [Tab, string][]).map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
        </div>
        <div className="mt">
          {tab === 'plots' && <TracePlots />}
          {tab === 'lots' && <Lots />}
          {tab === 'about' && <About />}
        </div>
      </main>
    </>
  );
}

function TracePlots() {
  const plots = useStore((s) => s.tracePlots);
  const profile = useStore((s) => s.profile)!;
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const [form, setForm] = useState(false);
  const [mapFor, setMapFor] = useState<TracePlot>();
  const [filter, setFilter] = useState('');

  const exportAll = (kind: 'geojson' | 'csv') => {
    if (kind === 'geojson') {
      saveAndShareFile(`kungula-trace-${Date.now()}.geojson`, toGeoJSON(plots.map((p) => ({ id: p.id, name: p.plotName, boundary: p.boundary, props: { farmer: p.farmerName, cooperative: p.coopName ?? '', crop: p.crop, area_ha: p.areaHa, status: p.status, forest_after_2020: p.forestBefore2021, consent: p.consent, mapped: new Date(p.createdAt).toISOString() } }))), 'application/geo+json');
    } else {
      saveAndShareFile(`kungula-trace-${Date.now()}.csv`, toCSV(plots.map((p) => ({ plot_id: p.id, farmer: p.farmerName, phone: p.farmerPhone ?? '', cooperative: p.coopName ?? '', plot: p.plotName, crop: p.crop, area_ha: p.areaHa?.toFixed(3) ?? '', points: p.boundary.length, lat: p.boundary[0]?.lat.toFixed(6) ?? '', lng: p.boundary[0]?.lng.toFixed(6) ?? '', tenure: p.landTenure, forest_after_2020: p.forestBefore2021, consent: p.consent ? 'yes' : 'no', status: p.status, mapped_on: fmtDate(p.createdAt) }))), 'text/csv');
    }
  };

  const shown = plots.filter((p) => !filter || p.status === filter);

  return (
    <>
      {plots.length > 0 && (
        <div className="row mb">
          <select className="input grow" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All plots</option><option value="green">🟢 Ready</option><option value="amber">🟡 Need checking</option><option value="red">🔴 At risk</option>
          </select>
          <button className="btn sm soft" onClick={() => exportAll('geojson')}><Download size={16} /> GeoJSON</button>
          <button className="btn sm soft" onClick={() => exportAll('csv')}>CSV</button>
        </div>
      )}
      {!plots.length && <Empty emoji="🗺️" title="No coffee plots mapped yet">Register a farmer's plot and walk its boundary. {profile.isChampion ? 'You earn a fee for each verified mapped farm.' : ''}</Empty>}
      <div className="stack">
        {shown.map((p) => (
          <div key={p.id} className="card">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <PlotShape points={p.boundary} size={76} />
              <div className="grow">
                <div className="row between"><b>{p.farmerName}</b><span className={'badge ' + STATUS[p.status].cls}>{STATUS[p.status].label}</span></div>
                <div className="small muted">{p.plotName} · {p.crop} · {p.areaHa ? `${num(p.areaHa, 2)} ha` : p.boundary.length ? 'point' : 'not mapped'}</div>
                <div className="small muted">{p.coopName || 'No co-op'} · {fmtDate(p.createdAt)}</div>
                {p.status !== 'green' && <div className="tiny" style={{ color: p.status === 'red' ? 'var(--alert)' : '#7a5600' }}>
                  {p.forestBefore2021 === 'yes' ? 'Forest cleared after 2020 — cannot supply EU buyers.' : !p.boundary.length ? 'Needs mapping.' : !p.consent ? 'Farmer consent missing.' : p.forestBefore2021 === 'unsure' ? 'Forest history unclear — needs satellite review.' : 'Plot ≥4 ha must be mapped as a boundary.'}
                </div>}
              </div>
            </div>
            <div className="row mt" style={{ gap: 6 }}>
              <button className="btn sm grow" onClick={() => setMapFor(p)}><MapPin size={16} /> {p.boundary.length ? 'Re-map' : 'Map now'}</button>
              <button className="btn sm ghost" onClick={() => confirm('Delete this plot record?') && remove('tracePlots', p.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn block mt" onClick={() => setForm(true)}><Plus size={20} /> Register farmer plot</button>
      <DemoNote>Status here is based on the mapped boundary and the farmer's declaration. The satellite forest-cover check (Sentinel-2 / global forest maps vs. 31 Dec 2020) runs on the Kungula server once plots sync.</DemoNote>

      <TraceForm open={form} onClose={() => setForm(false)} onSaved={(p) => { setForm(false); setMapFor(p); }} />
      <Sheet open={!!mapFor} onClose={() => setMapFor(undefined)} title={`Map: ${mapFor?.farmerName ?? ''}`}>
        {mapFor && <BoundaryWalker initial={mapFor.boundary} onSave={(pts: LatLng[], area: number) => {
          const boundary = pts.length >= 3 ? pts : [pts[0]];
          const areaHa = pts.length >= 3 ? m2ToHa(area) : mapFor.areaHa;
          const next = { ...mapFor, boundary, areaHa };
          upsert('tracePlots', { ...next, status: statusFor(next) });
          setMapFor(undefined);
        }} />}
      </Sheet>
    </>
  );
}

function TraceForm({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (p: TracePlot) => void }) {
  const profile = useStore((s) => s.profile)!;
  const upsert = useStore((s) => s.upsert);
  const [f, setF] = useState({ farmerName: '', farmerPhone: '', coopName: '', plotName: 'Coffee garden', crop: 'robusta' as TracePlot['crop'], trees: '', landTenure: 'customary' as TracePlot['landTenure'], forestBefore2021: 'no' as TracePlot['forestBefore2021'], consent: false, estHa: '' });
  const u = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const save = () => {
    const base = {
      id: uid(), farmerName: f.farmerName.trim(), farmerPhone: f.farmerPhone.trim() || undefined, coopName: f.coopName.trim() || undefined,
      plotName: f.plotName.trim() || 'Coffee garden', crop: f.crop, boundary: [] as LatLng[], areaHa: f.estHa ? parseFloat(f.estHa) : undefined,
      treesCount: f.trees ? parseInt(f.trees) : undefined, landTenure: f.landTenure, forestBefore2021: f.forestBefore2021, consent: f.consent, createdAt: Date.now(),
    };
    const p: TracePlot = { ...base, status: statusFor(base) };
    upsert('tracePlots', p);
    setF({ ...f, farmerName: '', farmerPhone: '', trees: '', consent: false, estHa: '' });
    onSaved(p);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Register a farmer's plot">
      <div className="grid2">
        <label className="field"><span>Farmer name</span><input className="input" value={f.farmerName} onChange={(e) => u({ farmerName: e.target.value })} placeholder={profile.isChampion ? '' : profile.name} /></label>
        <label className="field"><span>Farmer phone</span><input className="input" inputMode="tel" value={f.farmerPhone} onChange={(e) => u({ farmerPhone: e.target.value })} /></label>
        <label className="field"><span>Co-operative</span><input className="input" value={f.coopName} onChange={(e) => u({ coopName: e.target.value })} /></label>
        <label className="field"><span>Plot name</span><input className="input" value={f.plotName} onChange={(e) => u({ plotName: e.target.value })} /></label>
        <label className="field"><span>Crop</span>
          <select className="input" value={f.crop} onChange={(e) => u({ crop: e.target.value as TracePlot['crop'] })}><option value="robusta">Robusta coffee</option><option value="arabica">Arabica coffee</option><option value="cocoa">Cocoa</option><option value="other">Other</option></select>
        </label>
        <label className="field"><span>Number of trees</span><input className="input" inputMode="numeric" value={f.trees} onChange={(e) => u({ trees: e.target.value })} /></label>
        <label className="field"><span>Land tenure</span>
          <select className="input" value={f.landTenure} onChange={(e) => u({ landTenure: e.target.value as TracePlot['landTenure'] })}><option value="owned">Owned (title)</option><option value="customary">Customary</option><option value="family">Family land</option><option value="leased">Leased / kibanja</option></select>
        </label>
        <label className="field"><span>Estimated size (ha)</span><input className="input" inputMode="decimal" value={f.estHa} onChange={(e) => u({ estHa: e.target.value })} /></label>
      </div>
      <label className="field"><span>Was any part of this plot forest that was cleared after 31 December 2020?</span>
        <div className="chips">
          {([['no', 'No'], ['yes', 'Yes'], ['unsure', 'Not sure']] as const).map(([k, l]) => <button key={k} className={'chip' + (f.forestBefore2021 === k ? ' on' : '')} onClick={() => u({ forestBefore2021: k })}>{l}</button>)}
        </div>
      </label>
      <label className="row mt small" style={{ cursor: 'pointer' }}>
        <input type="checkbox" checked={f.consent} onChange={(e) => u({ consent: e.target.checked })} style={{ width: 22, height: 22, accentColor: '#1F6B3A' }} />
        The farmer agrees that this plot map and details can be shared with their co-operative and coffee exporter for EU due diligence.
      </label>
      <button className="btn block mt2" disabled={!f.farmerName.trim()} onClick={save}>Save and map the plot</button>
    </Sheet>
  );
}

function Lots() {
  const lots = useStore((s) => s.lots);
  const plots = useStore((s) => s.tracePlots);
  const upsert = useStore((s) => s.upsert);
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string>();
  const [show, setShow] = useState<string>();
  const [weight, setWeight] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const lot = lots.find((l) => l.id === show);

  useEffect(() => {
    if (!lot) return;
    const payload = JSON.stringify({ k: 'kungula-lot', c: lot.code, w: lot.weightKg, p: lot.plotIds, d: new Date(lot.createdAt).toISOString().slice(0, 10) });
    QRCode.toDataURL(payload, { margin: 1, width: 280, color: { dark: '#16261C', light: '#FFFFFF' } }).then(setQr).catch(() => setQr(undefined));
  }, [lot]);

  const create = () => {
    const n = lots.length + 1;
    const code = `KGL-${new Date().getFullYear()}-${String(n).padStart(4, '0')}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const l = { id: uid(), code, crop: 'coffee', weightKg: parseFloat(weight), plotIds: sel, createdAt: Date.now() };
    upsert('lots', l); setOpen(false); setWeight(''); setSel([]); setShow(l.id);
  };
  const ready = plots.filter((p) => p.status === 'green');

  return (
    <>
      {!lots.length && <Empty emoji="📦" title="No lots yet">Create a lot when coffee from mapped farms is bulked. Its QR code goes on the bags.</Empty>}
      <div className="stack">
        {lots.map((l) => (
          <button key={l.id} className="card row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setShow(l.id)}>
            <QrCode size={32} color="#1F6B3A" />
            <div className="grow"><b>{l.code}</b><div className="small muted">{num(l.weightKg)} kg · {l.plotIds.length} farms · {fmtDate(l.createdAt)}</div></div>
          </button>
        ))}
      </div>
      <button className="btn block mt" onClick={() => setOpen(true)} disabled={!ready.length}><Plus size={20} /> Create lot</button>
      {!ready.length && <p className="small muted center">Map at least one plot with status "Ready" first.</p>}

      <Sheet open={open} onClose={() => setOpen(false)} title="New coffee lot">
        <label className="field"><span>Weight (kg)</span><input className="input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
        <div className="section-title">Farms that contributed ({sel.length})</div>
        <div className="card">
          {ready.map((p) => (
            <label key={p.id} className="row" style={{ padding: '8px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={sel.includes(p.id)} onChange={(e) => setSel(e.target.checked ? [...sel, p.id] : sel.filter((x) => x !== p.id))} style={{ width: 22, height: 22, accentColor: '#1F6B3A' }} />
              <span className="grow">{p.farmerName} · {p.plotName}</span>
            </label>
          ))}
        </div>
        <button className="btn block mt" disabled={!weight || !sel.length} onClick={create}>Create lot & QR code</button>
      </Sheet>

      <Sheet open={!!lot} onClose={() => { setShow(undefined); setQr(undefined); }} title={lot?.code}>
        {lot && (
          <div className="center">
            {qr ? <img src={qr} alt="Lot QR code" style={{ margin: '10px auto', width: 240, height: 240, borderRadius: 12 }} /> : <div className="spinner" style={{ margin: 20 }} />}
            <div className="small">{num(lot.weightKg)} kg coffee · {lot.plotIds.length} mapped farms</div>
            <div className="tiny muted">Polygons: {lot.plotIds.map((id) => plots.find((p) => p.id === id)).filter(Boolean).map((p) => `${p!.farmerName} (${p!.areaHa ? num(p!.areaHa, 2) + ' ha' : 'point'})`).join(', ')}</div>
            <div className="row mt" style={{ justifyContent: 'center', gap: 6 }}>
              <button className="btn sm" onClick={() => saveAndShareFile(`${lot.code}.geojson`, toGeoJSON(plots.filter((p) => lot.plotIds.includes(p.id)).map((p) => ({ id: p.id, name: p.plotName, boundary: p.boundary, props: { lot: lot.code, farmer: p.farmerName, area_ha: p.areaHa ?? (p.boundary.length >= 3 ? m2ToHa(polygonAreaM2(p.boundary)) : null) } }))), 'application/geo+json')}><Download size={16} /> Lot GeoJSON</button>
              <button className="btn sm soft" onClick={() => shareText(lot.code, `Kungula lot ${lot.code}: ${num(lot.weightKg)} kg coffee from ${lot.plotIds.length} EUDR-mapped farms.`)}>Share</button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

function About() {
  return (
    <div className="stack">
      <div className="card">
        <h2>What the EU rule requires</h2>
        <p className="small">The EU Deforestation Regulation (EU) 2023/1115 requires companies placing coffee and cocoa on the EU market to show, with the GPS location of every plot, that it was not grown on land deforested after 31 December 2020, and that it was produced legally.</p>
        <p className="small" style={{ marginBottom: 0 }}>Plots under 4 hectares may be given as a single GPS point; larger plots need a boundary polygon. Kungula Trace records both and exports GeoJSON, the format used in due-diligence statements.</p>
      </div>
      <div className="card">
        <h2>Who does what</h2>
        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
          <li><b>Champions</b> register farmers and walk the plot boundaries.</li>
          <li><b>Co-operatives</b> bulk coffee into lots linked to mapped farms.</li>
          <li><b>Exporters</b> receive plot data and remain responsible for their due-diligence statements.</li>
          <li><b>Farmers</b> pay nothing and keep their place in premium supply chains.</li>
        </ul>
      </div>
      <div className="alert warn"><span className="a-ico">📅</span><div><b>Application dates</b><span className="small">After two delays, the rules were set to apply from 30 Dec 2026 for large and medium operators and 30 June 2027 for micro and small operators. Confirm the latest EU position before relying on these dates.</span></div></div>
    </div>
  );
}
