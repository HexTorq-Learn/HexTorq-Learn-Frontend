import { Clock } from 'lucide-react';
import { formatHourLabel } from '../../../lib/format.js';

export function TimeHeatmap({ timeMap, title = 'AM/PM watch heatmap' }) {
  const max = Math.max(1, ...(timeMap?.hours || []).map((hour) => hour.activeEvents));

  return (
    <div className="panel">
      <div className="panel-title"><Clock size={18} /><h3>{title}</h3></div>
      <div className="hour-grid">
        {(timeMap?.hours || []).map((hour) => (
          <div className="hour-cell" key={hour.hour} style={{ '--level': hour.activeEvents / max }}>
            <strong>{formatHourLabel(hour.hour)}</strong>
            <span>{hour.activeEvents} events</span>
          </div>
        ))}
      </div>
    </div>
  );
}
