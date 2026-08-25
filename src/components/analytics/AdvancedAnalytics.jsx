import { Activity, BarChart3, Eye, Folder, ListVideo, Shield, TimerReset } from 'lucide-react';
import { formatTime } from '../../lib/youtube.js';
import { formatRangeText } from '../../lib/format.js';
import { MetricCard } from '../ui/MetricCard.jsx';
import { DonutGauge } from '../charts/2d/DonutGauge.jsx';
import { SparklineChart } from '../charts/2d/SparklineChart.jsx';
import { TimelineStrip } from '../charts/2d/TimelineStrip.jsx';
import { VideoCompletionList } from '../charts/2d/VideoCompletionList.jsx';
import { CompletionFunnel } from '../charts/2d/CompletionFunnel.jsx';
import { FocusIdleStack } from '../charts/2d/FocusIdleStack.jsx';
import { PlaylistProgressChart } from '../charts/2d/PlaylistProgressChart.jsx';
import { StreakCalendarHeatmap } from '../charts/echarts/StreakCalendarHeatmap.jsx';
import { DifficultyScatter3D } from '../charts/echarts/DifficultyScatter3D.jsx';
import { GameDashboard } from '../gamification/GameDashboard.jsx';
import { PortalActivityPanel } from './PortalActivityPanel.jsx';

export function AdvancedAnalytics({ advanced }) {
  if (!advanced) return null;

  const hardest = [...(advanced.rewatchDifficulty || [])].sort((a, b) => b.hardTopicScore - a.hardTopicScore)[0];
  const playlist = [...(advanced.playlistMetrics || [])].sort((a, b) => b.activeWatchSeconds - a.activeWatchSeconds)[0];
  const bestVideo = [...(advanced.videoCompletion || [])].sort((a, b) => b.percentWatched - a.percentWatched)[0];

  return (
    <section className="advanced-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="panel">
        <div className="panel-title"><Shield size={18} /><h3>Game profile</h3></div>
        <GameDashboard game={advanced.game} />
      </div>

      <PortalActivityPanel portalActivity={advanced.portalActivity} />

      <div className="analytics-grid wide">
        <div className="panel">
          <div className="panel-title"><Activity size={18} /><h3>Learning quality</h3></div>
          <div className="gauge-grid">
            <DonutGauge label="Efficiency" value={advanced.learningTime.studyEfficiencyPercent} detail="Active / tab-open" />
            <DonutGauge label="Focus score" value={advanced.charts?.insightCards?.focusScore || 0} detail={`${formatTime(advanced.learningTime.focusedSeconds)} focused`} />
            <MetricCard title="Idle time" value={formatTime(advanced.learningTime.idleSeconds)} detail={`${advanced.sessionQuality.idleTriggerCount} idle triggers`} />
            <MetricCard title="Study streak" value={`${advanced.learningTime.studyStreakDays} days`} detail={`Best hour ${advanced.learningTime.bestStudyHour || '--'}`} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-title"><ListVideo size={18} /><h3>Progress</h3></div>
          <div className="gauge-grid">
            <DonutGauge label="Daily target" value={advanced.learningProgress.watchTargetCompletionPercent} detail="1 hour goal" />
            <DonutGauge label="Completion rate" value={advanced.charts?.insightCards?.completionRate || 0} detail={`${advanced.learningProgress.completedVideos} completed`} />
            <MetricCard title="Remaining" value={formatTime(advanced.learningProgress.remainingVideoSeconds)} detail="Estimated video time left" />
            <MetricCard title="Today delta" value={formatTime(Math.abs(advanced.learningProgress.todayVsYesterday.deltaSeconds))} detail={advanced.learningProgress.todayVsYesterday.deltaSeconds >= 0 ? 'More than yesterday' : 'Less than yesterday'} />
          </div>
        </div>
      </div>

      <div className="analytics-grid wide">
        <div className="panel">
          <div className="panel-title"><TimerReset size={18} /><h3>Difficulty signals</h3></div>
          <div className="insight-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div><strong>{hardest?.title || 'No video yet'}</strong><span className="muted"> Hard-topic score {hardest?.hardTopicScore || 0}</span></div>
            <div><strong>Repeated 5x</strong><span className="muted"> {formatRangeText(hardest?.repeated5xRanges)}</span></div>
            <div><strong>Most replayed</strong><span className="muted"> {hardest?.mostReplayedSecond ? `${formatTime(hardest.mostReplayedSecond.second)} · ${hardest.mostReplayedSecond.watchCount}x` : 'None'}</span></div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title"><Folder size={18} /><h3>Playlist performance</h3></div>
          <div className="insight-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div><strong>{playlist?.name || 'No playlist'}</strong><span className="muted"> {playlist?.completionPercent || 0}% complete · {formatTime(playlist?.activeWatchSeconds || 0)}</span></div>
            <div><strong>Best video</strong><span className="muted"> {bestVideo?.title || 'No watched video'} · {bestVideo?.percentWatched || 0}%</span></div>
            <div><strong>Completion ETA</strong><span className="muted"> {advanced.learningProgress.estimatedCourseCompletionDays ? `${advanced.learningProgress.estimatedCourseCompletionDays} days` : 'Needs more data'}</span></div>
          </div>
        </div>
      </div>

      <div className="analytics-grid wide">
        <div className="panel">
          <div className="panel-title"><Eye size={18} /><h3>Behavior</h3></div>
          <TimelineStrip events={(advanced.behavior.playPausePattern || []).map((event, index) => ({ id: `${index}-${event.clock}`, type: event.type, clock: event.clock }))} />
          <div className="metric-grid" style={{ marginTop: '0.75rem' }}>
            <MetricCard title="Pause/min" value={advanced.behavior.pauseFrequencyPerMinute} />
            <MetricCard title="Seek/min" value={advanced.behavior.seekFrequencyPerMinute} />
            <MetricCard title="Tab switches" value={advanced.behavior.tabSwitchingFrequency} />
            <MetricCard title="Avg gap" value={formatTime(advanced.behavior.averageSecondsBetweenInteractions)} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-title"><Shield size={18} /><h3>Alerts</h3></div>
          <div className="alert-list">
            {(advanced.alerts || []).slice(0, 8).map((alert) => <div className={`alert-row ${alert.severity}`} key={`${alert.type}-${alert.message}`}><strong>{alert.severity}</strong><span>{alert.message}</span></div>)}
            {!advanced.alerts?.length && <p className="muted">No alerts right now.</p>}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><BarChart3 size={18} /><h3>Consistency charts</h3></div>
        <SparklineChart rows={advanced.learningTime.dailySeries || []} getValue={(row) => row.activeWatchSeconds} label="Daily study trend" detail={`${(advanced.learningTime.dailySeries || []).length} day points`} />
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginTop: '1rem' }}>
          <StreakCalendarHeatmap days={advanced.charts?.streakCalendar || []} />
          <CompletionFunnel steps={advanced.charts?.completionFunnel || []} />
          <FocusIdleStack rows={advanced.charts?.focusIdleStack || []} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><Folder size={18} /><h3>Course charts</h3></div>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <PlaylistProgressChart rows={advanced.charts?.playlistProgress || []} />
          <VideoCompletionList rows={advanced.charts?.videoCompletionList || []} />
          <DifficultyScatter3D rows={advanced.rewatchDifficulty || []} />
        </div>
      </div>
    </section>
  );
}
