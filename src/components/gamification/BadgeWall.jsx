export function BadgeWall({ badges = [] }) {
  return (
    <div className="game-section">
      <div className="chart-title">Badge wall</div>
      <div className="badge-wall">
        {badges.map((badge) => (
          <div className={badge.unlocked ? 'badge-tile unlocked' : 'badge-tile'} key={badge.key} title={badge.description}>
            <strong>{badge.label}</strong>
            <span>{badge.category}</span>
            <i style={{ width: `${badge.percent || 0}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
