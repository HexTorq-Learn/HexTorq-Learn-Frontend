import { MiniBar } from '../ui/MiniBar.jsx';

export function AchievementTrack({ achievements = [] }) {
  return (
    <div className="game-section">
      <div className="chart-title">Achievement tracks</div>
      <div className="achievement-grid">
        {achievements.map((achievement) => (
          <MiniBar key={achievement.key} label={achievement.label} value={achievement.percent || 0} max={100} detail={`${achievement.percent || 0}%`} />
        ))}
      </div>
    </div>
  );
}
