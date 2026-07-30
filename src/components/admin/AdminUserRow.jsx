import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { formatTime } from '../../lib/youtube.js';

export function AdminUserRow({ user, selected, onChanged, currentUserId }) {
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState('');
  const isCurrentUser = user.id === currentUserId;
  const activeSeconds = user.summaries.reduce((total, row) => total + row.activeWatchSeconds, 0);
  const dailyMinutes = Object.entries(user.summaries.reduce((acc, row) => {
    const day = new Date(row.date).toLocaleDateString('en-CA');
    acc[day] = (acc[day] || 0) + row.activeWatchSeconds;
    return acc;
  }, {})).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7);

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
      <Link className="row-main" to={`/admin/users/${user.id}`}>
        <strong>{user.name}</strong>
        <span>{user.email}{user.username ? ` · @${user.username}` : ''}{user.phone ? ` · ${user.phone}` : ''} · {formatTime(activeSeconds)} · {user._count.sessions} sessions{isCurrentUser ? ' · current admin' : ''}</span>
        <span className="daily-minutes-line">
          {dailyMinutes.length
            ? dailyMinutes.map(([day, seconds]) => `${day}: ${Math.round(seconds / 60)} min`).join(' · ')
            : 'No daily watch minutes yet'}
        </span>
        {error && <span className="row-error">{error}</span>}
      </Link>
      <select value={role} onChange={(event) => updateRole(event.target.value)} disabled={isCurrentUser}>
        <option value="STUDENT">Student</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button className="icon-light danger" onClick={remove} disabled={isCurrentUser} title="Delete user"><Trash2 size={16} /></button>
    </div>
  );
}
