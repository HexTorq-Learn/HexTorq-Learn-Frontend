import { Clock } from 'lucide-react';
import { formatHourLabel } from '../../../lib/format.js';
import { EChart } from './EChart.jsx';
import { buildBar3DOption } from './bar3dOption.js';

export function AdminHourHeatmapSurface3D({ rows = [] }) {
  const option = buildBar3DOption({
    categories: rows.map((row) => formatHourLabel(row.hour)),
    values: rows.map((row) => row.events || 0),
    valueName: 'Events',
  });

  return (
    <div className="panel">
      <div className="panel-title"><Clock size={18} /><h3>All users AM/PM heatmap (hour skyline)</h3></div>
      <EChart option={option} />
    </div>
  );
}
