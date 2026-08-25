import { useCallback, useEffect, useRef } from 'react';
import { api } from '../lib/api.js';
import { API_BASE } from '../lib/constants.js';
import { getStoredAuth } from '../lib/auth-storage.js';

// App-wide activity tracking (login/idle/logout), independent of whether a
// video is open -- distinct from useYouTubePlayerTracking, which only runs
// while a video player is mounted. Mirrors its idle-detection pattern
// (5 min inactivity threshold) but at the portal/session level via a
// heartbeat every 25s, since closing a tab never reliably fires a request.
const IDLE_THRESHOLD_MS = 5 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 25 * 1000;

export function usePortalActivityTracking(auth) {
  const sessionIdRef = useRef(null);
  const eventBufferRef = useRef([]);
  const activeSecondsRef = useRef(0);
  const idleSecondsRef = useRef(0);
  const engagedRef = useRef(true);

  const queueEvent = useCallback((eventType) => {
    eventBufferRef.current.push({ eventType, clientTs: new Date().toISOString() });
  }, []);

  const sendHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current) return;
    const events = eventBufferRef.current.splice(0);
    const activeSeconds = activeSecondsRef.current;
    const idleSeconds = idleSecondsRef.current;
    activeSecondsRef.current = 0;
    idleSecondsRef.current = 0;

    try {
      await api('/api/portal/heartbeat', {
        method: 'POST',
        body: JSON.stringify({ sessionId: sessionIdRef.current, activeSeconds, idleSeconds, events }),
      });
    } catch {
      // Best-effort: portal activity tracking should never block or break the app.
    }
  }, []);

  const authKey = auth?.user?.id;

  useEffect(() => {
    if (!authKey) return undefined;
    let disposed = false;

    api('/api/portal/sessions', { method: 'POST' })
      .then((result) => {
        if (!disposed) sessionIdRef.current = result.session.id;
      })
      .catch(() => {});

    return () => {
      disposed = true;
      const sessionId = sessionIdRef.current;
      sessionIdRef.current = null;
      if (sessionId) {
        api(`/api/portal/sessions/${sessionId}/end`, { method: 'PATCH' }).catch(() => {});
      }
    };
  }, [authKey]);

  useEffect(() => {
    if (!authKey) return undefined;

    let idleTimer;
    let inactive = false;

    const setEngaged = (value) => {
      if (engagedRef.current === value) return;
      engagedRef.current = value;
      queueEvent(value ? 'IDLE_END' : 'IDLE_START');
    };

    const markActivity = () => {
      inactive = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        inactive = true;
        setEngaged(false);
      }, IDLE_THRESHOLD_MS);
      if (!document.hidden) setEngaged(true);
    };

    const onVisibilityChange = () => {
      queueEvent(document.hidden ? 'TAB_HIDDEN' : 'TAB_VISIBLE');
      if (document.hidden) setEngaged(false);
      else if (!inactive) setEngaged(true);
    };

    const activityEvents = ['mousemove', 'keydown', 'scroll', 'click'];
    markActivity();
    activityEvents.forEach((name) => window.addEventListener(name, markActivity));
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(idleTimer);
      activityEvents.forEach((name) => window.removeEventListener(name, markActivity));
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [authKey, queueEvent]);

  useEffect(() => {
    if (!authKey) return undefined;

    const tick = setInterval(() => {
      if (engagedRef.current) activeSecondsRef.current += 1;
      else idleSecondsRef.current += 1;
    }, 1000);
    const heartbeat = setInterval(() => { sendHeartbeat(); }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(tick);
      clearInterval(heartbeat);
    };
  }, [authKey, sendHeartbeat]);

  useEffect(() => {
    if (!authKey) return undefined;

    const onBeforeUnload = () => {
      const sessionId = sessionIdRef.current;
      if (!sessionId || !navigator.sendBeacon) return;
      const stored = getStoredAuth();
      if (!stored?.token) return;
      const blob = new Blob([JSON.stringify({ token: stored.token, sessionId })], { type: 'application/json' });
      navigator.sendBeacon(`${API_BASE}/api/portal/beacon-end`, blob);
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [authKey]);
}
