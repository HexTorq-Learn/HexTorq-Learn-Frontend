let apiPromise;

export function loadYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT);
      };

      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
    });
  }

  return apiPromise;
}

export function formatTime(totalSeconds = 0) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function groupHeatmapSegments(rows, threshold = 2) {
  const repeated = rows.filter((row) => row.watchCount >= threshold);
  const segments = [];

  for (const row of repeated) {
    const previous = segments[segments.length - 1];
    if (previous && row.second <= previous.end + 1) {
      previous.end = row.second;
      previous.max = Math.max(previous.max, row.watchCount);
    } else {
      segments.push({ start: row.second, end: row.second, max: row.watchCount });
    }
  }

  return segments.slice(0, 10);
}
