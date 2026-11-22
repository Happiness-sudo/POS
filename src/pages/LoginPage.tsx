import { useState } from 'react';
import type { FormEvent } from 'react';
import { login } from '../api';
import type { User } from '../types';

interface LoginPageProps { onSignIn: (user: User) => void }

export default function LoginPage({ onSignIn }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try { onSignIn(await login(username, password)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not sign in'); setBusy(false); }
  };

  return <main className="login-page"><form className="login-card" onSubmit={submit}>
    <h1>[SHOP NAME]</h1><p className="muted">Sign in to start your shift</p>
    <label>Username<input placeholder="alex" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} /></label>
    <label>Password or PIN<input placeholder="PIN" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
    {error && <p role="alert" style={{ color: '#b42318', margin: 0 }}>{error}</p>}
    <button className="primary login-submit" disabled={busy}>{busy ? 'Signing in...' : 'Log in'}</button><button className="link-button" type="button">Forgot PIN? Ask the owner to reset it</button>
  </form><div className="login-foot">Simple sales. Clear records.</div></main>;
}