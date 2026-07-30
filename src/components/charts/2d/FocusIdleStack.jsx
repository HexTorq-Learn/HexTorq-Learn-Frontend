import { formatTime } from '../../../lib/youtube.js';

const COLORS = { active: '#1f6f64', paused: '#93a1b5', idle: '#f7c948', unfocused: '#b42318' };

export function FocusIdleStack({ rows = [] }) {
  const total = Math.max(1, rows.reduce((acc, row) => acc + row.seconds, 0));
  return (
    <div className="chart-block">
      <div className="chart-title">Active vs idle stacked bar</div>
      <div style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', background: 'var(--color-surface-100)' }}>
        {rows.map((row) => (
          <i
            key={row.key}
            title={`${row.label}: ${formatTime(row.seconds)}`}
            style={{ display: 'block', width: `${(row.seconds / total) * 100}%`, background: COLORS[row.key] || 'var(--color-brand-500)' }}
          />
        ))}
      </div>
      <div className="stack-legend" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
        {rows.map((row) => (
          <span key={row.key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
            <i style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[row.key] || 'var(--color-brand-500)', display: 'inline-block' }} />
            {row.label} {formatTime(row.seconds)}
          </span>
        ))}
      </div>
    </div>
  );
}
