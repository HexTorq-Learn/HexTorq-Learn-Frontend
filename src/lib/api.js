import { API_BASE } from './constants.js';
import { clearStoredAuth, getStoredAuth } from './auth-storage.js';

export async function api(path, options = {}) {
  const auth = getStoredAuth();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = Array.isArray(data.issues)
      ? `: ${data.issues.map((issue) => `${issue.path?.join('.') || 'body'} ${issue.message}`).join('; ')}`
      : '';
    const error = new Error(`${data.message || `Request failed: ${response.status}`}${details}`);
    error.status = response.status;
    error.data = data;

    if (response.status === 401) {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent('auth-expired', {
        detail: { message: error.message },
      }));
    }

    throw error;
  }

  return data;
}
