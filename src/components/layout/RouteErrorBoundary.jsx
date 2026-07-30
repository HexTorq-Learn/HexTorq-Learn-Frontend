import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router-dom';

const CHUNK_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'ChunkLoadError',
  'error loading dynamically imported module',
];

function isChunkLoadError(error) {
  const message = String(error?.message || error || '');
  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export function RouteErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    if (!isChunkLoadError(error)) return;
    const key = 'hextorq-learn:route-chunk-reload';
    if (sessionStorage.getItem(key) === window.location.href) return;
    sessionStorage.setItem(key, window.location.href);
    window.location.reload();
  }, [error]);

  return (
    <div className="empty-state">
      <h1>App update required.</h1>
      <p className="muted">Refresh the page to load the latest version.</p>
      <button className="primary" onClick={() => window.location.reload()}>Refresh</button>
      <Link className="ghost-link" to="/learn">Back to learning</Link>
    </div>
  );
}
