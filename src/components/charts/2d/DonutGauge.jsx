export function DonutGauge({ label, value = 0, detail }) {
  const percent = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="donut-card">
      <div className="donut" style={{ '--value': `${percent}%` }}>
        <span>{Math.round(percent)}%</span>
      </div>
      <div>
        <strong>{label}</strong>
        {detail && <p>{detail}</p>}
      </div>
    </div>
  );
}
