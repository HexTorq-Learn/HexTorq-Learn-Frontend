import { Clock, Pause, Rewind, Wifi, WifiOff } from 'lucide-react';
import { formatTime } from '../../lib/youtube.js';
import { Stat } from '../ui/Stat.jsx';
import { VideoEtaPanel } from './VideoEtaPanel.jsx';

export function WatchSummary({ overview, advanced, selectedVideo, liveConnected }) {
  return (
    <section className="watch-summary">
      <div className="stats-grid">
        <Stat icon={Clock} label="Active study" value={formatTime(overview?.totals?.totalActiveSeconds || 0)} />
        <Stat icon={Pause} label="Pauses" value={overview?.totals?.totalPauseCount || 0} />
        <Stat icon={Rewind} label="Seeks / rewinds" value={overview?.totals?.totalSeekCount || 0} />
        <Stat icon={liveConnected ? Wifi : WifiOff} label="Live metrics" value={liveConnected ? 'Connected' : 'Offline'} />
      </div>
      <VideoEtaPanel advanced={advanced} selectedVideo={selectedVideo} />
    </section>
  );
}
