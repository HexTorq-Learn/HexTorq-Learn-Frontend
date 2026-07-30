import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { loadYouTubeApi } from '../lib/youtube.js';
import { PLAYER_STATES } from '../lib/constants.js';

// Ported verbatim (behavior-for-behavior) from the original monolithic LearningPlayer:
// session start/end, event buffer + heatmap buffer, 5s flush interval, idle/focus timers.
export function useYouTubePlayerTracking(video, { onFlush, onLocalMetric } = {}) {
  const holderRef = useRef(null);
  const playerRef = useRef(null);
  const sessionRef = useRef(null);
  const eventBuffer = useRef([]);
  const heatmapBuffer = useRef({});
  const playingRef = useRef(false);
  const lastTimeRef = useRef(null);
  const videoRef = useRef(video);
  const onFlushRef = useRef(onFlush);
  const onLocalMetricRef = useRef(onLocalMetric);
  const [status, setStatus] = useState('Loading');
  const [engaged, setEngaged] = useState(true);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [trackingError, setTrackingError] = useState('');
  const [mouseAway, setMouseAway] = useState(false);

  videoRef.current = video;
  onFlushRef.current = onFlush;
  onLocalMetricRef.current = onLocalMetric;

  const queueEvent = useCallback((eventType, extra = {}) => {
    const metricVideo = videoRef.current;
    const player = playerRef.current;
    const currentTime = player?.getCurrentTime ? player.getCurrentTime() : undefined;
    const playbackRate = player?.getPlaybackRate ? player.getPlaybackRate() : undefined;
    const event = {
      eventType,
      clientTs: new Date().toISOString(),
      metadata: {
        ...(Number.isFinite(playbackRate) ? { playbackRate } : {}),
        documentHidden: document.hidden,
        windowFocused: document.hasFocus(),
      },
      ...extra,
    };
    if (Number.isFinite(currentTime)) event.videoTimeSec = currentTime;
    eventBuffer.current.push(event);
    if (metricVideo) onLocalMetricRef.current?.({ type: 'event', eventType, video: metricVideo, videoTimeSec: event.videoTimeSec });
  }, []);

  const flush = useCallback(async (targetVideo = videoRef.current) => {
    if (!targetVideo || (!eventBuffer.current.length && !Object.keys(heatmapBuffer.current).length)) return;

    const events = eventBuffer.current.splice(0);
    const heatmapTicks = { ...heatmapBuffer.current };
    heatmapBuffer.current = {};

    try {
      await api('/api/tracking/ingest', {
        method: 'POST',
        body: JSON.stringify({
          videoId: targetVideo.id,
          ...(sessionRef.current ? { sessionId: sessionRef.current } : {}),
          events,
          heatmapTicks,
        }),
      });
      setTrackingError('');
      onFlushRef.current?.();
    } catch (error) {
      setTrackingError(error.message);
      if (error.status !== 400) {
        eventBuffer.current.unshift(...events);
        heatmapBuffer.current = Object.entries(heatmapTicks).reduce((acc, [second, count]) => {
          acc[second] = (acc[second] || 0) + count;
          return acc;
        }, heatmapBuffer.current);
      }
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let player;
    const activeVideo = video;
    setActiveSeconds(0);
    setTrackingError('');
    lastTimeRef.current = null;
    eventBuffer.current = [];
    heatmapBuffer.current = {};

    async function boot() {
      const session = await api('/api/tracking/sessions', {
        method: 'POST',
        body: JSON.stringify({ videoId: activeVideo.id }),
      });
      sessionRef.current = session.session.id;

      const YT = await loadYouTubeApi();
      if (disposed) return;

      player = new YT.Player(holderRef.current, {
        videoId: activeVideo.youtubeId,
        playerVars: { rel: 0, modestbranding: 1, iv_load_policy: 3, playsinline: 1, origin: window.location.origin },
        events: {
          onReady: () => setStatus('Ready'),
          onStateChange: (event) => {
            const eventType = PLAYER_STATES[event.data];
            if (!eventType) return;
            playingRef.current = event.data === 1;
            setStatus(eventType);
            queueEvent(eventType);
          },
        },
      });
      playerRef.current = player;
    }

    boot().catch((error) => setTrackingError(error.message));

    return () => {
      disposed = true;
      flush(activeVideo);
      if (sessionRef.current) api(`/api/tracking/sessions/${sessionRef.current}/end`, { method: 'PATCH' }).catch(() => {});
      player?.destroy?.();
      playerRef.current = null;
      sessionRef.current = null;
    };
  }, [flush, queueEvent, video.id, video.youtubeId]);

  useEffect(() => {
    let idleTimer;
    let outOfFocusTimer;
    let inactive = false;
    let outOfFocus = false;

    const markEngaged = () => {
      inactive = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        inactive = true;
        setEngaged(false);
        queueEvent('IDLE_START');
      }, 5 * 60 * 1000);
      if (!outOfFocus) setEngaged(true);
    };
    const onBlurOrHidden = (eventType) => {
      clearTimeout(outOfFocusTimer);
      outOfFocusTimer = setTimeout(() => {
        outOfFocus = true;
        setEngaged(false);
        queueEvent(eventType);
      }, 5 * 60 * 1000);
    };
    const onFocusOrVisible = (eventType) => {
      clearTimeout(outOfFocusTimer);
      if (outOfFocus || inactive) queueEvent(eventType);
      outOfFocus = false;
      setEngaged(!inactive);
    };
    const activityEvents = ['mousemove', 'keydown', 'scroll', 'click'];
    const onWindowBlur = () => onBlurOrHidden('WINDOW_BLUR');
    const onWindowFocus = () => onFocusOrVisible('WINDOW_FOCUS');
    const onVisibilityChange = () => (document.hidden ? onBlurOrHidden('TAB_HIDDEN') : onFocusOrVisible('TAB_VISIBLE'));

    markEngaged();
    activityEvents.forEach((name) => window.addEventListener(name, markEngaged));
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(outOfFocusTimer);
      activityEvents.forEach((name) => window.removeEventListener(name, markEngaged));
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [queueEvent]);

  useEffect(() => {
    const tick = setInterval(() => {
      const player = playerRef.current;
      if (!player?.getCurrentTime || !playingRef.current || !engaged) return;

      const currentTime = player.getCurrentTime();
      if (!Number.isFinite(currentTime)) return;

      const currentSecond = Math.floor(currentTime);
      const previous = lastTimeRef.current;
      if (previous !== null && Math.abs(currentTime - previous - 1) > 2.5) {
        queueEvent('SEEK', { fromTimeSec: previous, toTimeSec: currentTime });
      }

      heatmapBuffer.current[currentSecond] = (heatmapBuffer.current[currentSecond] || 0) + 1;
      lastTimeRef.current = currentTime;
      setActiveSeconds((value) => value + 1);
      if (videoRef.current) onLocalMetricRef.current?.({ type: 'tick', video: videoRef.current, second: currentSecond });
    }, 1000);

    const sync = setInterval(() => {
      queueEvent('FLUSH');
      flush();
    }, 5000);

    return () => {
      clearInterval(tick);
      clearInterval(sync);
    };
  }, [engaged, flush, queueEvent]);

  const restoreYouTubePointer = useCallback(() => {
    setMouseAway(false);
  }, []);

  const releaseYouTubeHover = useCallback(() => {
    setMouseAway(true);
    const iframe = playerRef.current?.getIframe?.();
    iframe?.blur?.();
    if (document.activeElement === iframe) document.body?.focus?.();
    window.focus?.();
    window.setTimeout(() => setMouseAway(false), 300);
  }, []);

  return {
    holderRef,
    status,
    engaged,
    activeSeconds,
    trackingError,
    mouseAway,
    releaseYouTubeHover,
    restoreYouTubePointer,
  };
}
