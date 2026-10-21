import React, { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin, settings }) {
  const [form, setForm] = useState({ email: 'student@campus.edu', password: 'student123' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(form.email, form.password);
      localStorage.setItem('campus_token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-art">
        <div className="brand-mark large">
          {settings?.institution_logo ? (
            <img src={settings.institution_logo} alt="Logo" className="logo-img-small" />
          ) : 'SC'}
        </div>
        <div>
          <p className="eyebrow">{settings?.institution_name ? settings.institution_name.toUpperCase() : 'SMART CAMPUS'}</p>
          <h1>One place to report, track and resolve campus issues.</h1>
          <p className="muted light">A centralized complaint workflow for students and college authorities.</p>
        </div>
        <div className="login-points">
          <span>● Real-time complaint tracking</span>
          <span>● Photo proof attachments</span>
          <span>● "+1 Me Too" issue upvoting</span>
          <span>● Department-wise assignment & SLA tracking</span>
        </div>
      </div>
      <div className="login-panel">
        <div className="login-card">
          <p className="eyebrow">CAMPUS PORTAL</p>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to access the complaint management system.</p>
          <form onSubmit={submit} className="form-stack">
            <label>Email
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label>Password
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </label>
            {error && <div className="error-box">{error}</div>}
            <button className="primary full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="demo-box">
            <strong>Demo Accounts (All passwords: <code>student123</code> / <code>admin123</code>)</strong>
            <div><span>Student 1 (Aarav)</span><code>student@campus.edu</code></div>
            <div><span>Student 2 (Riya)</span><code>riya@campus.edu</code></div>
            <div><span>Student 3 (Vikram)</span><code>vikram@campus.edu</code></div>
            <div><span>Student 4 (Ananya)</span><code>ananya@campus.edu</code></div>
            <div><span>Admin</span><code>admin@campus.edu</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}
