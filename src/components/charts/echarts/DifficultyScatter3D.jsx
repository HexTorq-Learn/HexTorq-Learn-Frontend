import { EChart } from './EChart.jsx';

export function DifficultyScatter3D({ rows = [] }) {
  const sorted = [...rows].sort((a, b) => b.hardTopicScore - a.hardTopicScore).slice(0, 20);
  const maxConfusing = Math.max(1, ...sorted.map((row) => row.confusingSectionScore || 0));

  const option = {
    tooltip: {
      formatter: (params) => {
        const row = sorted[params.dataIndex];
        return `${row.title}<br/>Pauses: ${row.pauseCount} · Rewinds: ${row.rewindCount}<br/>Hard-topic score: ${row.hardTopicScore}`;
      },
    },
    xAxis3D: { type: 'value', name: 'Pauses' },
    yAxis3D: { type: 'value', name: 'Rewinds' },
    zAxis3D: { type: 'value', name: 'Hard-topic score' },
    grid3D: {
      viewControl: { autoRotate: true, autoRotateSpeed: 3, distance: 200 },
      light: { main: { intensity: 1.1, shadow: true }, ambient: { intensity: 0.4 } },
    },
    series: [{
      type: 'scatter3D',
      symbolSize: (value, params) => 8 + ((sorted[params.dataIndex]?.confusingSectionScore || 0) / maxConfusing) * 20,
      data: sorted.map((row) => [row.pauseCount || 0, row.rewindCount || 0, row.hardTopicScore || 0]),
      itemStyle: { color: '#f7c948', opacity: 0.85 },
    }],
  };

  return (
    <div className="chart-block">
      <div className="chart-title">Video difficulty matrix</div>
      <EChart option={option} />
      {!sorted.length && <p className="muted">Watch videos to build difficulty signals.</p>}
    </div>
  );
}
