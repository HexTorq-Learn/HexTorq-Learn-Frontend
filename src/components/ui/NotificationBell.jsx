import { useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications.js';

const SEVERITY_COLOR = {
  high: 'var(--color-danger)',
  medium: 'var(--color-accent-600)',
  low: 'var(--color-text-muted)',
};

function timeAgo(dateStr) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button className="icon-light" onClick={() => setOpen((value) => !value)} title="Notifications" style={{ position: 'relative' }}>
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, background: 'var(--color-danger)', color: '#fff',
            borderRadius: '999px', fontSize: '0.62rem', lineHeight: 1, padding: '2px 4px', minWidth: 14, textAlign: 'center',
          }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          className="panel"
          style={{
            position: 'absolute', top: '2.4rem', right: 0, width: 340, maxHeight: 420, overflowY: 'auto',
            zIndex: 40, boxShadow: 'var(--shadow-hero)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <strong style={{ fontSize: '0.85rem' }}>Notifications</strong>
            {unreadCount > 0 && (
              <button className="icon-light" onClick={markAllRead} title="Mark all read">
                <Check size={14} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => !item.read && markRead(item.id)}
                style={{
                  textAlign: 'left', border: '1px solid var(--color-border)', borderRadius: '0.6rem',
                  padding: '0.55rem 0.7rem', background: item.read ? 'var(--color-surface-0)' : 'var(--color-surface-100)',
                  cursor: item.read ? 'default' : 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i style={{ width: 7, height: 7, borderRadius: '50%', background: SEVERITY_COLOR[item.severity] || SEVERITY_COLOR.medium, flexShrink: 0 }} />
                  <strong style={{ fontSize: '0.8rem' }}>{item.title}</strong>
                  <span className="muted" style={{ marginLeft: 'auto', fontSize: '0.68rem' }}>{timeAgo(item.createdAt)}</span>
                </div>
                <p className="muted" style={{ margin: '0.3rem 0 0', fontSize: '0.76rem' }}>{item.message}</p>
              </button>
            ))}
            {!notifications.length && <p className="muted" style={{ fontSize: '0.8rem' }}>No notifications yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
