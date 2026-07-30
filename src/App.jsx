import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider.jsx';
import { SocketProvider } from './providers/SocketProvider.jsx';
import { router } from './routes.jsx';

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

function recoverFromStaleChunk(error) {
  if (!isChunkLoadError(error)) return false;
  const key = 'hextorq-learn:chunk-reload';
  if (sessionStorage.getItem(key) === window.location.href) return false;
  sessionStorage.setItem(key, window.location.href);
  window.location.reload();
  return true;
}

export default function App() {
  useEffect(() => {
    const onUnhandledRejection = (event) => {
      if (recoverFromStaleChunk(event.reason)) event.preventDefault();
    };
    const onError = (event) => {
      if (recoverFromStaleChunk(event.error || event.message)) event.preventDefault();
    };

    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.addEventListener('error', onError);
    return () => {
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      window.removeEventListener('error', onError);
    };
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </AuthProvider>
  );
}
