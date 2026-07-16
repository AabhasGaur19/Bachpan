import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Loader } from '../components/BootGate.jsx';
import { useAuth } from '../lib/auth.jsx';

const WELCOME_MS = 2600;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [devMode, setDevMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [entering, setEntering] = useState(false);

  function toggleDev(on) {
    setDevMode(on);
    setError('');
    setUsername(on ? 'developer' : '');
    setPassword('');
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const u = await login(username.trim(), password);
      // Developer goes straight to account management; everyone else to home.
      if (u?.features?.includes('users')) {
        navigate('/users', { replace: true });
        return;
      }
      setEntering(true);
      setTimeout(() => navigate('/', { replace: true }), WELCOME_MS);
    } catch (err) {
      setError(err.message || 'Could not sign in');
      setBusy(false);
    }
  }

  if (entering) return <Loader />;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${devMode ? 'bg-slate-600' : 'bg-slate-900'}`}>
            <Icon name={devMode ? 'users' : 'building'} size={24} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            {devMode ? 'Developer access' : 'Bachpan'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {devMode ? 'Sign in to manage user accounts' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <Icon name="alert" size={16} /> {error}
            </div>
          )}
          <div>
            <span className="label">Username</span>
            <input
              className="input" value={username} autoFocus autoComplete="username"
              onChange={(e) => setUsername(e.target.value)} placeholder="Enter username"
            />
          </div>
          <div>
            <span className="label">Password</span>
            <input
              type="password" className="input" value={password} autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)} placeholder="Enter password"
            />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-center">
          {devMode ? (
            <button type="button" className="text-xs font-medium text-slate-400 hover:text-slate-600" onClick={() => toggleDev(false)}>
              ← Back to normal sign-in
            </button>
          ) : (
            <button type="button" className="text-xs font-medium text-slate-400 hover:text-slate-600" onClick={() => toggleDev(true)}>
              Developer access
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
