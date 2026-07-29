import { useState } from 'react';
import { Folder } from 'lucide-react';
import { api } from '../../lib/api.js';

export function PlaylistForm({ onCreated }) {
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
