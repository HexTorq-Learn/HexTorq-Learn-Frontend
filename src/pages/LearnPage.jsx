import { useEffect } from 'react';
import { Play } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useSocket } from '../providers/SocketProvider.jsx';
import { useVideos } from '../hooks/useVideos.js';
import { useAnalyticsOverview, useAdvancedMetrics, useVideoHeatmap } from '../hooks/useAnalytics.js';
import { useLocalMetricPatch } from '../hooks/useLocalMetricPatch.js';
import { LearningPlayer } from '../components/player/LearningPlayer.jsx';
import { WatchSummary } from '../components/player/WatchSummary.jsx';

export default function LearnPage() {
  const { auth } = useAuth();
  const { connected } = useSocket();
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { videos, loading } = useVideos();
  const { overview, timeMap, setOverview, setTimeMap } = useAnalyticsOverview();
  const { advanced, setAdvanced } = useAdvancedMetrics({ autoLoad: false });

  const selectedVideo = videos.find((video) => video.id === videoId) || null;
  const { heatmap, setHeatmap } = useVideoHeatmap(selectedVideo?.id);
  const playlistVideos = selectedVideo?.playlistId
    ? videos.filter((video) => video.playlistId === selectedVideo.playlistId)
    : videos.filter((video) => !video.playlistId);

  useEffect(() => {
    if (!loading && !videoId && videos[0]) {
      navigate(`/learn/${videos[0].id}`, { replace: true });
    }
  }, [loading, videoId, videos, navigate]);

  const applyLocalMetric = useLocalMetricPatch({
    userId: auth?.user?.id,
    heatmap,
    setAdvanced,
    setOverview,
    setTimeMap,
    setHeatmap,
  });

  function handleFlush() {
    // Realtime socket updates and local metric patches keep this page fresh.
    // Avoid polling heavy analytics endpoints every 5 seconds while video tracking is active.
  }

  if (!loading && !videos.length) {
    return (
      <div className="empty-state">
        <Play size={44} />
        <h1>Add a YouTube lesson to start tracking.</h1>
      </div>
    );
  }

  if (!selectedVideo) return null;

  return (
    <div className="learning-page">
      <LearningPlayer
        video={selectedVideo}
        playlistVideos={playlistVideos.length ? playlistVideos : videos}
        onSelectVideo={(nextVideo) => navigate(`/learn/${nextVideo.id}`)}
        onFlush={handleFlush}
        onLocalMetric={applyLocalMetric}
      />
      <WatchSummary overview={overview} advanced={advanced} selectedVideo={selectedVideo} liveConnected={connected} />
    </div>
  );
}
