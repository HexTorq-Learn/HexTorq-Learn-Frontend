const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export function getStoredAuth() {
  const raw = localStorage.getItem('hextorq_learn_auth');
  return raw ? JSON.parse(raw) : null;
}

export function setStoredAuth(auth) {
  localStorage.setItem('hextorq_learn_auth', JSON.stringify(auth));
}

export function clearStoredAuth() {
  localStorage.removeItem('hextorq_learn_auth');
}

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
    const error = new Error(data.message || `Request failed: ${response.status}`);
    error.status = response.status;

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
