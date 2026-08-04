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
  const [error, setError] = useState('');
  const { socket } = useSocket();
  const coreReloadingRef = useRef(false);

  const reloadCore = useCallback(async () => {
    if (coreReloadingRef.current) return;
    coreReloadingRef.current = true;
    setError('');
    try {
      const [summaryData, userData, videoData, playlistData] = await Promise.all([
        api('/api/admin/summary'),
        api('/api/admin/users'),
        api('/api/admin/videos'),
        api('/api/playlists'),
      ]);
      setSummary(summaryData);
      setUsers(userData.users);
      setVideos(videoData.videos);
      setPlaylists(playlistData.playlists);
    } catch (err) {
      setError(err.message);
    } finally {
      coreReloadingRef.current = false;
    }
  }, []);

  const reloadComparison = useCallback(async () => {
    setComparisonLoading(true);
    try {
      const comparisonData = await api('/api/admin/analytics/comparison');
      setComparison(comparisonData);
    } catch (err) {
      setError(err.message);
    } finally {
      setComparisonLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    await reloadCore();
    reloadComparison();
  }, [reloadCore, reloadComparison]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!socket) return undefined;
    let timer;
    const onAdminUpdate = () => {
      clearTimeout(timer);
      timer = setTimeout(() => reloadCore(), 3000);
    };
    socket.on('admin:metrics:update', onAdminUpdate);
    return () => {
      clearTimeout(timer);
      socket.off('admin:metrics:update', onAdminUpdate);
    };
  }, [socket, reloadCore]);

  return { summary, users, videos, playlists, comparison, comparisonLoading, error, reload, reloadComparison };
}

export function useAdminUserDetail(userId) {
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [userTimeMap, setUserTimeMap] = useState(null);
  const [userAdvanced, setUserAdvanced] = useState(null);

  useEffect(() => {
    if (!userId) {
      setUserAnalytics(null);
      setUserTimeMap(null);
      setUserAdvanced(null);
      return;
    }
    Promise.all([
      api(`/api/admin/analytics/users/${userId}`),
      api(`/api/admin/analytics/users/${userId}/time-map`),
      api(`/api/admin/analytics/users/${userId}/advanced`),
    ])
      .then(([analyticsData, timeMapData, advancedData]) => {
        setUserAnalytics(analyticsData);
        setUserTimeMap(timeMapData);
        setUserAdvanced(advancedData);
      })
      .catch(() => {
        setUserAnalytics(null);
        setUserTimeMap(null);
        setUserAdvanced(null);
      });
  }, [userId]);

  return { userAnalytics, userTimeMap, userAdvanced };
}
