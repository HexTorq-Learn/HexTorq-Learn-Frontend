export function MetricCard({ title, value, detail }) {
  return (
    <div className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
      {detail && <p>{detail}</p>}
    </div>
  );
}
