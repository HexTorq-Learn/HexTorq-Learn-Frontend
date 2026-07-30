import { useParams, useOutletContext, Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Clock, Pause, Play, Rewind } from 'lucide-react';
import { useAdminUserDetail } from '../../hooks/useAdmin.js';
import { Stat } from '../../components/ui/Stat.jsx';
import { TimeHeatmap } from '../../components/charts/2d/TimeHeatmap.jsx';
import { EventTimeline } from '../../components/charts/2d/EventTimeline.jsx';
import { MinuteDrilldown } from '../../components/charts/2d/MinuteDrilldown.jsx';
import { AdvancedAnalytics } from '../../components/analytics/AdvancedAnalytics.jsx';
import { formatDateKey } from '../../lib/format.js';
import { formatTime } from '../../lib/youtube.js';

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const { users } = useOutletContext();
  const { userAnalytics, userTimeMap, userAdvanced } = useAdminUserDetail(userId);
  const user = users.find((row) => row.id === userId);
  const dailyWatchMinutes = Object.entries((userAnalytics?.summaries || []).reduce((acc, row) => {
    const day = formatDateKey(new Date(row.date));
    acc[day] = (acc[day] || 0) + row.activeWatchSeconds;
    return acc;
  }, {})).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className="learner-drilldown">
      <Link to="/admin/users" className="small-button" style={{ width: 'fit-content' }}>
        <ArrowLeft size={16} /> Back to users
      </Link>
      <div className="panel">
        <div className="panel-title"><BarChart3 size={18} /><h3>{userAnalytics ? `${userAnalytics.user.name} analytics` : user?.name || 'Loading learner...'}</h3></div>
        {userAnalytics && (
          <div className="stats-grid compact">
            <Stat icon={Clock} label="Study time" value={formatTime(userAnalytics.totals.activeWatchSeconds)} />
            <Stat icon={Pause} label="Pauses" value={userAnalytics.totals.pauseCount} />
            <Stat icon={Rewind} label="Seeks" value={userAnalytics.totals.seekCount} />
            <Stat icon={Play} label="Sessions" value={userAnalytics.totals.sessionCount} />
          </div>
        )}
      </div>
      {userAnalytics && (
        <>
          <div className="analytics-grid wide">
            <TimeHeatmap timeMap={userTimeMap} />
            <EventTimeline timeMap={userTimeMap} />
          </div>
          <div className="analytics-grid wide">
            <div className="panel"><MinuteDrilldown timeMap={userTimeMap} /></div>
            <div className="panel">
              <div className="panel-title"><Clock size={18} /><h3>Minutes watched per day</h3></div>
              <div className="admin-table daily-watch-table">
                {dailyWatchMinutes.map(([day, seconds]) => (
                  <div className="table-row" key={day}>
                    <span>{day}</span>
                    <strong>{Math.round(seconds / 60)} min</strong>
                    <span>{formatTime(seconds)}</span>
                  </div>
                ))}
                {!dailyWatchMinutes.length && <p className="muted">No daily watch minutes yet.</p>}
              </div>
              <div className="panel-title spaced-title"><BarChart3 size={18} /><h3>Daily video activity</h3></div>
              <div className="admin-table">
                {(userAnalytics?.summaries || []).map((row) => (
                  <div className="table-row" key={row.id}>
                    <span>{formatDateKey(new Date(row.date))}</span>
                    <strong>{row.video.title}</strong>
                    <span>{formatTime(row.activeWatchSeconds)}</span>
                  </div>
                ))}
                {!userAnalytics?.summaries?.length && <p className="muted">No daily summaries yet.</p>}
              </div>
            </div>
          </div>
          <AdvancedAnalytics advanced={userAdvanced} />
        </>
      )}
    </div>
  );
}
