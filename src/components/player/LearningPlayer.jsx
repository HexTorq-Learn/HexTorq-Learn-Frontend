import { formatTime } from '../../lib/youtube.js';
import { useYouTubePlayerTracking } from '../../hooks/useYouTubePlayerTracking.js';

export function LearningPlayer({ video, playlistVideos = [], onSelectVideo, onFlush, onLocalMetric }) {
  const {
    holderRef,
    status,
    engaged,
    activeSeconds,
    trackingError,
    mouseAway,
    isPlaying,
    togglePlayback,
    releaseYouTubeHover,
    restoreYouTubePointer,
  } = useYouTubePlayerTracking(video, { onFlush, onLocalMetric });

  return (
    <section className="player-section">
      <div
        className={mouseAway || isPlaying ? 'player-wrap youtube-hover-locked' : 'player-wrap'}
        onMouseEnter={restoreYouTubePointer}
        onMouseMove={restoreYouTubePointer}
        onMouseLeave={releaseYouTubeHover}
      >
        <div ref={holderRef} className="player-target" />
        {isPlaying && (
          <button
            type="button"
            className="player-click-layer"
            onClick={togglePlayback}
            title="Pause video"
            aria-label="Pause video"
          />
        )}
      </div>
      <div className="playlist-under-player">
        <div className="playlist-under-header">
          <div>
            <strong>{video.playlist?.name || 'No playlist'}</strong>
            <span>{playlistVideos.findIndex((item) => item.id === video.id) + 1 || 1} / {playlistVideos.length || 1}</span>
          </div>
          <span>{playlistVideos.length} videos</span>
        </div>
        <div className="playlist-under-list">
          {playlistVideos.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={item.id === video.id ? 'playlist-under-item active' : 'playlist-under-item'}
              onClick={() => onSelectVideo?.(item)}
            >
              <span className="playlist-index">{index + 1}</span>
              <img src={`https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`} alt="" />
              <span className="playlist-under-title">
                <strong>{item.title}</strong>
                <small>{item.playlist?.name || 'No playlist'}{item.durationSec ? ` · ${formatTime(item.durationSec)}` : ''}</small>
              </span>
            </button>
          ))}
        </div>
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
