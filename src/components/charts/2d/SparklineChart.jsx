export function SparklineChart({ rows = [], getValue, label, detail }) {
  const values = rows.map((row) => Number(getValue(row)) || 0);
  const max = Math.max(1, ...values);
  const points = values.length
    ? values.map((value, index) => {
      const x = values.length === 1 ? 150 : (index / (values.length - 1)) * 300;
      const y = 96 - (value / max) * 80;
      return `${x},${y}`;
    }).join(' ')
    : '';
  const area = points ? `0,100 ${points} 300,100` : '';

  return (
    <div className="spark-chart">
      <div className="chart-title">{label}</div>
      <svg viewBox="0 0 300 110" role="img" aria-label={label}>
        <polyline className="grid-line" points="0,96 300,96" stroke="var(--color-border)" fill="none" />
        {area && <polygon className="area" points={area} fill="color-mix(in srgb, var(--color-brand-500) 18%, transparent)" />}
        {points && <polyline className="line" points={points} stroke="var(--color-brand-500)" strokeWidth="2" fill="none" />}
        {values.map((value, index) => {
          const x = values.length === 1 ? 150 : (index / (values.length - 1)) * 300;
          const y = 96 - (value / max) * 80;
          return <circle key={`${index}-${value}`} cx={x} cy={y} r="3" fill="var(--color-brand-500)" />;
        })}
      </svg>
      {detail && <p className="muted">{detail}</p>}
    </div>
  );
}
