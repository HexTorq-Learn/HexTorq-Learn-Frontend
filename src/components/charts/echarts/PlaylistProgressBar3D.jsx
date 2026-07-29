import { EChart } from './EChart.jsx';
import { buildBar3DOption } from './bar3dOption.js';

export function PlaylistProgressBar3D({ rows = [] }) {
  const option = buildBar3DOption({
    categories: rows.map((row) => row.name),
    values: rows.map((row) => row.completionPercent || 0),
    colors: rows.map((row) => row.color || '#1f6f64'),
    valueName: 'Completion %',
    tooltipFormatter: (params) => `${rows[params.value[0]]?.name}: ${rows[params.value[0]]?.completedVideos}/${rows[params.value[0]]?.videoCount} · ${params.value[2]}%`,
  });

  return (
    <div className="chart-block">
      <div className="chart-title">Playlist progress</div>
      <EChart option={option} />
    </div>
  );
}
