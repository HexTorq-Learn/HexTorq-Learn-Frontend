import { Users } from 'lucide-react';
import { MiniBar } from '../ui/MiniBar.jsx';

export function CohortRetentionChart({ rows = [] }) {
  const max = Math.max(1, ...rows.map((row) => row.users || 0));
  return (
    <div className="panel">
      <div className="panel-title"><Users size={18} /><h3>Cohort size by signup week</h3></div>
      <div className="funnel-list">
        {rows.map((row) => (
          <MiniBar key={row.cohort} label={row.cohort} value={row.users} max={max} detail={`${row.users} learners`} />
        ))}
        {!rows.length && <p className="muted">No cohort data yet.</p>}
      </div>
    </div>
  );
}
