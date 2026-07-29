import { Activity } from 'lucide-react';
import { formatTime } from '../../../lib/youtube.js';
import { formatClockLabel } from '../../../lib/format.js';

export function EventTimeline({ timeMap }) {
  return (
    <div className="panel">
      <div className="panel-title"><Activity size={18} /><h3>Clock-time event trail</h3></div>
      <div className="timeline-list">
        {(timeMap?.timeline || []).slice().reverse().slice(0, 24).map((event) => (
          <div className="timeline-row" key={event.id}>
            <strong>{formatClockLabel(event.clock)}</strong>
            <span>{event.type}</span>
            <p>{event.video.title}{Number.isFinite(event.videoTimeSec) ? ` at ${formatTime(event.videoTimeSec)}` : ''}</p>
          </div>
        ))}
        {!timeMap?.timeline?.length && <p className="muted">No clock-time events yet.</p>}
      </div>
    </div>
  );
}
