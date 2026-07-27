import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Clock,
  Edit3,
  Eye,
  ListVideo,
  LogOut,
  Shield,
  Trash2,
  Users,
  Pause,
  Play,
  Plus,
  Rewind,
  TimerReset,
} from 'lucide-react';
import { api, clearStoredAuth, getStoredAuth, setStoredAuth } from './api.js';
import { formatTime, groupHeatmapSegments, loadYouTubeApi } from './youtube.js';

const PLAYER_STATES = {
  [-1]: 'UNSTARTED',
  0: 'END',
  1: 'PLAY',
  2: 'PAUSE',
  3: 'BUFFER',
};

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="stat">
      <Icon size={18} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');

    try {
      const payload = mode === 'register'
        ? form
        : { email: form.email, password: form.password };
      const auth = await api(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStoredAuth(auth);
      onAuth(auth);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">HexTorq Learn</p>
          <h1>Track real study time from YouTube lessons.</h1>
        </div>
        <div className="mode-switch">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <label>
              Name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit">{mode === 'login' ? 'Login' : 'Create account'}</button>
        </form>
      </section>
    </main>
  );
}

function VideoForm({ onCreated }) {
  const [form, setForm] = useState({ url: '', title: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');

    try {
      const { video } = await api('/api/videos', {
        method: 'POST',
        body: JSON.stringify({ url: form.url, title: form.title || undefined }),
      });
      setForm({ url: '', title: '' });
      onCreated(video);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="video-form" onSubmit={submit}>
      <input placeholder="Paste YouTube link" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} required />
      <input placeholder="Title optional" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
      <button className="icon-button" type="submit" title="Add video"><Plus size={18} /></button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function LearningPlayer({ video, onFlush }) {
  const holderRef = useRef(null);
  const playerRef = useRef(null);
  const sessionRef = useRef(null);
  const eventBuffer = useRef([]);
  const heatmapBuffer = useRef({});
  const playingRef = useRef(false);
  const lastTimeRef = useRef(null);
  const [status, setStatus] = useState('Loading');
  const [engaged, setEngaged] = useState(true);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [trackingError, setTrackingError] = useState('');

  const queueEvent = useCallback((eventType, extra = {}) => {
    const player = playerRef.current;
    const videoTimeSec = player?.getCurrentTime ? player.getCurrentTime() : undefined;
    const event = {
      eventType,
      clientTs: new Date().toISOString(),
      ...extra,
    };

    if (Number.isFinite(videoTimeSec)) {
      event.videoTimeSec = videoTimeSec;
    }

    eventBuffer.current.push(event);
  }, []);

  const flush = useCallback(async () => {
    if (!video || (!eventBuffer.current.length && !Object.keys(heatmapBuffer.current).length)) {
      return;
    }

    const events = eventBuffer.current.splice(0);
    const heatmapTicks = { ...heatmapBuffer.current };
    heatmapBuffer.current = {};

    try {
      await api('/api/tracking/ingest', {
        method: 'POST',
        body: JSON.stringify({
          videoId: video.id,
          ...(sessionRef.current ? { sessionId: sessionRef.current } : {}),
          events,
          heatmapTicks,
        }),
      });
      setTrackingError('');
      onFlush?.();
    } catch (error) {
      setTrackingError(error.message);
      eventBuffer.current.unshift(...events);
      heatmapBuffer.current = Object.entries(heatmapTicks).reduce((acc, [second, count]) => {
        acc[second] = (acc[second] || 0) + count;
        return acc;
      }, heatmapBuffer.current);
    }
  }, [onFlush, video]);

  useEffect(() => {
    let disposed = false;
    let player;

    async function boot() {
      const session = await api('/api/tracking/sessions', {
        method: 'POST',
        body: JSON.stringify({ videoId: video.id }),
      });
      sessionRef.current = session.session.id;

      const YT = await loadYouTubeApi();
      if (disposed) return;

      player = new YT.Player(holderRef.current, {
        videoId: video.youtubeId,
        playerVars: { rel: 0, modestbranding: 1 },
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

    boot();

    return () => {
      disposed = true;
      flush();
      if (sessionRef.current) {
        api(`/api/tracking/sessions/${sessionRef.current}/end`, { method: 'PATCH' }).catch(() => {});
      }
      player?.destroy?.();
      playerRef.current = null;
    };
  }, [flush, queueEvent, video]);

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
    const onVisibilityChange = () => {
      if (document.hidden) onBlurOrHidden('TAB_HIDDEN');
      else onFocusOrVisible('TAB_VISIBLE');
    };

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
    const interval = setInterval(() => {
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
    }, 1000);

    const flushInterval = setInterval(() => {
      queueEvent('FLUSH');
      flush();
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(flushInterval);
    };
  }, [engaged, flush, queueEvent]);

  return (
    <section className="player-section">
      <div className="player-wrap">
        <div ref={holderRef} className="player-target" />
      </div>
      <div className="player-meta">
        <div>
          <p className="eyebrow">Now tracking</p>
          <h2>{video.title}</h2>
        </div>
        <div className="status-row">
          <span className={engaged ? 'pill good' : 'pill warn'}>{engaged ? 'Counting active study time' : 'Tracking paused for inactivity'}</span>
          <span className="pill">{status}</span>
          <span className="pill">{formatTime(activeSeconds)} active now</span>
        </div>
        {trackingError && <p className="error">Tracking sync failed: {trackingError}</p>}
      </div>
    </section>
  );
}

function Dashboard({ analytics, selectedVideo, heatmap }) {
  const summariesByDate = useMemo(() => {
    const rows = {};
    analytics?.summaries?.forEach((summary) => {
      const date = summary.date.slice(0, 10);
      rows[date] = (rows[date] || 0) + summary.activeWatchSeconds;
    });
    return Object.entries(rows).slice(0, 14);
  }, [analytics]);

  const segments = groupHeatmapSegments(heatmap?.heatmap || []);

  return (
    <section className="dashboard">
      <div className="stats-grid">
        <Stat icon={Clock} label="Active study" value={formatTime(analytics?.totals?.totalActiveSeconds || 0)} />
        <Stat icon={Pause} label="Pauses" value={analytics?.totals?.totalPauseCount || 0} />
        <Stat icon={Rewind} label="Seeks / rewinds" value={analytics?.totals?.totalSeekCount || 0} />
        <Stat icon={Eye} label="Repeated frames" value={segments.length} />
      </div>
      <div className="analytics-grid">
        <div className="panel">
          <div className="panel-title">
            <BarChart3 size={18} />
            <h3>Daily activity</h3>
          </div>
          <div className="bars">
            {summariesByDate.map(([date, seconds]) => (
              <div className="bar-row" key={date}>
                <span>{date}</span>
                <div><i style={{ width: `${Math.min(100, seconds / 60)}%` }} /></div>
                <strong>{formatTime(seconds)}</strong>
              </div>
            ))}
            {!summariesByDate.length && <p className="muted">No watch data yet.</p>}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">
            <TimerReset size={18} />
            <h3>{selectedVideo ? 'Repeated sections' : 'Video heatmap'}</h3>
          </div>
          <div className="segments">
            {segments.map((segment) => (
              <div className="segment" key={`${segment.start}-${segment.end}`}>
                <span>{formatTime(segment.start)} - {formatTime(segment.end)}</span>
                <strong>{segment.max}x</strong>
              </div>
            ))}
            {!segments.length && <p className="muted">Play and rewind a video to build the heatmap.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminUserForm({ onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');

    try {
      await api('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ name: '', email: '', password: '', role: 'STUDENT' });
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <input placeholder="User name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
      <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
      <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
        <option value="STUDENT">Student</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button className="primary" type="submit">Create user</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function AdminVideoRow({ video, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [error, setError] = useState('');
  const activeSeconds = video.summaries.reduce((total, row) => total + row.activeWatchSeconds, 0);

  async function save() {
    setError('');

    try {
      await api(`/api/admin/videos/${video.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    setError('');

    try {
      await api(`/api/admin/videos/${video.id}`, { method: 'DELETE' });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-row video-admin-row">
      <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} alt="" />
      <div>
        {editing ? (
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        ) : (
          <strong>{video.title}</strong>
        )}
        <span>{video.youtubeId} · {formatTime(activeSeconds)} watched · {video._count.events} events</span>
        {error && <span className="row-error">{error}</span>}
      </div>
      <div className="row-actions">
        {editing ? (
          <button className="small-button" onClick={save}>Save</button>
        ) : (
          <button className="icon-light" onClick={() => setEditing(true)} title="Edit video"><Edit3 size={16} /></button>
        )}
        <button className="icon-light danger" onClick={remove} title="Delete video"><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

function AdminUserRow({ user, selected, onSelect, onChanged, currentUserId }) {
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState('');
  const isCurrentUser = user.id === currentUserId;
  const activeSeconds = user.summaries.reduce((total, row) => total + row.activeWatchSeconds, 0);

  async function updateRole(nextRole) {
    setError('');
    const previousRole = role;
    setRole(nextRole);

    try {
      await api(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      });
      onChanged();
    } catch (err) {
      setRole(previousRole);
      setError(err.message);
    }
  }

  async function remove() {
    setError('');

    try {
      await api(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className={selected ? 'admin-row active' : 'admin-row'}>
      <button className="row-main" onClick={() => onSelect(user)}>
        <strong>{user.name}</strong>
        <span>{user.email} · {formatTime(activeSeconds)} · {user._count.sessions} sessions{isCurrentUser ? ' · current admin' : ''}</span>
        {error && <span className="row-error">{error}</span>}
      </button>
      <select value={role} onChange={(event) => updateRole(event.target.value)} disabled={isCurrentUser}>
        <option value="STUDENT">Student</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button className="icon-light danger" onClick={remove} disabled={isCurrentUser} title={isCurrentUser ? 'Cannot delete current user' : 'Delete user'}><Trash2 size={16} /></button>
    </div>
  );
}

function UserAnalyticsPanel({ userAnalytics }) {
  const rows = userAnalytics?.summaries || [];

  return (
    <div className="panel">
      <div className="panel-title">
        <BarChart3 size={18} />
        <h3>{userAnalytics ? `${userAnalytics.user.name} analytics` : 'Select a user'}</h3>
      </div>
      {userAnalytics && (
        <>
          <div className="stats-grid compact">
            <Stat icon={Clock} label="Study time" value={formatTime(userAnalytics.totals.activeWatchSeconds)} />
            <Stat icon={Pause} label="Pauses" value={userAnalytics.totals.pauseCount} />
            <Stat icon={Rewind} label="Seeks" value={userAnalytics.totals.seekCount} />
            <Stat icon={Play} label="Sessions" value={userAnalytics.totals.sessionCount} />
          </div>
          <div className="admin-table">
            {rows.map((row) => (
              <div className="table-row" key={row.id}>
                <span>{row.date.slice(0, 10)}</span>
                <strong>{row.video.title}</strong>
                <span>{formatTime(row.activeWatchSeconds)}</span>
              </div>
            ))}
            {!rows.length && <p className="muted">No analytics for this user yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}

function AdminPanel({ auth, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [error, setError] = useState('');

  const loadAdmin = useCallback(async () => {
    setError('');

    try {
      const [summaryData, userData, videoData] = await Promise.all([
        api('/api/admin/summary'),
        api('/api/admin/users'),
        api('/api/admin/videos'),
      ]);
      setSummary(summaryData);
      setUsers(userData.users);
      setVideos(videoData.videos);
      setSelectedUser((current) => current || userData.users[0] || null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadAdmin().catch(() => {});
  }, [loadAdmin]);

  useEffect(() => {
    if (!selectedUser) {
      setUserAnalytics(null);
      return;
    }
    api(`/api/admin/analytics/users/${selectedUser.id}`)
      .then(setUserAnalytics)
      .catch(() => setUserAnalytics(null));
  }, [selectedUser]);

  if (auth.user.role !== 'ADMIN') {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <Shield />
          <h1>Admin access required.</h1>
          <button className="primary" onClick={() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Back to learning</button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="brand">
          <Shield />
          <div>
            <strong>HexTorq Learn Admin</strong>
            <span>{auth.user.email}</span>
          </div>
        </div>
        <nav className="admin-tabs">
          {['overview', 'users', 'videos', 'analytics'].map((item) => (
            <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>
          ))}
        </nav>
        <div className="admin-actions">
          <button className="small-button" onClick={() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Learner</button>
          <button className="logout" onClick={onLogout}><LogOut size={16} /> Logout</button>
        </div>
      </header>

      <section className="admin-content">
        {error && <p className="error banner-error">{error}</p>}
        {tab === 'overview' && (
          <>
            <div className="stats-grid">
              <Stat icon={Users} label="Users" value={summary?.userCount || 0} />
              <Stat icon={ListVideo} label="Videos" value={summary?.videoCount || 0} />
              <Stat icon={Activity} label="Events" value={summary?.eventCount || 0} />
              <Stat icon={Clock} label="Total study" value={formatTime(summary?.totals?.activeWatchSeconds || 0)} />
            </div>
            <div className="analytics-grid">
              <div className="panel">
                <div className="panel-title"><Users size={18} /><h3>Latest users</h3></div>
                {users.slice(0, 8).map((user) => (
                  <div className="table-row" key={user.id}>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    <span>{user.role}</span>
                  </div>
                ))}
              </div>
              <div className="panel">
                <div className="panel-title"><ListVideo size={18} /><h3>Latest videos</h3></div>
                {videos.slice(0, 8).map((video) => (
                  <div className="table-row" key={video.id}>
                    <strong>{video.title}</strong>
                    <span>{video._count.events} events</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="admin-grid">
            <div className="panel">
              <div className="panel-title"><Plus size={18} /><h3>Create user</h3></div>
              <AdminUserForm onCreated={loadAdmin} />
            </div>
            <div className="panel">
              <div className="panel-title"><Users size={18} /><h3>Manage users</h3></div>
              <div className="admin-list">
                {users.map((user) => (
                  <AdminUserRow key={user.id} user={user} selected={selectedUser?.id === user.id} onSelect={setSelectedUser} onChanged={loadAdmin} currentUserId={auth.user.id} />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'videos' && (
          <div className="admin-grid">
            <div className="panel">
              <div className="panel-title"><Plus size={18} /><h3>Add video</h3></div>
              <VideoForm onCreated={loadAdmin} />
            </div>
            <div className="panel">
              <div className="panel-title"><ListVideo size={18} /><h3>Manage videos</h3></div>
              <div className="admin-list">
                {videos.map((video) => <AdminVideoRow key={video.id} video={video} onChanged={loadAdmin} />)}
              </div>
            </div>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="admin-grid">
            <div className="panel">
              <div className="panel-title"><Users size={18} /><h3>All users</h3></div>
              <div className="admin-list">
                {users.map((user) => (
                  <AdminUserRow key={user.id} user={user} selected={selectedUser?.id === user.id} onSelect={setSelectedUser} onChanged={loadAdmin} currentUserId={auth.user.id} />
                ))}
              </div>
            </div>
            <UserAnalyticsPanel userAnalytics={userAnalytics} />
          </div>
        )}
      </section>
    </main>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [path, setPath] = useState(() => window.location.pathname);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [heatmap, setHeatmap] = useState(null);

  const loadData = useCallback(async () => {
    if (!auth) return;
    const [videoData, overview] = await Promise.all([
      api('/api/videos'),
      api('/api/analytics/overview'),
    ]);
    setVideos(videoData.videos);
    setAnalytics(overview);
    setSelectedVideo((current) => current || videoData.videos[0] || null);
  }, [auth]);

  useEffect(() => {
    loadData().catch(() => {});
  }, [loadData]);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    const onAuthExpired = () => setAuth(null);
    window.addEventListener('popstate', onPopState);
    window.addEventListener('auth-expired', onAuthExpired);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('auth-expired', onAuthExpired);
    };
  }, []);

  useEffect(() => {
    if (!selectedVideo) {
      setHeatmap(null);
      return;
    }
    api(`/api/analytics/videos/${selectedVideo.id}/heatmap`)
      .then(setHeatmap)
      .catch(() => setHeatmap(null));
  }, [selectedVideo]);

  if (!auth) {
    return <AuthScreen onAuth={setAuth} />;
  }

  const logout = () => {
    clearStoredAuth();
    setAuth(null);
  };

  if (path === '/admin') {
    return <AdminPanel auth={auth} onLogout={logout} />;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Activity />
          <div>
            <strong>HexTorq Learn</strong>
            <span>{auth.user.name}</span>
          </div>
        </div>
        {auth.user.role === 'ADMIN' && (
          <>
            <button className="admin-link" onClick={() => { window.history.pushState({}, '', '/admin'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
              <Shield size={16} />
              Admin panel
            </button>
            <VideoForm onCreated={(video) => {
              setVideos((items) => [video, ...items.filter((item) => item.id !== video.id)]);
              setSelectedVideo(video);
              loadData();
            }} />
          </>
        )}
        <div className="video-list">
          <div className="list-heading">
            <ListVideo size={16} />
            <span>Videos</span>
          </div>
          {videos.map((video) => (
            <button
              key={video.id}
              className={selectedVideo?.id === video.id ? 'video-item active' : 'video-item'}
              onClick={() => setSelectedVideo(video)}
            >
              <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} alt="" />
              <span>{video.title}</span>
            </button>
          ))}
        </div>
        <button className="logout" onClick={logout}>
          <LogOut size={16} />
          Logout
        </button>
      </aside>
      <section className="content">
        {selectedVideo ? (
          <>
            <LearningPlayer video={selectedVideo} onFlush={loadData} />
            <Dashboard analytics={analytics} selectedVideo={selectedVideo} heatmap={heatmap} />
          </>
        ) : (
          <div className="empty-state">
            <Play size={44} />
            <h1>Add a YouTube lesson to start tracking.</h1>
          </div>
        )}
      </section>
    </main>
  );
}
