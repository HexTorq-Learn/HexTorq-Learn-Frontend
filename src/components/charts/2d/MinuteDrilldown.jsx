import { useState } from 'react';
import { formatHourLabel, formatClockLabel } from '../../../lib/format.js';

export function MinuteDrilldown({ timeMap }) {
  const [hour, setHour] = useState(() => new Date().getHours());
  const selected = timeMap?.hours?.find((row) => row.hour === hour);
  const max = Math.max(1, ...(selected?.seconds || []).map((row) => row.count));
  return (
    <div className="chart-block">
      <div className="chart-title">Minute drilldown heatmap</div>
      <select value={hour} onChange={(event) => setHour(Number(event.target.value))}>
        {(timeMap?.hours || []).map((row) => <option key={row.hour} value={row.hour}>{formatHourLabel(row.hour)}</option>)}
      </select>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(14px, 1fr))', gap: 3, marginTop: '0.6rem' }}>
        {(selected?.seconds || []).map((row) => (
          <span
            key={row.minute}
            title={`${formatClockLabel(`${String(hour).padStart(2, '0')}:${String(row.minute).padStart(2, '0')}:00`)} · ${row.count} events`}
            style={{
              height: 14,
              borderRadius: 3,
              background: `color-mix(in srgb, var(--color-brand-500) ${Math.round((row.count / max) * 90)}%, var(--color-surface-100))`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
