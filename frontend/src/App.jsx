import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Icon from './components/Icon.jsx';
import { useAuth } from './lib/auth.jsx';
import { coordinatorWindowOpen } from './lib/schedule.js';

export default function App() {
  const { user, logout } = useAuth();
  const [, setTick] = useState(0);

  // Re-check the schedule periodically so the lock applies as time passes.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  if (user?.role === 'coordinator' && !coordinatorWindowOpen()) {
    return <AccessClosed onLogout={logout} />;
  }

  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}

function AccessClosed({ onLogout }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon name="calendar" size={24} />
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Access closed</h1>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Access is available <span className="font-medium text-slate-700">Monday to Saturday, 7:00 AM to 1:30 PM</span>.
        Please come back during those hours.
      </p>
      <button className="btn-secondary mt-5" onClick={onLogout}>
        <Icon name="log-out" size={16} /> Sign out
      </button>
    </div>
  );
}
