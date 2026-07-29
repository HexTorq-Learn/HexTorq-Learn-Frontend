import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useLeaderboard } from '../hooks/useAnalytics.js';
import { LeaderboardScene3D } from '../components/charts/three/LeaderboardScene3D.jsx';
import { LeaderboardTable } from '../components/gamification/LeaderboardTable.jsx';
import { formatTime } from '../lib/youtube.js';

export default function LeaderboardPage() {
  const { auth } = useAuth();
  const { leaderboard, loading } = useLeaderboard();
  const [selected, setSelected] = useState(null);

  const topThree = leaderboard.slice(0, 3);
  const arenaRows = leaderboard.slice(3, 10);
  const restRows = leaderboard.slice(10);

  if (loading) return <p className="muted">Loading leaderboard...</p>;

  if (!leaderboard.length) {
    return (
      <div className="empty-state">
        <Trophy size={44} />
        <h1>No learners have study data yet.</h1>
      </div>
    );
  }

  return (
    <section>
      <div className="panel-title" style={{ marginBottom: '0.5rem' }}>
        <Trophy size={20} />
        <h3 style={{ fontSize: '1.1rem' }}>Learner Arena</h3>
      </div>
      <div className="panel arena-panel">
        <LeaderboardScene3D
          topThree={topThree}
          arenaRows={arenaRows}
          currentUserId={auth?.user?.id}
          onSelect={setSelected}
        />
      </div>
      {selected && (
        <div className="panel" style={{ marginTop: '0.75rem' }}>
          <strong>{selected.name}</strong> <span className="muted">{selected.publicLearnerId}</span>
          <p className="muted" style={{ margin: '0.4rem 0 0' }}>
            Lv {selected.level} · {selected.role} · {selected.xp} XP · {selected.badgeCount} badges ·{' '}
            {formatTime(selected.activeStudySeconds)} studied · {selected.completionRatePercent}% completion ·{' '}
            {selected.playlistProgressPercent}% playlist progress
          </p>
        </div>
      )}
      <div style={{ marginTop: '1rem' }}>
        <LeaderboardTable rows={restRows} currentUserId={auth?.user?.id} startRank={11} />
      </div>
    </section>
  );
}
