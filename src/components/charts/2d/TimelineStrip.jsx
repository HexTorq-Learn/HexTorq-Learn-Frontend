import { formatClockLabel } from '../../../lib/format.js';

export function TimelineStrip({ events = [] }) {
  return (
    <div className="timeline-strip">
      <div className="chart-title">Event sequence strip</div>
      <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
        {events.slice(-42).map((event) => (
          <span
            key={event.id}
            title={`${formatClockLabel(event.clock)} · ${event.type}`}
            style={{
              width: 8,
              height: 20,
              borderRadius: 2,
              background: event.type === 'PLAY' ? 'var(--color-brand-500)' : 'var(--color-accent-500)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
