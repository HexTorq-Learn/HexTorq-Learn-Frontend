import { useState } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { formatTime } from '../../lib/youtube.js';

export function AdminVideoRow({ video, playlists, onChanged }) {
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
