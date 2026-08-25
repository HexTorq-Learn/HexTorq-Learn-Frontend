import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useSocket } from '../providers/SocketProvider.jsx';

export function useAdminData() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [contentInsights, setContentInsights] = useState(null);
  const [contentInsightsLoading, setContentInsightsLoading] = useState(false);
  const [error, setError] = useState('');
  const { socket } = useSocket();
  const loadingRef = useRef({});
  const loadedRef = useRef({
    summary: false,
    users: false,
    videos: false,
    playlists: false,
    comparison: false,
    contentInsights: false,
  });

  const runOnce = useCallback(async (key, force, task) => {
    if (!force && loadedRef.current[key]) return;
    if (loadingRef.current[key]) return loadingRef.current[key];
    setError('');
    loadingRef.current[key] = task()
      .then(() => {
        loadedRef.current[key] = true;
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        loadingRef.current[key] = null;
      });
    return loadingRef.current[key];
  }, []);

  const reloadSummary = useCallback((force = true) => runOnce('summary', force, async () => {
    const summaryData = await api('/api/admin/summary');
    setSummary(summaryData);
  }), [runOnce]);

  const reloadUsers = useCallback((force = true) => runOnce('users', force, async () => {
    const userData = await api('/api/admin/users');
    setUsers(userData.users);
  }), [runOnce]);

  const reloadVideos = useCallback((force = true) => runOnce('videos', force, async () => {
    const videoData = await api('/api/admin/videos');
    setVideos(videoData.videos);
  }), [runOnce]);

  const reloadPlaylists = useCallback((force = true) => runOnce('playlists', force, async () => {
    const playlistData = await api('/api/playlists?lite=1');
    setPlaylists(playlistData.playlists);
  }), [runOnce]);

  const ensureSummary = useCallback(() => reloadSummary(false), [reloadSummary]);
  const ensureUsers = useCallback(() => reloadUsers(false), [reloadUsers]);
  const ensureVideos = useCallback(() => reloadVideos(false), [reloadVideos]);
  const ensurePlaylists = useCallback(() => reloadPlaylists(false), [reloadPlaylists]);

  const reloadCore = useCallback(async () => {
    await Promise.all([
      reloadSummary(true),
      reloadUsers(true),
      reloadVideos(true),
      reloadPlaylists(true),
    ]);
  }, [reloadSummary, reloadUsers, reloadVideos, reloadPlaylists]);

  const ensureCore = useCallback(async () => {
    await Promise.all([
      ensureSummary(),
      ensureUsers(),
      ensureVideos(),
      ensurePlaylists(),
    ]);
  }, [ensureSummary, ensureUsers, ensureVideos, ensurePlaylists]);

  const reloadComparison = useCallback(async () => {
    setComparisonLoading(true);
    await runOnce('comparison', true, async () => {
      const comparisonData = await api('/api/admin/analytics/comparison');
      setComparison(comparisonData);
    });
    setComparisonLoading(false);
  }, [runOnce]);

  const reloadOverview = useCallback(async () => {
    try {
      await Promise.all([
        reloadSummary(true),
        reloadUsers(true),
        reloadVideos(true),
      ]);
      reloadComparison();
    } catch (err) {
      setError(err.message);
    }
  }, [reloadSummary, reloadUsers, reloadVideos, reloadComparison]);

  const reloadVideosPage = useCallback(async () => {
    await Promise.all([reloadVideos(true), reloadPlaylists(true)]);
  }, [reloadVideos, reloadPlaylists]);

  const ensureVideosPage = useCallback(async () => {
    await Promise.all([ensureVideos(), ensurePlaylists()]);
  }, [ensureVideos, ensurePlaylists]);

  const reloadPlaylistsPage = useCallback(async () => {
    await reloadPlaylists(true);
  }, [reloadPlaylists]);

  const ensurePlaylistsPage = useCallback(async () => {
    await ensurePlaylists();
  }, [ensurePlaylists]);

  const reloadUsersPage = useCallback(async () => {
    await reloadUsers(true);
  }, [reloadUsers]);

  const ensureUsersPage = useCallback(async () => {
    await ensureUsers();
  }, [ensureUsers]);

  const ensureComparison = useCallback(async () => {
    if (loadedRef.current.comparison) return;
    setComparisonLoading(true);
    await runOnce('comparison', false, async () => {
      const comparisonData = await api('/api/admin/analytics/comparison');
      setComparison(comparisonData);
    });
    setComparisonLoading(false);
  }, [runOnce]);

  const reloadContentInsights = useCallback(async () => {
    setContentInsightsLoading(true);
    await runOnce('contentInsights', true, async () => {
      const data = await api('/api/admin/analytics/content-insights');
      setContentInsights(data);
    });
    setContentInsightsLoading(false);
  }, [runOnce]);

  const ensureContentInsights = useCallback(async () => {
    if (loadedRef.current.contentInsights) return;
    setContentInsightsLoading(true);
    await runOnce('contentInsights', false, async () => {
      const data = await api('/api/admin/analytics/content-insights');
      setContentInsights(data);
    });
    setContentInsightsLoading(false);
  }, [runOnce]);

  const reload = useCallback(async () => {
    await reloadCore();
    reloadComparison();
  }, [reloadCore, reloadComparison]);

  useEffect(() => {
    if (!socket) return undefined;
    let timer;
    const onAdminUpdate = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (loadedRef.current.summary) reloadSummary(true);
        if (loadedRef.current.users) reloadUsers(true);
      }, 5000);
    };
    socket.on('admin:metrics:update', onAdminUpdate);
    return () => {
      clearTimeout(timer);
      socket.off('admin:metrics:update', onAdminUpdate);
    };
  }, [socket, reloadSummary, reloadUsers]);

  return {
    summary,
    users,
    videos,
    playlists,
    comparison,
    comparisonLoading,
    error,
    reload,
    reloadCore,
    ensureCore,
    reloadOverview,
    reloadSummary,
    ensureSummary,
    reloadUsers,
    ensureUsers,
    reloadUsersPage,
    ensureUsersPage,
    reloadVideos,
    ensureVideos,
    reloadVideosPage,
    ensureVideosPage,
    reloadPlaylists,
    ensurePlaylists,
    reloadPlaylistsPage,
    ensurePlaylistsPage,
    reloadComparison,
    ensureComparison,
    contentInsights,
    contentInsightsLoading,
    reloadContentInsights,
    ensureContentInsights,
  };
}

export function useAdminUserDetail(userId) {
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [userTimeMap, setUserTimeMap] = useState(null);
  const [userAdvanced, setUserAdvanced] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [advancedLoading, setAdvancedLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setUserAnalytics(null);
      setUserTimeMap(null);
      setUserAdvanced(null);
      setDetailLoading(false);
      setAdvancedLoading(false);
      return;
    }
    setUserAnalytics(null);
    setUserTimeMap(null);
    setUserAdvanced(null);
    setDetailLoading(true);
    setAdvancedLoading(true);

    Promise.all([
      api(`/api/admin/analytics/users/${userId}`),
      api(`/api/admin/analytics/users/${userId}/time-map`),
    ])
      .then(([analyticsData, timeMapData]) => {
        if (cancelled) return;
        setUserAnalytics(analyticsData);
        setUserTimeMap(timeMapData);
      })
      .catch(() => {
        if (cancelled) return;
        setUserAnalytics(null);
        setUserTimeMap(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    api(`/api/admin/analytics/users/${userId}/advanced`)
      .then((advancedData) => {
        if (!cancelled) setUserAdvanced(advancedData);
      })
      .catch(() => {
        if (cancelled) return;
        setUserAdvanced(null);
      })
      .finally(() => {
        if (!cancelled) setAdvancedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { userAnalytics, userTimeMap, userAdvanced, detailLoading, advancedLoading };
}
