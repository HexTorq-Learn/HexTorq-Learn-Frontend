import { Clock } from 'lucide-react';
import { formatTime } from '../../lib/youtube.js';
import { MetricCard } from '../ui/MetricCard.jsx';

export function VideoEtaPanel({ advanced, selectedVideo }) {
  const videoMetric = advanced?.videoCompletion?.find((video) => video.id === selectedVideo?.id);
  if (!selectedVideo || !videoMetric) return null;

  const remainingSeconds = Math.max(0, videoMetric.durationSec - videoMetric.uniqueWatchedSeconds);
  const eta = new Date(Date.now() + remainingSeconds * 1000);
  const etaClock = remainingSeconds > 0 ? eta.toLocaleTimeString('en-US', { hour12: true }) : 'Complete';

  return (
    <div className="panel eta-panel">
      <div className="panel-title"><Clock size={18} /><h3>Expected finish time</h3></div>
      <div className="eta-grid gauge-grid">
        <MetricCard title="ETA clock" value={etaClock} detail={remainingSeconds > 0 ? 'If you keep watching now' : 'Video target reached'} />
        <MetricCard title="Remaining" value={formatTime(remainingSeconds)} detail={`${videoMetric.percentWatched}% watched`} />
        <MetricCard title="Unique watched" value={formatTime(videoMetric.uniqueWatchedSeconds)} detail={`${formatTime(videoMetric.rewatchedSeconds)} rewatched`} />
        <MetricCard title="Resume point" value={formatTime(videoMetric.lastWatchedPosition || 0)} detail="Last known video position" />
      </div>
      <div className="progress-track">
        <i style={{ width: `${Math.min(100, videoMetric.percentWatched)}%` }} />
      </div>
    </div>
  );
}
