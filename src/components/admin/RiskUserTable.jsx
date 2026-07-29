export function RiskUserTable({ title, rows = [], detail }) {
  return (
    <div className="chart-block">
      <div className="chart-title">{title}</div>
      <div className="compact-table">
        {rows.slice(0, 8).map((row) => (
          <div className="compact-row" key={row.user.id}>
            <strong>{row.user.name}</strong>
            <span>{detail(row)}</span>
          </div>
        ))}
        {!rows.length && <p className="muted">No users in this list.</p>}
      </div>
    </div>
  );
}
