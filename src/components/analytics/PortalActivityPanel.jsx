import { Activity } from 'lucide-react';
import { formatTime } from '../../lib/youtube.js';
import { formatClockLabel } from '../../lib/format.js';
import { MetricCard } from '../ui/MetricCard.jsx';
import { SparklineChart } from '../charts/2d/SparklineChart.jsx';

const STATUS_LABEL = { online: 'Online now', idle: 'Idle', offline: 'Offline' };
const STATUS_COLOR = { online: 'var(--color-brand-500)', idle: 'var(--color-accent-600)', offline: 'var(--color-text-muted)' };

export function PortalActivityPanel({ portalActivity }) {
  if (!portalActivity) return null;
  const status = portalActivity.currentStatus || 'offline';

  return (
    <div className="panel">
      <div className="panel-title">
        <Activity size={18} />
        <h3>Portal activity</h3>
        <span className="pill" style={{ marginLeft: 'auto', color: STATUS_COLOR[status] }}>
          <i style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[status], display: 'inline-block' }} />
          {' '}{STATUS_LABEL[status]}
        </span>
      </div>
      <div className="metric-grid">
        <MetricCard title="Active today" value={formatTime(portalActivity.todayActiveSeconds)} detail="Time actually engaged with the portal" />
        <MetricCard title="Idle today" value={formatTime(portalActivity.todayIdleSeconds)} detail="Logged in but inactive" />
        <MetricCard title="Portal streak" value={`${portalActivity.portalStreakDays} days`} detail="Consecutive active days" />
        <MetricCard title="Logins" value={portalActivity.loginCount} detail="Total portal logins" />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <SparklineChart
          rows={portalActivity.dailySeries || []}
          getValue={(row) => row.activeSeconds}
          label="Daily portal-active time"
          detail={`${formatTime(portalActivity.last7DaysActiveSeconds)} in the last 7 days`}
        />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <div className="chart-title">Login / idle / logout timeline</div>
        <div className="timeline-list">
          {(portalActivity.recentTimeline || []).slice().reverse().slice(0, 15).map((event, index) => (
            <div className="timeline-row" key={`${event.serverTs}-${index}`}>
              <strong>{formatClockLabel(event.clock)}</strong>
              <span>{event.type}</span>
              <p />
            </div>
          ))}
          {!portalActivity.recentTimeline?.length && <p className="muted">No portal activity recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
