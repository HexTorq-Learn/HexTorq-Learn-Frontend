import { useOutletContext } from 'react-router-dom';
import { useEffect } from 'react';
import { BarChart3, Clock, Folder, ListVideo, Shield, Users } from 'lucide-react';
import { Stat } from '../../components/ui/Stat.jsx';
import { MetricCard } from '../../components/ui/MetricCard.jsx';
import { formatTime } from '../../lib/youtube.js';
import { AdminHourHeatmap } from '../../components/admin/AdminHourHeatmap.jsx';
import { LeaderboardChart } from '../../components/admin/LeaderboardChart.jsx';

export default function AdminOverviewPage() {
  const { summary, users, videos, comparison, comparisonLoading, reloadOverview } = useOutletContext();

  useEffect(() => {
    reloadOverview();
  }, [reloadOverview]);

  return (
    <>
      <div className="stats-grid">
        <Stat icon={Users} label="Users" value={summary?.userCount || 0} />
        <Stat icon={Folder} label="Playlists" value={summary?.playlistCount || 0} />
        <Stat icon={ListVideo} label="Videos" value={summary?.videoCount || 0} />
        <Stat icon={Clock} label="Total study" value={formatTime(summary?.totals?.activeWatchSeconds || 0)} />
      </div>

      <div className="analytics-grid wide">
        <div className="panel">
          <div className="panel-title"><Users size={18} /><h3>Users</h3></div>
          {users.slice(0, 8).map((user) => <div className="table-row" key={user.id}><strong>{user.name}</strong><span>{user.email}</span><span>{user.role}</span></div>)}
        </div>
        <div className="panel">
          <div className="panel-title"><ListVideo size={18} /><h3>Videos</h3></div>
          {videos.slice(0, 8).map((video) => <div className="table-row" key={video.id}><strong>{video.title}</strong><span>{video.playlist?.name || 'No playlist'}</span><span>{video._count.events} events</span></div>)}
        </div>
      </div>

      <div className="analytics-grid wide">
        {comparisonLoading && !comparison && <p className="muted">Loading leaderboard charts...</p>}
        <LeaderboardChart
          title="Active study leaderboard"
          rows={comparison?.leaderboards?.byActiveStudy || []}
          metric={(row) => row.activeStudySeconds}
          valueLabel={(row) => `${formatTime(row.activeStudySeconds)} · ${row.completionRatePercent}% complete`}
        />
        <div className="panel">
          <div className="panel-title"><Shield size={18} /><h3>Risk lists</h3></div>
          <div className="metric-grid">
            <MetricCard title="Inactive" value={comparison?.inactiveUsers?.length || 0} />
            <MetricCard title="High distraction" value={comparison?.highDistractionUsers?.length || 0} />
            <MetricCard title="Low completion" value={comparison?.lowCompletionUsers?.length || 0} />
            <MetricCard title="Stuck users" value={comparison?.stuckUsers?.length || 0} />
          </div>
        </div>
      </div>

      <div className="analytics-grid wide">
        <AdminHourHeatmap rows={comparison?.charts?.allUsers24HourHeatmap || []} />
        <div className="panel">
          <div className="panel-title"><BarChart3 size={18} /><h3>Daily active learners</h3></div>
          <div className="funnel-list">
            {(comparison?.charts?.dailyActiveLearners || []).slice(-14).map((row) => (
              <div key={row.date} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px', gap: '0.5rem', fontSize: '0.8rem', alignItems: 'center' }}>
                <span>{row.date}</span>
                <div style={{ height: 8, background: 'var(--color-surface-100)', borderRadius: 999 }}>
                  <i style={{ display: 'block', height: '100%', width: `${Math.min(100, (row.activeUsers / Math.max(1, users.length)) * 100)}%`, background: 'var(--color-brand-500)', borderRadius: 999 }} />
                </div>
                <strong>{row.activeUsers}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
