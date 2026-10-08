import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapPin, Pencil, Trash2, ScanLine, Mic, Share2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { subjectIcon, subjectName } from '../data/catalog';
import { num, fmtDate, fmtDay, ugx, toGeoJSON } from '../lib/util';
import { saveAndShareFile } from '../lib/native';
import { TopBar, Empty, PlotShape } from '../components/ui';
import { PlotForm, QuickRecord, kindLabel } from './Farm';

export default function PlotPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const plot = useStore((s) => s.plots.find((p) => p.id === id));
  const allActivities = useStore((s) => s.activities);
  const allScans = useStore((s) => s.scans);
  const activities = allActivities.filter((a) => a.plotId === id);
  const scans = allScans.filter((x) => x.plotId === id);
  const remove = useStore((s) => s.remove);
  const [edit, setEdit] = useState(false);
  const [rec, setRec] = useState(false);
  if (!plot) return (<><TopBar title="Plot" /><main className="page"><Empty emoji="🗺️" title="Plot not found" /></main></>);

  const acres = plot.areaAcres ?? plot.manualAcres;
  const income = activities.reduce((s, a) => s + (a.income ?? 0), 0);
  const cost = activities.reduce((s, a) => s + (a.cost ?? 0), 0);
  const harvested = activities.filter((a) => a.kind === 'harvest').reduce((s, a) => s + (a.quantity ?? 0), 0);
  const daysToHarvest = plot.expectedHarvest ? Math.ceil((new Date(plot.expectedHarvest).getTime() - Date.now()) / 86400000) : undefined;

  return (
    <>
      <TopBar title={plot.name} right={
        <>
          <button className="icon-btn" aria-label="Edit" onClick={() => setEdit(true)}><Pencil size={20} /></button>
          <button className="icon-btn" aria-label="Delete" onClick={() => { if (confirm('Delete this plot? Its records stay in your book.')) { remove('plots', plot.id); nav('/farm', { replace: true }); } }}><Trash2 size={20} /></button>
        </>
      } />
      <main className="page">
        <div className="card row" style={{ alignItems: 'flex-start' }}>
          <PlotShape points={plot.boundary} size={128} />
          <div className="grow">
            <div style={{ fontSize: '1.6rem' }}>{subjectIcon(plot.crop)}</div>
            <b>{subjectName(plot.crop)}{plot.variety ? ` · ${plot.variety}` : ''}</b>
            <div className="small muted">{acres ? `${num(acres, 2)} acres${plot.areaAcres ? ' (GPS)' : ''}` : 'Size not set'}</div>
            {plot.plantedOn && <div className="small muted">Planted {fmtDate(plot.plantedOn)}</div>}
            {daysToHarvest !== undefined && <div className="small" style={{ fontWeight: 600, color: daysToHarvest < 14 ? 'var(--murram)' : 'var(--green)' }}>{daysToHarvest > 0 ? `Harvest in ~${daysToHarvest} days` : 'Harvest due'}</div>}
          </div>
        </div>

        <div className="grid3 mt">
          <Link to={`/farm/map/${plot.id}`} className="tile"><MapPin size={26} className="tint" />{plot.boundary.length >= 3 ? 'Re-map' : 'Map plot'}</Link>
          <Link to={`/scan?subject=${plot.crop}`} className="tile"><ScanLine size={26} className="tint" />Scan</Link>
          <button className="tile" onClick={() => setRec(true)}><Mic size={26} className="tint" />Record</button>
        </div>

        <div className="card mt">
          <div className="grid3">
            <div className="stat"><span className="l">Money in</span><span className="v" style={{ color: 'var(--green)', fontSize: '1.1rem' }}>{num(income)}</span></div>
            <div className="stat"><span className="l">Money out</span><span className="v" style={{ color: 'var(--murram)', fontSize: '1.1rem' }}>{num(cost)}</span></div>
            <div className="stat"><span className="l">Profit</span><span className="v" style={{ fontSize: '1.1rem' }}>{num(income - cost)}</span></div>
          </div>
          {acres ? <div className="small muted mt">Profit per acre: {ugx((income - cost) / acres)}{harvested ? ` · Yield ${num(harvested / acres, 1)} per acre` : ''}</div> : null}
        </div>

        {acres ? (
          <div className="card mt">
            <h2>🧮 Spray planner</h2>
            <p className="small" style={{ marginBottom: 0 }}>For {num(acres, 2)} acres of a full-grown crop, plan about <b>{Math.max(1, Math.round(acres * 10))} knapsack tanks of 20 litres</b> (≈200 litres per acre). Mix the label dose in each tank. Young crops need fewer tanks.</p>
          </div>
        ) : null}

        <div className="section-title">Activity</div>
        {activities.length === 0 && <p className="small muted">No records for this plot yet.</p>}
        <div className="card" style={{ display: activities.length ? 'block' : 'none' }}>
          <ul className="list">
            {activities.sort((a, b) => b.date.localeCompare(a.date)).map((a) => (
              <li key={a.id}>
                <div className="avatar">{kindLabel(a.kind).icon}</div>
                <div className="grow"><div style={{ fontWeight: 600 }}>{a.description}</div><div className="small muted">{fmtDay(a.date)}</div></div>
                {a.income ? <b style={{ color: 'var(--green)' }}>+{num(a.income)}</b> : a.cost ? <b style={{ color: 'var(--murram)' }}>−{num(a.cost)}</b> : null}
              </li>
            ))}
          </ul>
        </div>
        {scans.length > 0 && <p className="small muted mt">{scans.length} scan{scans.length > 1 ? 's' : ''} linked to this plot.</p>}

        {plot.boundary.length > 0 && (
          <button className="btn ghost block mt2" onClick={() => saveAndShareFile(`${plot.name.replace(/\W+/g, '-')}.geojson`, toGeoJSON([{ id: plot.id, name: plot.name, boundary: plot.boundary, props: { crop: plot.crop, acres: plot.areaAcres } }]), 'application/geo+json')}>
            <Share2 size={18} /> Share plot map (GeoJSON)
          </button>
        )}
      </main>
      <PlotForm open={edit} onClose={() => setEdit(false)} editId={plot.id} onSaved={(_, map) => { setEdit(false); if (map) nav(`/farm/map/${plot.id}`); }} />
      <QuickRecord open={rec} onClose={() => setRec(false)} plotId={plot.id} />
    </>
  );
}
