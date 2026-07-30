import { BarChart3 } from 'lucide-react';
import { MiniBar } from '../ui/MiniBar.jsx';

export function LeaderboardChart({ title, rows = [], metric, valueLabel }) {
  const max = Math.max(1, ...rows.map((row) => metric(row)));
  return (
    <div className="panel">
      <div className="panel-title"><BarChart3 size={18} /><h3>{title}</h3></div>
      <div className="funnel-list">
        {rows.slice(0, 10).map((row, index) => (
          <MiniBar
            key={row.user.id}
            label={`#${index + 1} ${row.user.name}`}
            value={metric(row)}
            max={max}
            detail={valueLabel(row)}
          />
        ))}
        {!rows.length && <p className="muted">No learners yet.</p>}
      </div>
    </div>
  );
}
