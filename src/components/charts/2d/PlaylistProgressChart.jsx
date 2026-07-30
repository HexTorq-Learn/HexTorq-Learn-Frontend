import { MiniBar } from '../../ui/MiniBar.jsx';

export function PlaylistProgressChart({ rows = [] }) {
  return (
    <div className="chart-block">
      <div className="chart-title">Playlist progress</div>
      <div className="funnel-list">
        {rows.map((row) => (
          <MiniBar key={row.id} label={row.name} value={row.completionPercent || 0} max={100} detail={`${row.completedVideos}/${row.videoCount} completed`} />
        ))}
        {!rows.length && <p className="muted">No playlists yet.</p>}
      </div>
    </div>
  );
}
