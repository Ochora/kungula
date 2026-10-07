import { useParams, Link } from 'react-router-dom';
import { conditionById } from '../data/conditions';
import { subjectIcon, subjectName } from '../data/catalog';
import { TopBar, Empty } from '../components/ui';
import ConditionDetail from '../components/ConditionDetail';

export default function ConditionPage() {
  const { id } = useParams();
  const c = id ? conditionById(id) : undefined;
  if (!c) return (<><TopBar title="Condition" /><main className="page"><Empty emoji="📖" title="Not found" /></main></>);
  return (
    <>
      <TopBar title={c.name} />
      <main className="page">
        <div className="row mb"><span style={{ fontSize: '2rem' }}>{subjectIcon(c.subject)}</span><div><div className="small muted">{subjectName(c.subject)}</div><h2>{c.name}</h2></div></div>
        <ConditionDetail c={c} />
        <Link to={`/scan?subject=${c.subject}`} className="btn block mt2">Scan my {subjectName(c.subject).toLowerCase()}</Link>
      </main>
    </>
  );
}
