import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../providers/AuthProvider.jsx';

export function useVideos() {
  const { auth } = useAuth();
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!auth) return;
    const [videoData, playlistData] = await Promise.all([
      api('/api/videos'),
      api('/api/playlists'),
    ]);
    setVideos(videoData.videos);
    setPlaylists(playlistData.playlists);
    setLoading(false);
  }, [auth]);

  useEffect(() => {
    reload().catch(() => setLoading(false));
  }, [reload]);

  return { videos, playlists, loading, reload };
}
