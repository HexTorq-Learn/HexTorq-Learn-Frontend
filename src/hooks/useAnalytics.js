import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useSocket } from '../providers/SocketProvider.jsx';

export function useAnalyticsOverview() {
  const { auth } = useAuth();
  const { socket } = useSocket();
  const [overview, setOverview] = useState(null);
  const [timeMap, setTimeMap] = useState(null);
  const pendingRef = useRef(null);

  const reload = useCallback(async () => {
    if (!auth) return;
    if (!pendingRef.current) {
      pendingRef.current = Promise.all([
        api('/api/analytics/overview'),
        api('/api/analytics/time-map'),
      ])
        .then(([overviewData, mapData]) => {
          setOverview(overviewData);
          setTimeMap(mapData);
        })
        .finally(() => {
          pendingRef.current = null;
        });
    }
    return pendingRef.current;
  }, [auth]);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  useEffect(() => {
    if (!socket) return undefined;
    const onUpdate = ({ overview: nextOverview, timeMap: nextTimeMap }) => {
      setOverview(nextOverview);
      setTimeMap(nextTimeMap);
    };
    socket.on('metrics:update', onUpdate);
    return () => socket.off('metrics:update', onUpdate);
  }, [socket]);

  return { overview, timeMap, reload, setOverview, setTimeMap };
}

export function useAdvancedMetrics({ autoLoad = true } = {}) {
  const { auth } = useAuth();
  const [advanced, setAdvanced] = useState(null);
  const pendingRef = useRef(null);

  const reload = useCallback(async () => {
    if (!auth) return;
    if (!pendingRef.current) {
      pendingRef.current = api('/api/analytics/advanced')
        .then((data) => {
          setAdvanced(data);
        })
        .finally(() => {
          pendingRef.current = null;
        });
    }
    return pendingRef.current;
  }, [auth]);

  useEffect(() => {
    if (!autoLoad) return;
    reload().catch(() => {});
  }, [autoLoad, reload]);

  return { advanced, setAdvanced, reload };
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await api('/api/analytics/leaderboard');
    setLeaderboard(data.leaderboard || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload().catch(() => setLoading(false));
  }, [reload]);

  return { leaderboard, loading, reload };
}

export function useVideoHeatmap(videoId) {
  const [heatmap, setHeatmap] = useState(null);

  const reload = useCallback(async () => {
    if (!videoId) {
      setHeatmap(null);
      return;
    }
    const data = await api(`/api/analytics/videos/${videoId}/heatmap`);
    setHeatmap(data);
  }, [videoId]);

  useEffect(() => {
    reload().catch(() => setHeatmap(null));
  }, [reload]);

  return { heatmap, setHeatmap, reload };
}
