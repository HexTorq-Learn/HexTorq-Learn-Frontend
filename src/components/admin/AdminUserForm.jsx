import { useState } from 'react';
import { api } from '../../lib/api.js';

export function AdminUserForm({ onCreated }) {
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
