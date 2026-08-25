import { Activity } from 'lucide-react';
import { formatTime } from '../../lib/youtube.js';
import { MiniBar } from '../ui/MiniBar.jsx';

export function PortalActivityLeaderboard({ rows = [], currentUserId }) {
  const top = [...rows].sort((a, b) => (b.portalActiveSeconds || 0) - (a.portalActiveSeconds || 0)).slice(0, 10);
  const max = Math.max(1, ...top.map((row) => row.portalActiveSeconds || 0));
  const onlineCount = rows.filter((row) => row.onlineStatus === 'online').length;

  return (
    <div className="panel">
      <div className="panel-title">
        <Activity size={18} />
        <h3>Most active in portal</h3>
        <span className="pill" style={{ marginLeft: 'auto' }}>{onlineCount} online now</span>
      </div>
      <div className="funnel-list">
        {top.map((row, index) => (
          <div key={row.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              title={row.onlineStatus === 'online' ? 'Online now' : 'Offline'}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: row.onlineStatus === 'online' ? 'var(--color-brand-500)' : 'var(--color-border)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <MiniBar
                label={`${row.userId === currentUserId ? '★ ' : ''}#${index + 1} ${row.name}`}
                value={row.portalActiveSeconds || 0}
                max={max}
                detail={`${formatTime(row.portalActiveSeconds || 0)} · ${row.portalLoginCount || 0} logins`}
              />
            </div>
          </div>
        ))}
        {!top.length && <p className="muted">No portal activity yet.</p>}
      </div>
    </div>
  );
}
