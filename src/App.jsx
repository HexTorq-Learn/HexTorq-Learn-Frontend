import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  Folder,
  ListVideo,
  LogOut,
  Pause,
  Play,
  Plus,
  Rewind,
  Shield,
  TimerReset,
  Trash2,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { api, clearStoredAuth, getStoredAuth, setStoredAuth } from './api.js';
import { formatTime, groupHeatmapSegments, loadYouTubeApi } from './youtube.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://git-pipeline.metatronhost.in/hextorq-learn';
const API_URL = new URL(API_BASE);
const SOCKET_PATH = `${API_URL.pathname.replace(/\/$/, '')}/socket.io`;
const PLAYER_STATES = { [-1]: 'UNSTARTED', 0: 'END', 1: 'PLAY', 2: 'PAUSE', 3: 'BUFFER' };

function formatHourLabel(hour) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${suffix}`;
}

function formatDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatClockLabel(clock) {
  if (!clock) return '';
  const match = String(clock).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return clock;
  const hour = Number(match[1]);
  if (!Number.isFinite(hour)) return clock;
  const suffix = match[4]?.toUpperCase() || (hour >= 12 ? 'PM' : 'AM');
  const displayHour = match[4] ? hour : hour % 12 || 12;
  return `${displayHour}:${match[2]}:${match[3] || '00'} ${suffix}`;
}

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

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
      const payload = mode === 'register' ? form : { email: form.email, password: form.password };
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

function VideoForm({ playlists = [], onCreated }) {
  const [form, setForm] = useState({ url: '', title: '', playlistId: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');

    try {
      const { video } = await api('/api/videos', {
        method: 'POST',
        body: JSON.stringify({
          url: form.url,
          title: form.title || undefined,
          playlistId: form.playlistId || undefined,
        }),
      });
      setForm({ url: '', title: '', playlistId: '' });
      onCreated(video);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <input placeholder="Paste YouTube link" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} required />
      <input placeholder="Title optional" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
      <select value={form.playlistId} onChange={(event) => setForm({ ...form, playlistId: event.target.value })}>
        <option value="">No playlist</option>
        {playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.name}</option>)}
      </select>
      <button className="primary" type="submit"><Plus size={16} /> Add video</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function PlaylistForm({ onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#1f6f64' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');

    try {
      await api('/api/playlists', {
        method: 'POST',
        body: JSON.stringify({ ...form, description: form.description || undefined }),
      });
      setForm({ name: '', description: '', color: '#1f6f64' });
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <input placeholder="Playlist or folder name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      <input placeholder="Description optional" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      <input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
      <button className="primary" type="submit"><Folder size={16} /> Create playlist</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function LearningPlayer({ video, onFlush, onLocalMetric }) {
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

  return (
    <section className="player-section">
      <div className="player-wrap">
        <div ref={holderRef} className="player-target" />
      </div>
      <div className="player-meta">
        <div>
          <p className="eyebrow">Now tracking</p>
          <h2>{video.title}</h2>
          <span className="subtle">{video.playlist?.name || 'No playlist'}</span>
        </div>
        <div className="status-row">
          <span className={engaged ? 'pill good' : 'pill warn'}>{engaged ? 'Counting active study time' : 'Paused for inactivity'}</span>
          <span className="pill">{status}</span>
          <span className="pill">{formatTime(activeSeconds)} active now</span>
        </div>
        {trackingError && <p className="error">Tracking sync failed: {trackingError}</p>}
      </div>
    </section>
  );
}

function TimeHeatmap({ timeMap }) {
  const max = Math.max(1, ...(timeMap?.hours || []).map((hour) => hour.activeEvents));

  return (
    <div className="panel">
      <div className="panel-title"><Clock size={18} /><h3>AM/PM watch heatmap</h3></div>
      <div className="hour-grid">
        {(timeMap?.hours || []).map((hour) => (
          <div className="hour-cell" key={hour.hour} style={{ '--level': hour.activeEvents / max }}>
            <strong>{formatHourLabel(hour.hour)}</strong>
            <span>{hour.activeEvents} events</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventTimeline({ timeMap }) {
  return (
    <div className="panel">
      <div className="panel-title"><Activity size={18} /><h3>Clock-time event trail</h3></div>
      <div className="timeline-list">
        {(timeMap?.timeline || []).slice().reverse().slice(0, 24).map((event) => (
          <div className="timeline-row" key={event.id}>
            <strong>{formatClockLabel(event.clock)}</strong>
            <span>{event.type}</span>
            <p>{event.video.title}{Number.isFinite(event.videoTimeSec) ? ` at ${formatTime(event.videoTimeSec)}` : ''}</p>
          </div>
        ))}
        {!timeMap?.timeline?.length && <p className="muted">No clock-time events yet.</p>}
      </div>
    </div>
  );
}

function MetricCard({ title, value, detail }) {
  return (
    <div className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
      {detail && <p>{detail}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, detail }) {
  return (
    <div className="mini-bar">
      <div><strong>{label}</strong><span>{detail}</span></div>
      <div><i style={{ width: `${Math.min(100, max ? (value / max) * 100 : 0)}%` }} /></div>
    </div>
  );
}

function StreakCalendar({ days = [] }) {
  return (
    <div className="chart-block">
      <div className="chart-title">Study streak calendar</div>
      <div className="streak-calendar">
        {days.slice(-70).map((day) => (
          <span key={day.date} className={`level-${day.level}`} title={`${day.date}: ${formatTime(day.activeWatchSeconds)}`} />
        ))}
      </div>
    </div>
  );
}

function CompletionFunnel({ steps = [] }) {
  return (
    <div className="chart-block">
      <div className="chart-title">Completion funnel</div>
      <div className="funnel-list">
        {steps.map((step) => <MiniBar key={step.key} label={step.label} value={step.percent} max={100} detail={`${step.count} videos · ${step.percent}%`} />)}
      </div>
    </div>
  );
}

function FocusIdleStack({ rows = [] }) {
  const total = Math.max(1, rows.reduce((acc, row) => acc + row.seconds, 0));
  return (
    <div className="chart-block">
      <div className="chart-title">Active vs idle stacked bar</div>
      <div className="stacked-bar">
        {rows.map((row) => <i key={row.key} className={row.key} style={{ width: `${(row.seconds / total) * 100}%` }} title={`${row.label}: ${formatTime(row.seconds)}`} />)}
      </div>
      <div className="stack-legend">{rows.map((row) => <span key={row.key}><i className={row.key} />{row.label} {formatTime(row.seconds)}</span>)}</div>
    </div>
  );
}

function PlaylistProgressChart({ rows = [] }) {
  return (
    <div className="chart-block">
      <div className="chart-title">Playlist progress</div>
      <div className="funnel-list">
        {rows.map((row) => <MiniBar key={row.id} label={row.name} value={row.completionPercent || 0} max={100} detail={`${row.completedVideos}/${row.videoCount} completed`} />)}
      </div>
    </div>
  );
}

function VideoCompletionList({ rows = [] }) {
  return (
    <div className="chart-block">
      <div className="chart-title">Video completion list</div>
      <div className="funnel-list">
        {rows.slice(0, 10).map((row) => <MiniBar key={row.id} label={row.title} value={row.percentWatched} max={100} detail={`${row.percentWatched}% · resume ${formatTime(row.lastWatchedPosition || 0)}`} />)}
      </div>
    </div>
  );
}

function MinuteDrilldown({ timeMap }) {
  const [hour, setHour] = useState(() => new Date().getHours());
  const selected = timeMap?.hours?.find((row) => row.hour === hour);
  const max = Math.max(1, ...(selected?.seconds || []).map((row) => row.count));
  return (
    <div className="chart-block">
      <div className="chart-title">Minute drilldown heatmap</div>
      <select value={hour} onChange={(event) => setHour(Number(event.target.value))}>
        {(timeMap?.hours || []).map((row) => <option key={row.hour} value={row.hour}>{formatHourLabel(row.hour)}</option>)}
      </select>
      <div className="minute-grid">
        {(selected?.seconds || []).map((row) => <span key={row.minute} style={{ '--level': row.count / max }} title={`${formatClockLabel(`${String(hour).padStart(2, '0')}:${String(row.minute).padStart(2, '0')}:00`)} · ${row.count} events`} />)}
      </div>
    </div>
  );
}

function LearnerLeaderboard({ leaderboard = [], currentUserId }) {
  return (
    <div className="chart-block">
      <div className="chart-title">Learner comparison</div>
      <div className="leaderboard-list">
        {leaderboard.slice(0, 10).map((row, index) => (
          <div className={row.userId === currentUserId ? 'leader-row current' : 'leader-row'} key={row.userId}>
            <strong>#{index + 1}</strong>
            <span>{row.name}<small>{row.publicLearnerId}</small></span>
            <em>Lv {row.level} · {row.xp} XP · {formatTime(row.activeStudySeconds)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarBars({ rows = [] }) {
  return (
    <div className="chart-block">
      <div className="chart-title">User comparison radar</div>
      <div className="radar-list">
        {rows.slice(0, 6).map((row) => (
          <div className="radar-row" key={row.user.id}>
            <strong>{row.user.name}</strong>
            {Object.entries(row.radar || {}).map(([key, value]) => <MiniBar key={key} label={key} value={value} max={100} detail={`${Math.round(value)}%`} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminHourHeatmap({ rows = [] }) {
  const max = Math.max(1, ...rows.map((row) => row.events || 0));
  return (
    <div className="panel">
      <div className="panel-title"><Clock size={18} /><h3>All users AM/PM heatmap</h3></div>
      <div className="hour-grid">
        {rows.map((row) => (
          <div className="hour-cell" key={row.hour} style={{ '--level': (row.events || 0) / max }}>
            <strong>{formatHourLabel(row.hour)}</strong>
            <span>{row.events || 0} events</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardChart({ title, rows = [], metric, valueLabel }) {
  const max = Math.max(1, ...rows.map((row) => metric(row)));
  return (
    <div className="panel">
      <div className="panel-title"><BarChart3 size={18} /><h3>{title}</h3></div>
      <div className="funnel-list">
        {rows.slice(0, 10).map((row, index) => (
          <MiniBar
            key={row.user.id}
            label={`#${index + 1} ${row.user.name}`}
            value={metric(row)}
            max={max}
            detail={valueLabel(row)}
          />
        ))}
        {!rows.length && <p className="muted">No learners yet.</p>}
      </div>
    </div>
  );
}

function RiskUserTable({ title, rows = [], detail }) {
  return (
    <div className="chart-block">
      <div className="chart-title">{title}</div>
      <div className="compact-table">
        {rows.slice(0, 8).map((row) => (
          <div className="compact-row" key={row.user.id}>
            <strong>{row.user.name}</strong>
            <span>{detail(row)}</span>
          </div>
        ))}
        {!rows.length && <p className="muted">No users in this list.</p>}
      </div>
    </div>
  );
}

function AdminAnalyticsDashboard({ users, comparison, selectedUser, setSelectedUser, userAnalytics, userTimeMap, userAdvanced, onChanged, currentUserId }) {
  const comparisonRows = comparison?.userComparison || [];
  const dailyRows = comparison?.charts?.dailyActiveLearners || [];
  const totalStudyRows = comparison?.charts?.totalStudyTimeByDay || [];
  const playlistRows = comparison?.charts?.playlistCompletion || [];

  return (
    <div className="admin-analytics-page">
      <div className="stats-grid">
        <Stat icon={Users} label="Compared users" value={comparisonRows.length} />
        <Stat icon={Clock} label="Total active study" value={formatTime(comparisonRows.reduce((total, row) => total + row.activeStudySeconds, 0))} />
        <Stat icon={Shield} label="Risk users" value={(comparison?.inactiveUsers?.length || 0) + (comparison?.lowCompletionUsers?.length || 0)} />
        <Stat icon={BarChart3} label="Daily rows" value={dailyRows.length} />
      </div>

      <div className="analytics-grid wide">
        <AdminHourHeatmap rows={comparison?.charts?.allUsers24HourHeatmap || []} />
        <LeaderboardChart
          title="Active study leaderboard"
          rows={comparison?.leaderboards?.byActiveStudy || []}
          metric={(row) => row.activeStudySeconds}
          valueLabel={(row) => `${formatTime(row.activeStudySeconds)} · ${row.completionRatePercent}% complete`}
        />
      </div>

      <div className="analytics-grid wide">
        <LeaderboardChart
          title="Consistency leaderboard"
          rows={comparison?.leaderboards?.byConsistency || []}
          metric={(row) => row.consistencyScore}
          valueLabel={(row) => `${row.consistencyScore} streak score · Lv ${row.game?.level || 1}`}
        />
        <LeaderboardChart
          title="Playlist progress leaderboard"
          rows={comparison?.leaderboards?.byPlaylistProgress || []}
          metric={(row) => row.playlistProgressPercent}
          valueLabel={(row) => `${row.playlistProgressPercent}% playlist progress`}
        />
      </div>

      <div className="analytics-grid wide">
        <div className="panel">
          <div className="panel-title"><Activity size={18} /><h3>Daily active learners</h3></div>
          <div className="funnel-list">
            {dailyRows.slice(-21).map((row) => <MiniBar key={row.date} label={row.date} value={row.activeUsers} max={Math.max(1, users.length)} detail={`${row.activeUsers} active · ${formatTime(row.totalStudySeconds)}`} />)}
            {!dailyRows.length && <p className="muted">No daily learner activity yet.</p>}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title"><Clock size={18} /><h3>Total study time by day</h3></div>
          <div className="funnel-list">
            {totalStudyRows.slice(-21).map((row) => <MiniBar key={row.date} label={row.date} value={row.totalStudySeconds} max={Math.max(1, ...totalStudyRows.map((item) => item.totalStudySeconds))} detail={formatTime(row.totalStudySeconds)} />)}
            {!totalStudyRows.length && <p className="muted">No study time recorded yet.</p>}
          </div>
        </div>
      </div>

      <div className="analytics-grid wide">
        <div className="panel">
          <div className="panel-title"><Shield size={18} /><h3>Risk lists</h3></div>
          <div className="risk-grid">
            <RiskUserTable title="Inactive users" rows={comparison?.inactiveUsers || []} detail={(row) => `${formatTime(row.activeStudySeconds)} active`} />
            <RiskUserTable title="High distraction" rows={comparison?.highDistractionUsers || []} detail={(row) => `${row.distractionRate} focus losses`} />
            <RiskUserTable title="Low completion" rows={comparison?.lowCompletionUsers || []} detail={(row) => `${row.completionRatePercent}% completion`} />
            <RiskUserTable title="Stuck users" rows={comparison?.stuckUsers || []} detail={(row) => `${row.stuckSegments} stuck segments`} />
          </div>
        </div>
        <div className="panel">
          <RadarBars rows={comparisonRows} />
        </div>
      </div>

      <div className="analytics-grid wide">
        <div className="panel">
          <div className="panel-title"><Folder size={18} /><h3>Playlist completion chart</h3></div>
          <div className="funnel-list">
            {playlistRows.map((row) => <MiniBar key={row.id} label={row.name} value={row.videoCount} max={Math.max(1, ...playlistRows.map((item) => item.videoCount))} detail={`${row.videoCount} videos · ${row.activityRows} activity rows`} />)}
            {!playlistRows.length && <p className="muted">No playlists yet.</p>}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title"><Users size={18} /><h3>Cohort retention</h3></div>
          <div className="funnel-list">
            {(comparison?.charts?.cohortRetention || []).map((row) => <MiniBar key={row.cohort} label={row.cohort} value={row.users} max={Math.max(1, users.length)} detail={`${row.users} learners`} />)}
            {!comparison?.charts?.cohortRetention?.length && <p className="muted">No cohort data yet.</p>}
          </div>
        </div>
      </div>

      <div className="analytics-grid admin-drilldown">
        <div className="panel">
          <div className="panel-title"><Users size={18} /><h3>Select learner</h3></div>
          <div className="admin-list">{users.map((user) => <AdminUserRow key={user.id} user={user} selected={selectedUser?.id === user.id} onSelect={setSelectedUser} onChanged={onChanged} currentUserId={currentUserId} />)}</div>
        </div>
        <UserAnalyticsPanel userAnalytics={userAnalytics} userTimeMap={userTimeMap} advanced={userAdvanced} />
      </div>
    </div>
  );
}

function RangeText({ ranges }) {
  if (!ranges?.length) return 'None';
  return ranges.slice(0, 3).map((range) => `${formatTime(range.start)}-${formatTime(range.end)}`).join(', ');
}

function AdvancedAnalytics({ advanced }) {
  if (!advanced) return null;

  const hardest = [...(advanced.rewatchDifficulty || [])].sort((a, b) => b.hardTopicScore - a.hardTopicScore)[0];
  const playlist = [...(advanced.playlistMetrics || [])].sort((a, b) => b.activeWatchSeconds - a.activeWatchSeconds)[0];
  const bestVideo = [...(advanced.videoCompletion || [])].sort((a, b) => b.percentWatched - a.percentWatched)[0];

  return (
    <section className="advanced-grid">
      <div className="panel">
        <div className="panel-title"><Shield size={18} /><h3>Game profile</h3></div>
        <div className="game-profile">
          <div>
            <span>{advanced.game?.publicLearnerId}</span>
            <strong>Level {advanced.game?.level || 1}</strong>
            <p>{advanced.game?.xp || 0} XP · {advanced.game?.levelProgressPercent || 0}% to next level</p>
          </div>
          <div className="progress-track"><i style={{ width: `${advanced.game?.levelProgressPercent || 0}%` }} /></div>
          <div className="badge-list">
            {(advanced.game?.badges || []).map((badge) => <span key={badge.key}>{badge.label}</span>)}
            {!advanced.game?.badges?.length && <span>Start learning to unlock badges</span>}
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-title"><Activity size={18} /><h3>Learning quality</h3></div>
        <div className="metric-grid">
          <MetricCard title="Efficiency" value={`${advanced.learningTime.studyEfficiencyPercent}%`} detail="Active study / tab-open time" />
          <MetricCard title="Focused time" value={formatTime(advanced.learningTime.focusedSeconds)} detail={`${formatTime(advanced.learningTime.unfocusedSeconds)} unfocused`} />
          <MetricCard title="Idle time" value={formatTime(advanced.learningTime.idleSeconds)} detail={`${advanced.sessionQuality.idleTriggerCount} idle triggers`} />
          <MetricCard title="Study streak" value={`${advanced.learningTime.studyStreakDays} days`} detail={`Best hour ${advanced.learningTime.bestStudyHour || '--'}`} />
        </div>
      </div>
      <div className="panel">
        <div className="panel-title"><ListVideo size={18} /><h3>Progress</h3></div>
        <div className="metric-grid">
          <MetricCard title="Completed" value={advanced.learningProgress.completedVideos} detail={`${advanced.learningProgress.partiallyWatchedVideos} partial, ${advanced.learningProgress.unstartedVideos} unstarted`} />
          <MetricCard title="Remaining" value={formatTime(advanced.learningProgress.remainingVideoSeconds)} detail="Estimated video time left" />
          <MetricCard title="Today delta" value={formatTime(Math.abs(advanced.learningProgress.todayVsYesterday.deltaSeconds))} detail={advanced.learningProgress.todayVsYesterday.deltaSeconds >= 0 ? 'More than yesterday' : 'Less than yesterday'} />
          <MetricCard title="Target" value={`${advanced.learningProgress.watchTargetCompletionPercent}%`} detail="Of 1 hour daily target" />
        </div>
      </div>
      <div className="panel">
        <div className="panel-title"><TimerReset size={18} /><h3>Difficulty signals</h3></div>
        <div className="insight-list">
          <div><strong>{hardest?.title || 'No video yet'}</strong><span>Hard-topic score {hardest?.hardTopicScore || 0}</span></div>
          <div><strong>Repeated 5x</strong><span>{RangeText(hardest?.repeated5xRanges)}</span></div>
          <div><strong>Most replayed</strong><span>{hardest?.mostReplayedSecond ? `${formatTime(hardest.mostReplayedSecond.second)} · ${hardest.mostReplayedSecond.watchCount}x` : 'None'}</span></div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-title"><Folder size={18} /><h3>Playlist performance</h3></div>
        <div className="insight-list">
          <div><strong>{playlist?.name || 'No playlist'}</strong><span>{playlist?.completionPercent || 0}% complete · {formatTime(playlist?.activeWatchSeconds || 0)}</span></div>
          <div><strong>Best video</strong><span>{bestVideo?.title || 'No watched video'} · {bestVideo?.percentWatched || 0}%</span></div>
          <div><strong>Completion ETA</strong><span>{advanced.learningProgress.estimatedCourseCompletionDays ? `${advanced.learningProgress.estimatedCourseCompletionDays} days` : 'Needs more data'}</span></div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-title"><Eye size={18} /><h3>Behavior</h3></div>
        <div className="metric-grid">
          <MetricCard title="Pause/min" value={advanced.behavior.pauseFrequencyPerMinute} />
          <MetricCard title="Seek/min" value={advanced.behavior.seekFrequencyPerMinute} />
          <MetricCard title="Tab switches" value={advanced.behavior.tabSwitchingFrequency} />
          <MetricCard title="Avg gap" value={formatTime(advanced.behavior.averageSecondsBetweenInteractions)} />
        </div>
      </div>
      <div className="panel">
        <div className="panel-title"><Shield size={18} /><h3>Alerts</h3></div>
        <div className="alert-list">
          {(advanced.alerts || []).slice(0, 8).map((alert) => <div className={`alert-row ${alert.severity}`} key={`${alert.type}-${alert.message}`}><strong>{alert.severity}</strong><span>{alert.message}</span></div>)}
          {!advanced.alerts?.length && <p className="muted">No alerts right now.</p>}
        </div>
      </div>
      <div className="panel">
        <div className="panel-title"><BarChart3 size={18} /><h3>Consistency charts</h3></div>
        <StreakCalendar days={advanced.charts?.streakCalendar || []} />
        <CompletionFunnel steps={advanced.charts?.completionFunnel || []} />
        <FocusIdleStack rows={advanced.charts?.focusIdleStack || []} />
      </div>
      <div className="panel">
        <div className="panel-title"><Folder size={18} /><h3>Course charts</h3></div>
        <PlaylistProgressChart rows={advanced.charts?.playlistProgress || []} />
        <VideoCompletionList rows={advanced.charts?.videoCompletionList || []} />
      </div>
    </section>
  );
}

function VideoEtaPanel({ advanced, selectedVideo }) {
  const videoMetric = advanced?.videoCompletion?.find((video) => video.id === selectedVideo?.id);
  if (!selectedVideo || !videoMetric) return null;

  const remainingSeconds = Math.max(0, videoMetric.durationSec - videoMetric.uniqueWatchedSeconds);
  const eta = new Date(Date.now() + remainingSeconds * 1000);
  const etaClock = remainingSeconds > 0 ? eta.toLocaleTimeString('en-US', { hour12: true }) : 'Complete';

  return (
    <div className="panel eta-panel">
      <div className="panel-title"><Clock size={18} /><h3>Expected finish time</h3></div>
      <div className="eta-grid">
        <MetricCard title="ETA clock" value={etaClock} detail={remainingSeconds > 0 ? `If you keep watching now` : 'Video target reached'} />
        <MetricCard title="Remaining" value={formatTime(remainingSeconds)} detail={`${videoMetric.percentWatched}% watched`} />
        <MetricCard title="Unique watched" value={formatTime(videoMetric.uniqueWatchedSeconds)} detail={`${formatTime(videoMetric.rewatchedSeconds)} rewatched`} />
        <MetricCard title="Resume point" value={formatTime(videoMetric.lastWatchedPosition || 0)} detail="Last known video position" />
      </div>
      <div className="progress-track">
        <i style={{ width: `${Math.min(100, videoMetric.percentWatched)}%` }} />
      </div>
    </div>
  );
}

function Dashboard({ analytics, selectedVideo, heatmap, timeMap, advanced, leaderboard, currentUserId, liveConnected }) {
  const summariesByDate = useMemo(() => {
    const rows = {};
    analytics?.summaries?.forEach((summary) => {
      const date = formatDateKey(new Date(summary.date));
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
        <Stat icon={liveConnected ? Wifi : WifiOff} label="Live metrics" value={liveConnected ? 'Connected' : 'Offline'} />
      </div>
      <VideoEtaPanel advanced={advanced} selectedVideo={selectedVideo} />
      <div className="analytics-grid wide">
        <div className="panel">
          <div className="panel-title"><BarChart3 size={18} /><h3>Daily activity</h3></div>
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
          <div className="panel-title"><TimerReset size={18} /><h3>{selectedVideo ? 'Repeated sections' : 'Video heatmap'}</h3></div>
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
      <div className="analytics-grid wide">
        <TimeHeatmap timeMap={timeMap} />
        <EventTimeline timeMap={timeMap} />
      </div>
      <div className="analytics-grid wide">
        <div className="panel"><MinuteDrilldown timeMap={timeMap} /></div>
        <div className="panel"><LearnerLeaderboard leaderboard={leaderboard} currentUserId={currentUserId} /></div>
      </div>
      <AdvancedAnalytics advanced={advanced} />
    </section>
  );
}

function WatchSummary({ analytics, advanced, selectedVideo, liveConnected }) {
  return (
    <section className="watch-summary">
      <div className="stats-grid">
        <Stat icon={Clock} label="Active study" value={formatTime(analytics?.totals?.totalActiveSeconds || 0)} />
        <Stat icon={Pause} label="Pauses" value={analytics?.totals?.totalPauseCount || 0} />
        <Stat icon={Rewind} label="Seeks / rewinds" value={analytics?.totals?.totalSeekCount || 0} />
        <Stat icon={liveConnected ? Wifi : WifiOff} label="Live metrics" value={liveConnected ? 'Connected' : 'Offline'} />
      </div>
      <VideoEtaPanel advanced={advanced} selectedVideo={selectedVideo} />
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
      await api('/api/admin/users', { method: 'POST', body: JSON.stringify(form) });
      setForm({ name: '', email: '', password: '', role: 'STUDENT' });
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="stack-form" onSubmit={submit}>
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
      await api(`/api/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ role: nextRole }) });
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
      <button className="icon-light danger" onClick={remove} disabled={isCurrentUser} title="Delete user"><Trash2 size={16} /></button>
    </div>
  );
}

function AdminVideoRow({ video, playlists, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [playlistId, setPlaylistId] = useState(video.playlistId || '');
  const [error, setError] = useState('');
  const activeSeconds = video.summaries.reduce((total, row) => total + row.activeWatchSeconds, 0);

  async function save() {
    setError('');
    try {
      await api(`/api/admin/videos/${video.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, playlistId: playlistId || null }),
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
        {editing ? <input value={title} onChange={(event) => setTitle(event.target.value)} /> : <strong>{video.title}</strong>}
        <span>{video.playlist?.name || 'No playlist'} · {formatTime(activeSeconds)} watched · {video._count.events} events</span>
        {editing && (
          <select value={playlistId} onChange={(event) => setPlaylistId(event.target.value)}>
            <option value="">No playlist</option>
            {playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.name}</option>)}
          </select>
        )}
        {error && <span className="row-error">{error}</span>}
      </div>
      <div className="row-actions">
        {editing ? <button className="small-button" onClick={save}>Save</button> : <button className="icon-light" onClick={() => setEditing(true)} title="Edit video"><Edit3 size={16} /></button>}
        <button className="icon-light danger" onClick={remove} title="Delete video"><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

function UserAnalyticsPanel({ userAnalytics, userTimeMap, advanced }) {
  const rows = userAnalytics?.summaries || [];

  return (
    <div className="learner-drilldown">
      <div className="panel">
        <div className="panel-title"><BarChart3 size={18} /><h3>{userAnalytics ? `${userAnalytics.user.name} analytics` : 'Select a user'}</h3></div>
      {userAnalytics && (
        <>
          <div className="stats-grid compact">
            <Stat icon={Clock} label="Study time" value={formatTime(userAnalytics.totals.activeWatchSeconds)} />
            <Stat icon={Pause} label="Pauses" value={userAnalytics.totals.pauseCount} />
            <Stat icon={Rewind} label="Seeks" value={userAnalytics.totals.seekCount} />
            <Stat icon={Play} label="Sessions" value={userAnalytics.totals.sessionCount} />
          </div>
        </>
      )}
      </div>
      {userAnalytics && (
        <>
          <div className="analytics-grid wide">
            <TimeHeatmap timeMap={userTimeMap} />
            <EventTimeline timeMap={userTimeMap} />
          </div>
          <div className="analytics-grid wide">
            <div className="panel"><MinuteDrilldown timeMap={userTimeMap} /></div>
            <div className="panel">
              <div className="panel-title"><BarChart3 size={18} /><h3>Daily video activity</h3></div>
              <div className="admin-table">
                {rows.map((row) => (
                  <div className="table-row" key={row.id}>
                    <span>{formatDateKey(new Date(row.date))}</span>
                    <strong>{row.video.title}</strong>
                    <span>{formatTime(row.activeWatchSeconds)}</span>
                  </div>
                ))}
                {!rows.length && <p className="muted">No daily summaries yet.</p>}
              </div>
            </div>
          </div>
          <AdvancedAnalytics advanced={advanced} />
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
  const [playlists, setPlaylists] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [userTimeMap, setUserTimeMap] = useState(null);
  const [userAdvanced, setUserAdvanced] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState('');

  const loadAdmin = useCallback(async () => {
    setError('');
    try {
      const [summaryData, userData, videoData, playlistData, comparisonData] = await Promise.all([
        api('/api/admin/summary'),
        api('/api/admin/users'),
        api('/api/admin/videos'),
        api('/api/playlists'),
        api('/api/admin/analytics/comparison'),
      ]);
      setSummary(summaryData);
      setUsers(userData.users);
      setVideos(videoData.videos);
      setPlaylists(playlistData.playlists);
      setComparison(comparisonData);
      setSelectedUser((current) => current || userData.users[0] || null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  useEffect(() => {
    if (!selectedUser) {
      setUserAnalytics(null);
      setUserTimeMap(null);
      setUserAdvanced(null);
      return;
    }
    Promise.all([
      api(`/api/admin/analytics/users/${selectedUser.id}`),
      api(`/api/admin/analytics/users/${selectedUser.id}/time-map`),
      api(`/api/admin/analytics/users/${selectedUser.id}/advanced`),
    ])
      .then(([analyticsData, timeMapData, advancedData]) => {
        setUserAnalytics(analyticsData);
        setUserTimeMap(timeMapData);
        setUserAdvanced(advancedData);
      })
      .catch(() => {
        setUserAnalytics(null);
        setUserTimeMap(null);
        setUserAdvanced(null);
      });
  }, [selectedUser]);

  if (auth.user.role !== 'ADMIN') {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <Shield />
          <h1>Admin access required.</h1>
          <button className="primary" onClick={() => navigate('/')}>Back to learning</button>
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
          {['overview', 'users', 'playlists', 'videos', 'analytics'].map((item) => (
            <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>
          ))}
        </nav>
        <div className="admin-actions">
          <button className="small-button" onClick={() => navigate('/')}>Learner</button>
          <button className="logout" onClick={onLogout}><LogOut size={16} /> Logout</button>
        </div>
      </header>
      <section className="admin-content">
        {error && <p className="error banner-error">{error}</p>}
        {tab === 'overview' && (
          <>
            <div className="stats-grid">
              <Stat icon={Users} label="Users" value={summary?.userCount || 0} />
              <Stat icon={Folder} label="Playlists" value={summary?.playlistCount || 0} />
              <Stat icon={ListVideo} label="Videos" value={summary?.videoCount || 0} />
              <Stat icon={Clock} label="Total study" value={formatTime(summary?.totals?.activeWatchSeconds || 0)} />
            </div>
            <div className="analytics-grid wide">
              <div className="panel"><div className="panel-title"><Users size={18} /><h3>Users</h3></div>{users.slice(0, 8).map((user) => <div className="table-row" key={user.id}><strong>{user.name}</strong><span>{user.email}</span><span>{user.role}</span></div>)}</div>
              <div className="panel"><div className="panel-title"><ListVideo size={18} /><h3>Videos</h3></div>{videos.slice(0, 8).map((video) => <div className="table-row" key={video.id}><strong>{video.title}</strong><span>{video.playlist?.name || 'No playlist'}</span><span>{video._count.events} events</span></div>)}</div>
            </div>
            <div className="analytics-grid wide">
              <div className="panel"><div className="panel-title"><BarChart3 size={18} /><h3>Active study leaderboard</h3></div>{(comparison?.leaderboards?.byActiveStudy || []).slice(0, 8).map((row) => <div className="table-row" key={row.user.id}><strong>{row.user.name}</strong><span>{formatTime(row.activeStudySeconds)}</span><span>{row.completionRatePercent}% complete</span></div>)}</div>
              <div className="panel"><div className="panel-title"><Shield size={18} /><h3>Risk lists</h3></div><div className="metric-grid"><MetricCard title="Inactive" value={comparison?.inactiveUsers?.length || 0} /><MetricCard title="High distraction" value={comparison?.highDistractionUsers?.length || 0} /><MetricCard title="Low completion" value={comparison?.lowCompletionUsers?.length || 0} /><MetricCard title="Stuck users" value={comparison?.stuckUsers?.length || 0} /></div></div>
            </div>
            <div className="analytics-grid wide">
              <div className="panel">
                <div className="panel-title"><Clock size={18} /><h3>All users AM/PM heatmap</h3></div>
                <div className="hour-grid">
                  {(comparison?.charts?.allUsers24HourHeatmap || []).map((row) => (
                    <div className="hour-cell" key={row.hour} style={{ '--level': row.events / Math.max(1, ...(comparison?.charts?.allUsers24HourHeatmap || []).map((item) => item.events)) }}>
                      <strong>{formatHourLabel(row.hour)}</strong>
                      <span>{row.events} events</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-title"><BarChart3 size={18} /><h3>Daily active learners</h3></div>
                <div className="funnel-list">
                  {(comparison?.charts?.dailyActiveLearners || []).slice(-14).map((row) => <MiniBar key={row.date} label={row.date} value={row.activeUsers} max={Math.max(1, users.length)} detail={`${row.activeUsers} active · ${formatTime(row.totalStudySeconds)}`} />)}
                </div>
              </div>
            </div>
            <div className="analytics-grid wide">
              <div className="panel"><RadarBars rows={comparison?.userComparison || []} /></div>
              <div className="panel">
                <div className="panel-title"><Users size={18} /><h3>Cohort retention</h3></div>
                <div className="funnel-list">
                  {(comparison?.charts?.cohortRetention || []).map((row) => <MiniBar key={row.cohort} label={row.cohort} value={row.users} max={Math.max(1, users.length)} detail={`${row.users} learners`} />)}
                </div>
              </div>
            </div>
          </>
        )}
        {tab === 'users' && (
          <div className="admin-grid">
            <div className="panel"><div className="panel-title"><Plus size={18} /><h3>Create user</h3></div><AdminUserForm onCreated={loadAdmin} /></div>
            <div className="panel"><div className="panel-title"><Users size={18} /><h3>Manage users</h3></div><div className="admin-list">{users.map((user) => <AdminUserRow key={user.id} user={user} selected={selectedUser?.id === user.id} onSelect={setSelectedUser} onChanged={loadAdmin} currentUserId={auth.user.id} />)}</div></div>
          </div>
        )}
        {tab === 'playlists' && (
          <div className="admin-grid">
            <div className="panel"><div className="panel-title"><Plus size={18} /><h3>Create playlist</h3></div><PlaylistForm onCreated={loadAdmin} /></div>
            <div className="panel"><div className="panel-title"><Folder size={18} /><h3>Folders</h3></div><div className="admin-list">{playlists.map((playlist) => <div className="playlist-admin-row" key={playlist.id}><i style={{ background: playlist.color }} /><div><strong>{playlist.name}</strong><span>{playlist.videos.length} videos</span></div></div>)}</div></div>
          </div>
        )}
        {tab === 'videos' && (
          <div className="admin-grid">
            <div className="panel"><div className="panel-title"><Plus size={18} /><h3>Add video</h3></div><VideoForm playlists={playlists} onCreated={loadAdmin} /></div>
            <div className="panel"><div className="panel-title"><ListVideo size={18} /><h3>Manage videos</h3></div><div className="admin-list">{videos.map((video) => <AdminVideoRow key={video.id} video={video} playlists={playlists} onChanged={loadAdmin} />)}</div></div>
          </div>
        )}
        {tab === 'analytics' && (
          <AdminAnalyticsDashboard
            users={users}
            comparison={comparison}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            userAnalytics={userAnalytics}
            userTimeMap={userTimeMap}
            userAdvanced={userAdvanced}
            onChanged={loadAdmin}
            currentUserId={auth.user.id}
          />
        )}
      </section>
    </main>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [path, setPath] = useState(() => window.location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timeMap, setTimeMap] = useState(null);
  const [advanced, setAdvanced] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [heatmap, setHeatmap] = useState(null);
  const [liveConnected, setLiveConnected] = useState(false);

  const applyLocalMetric = useCallback((metric) => {
    const now = new Date();
    const today = formatDateKey(now);

    if (metric.type === 'tick') {
      setAdvanced((current) => {
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

        return {
          ...current,
          videoCompletion,
        };
      });

      setAnalytics((current) => {
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
            userId: auth.user.id,
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

      setHeatmap((current) => {
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
      setAnalytics((current) => {
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

      setTimeMap((current) => {
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
            seconds: bucket.seconds.map((entry) => entry.minute === minute ? { ...entry, count: entry.count + 1 } : entry),
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
              video: {
                id: metric.video.id,
                title: metric.video.title,
                youtubeId: metric.video.youtubeId,
              },
            },
          ].slice(-120),
        };
      });
    }
  }, [auth, heatmap]);

  const loadData = useCallback(async () => {
    if (!auth) return;
    const [videoData, playlistData, overview, mapData, advancedData, leaderboardData] = await Promise.all([
      api('/api/videos'),
      api('/api/playlists'),
      api('/api/analytics/overview'),
      api('/api/analytics/time-map'),
      api('/api/analytics/advanced'),
      api('/api/analytics/leaderboard'),
    ]);
    setVideos(videoData.videos);
    setPlaylists(playlistData.playlists);
    setAnalytics(overview);
    setTimeMap(mapData);
    setAdvanced(advancedData);
    setLeaderboard(leaderboardData.leaderboard || []);
    setSelectedVideo((current) => current || videoData.videos[0] || null);
  }, [auth]);

  useEffect(() => {
    loadData().catch(() => {});
  }, [loadData]);

  useEffect(() => {
    if (!auth?.token) return undefined;
    const socket = io(API_URL.origin, {
      path: SOCKET_PATH,
      auth: { token: auth.token },
    });
    socket.on('connect', () => setLiveConnected(true));
    socket.on('disconnect', () => setLiveConnected(false));
    socket.on('metrics:update', ({ overview, timeMap: nextTimeMap }) => {
      setAnalytics(overview);
      setTimeMap(nextTimeMap);
      if (selectedVideo) {
        api(`/api/analytics/videos/${selectedVideo.id}/heatmap`).then(setHeatmap).catch(() => {});
      }
    });
    return () => socket.disconnect();
  }, [auth, selectedVideo]);

  useEffect(() => {
    if (!selectedVideo) {
      setHeatmap(null);
      return;
    }
    api(`/api/analytics/videos/${selectedVideo.id}/heatmap`).then(setHeatmap).catch(() => setHeatmap(null));
  }, [selectedVideo]);

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

  if (!auth) return <AuthScreen onAuth={setAuth} />;

  const logout = () => {
    clearStoredAuth();
    setAuth(null);
  };

  if (path === '/admin') return <AdminPanel auth={auth} onLogout={logout} />;

  const groupedVideos = selectedPlaylistId === 'all'
    ? videos
    : selectedPlaylistId === 'none'
      ? videos.filter((video) => !video.playlistId)
      : videos.filter((video) => video.playlistId === selectedPlaylistId);

  return (
    <main className={sidebarOpen ? 'app-shell' : 'app-shell collapsed'}>
      <aside className="sidebar">
        <div className="brand">
          <Activity />
          <div>
            <strong>HexTorq Learn</strong>
            <span>{auth.user.name}</span>
          </div>
        </div>
        <button className="collapse-button" onClick={() => setSidebarOpen((value) => !value)} title="Toggle sidebar">
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        <nav className="learner-nav">
          <button className={path === '/' ? 'nav-button active' : 'nav-button'} onClick={() => navigate('/')} title="Learning">
            <Play size={16} /><span>Learning</span>
          </button>
          <button className={path === '/analytics' ? 'nav-button active' : 'nav-button'} onClick={() => navigate('/analytics')} title="Analytics">
            <BarChart3 size={16} /><span>Analytics</span>
          </button>
        </nav>
        {auth.user.role === 'ADMIN' && (
          <button className="admin-link" onClick={() => navigate('/admin')}><Shield size={16} /><span>Admin panel</span></button>
        )}
        <div className="sidebar-section">
          <div className="list-heading"><Folder size={16} /><span>Playlists</span></div>
          <button className={selectedPlaylistId === 'all' ? 'playlist-button active' : 'playlist-button'} onClick={() => setSelectedPlaylistId('all')}><i /> <span>All videos</span><strong>{videos.length}</strong></button>
          {playlists.map((playlist) => (
            <button key={playlist.id} className={selectedPlaylistId === playlist.id ? 'playlist-button active' : 'playlist-button'} onClick={() => setSelectedPlaylistId(playlist.id)}>
              <i style={{ background: playlist.color }} /><span>{playlist.name}</span><strong>{playlist.videos.length}</strong>
            </button>
          ))}
          <button className={selectedPlaylistId === 'none' ? 'playlist-button active' : 'playlist-button'} onClick={() => setSelectedPlaylistId('none')}><i /> <span>No playlist</span><strong>{videos.filter((video) => !video.playlistId).length}</strong></button>
        </div>
        <div className="video-list">
          <div className="list-heading"><ListVideo size={16} /><span>Videos</span></div>
          {groupedVideos.map((video) => (
            <button key={video.id} className={selectedVideo?.id === video.id ? 'video-item active' : 'video-item'} onClick={() => { setSelectedVideo(video); navigate('/'); }}>
              <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} alt="" />
              <span>{video.title}</span>
            </button>
          ))}
        </div>
        <button className="logout" onClick={logout}><LogOut size={16} /><span>Logout</span></button>
      </aside>
      <section className="content">
        {path === '/analytics' ? (
          <Dashboard analytics={analytics} selectedVideo={selectedVideo} heatmap={heatmap} timeMap={timeMap} advanced={advanced} leaderboard={leaderboard} currentUserId={auth.user.id} liveConnected={liveConnected} />
        ) : selectedVideo ? (
          <div className="learning-page">
            <LearningPlayer video={selectedVideo} onFlush={loadData} onLocalMetric={applyLocalMetric} />
            <WatchSummary analytics={analytics} advanced={advanced} selectedVideo={selectedVideo} liveConnected={liveConnected} />
          </div>
        ) : (
          <div className="empty-state"><Play size={44} /><h1>Add a YouTube lesson to start tracking.</h1></div>
        )}
      </section>
    </main>
  );
}
