import { Users } from 'lucide-react';
import { EChart } from './EChart.jsx';
import { buildBar3DOption } from './bar3dOption.js';

// Backend only tracks per-cohort user counts today (day1/day2/day7 retention fields exist
// in the API shape but are never incremented) — plotting only `users` avoids fabricating
// a retention curve from permanently-zero fields. See rewrite plan risk notes.
export function CohortRetentionBar3D({ rows = [] }) {
  const option = buildBar3DOption({
    categories: rows.map((row) => row.cohort),
    values: rows.map((row) => row.users || 0),
    valueName: 'Learners',
  });

  return (
    <div className="panel">
      <div className="panel-title"><Users size={18} /><h3>Cohort size by signup week</h3></div>
      <EChart option={option} />
      {!rows.length && <p className="muted">No cohort data yet.</p>}
    </div>
  );
}
