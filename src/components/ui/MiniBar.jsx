export function MiniBar({ label, value, max, detail }) {
  return (
    <div className="mini-bar">
      <div><strong>{label}</strong><span>{detail}</span></div>
      <div><i style={{ width: `${Math.min(100, max ? (value / max) * 100 : 0)}%` }} /></div>
    </div>
  );
}
