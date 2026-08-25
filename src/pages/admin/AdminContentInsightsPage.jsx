import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertTriangle, Film, Users } from 'lucide-react';
import { formatTime } from '../../lib/youtube.js';
import { Stat } from '../../components/ui/Stat.jsx';

function formatRange(startSec, endSec) {
  return startSec === endSec ? formatTime(startSec) : `${formatTime(startSec)}-${formatTime(endSec)}`;
}

export default function AdminContentInsightsPage() {
  const { contentInsights, contentInsightsLoading, ensureContentInsights } = useOutletContext();
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    ensureContentInsights();
  }, [ensureContentInsights]);

  const videos = contentInsights?.videos || [];
  const selected = videos.find((video) => video.videoId === selectedId) || videos[0] || null;

  return (
    <div className="admin-analytics-page">
      <div className="stats-grid">
        <Stat icon={Film} label="Videos with activity" value={videos.length} />
        <Stat icon={AlertTriangle} label="Flagged hot spots" value={videos.reduce((total, video) => total + video.hotMoments.length, 0)} />
        <Stat icon={Users} label="Most-watched video viewers" value={Math.max(0, ...videos.map((video) => video.viewerCount))} />
      </div>

      {contentInsightsLoading && !videos.length && <p className="muted">Loading content insights...</p>}
      {!contentInsightsLoading && !videos.length && <p className="muted">No watch activity recorded yet.</p>}

      {Boolean(videos.length) && (
        <div className="admin-grid">
          <div className="panel">
            <div className="panel-title"><AlertTriangle size={18} /><h3>Ranked by cross-learner difficulty</h3></div>
            <div className="admin-list">
              {videos.map((video, index) => (
                <button
                  type="button"
                  key={video.videoId}
                  className={selected?.videoId === video.videoId ? 'admin-row active' : 'admin-row'}
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: '1px solid var(--color-border)' }}
                  onClick={() => setSelectedId(video.videoId)}
                >
                  <div className="row-main">
                    <strong>#{index + 1} {video.title}</strong>
                    <span>
                      {video.playlistName} · {video.viewerCount} viewers · difficulty score {video.crossUserDifficultyScore}
                    </span>
                    <span className="daily-minutes-line">
                      {video.avgPauseRate} pauses/viewer · {video.avgRewindRate} rewinds/viewer · {video.hotMoments.length} hot spots
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title"><Film size={18} /><h3>{selected ? selected.title : 'Select a video'}</h3></div>
            {selected && (
              <>
                <div className="metric-grid" style={{ marginBottom: '1rem' }}>
                  <div className="metric-card"><span>Viewers</span><strong>{selected.viewerCount}</strong></div>
                  <div className="metric-card"><span>Pauses / viewer</span><strong>{selected.avgPauseRate}</strong></div>
                  <div className="metric-card"><span>Rewinds / viewer</span><strong>{selected.avgRewindRate}</strong></div>
                  <div className="metric-card"><span>Difficulty score</span><strong>{selected.crossUserDifficultyScore}</strong></div>
                </div>
                <div className="chart-title">Hot-spot time ranges (rewatched far more than average)</div>
                <div className="funnel-list">
                  {selected.hotMoments.map((moment) => (
                    <div className="compact-row" key={`${moment.startSec}-${moment.endSec}`}>
                      <strong>{formatRange(moment.startSec, moment.endSec)}</strong>
                      <span>rewatched {moment.peakRatio}x on average by {moment.peakViewerCount} viewers</span>
                    </div>
                  ))}
                  {!selected.hotMoments.length && <p className="muted">No unusually confusing sections detected for this video yet.</p>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
