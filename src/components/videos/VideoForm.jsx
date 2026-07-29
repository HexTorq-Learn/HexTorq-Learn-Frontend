import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api.js';

export function VideoForm({ playlists = [], onCreated }) {
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
