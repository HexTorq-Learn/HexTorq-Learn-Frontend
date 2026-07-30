import { formatTime } from '../../lib/youtube.js';
import { useYouTubePlayerTracking } from '../../hooks/useYouTubePlayerTracking.js';

export function LearningPlayer({ video, onFlush, onLocalMetric }) {
  const {
    holderRef,
    status,
    engaged,
    activeSeconds,
    trackingError,
    mouseAway,
    releaseYouTubeHover,
    restoreYouTubePointer,
  } = useYouTubePlayerTracking(video, { onFlush, onLocalMetric });

  return (
    <section className="player-section">
      <div
        className={mouseAway ? 'player-wrap mouse-away' : 'player-wrap'}
        onMouseEnter={restoreYouTubePointer}
        onMouseMove={restoreYouTubePointer}
        onMouseLeave={releaseYouTubeHover}
      >
        <div ref={holderRef} className="player-target" />
      </div>
      <div className="player-meta">
        <div>
          <p className="eyebrow">Now tracking</p>
          <h2>{video.title}</h2>
          <span className="subtle muted">{video.playlist?.name || 'No playlist'}</span>
        </div>
        <div className="status-row">
          <span className={engaged ? 'pill good' : 'pill warn'}>{engaged ? 'Counting active study time' : 'Paused for inactivity'}</span>
          <span className="pill">{status}</span>
          <span className="pill">{formatTime(activeSeconds)} active now</span>
        </div>
        {trackingError && <p className="error">Tracking sync failed: {trackingError}</p>}
      </div>
    </section>
  );
}
