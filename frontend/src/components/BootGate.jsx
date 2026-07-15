import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { api } from '../lib/api.js';

// Shows a one-time loader while the (possibly asleep) backend wakes up, then
// renders the app. Runs once per browser-tab session — a plain reload skips it.
const WARM_KEY = 'bachpan_warm';   // sessionStorage flag
const MAX_WAIT_MS = 60 * 1000;     // give up waiting after 60s
const ATTEMPT_TIMEOUT_MS = 20 * 1000;
const GRACE_MS = 500;              // don't flash the loader if the server is already awake

export default function BootGate({ children }) {
  const [ready, setReady] = useState(() => sessionStorage.getItem(WARM_KEY) === '1');
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    const start = Date.now();
    const grace = setTimeout(() => { if (!cancelled) setShowLoader(true); }, GRACE_MS);

    const withTimeout = (p) =>
      Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ATTEMPT_TIMEOUT_MS))]);

    async function attempt() {
      if (cancelled) return;
      try {
        await withTimeout(api.health());
        if (cancelled) return;
        sessionStorage.setItem(WARM_KEY, '1');
        setReady(true);
      } catch {
        if (cancelled) return;
        if (Date.now() - start >= MAX_WAIT_MS) {
          setReady(true); // stop waiting; let the app try on its own
          return;
        }
        setTimeout(attempt, 2000);
      }
    }
    attempt();

    return () => { cancelled = true; clearTimeout(grace); };
  }, [ready]);

  if (ready) return children;
  if (!showLoader) return null; // brief blank during the grace period
  return <Loader />;
}

function Loader() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const pct = Math.min((elapsed / 60) * 100, 100);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <Icon name="building" size={24} />
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Bachpan</h1>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Getting things ready — the first load can take up to a minute.
      </p>

      <div className="mt-5 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-brand-500 transition-all duration-1000 ease-linear" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
        Starting the server…
      </div>
    </div>
  );
}
