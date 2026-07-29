import { formatTime } from '../../../lib/youtube.js';
import { EChart } from './EChart.jsx';
import { buildBar3DOption } from './bar3dOption.js';

const COLORS = { active: '#1f6f64', paused: '#93a1b5', idle: '#f7c948', unfocused: '#b42318' };

export function FocusIdleBar3D({ rows = [] }) {
  const option = buildBar3DOption({
    categories: rows.map((row) => row.label),
    values: rows.map((row) => row.seconds),
    colors: rows.map((row) => COLORS[row.key] || '#1f6f64'),
    valueName: 'Seconds',
    tooltipFormatter: (params) => `${rows[params.value[0]]?.label}: ${formatTime(params.value[2])}`,
  });

  return (
    <div className="chart-block">
      <div className="chart-title">Active vs idle 3D bars</div>
      <EChart option={option} />
      <div className="stack-legend" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        {rows.map((row) => (
          <span key={row.key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
            <i style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[row.key] || '#1f6f64', display: 'inline-block' }} />
            {row.label} {formatTime(row.seconds)}
          </span>
        ))}
      </div>
    </div>
  );
}
