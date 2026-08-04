import { useOutletContext } from 'react-router-dom';
import { Activity, BarChart3, Clock, Folder, Shield, Users } from 'lucide-react';
import { Stat } from '../../components/ui/Stat.jsx';
import { formatTime } from '../../lib/youtube.js';
import { SparklineChart } from '../../components/charts/2d/SparklineChart.jsx';
import { RadarChart } from '../../components/charts/echarts/RadarChart.jsx';
import { LeaderboardChart } from '../../components/admin/LeaderboardChart.jsx';
import { CohortRetentionChart } from '../../components/admin/CohortRetentionChart.jsx';
import { RiskUserTable } from '../../components/admin/RiskUserTable.jsx';

export default function AdminAnalyticsPage() {
  const { comparison, comparisonLoading } = useOutletContext();
  const comparisonRows = comparison?.userComparison || [];
  const dailyRows = comparison?.charts?.dailyActiveLearners || [];
  const totalStudyRows = comparison?.charts?.totalStudyTimeByDay || [];
  const playlistRows = comparison?.charts?.playlistCompletion || [];

  return (
    <div className="admin-analytics-page">
      {comparisonLoading && !comparison && <p className="muted">Loading analytics charts...</p>}
      <div className="stats-grid">
        <Stat icon={Users} label="Compared users" value={comparisonRows.length} />
        <Stat icon={Clock} label="Total active study" value={formatTime(comparisonRows.reduce((total, row) => total + row.activeStudySeconds, 0))} />
        <Stat icon={Shield} label="Risk users" value={(comparison?.inactiveUsers?.length || 0) + (comparison?.lowCompletionUsers?.length || 0)} />
        <Stat icon={BarChart3} label="Daily rows" value={dailyRows.length} />
      </div>

      <div className="analytics-grid wide">
        <LeaderboardChart
          title="Consistency leaderboard"
          rows={comparison?.leaderboards?.byConsistency || []}
          metric={(row) => row.consistencyScore}
          valueLabel={(row) => `${row.consistencyScore} streak score · Lv ${row.game?.level || 1}`}
        />
        <LeaderboardChart
          title="Playlist progress leaderboard"
          rows={comparison?.leaderboards?.byPlaylistProgress || []}
          metric={(row) => row.playlistProgressPercent}
          valueLabel={(row) => `${row.playlistProgressPercent}% playlist progress`}
        />
      </div>

      <div className="analytics-grid wide">
        <div className="panel">
          <div className="panel-title"><Activity size={18} /><h3>Daily active learners</h3></div>
          <SparklineChart rows={dailyRows.slice(-21)} getValue={(row) => row.activeUsers} label="Active learner trend" detail={`${dailyRows.at(-1)?.activeUsers || 0} active on latest day`} />
          {!dailyRows.length && <p className="muted">No daily learner activity yet.</p>}
        </div>
        <div className="panel">
          <div className="panel-title"><Clock size={18} /><h3>Total study time by day</h3></div>
          <SparklineChart rows={totalStudyRows.slice(-21)} getValue={(row) => row.totalStudySeconds} label="Study time trend" detail={formatTime(totalStudyRows.at(-1)?.totalStudySeconds || 0)} />
          {!totalStudyRows.length && <p className="muted">No study time recorded yet.</p>}
        </div>
      </div>

      <div className="analytics-grid wide">
        <div className="panel">
          <div className="panel-title"><Shield size={18} /><h3>Risk lists</h3></div>
          <div className="risk-grid">
            <RiskUserTable title="Inactive users" rows={comparison?.inactiveUsers || []} detail={(row) => `${formatTime(row.activeStudySeconds)} active`} />
            <RiskUserTable title="High distraction" rows={comparison?.highDistractionUsers || []} detail={(row) => `${row.distractionRate} focus losses`} />
            <RiskUserTable title="Low completion" rows={comparison?.lowCompletionUsers || []} detail={(row) => `${row.completionRatePercent}% completion`} />
            <RiskUserTable title="Stuck users" rows={comparison?.stuckUsers || []} detail={(row) => `${row.stuckSegments} stuck segments`} />
          </div>
        </div>
        <RadarChart rows={comparisonRows} />
      </div>

      <div className="analytics-grid wide">
        <div className="panel">
          <div className="panel-title"><Folder size={18} /><h3>Playlist completion chart</h3></div>
          <div className="funnel-list">
            {playlistRows.map((row) => (
              <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span>{row.name}</span>
                <strong>{row.videoCount} videos</strong>
              </div>
            ))}
            {!playlistRows.length && <p className="muted">No playlists yet.</p>}
          </div>
        </div>
        <CohortRetentionChart rows={comparison?.charts?.cohortRetention || []} />
      </div>

      <div className="panel">
        <div className="panel-title"><Shield size={18} /><h3>Gaming leaderboard</h3></div>
        <div className="game-leaderboard" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[...comparisonRows].sort((a, b) => (b.game?.xp || 0) - (a.game?.xp || 0)).slice(0, 12).map((row, index) => (
            <div className="game-rank-row" key={row.user.id}>
              <strong>#{index + 1}</strong>
              <span>{row.user.name}<small>{row.publicLearnerId}</small></span>
              <em>Lv {row.game?.level || 1} · {row.game?.role || 'Starter'} · {row.game?.xp || 0} XP · {row.game?.badgeCount || row.game?.badges?.length || 0} badges</em>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
