import { formatTime } from '../../lib/youtube.js';

export function LeaderboardTable({ rows = [], currentUserId, startRank = 11 }) {
  if (!rows.length) return null;
  return (
    <div className="chart-block">
      <div className="chart-title">Full learner rankings</div>
      <div className="leaderboard-list">
        {rows.map((row, index) => (
          <div className={row.userId === currentUserId ? 'leader-row current' : 'leader-row'} key={row.userId}>
            <strong>#{startRank + index}</strong>
            <span>{row.name}<small>{row.publicLearnerId}</small></span>
            <em>Lv {row.level} · {row.role || 'Starter'} · {row.xp} XP · {row.badgeCount || row.badges?.length || 0} badges · {formatTime(row.activeStudySeconds)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}
