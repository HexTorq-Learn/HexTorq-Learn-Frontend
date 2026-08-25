import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useSocket } from '../providers/SocketProvider.jsx';

export function useNotifications() {
  const { auth } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const reload = useCallback(async () => {
    if (!auth) return;
    const data = await api('/api/notifications');
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }, [auth]);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  useEffect(() => {
    if (!socket) return undefined;
    const onNew = (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 30));
      setUnreadCount((count) => count + 1);
    };
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [socket]);

  const markRead = useCallback(async (id) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await api(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      reload().catch(() => {});
    }
  }, [reload]);

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    try {
      await api('/api/notifications/read-all', { method: 'POST' });
    } catch {
      reload().catch(() => {});
    }
  }, [reload]);

  return { notifications, unreadCount, reload, markRead, markAllRead };
}
