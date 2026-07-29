import { useMemo } from 'react';
import { BarChart3, Clock, Pause, Rewind, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useSocket } from '../providers/SocketProvider.jsx';
import { useAnalyticsOverview, useAdvancedMetrics } from '../hooks/useAnalytics.js';
import { formatDateKey } from '../lib/format.js';
import { formatTime } from '../lib/youtube.js';
import { Stat } from '../components/ui/Stat.jsx';
import { TimeHeatmap } from '../components/charts/2d/TimeHeatmap.jsx';
import { EventTimeline } from '../components/charts/2d/EventTimeline.jsx';
import { MinuteDrilldown } from '../components/charts/2d/MinuteDrilldown.jsx';
import { AdvancedAnalytics } from '../components/analytics/AdvancedAnalytics.jsx';

export default function AnalyticsPage() {
  useAuth();
  const { connected } = useSocket();
  const { overview, timeMap } = useAnalyticsOverview();
  const { advanced } = useAdvancedMetrics();

  const summariesByDate = useMemo(() => {
    const rows = {};
    overview?.summaries?.forEach((summary) => {
      const date = formatDateKey(new Date(summary.date));
      rows[date] = (rows[date] || 0) + summary.activeWatchSeconds;
    });
    return Object.entries(rows).slice(0, 14);
  }, [overview]);

  return (
    <section className="dashboard">
      <div className="stats-grid">
        <Stat icon={Clock} label="Active study" value={formatTime(overview?.totals?.totalActiveSeconds || 0)} />
        <Stat icon={Pause} label="Pauses" value={overview?.totals?.totalPauseCount || 0} />
        <Stat icon={Rewind} label="Seeks / rewinds" value={overview?.totals?.totalSeekCount || 0} />
        <Stat icon={connected ? Wifi : WifiOff} label="Live metrics" value={connected ? 'Connected' : 'Offline'} />
      </div>

      <div className="analytics-grid wide">
        <div className="panel">
          <div className="panel-title"><BarChart3 size={18} /><h3>Daily activity</h3></div>
          <div className="bars" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {summariesByDate.map(([date, seconds]) => (
              <div key={date} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem' }}>
                <span>{date}</span>
                <div style={{ height: 8, background: 'var(--color-surface-100)', borderRadius: 999 }}>
                  <i style={{ display: 'block', height: '100%', width: `${Math.min(100, seconds / 60)}%`, background: 'var(--color-brand-500)', borderRadius: 999 }} />
                </div>
                <strong>{formatTime(seconds)}</strong>
              </div>
            ))}
            {!summariesByDate.length && <p className="muted">No watch data yet.</p>}
          </div>
        </div>
        <TimeHeatmap timeMap={timeMap} />
      </div>

      <div className="analytics-grid wide">
        <EventTimeline timeMap={timeMap} />
        <div className="panel"><MinuteDrilldown timeMap={timeMap} /></div>
      </div>

      <AdvancedAnalytics advanced={advanced} />
    </section>
  );
}
