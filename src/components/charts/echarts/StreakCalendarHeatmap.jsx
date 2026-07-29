import { EChart } from './EChart.jsx';
import { formatTime } from '../../../lib/youtube.js';

export function StreakCalendarHeatmap({ days = [] }) {
  if (!days.length) {
    return (
      <div className="chart-block">
        <div className="chart-title">Study streak calendar</div>
        <p className="muted">No streak data yet.</p>
      </div>
    );
  }

  const values = days.map((day) => [day.date, day.activeWatchSeconds]);
  const range = [days[0].date, days[days.length - 1].date];
  const max = Math.max(1, ...days.map((day) => day.activeWatchSeconds));

  const option = {
    tooltip: {
      formatter: (params) => `${params.value[0]}: ${formatTime(params.value[1])}`,
    },
    visualMap: {
      show: false,
      min: 0,
      max,
      inRange: { color: ['#edf1f6', '#6fb5a6', '#1f6f64'] },
    },
    calendar: {
      range,
      cellSize: [14, 14],
      itemStyle: { borderWidth: 2, borderColor: 'var(--color-surface-0)' },
      yearLabel: { show: false },
      dayLabel: { fontSize: 10 },
      monthLabel: { fontSize: 10 },
    },
    series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: values }],
  };

  return (
    <div className="chart-block">
      <div className="chart-title">Study streak calendar</div>
      <EChart option={option} height={180} />
    </div>
  );
}
