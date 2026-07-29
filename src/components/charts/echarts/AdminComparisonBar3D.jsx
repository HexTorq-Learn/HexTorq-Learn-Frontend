import { BarChart3 } from 'lucide-react';
import { EChart } from './EChart.jsx';
import { buildBar3DOption } from './bar3dOption.js';

export function AdminComparisonBar3D({ title, rows = [], metric, valueLabel }) {
  const top = rows.slice(0, 10);
  const option = buildBar3DOption({
    categories: top.map((row, index) => `#${index + 1} ${row.user.name}`),
    values: top.map((row) => metric(row)),
    valueName: 'Score',
    tooltipFormatter: (params) => `${top[params.value[0]]?.user.name}: ${valueLabel(top[params.value[0]])}`,
  });

  return (
    <div className="panel">
      <div className="panel-title"><BarChart3 size={18} /><h3>{title}</h3></div>
      <EChart option={option} />
      {!rows.length && <p className="muted">No learners yet.</p>}
    </div>
  );
}
