import { useCallback } from 'react';
import { formatDateKey } from '../lib/format.js';

// Applies optimistic local patches to overview/timeMap/advanced/heatmap state between
// server flush cycles, mirroring the server-side aggregation logic closely enough to
// avoid visible flicker while the 5s tracking flush is in flight.
export function useLocalMetricPatch({ userId, heatmap, setAdvanced, setOverview, setTimeMap, setHeatmap }) {
  return useCallback((metric) => {
    const now = new Date();
    const today = formatDateKey(now);

    if (metric.type === 'tick') {
      setAdvanced?.((current) => {
        if (!current) return current;
        const videoCompletion = (current.videoCompletion || []).map((video) => {
          if (video.id !== metric.video.id) return video;
          const alreadyWatched = (heatmap?.heatmap || []).some((row) => row.second === metric.second && row.watchCount > 0);
          const uniqueWatchedSeconds = video.uniqueWatchedSeconds + (alreadyWatched ? 0 : 1);
          const rewatchedSeconds = video.rewatchedSeconds + (alreadyWatched ? 1 : 0);
          return {
            ...video,
            uniqueWatchedSeconds,
            rewatchedSeconds,
            skippedSeconds: Math.max(0, video.durationSec - uniqueWatchedSeconds),
            percentWatched: Math.min(100, Math.round((uniqueWatchedSeconds / Math.max(1, video.durationSec)) * 100)),
            lastWatchedPosition: metric.second,
          };
        });
        return { ...current, videoCompletion };
      });

      setOverview?.((current) => {
        if (!current) return current;
        const summaries = [...(current.summaries || [])];
        const existingIndex = summaries.findIndex((summary) => (
          summary.videoId === metric.video.id && summary.date?.slice(0, 10) === today
        ));

        if (existingIndex >= 0) {
          summaries[existingIndex] = {
            ...summaries[existingIndex],
            activeWatchSeconds: summaries[existingIndex].activeWatchSeconds + 1,
          };
        } else {
          summaries.unshift({
            id: `local-${metric.video.id}-${today}`,
            userId,
            videoId: metric.video.id,
            video: metric.video,
            date: `${today}T00:00:00.000Z`,
            activeWatchSeconds: 1,
            pauseCount: 0,
            seekCount: 0,
            sessionCount: 0,
          });
        }

        return {
          ...current,
          totals: {
            ...current.totals,
            totalActiveSeconds: (current.totals?.totalActiveSeconds || 0) + 1,
          },
          summaries,
        };
      });

      setHeatmap?.((current) => {
        if (!current) return current;
        const rows = [...(current.heatmap || [])];
        const existingIndex = rows.findIndex((row) => row.second === metric.second);
        if (existingIndex >= 0) {
          rows[existingIndex] = { ...rows[existingIndex], watchCount: rows[existingIndex].watchCount + 1 };
        } else {
          rows.push({ id: `local-${metric.video.id}-${metric.second}`, videoId: metric.video.id, second: metric.second, watchCount: 1 });
        }
        rows.sort((a, b) => a.second - b.second);
        return {
          ...current,
          heatmap: rows,
          maxWatchCount: Math.max(current.maxWatchCount || 0, rows[existingIndex >= 0 ? existingIndex : rows.length - 1].watchCount),
        };
      });
    }

    if (metric.type === 'event') {
      setOverview?.((current) => {
        if (!current) return current;
        const pauseDelta = metric.eventType === 'PAUSE' ? 1 : 0;
        const seekDelta = metric.eventType === 'SEEK' ? 1 : 0;
        if (!pauseDelta && !seekDelta) return current;

        return {
          ...current,
          totals: {
            ...current.totals,
            totalPauseCount: (current.totals?.totalPauseCount || 0) + pauseDelta,
            totalSeekCount: (current.totals?.totalSeekCount || 0) + seekDelta,
          },
        };
      });

      setTimeMap?.((current) => {
        if (!current?.hours) return current;
        const hour = now.getHours();
        const minute = now.getMinutes();
        const hours = current.hours.map((bucket) => {
          if (bucket.hour !== hour) return bucket;
          return {
            ...bucket,
            activeEvents: bucket.activeEvents + 1,
            playEvents: bucket.playEvents + (metric.eventType === 'PLAY' ? 1 : 0),
            pauseEvents: bucket.pauseEvents + (metric.eventType === 'PAUSE' ? 1 : 0),
            seekEvents: bucket.seekEvents + (metric.eventType === 'SEEK' ? 1 : 0),
            seconds: bucket.seconds.map((entry) => (entry.minute === minute ? { ...entry, count: entry.count + 1 } : entry)),
          };
        });

        return {
          ...current,
          hours,
          timeline: [
            ...(current.timeline || []),
            {
              id: `local-${Date.now()}-${metric.eventType}`,
              type: metric.eventType,
              clock: now.toLocaleTimeString('en-US', { hour12: true }),
              serverTs: now.toISOString(),
              videoTimeSec: metric.videoTimeSec,
              video: { id: metric.video.id, title: metric.video.title, youtubeId: metric.video.youtubeId },
            },
          ].slice(-120),
        };
      });
    }
  }, [userId, heatmap, setAdvanced, setOverview, setTimeMap, setHeatmap]);
}
