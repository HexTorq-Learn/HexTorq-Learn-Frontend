import { Clock } from 'lucide-react';
import { formatHourLabel } from '../../lib/format.js';

export function AdminHourHeatmap({ rows = [] }) {
  const max = Math.max(1, ...rows.map((row) => row.events || 0));
  return (
    <div className="panel">
      <div className="panel-title"><Clock size={18} /><h3>All users AM/PM heatmap</h3></div>
      <div className="hour-grid">
        {rows.map((row) => (
          <div className="hour-cell" key={row.hour} style={{ '--level': (row.events || 0) / max }}>
            <strong>{formatHourLabel(row.hour)}</strong>
            <span>{row.events || 0} events</span>
          </div>
        ))}
      </div>
    </div>
  );
}
