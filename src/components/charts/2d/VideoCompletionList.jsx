import { MiniBar } from '../../ui/MiniBar.jsx';
import { formatTime } from '../../../lib/youtube.js';

export function VideoCompletionList({ rows = [] }) {
  return (
    <div className="chart-block">
      <div className="chart-title">Video completion list</div>
      <div className="funnel-list">
        {rows.slice(0, 10).map((row) => (
          <MiniBar key={row.id} label={row.title} value={row.percentWatched} max={100} detail={`${row.percentWatched}% · resume ${formatTime(row.lastWatchedPosition || 0)}`} />
        ))}
      </div>
    </div>
  );
}
