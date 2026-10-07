import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { m2ToAcres } from '../lib/util';
import { TopBar, Empty } from '../components/ui';
import BoundaryWalker from '../components/BoundaryWalker';

export default function MapPlot() {
  const { id } = useParams();
  const nav = useNavigate();
  const plot = useStore((s) => s.plots.find((p) => p.id === id));
  const upsert = useStore((s) => s.upsert);
  if (!plot) return (<><TopBar title="Map plot" /><main className="page"><Empty emoji="🗺️" title="Choose a plot first">Add a plot in My farm, then tap Map plot.</Empty></main></>);
  return (
    <>
      <TopBar title={`Map: ${plot.name}`} />
      <main className="page">
        <BoundaryWalker initial={plot.boundary} onSave={(pts, area) => {
          const boundary = pts.length >= 3 ? pts : [pts[0]];
          upsert('plots', { ...plot, boundary, areaAcres: pts.length >= 3 ? Math.round(m2ToAcres(area) * 100) / 100 : plot.areaAcres });
          nav(`/farm/plot/${plot.id}`, { replace: true });
        }} />
      </main>
    </>
  );
}
