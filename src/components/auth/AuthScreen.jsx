import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { api } from '../../lib/api.js';

export function AuthScreen({ mode: initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', username: '', phone: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function checkAvailability() {
    if (mode !== 'register') return;
    const params = new URLSearchParams();
    if (form.email.trim()) params.set('email', form.email.trim());
    if (form.username.trim()) params.set('username', form.username.trim());
    if (form.phone.trim()) params.set('phone', form.phone.trim());
    if (!params.toString()) return;

    setChecking(true);
    try {
      const result = await api(`/api/auth/availability?${params.toString()}`);
      if (!result.available) throw new Error(result.message || 'User already exists');
    } finally {
      setChecking(false);
    }
  }

  function checkAvailabilityOnBlur() {
    checkAvailability().then(() => {
      setError('');
    }).catch((err) => {
      setError(err.message);
    });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      if (mode === 'register') {
        await checkAvailability();
        await register(form.name, form.email, form.password, form.username, form.phone);
      } else {
        await login(form.email, form.password);
      }
      navigate('/learn', { replace: true });
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
            <>
              <label>
                Name
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </label>
              <label>
                Username
                <input value={form.username} onBlur={checkAvailabilityOnBlur} onChange={(event) => setForm({ ...form, username: event.target.value })} minLength={3} required />
              </label>
              <label>
                Phone
                <input type="tel" value={form.phone} onBlur={checkAvailabilityOnBlur} onChange={(event) => setForm({ ...form, phone: event.target.value })} minLength={7} required />
              </label>
            </>
          )}
          <label>
            Email
            <input type="email" value={form.email} onBlur={checkAvailabilityOnBlur} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit" disabled={checking}>{checking ? 'Checking...' : mode === 'login' ? 'Login' : 'Create account'}</button>
        </form>
      </section>
    </main>
  );
}
