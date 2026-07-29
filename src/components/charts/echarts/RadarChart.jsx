import { EChart } from './EChart.jsx';

const PALETTE = ['#1f6f64', '#f7c948', '#6fb5a6', '#b42318', '#93a1b5', '#124039'];

export function RadarChart({ rows = [] }) {
  const sample = rows.slice(0, 6);
  const indicators = [
    { name: 'Focus', max: 100 },
    { name: 'Completion', max: 100 },
    { name: 'Consistency', max: 100 },
    { name: 'Rewatch', max: 100 },
    { name: 'Idle control', max: 100 },
  ];

  const option = {
    tooltip: {},
    legend: { bottom: 0, textStyle: { color: 'var(--color-text-muted)' } },
    radar: { indicator: indicators, radius: '65%' },
    series: [{
      type: 'radar',
      data: sample.map((row, index) => ({
        name: row.user?.name || `User ${index + 1}`,
        value: [row.radar?.focus || 0, row.radar?.completion || 0, row.radar?.consistency || 0, row.radar?.rewatch || 0, row.radar?.idle || 0],
        lineStyle: { color: PALETTE[index % PALETTE.length] },
        areaStyle: { color: PALETTE[index % PALETTE.length], opacity: 0.1 },
        itemStyle: { color: PALETTE[index % PALETTE.length] },
      })),
    }],
  };

  return (
    <div className="chart-block">
      <div className="chart-title">User comparison radar</div>
      <EChart option={option} height={360} />
      {!sample.length && <p className="muted">No comparison data yet.</p>}
    </div>
  );
}
