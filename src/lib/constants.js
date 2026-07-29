export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://git-pipeline.metatronhost.in/hextorq-learn';
export const API_URL = new URL(API_BASE);
export const SOCKET_PATH = `${API_URL.pathname.replace(/\/$/, '')}/socket.io`;
export const PLAYER_STATES = { [-1]: 'UNSTARTED', 0: 'END', 1: 'PLAY', 2: 'PAUSE', 3: 'BUFFER' };
export const AUTH_STORAGE_KEY = 'hextorq_learn_auth';
export const THEME_STORAGE_KEY = 'hextorq_learn_theme';
