import { useEffect, useState } from 'react';
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

const MESSAGES = [
  'Skipping to class…',
  'Bouncing into lessons…',
  'Turning the page…',
  'Getting the crayons out…',
  'Almost ready to learn!',
];

// Little cartoon face (eyes + smile) centred on (cx, cy).
function Face({ cx, cy }) {
  return (
    <>
      <circle cx={cx - 2.6} cy={cy - 1} r="1.1" fill="#7c2d12" />
      <circle cx={cx + 2.6} cy={cy - 1} r="1.1" fill="#7c2d12" />
      <path d={`M${cx - 3} ${cy + 2} Q${cx} ${cy + 4.5} ${cx + 3} ${cy + 2}`} stroke="#7c2d12" strokeWidth="1" fill="none" strokeLinecap="round" />
    </>
  );
}

export function Loader() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % MESSAGES.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="kl-wrap">
      <style>{KL_CSS}</style>

      <svg className="kl-scene" viewBox="0 0 300 178" role="img" aria-label="Students doing activities">
        {/* clouds */}
        <g className="kl-cloud" fill="#ffffff">
          <ellipse cx="60" cy="28" rx="16" ry="9" /><ellipse cx="75" cy="28" rx="11" ry="7" />
        </g>
        <g className="kl-cloud kl-cloud2" fill="#ffffff">
          <ellipse cx="205" cy="20" rx="13" ry="8" /><ellipse cx="217" cy="20" rx="9" ry="6" />
        </g>

        {/* sun */}
        <g className="kl-sun">
          <g stroke="#fbbf24" strokeWidth="3" strokeLinecap="round">
            <line x1="270" y1="16" x2="270" y2="23" /><line x1="270" y1="49" x2="270" y2="56" />
            <line x1="250" y1="36" x2="257" y2="36" /><line x1="283" y1="36" x2="290" y2="36" />
            <line x1="256" y1="22" x2="261" y2="27" /><line x1="279" y1="45" x2="284" y2="50" />
            <line x1="256" y1="50" x2="261" y2="45" /><line x1="279" y1="27" x2="284" y2="22" />
          </g>
          <circle cx="270" cy="36" r="11" fill="#fbbf24" />
        </g>

        {/* ground */}
        <path d="M0 150 Q150 132 300 150 L300 178 L0 178 Z" fill="#bbf7d0" />
        <path d="M0 150 Q150 132 300 150" fill="none" stroke="#86efac" strokeWidth="3" />

        {/* --- Student 1: skipping rope --- */}
        <g className="kl-hop">
          <ellipse className="kl-rope" cx="60" cy="126" rx="26" ry="30" fill="none" stroke="#f472b6" strokeWidth="2.5" />
          <line x1="52" y1="120" x2="43" y2="114" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <line x1="68" y1="120" x2="77" y2="114" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <rect x="51" y="116" width="18" height="24" rx="9" fill="#a78bfa" />
          <circle cx="60" cy="108" r="8" fill="#f59e0b" />
          <Face cx={60} cy={108} />
        </g>

        {/* --- Student 2: bouncing a ball --- */}
        <g>
          <line x1="159" y1="120" x2="171" y2="126" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" />
          <rect x="141" y="116" width="18" height="24" rx="9" fill="#38bdf8" />
          <circle cx="150" cy="108" r="8" fill="#fca5a5" />
          <Face cx={150} cy={108} />
        </g>
        <circle className="kl-ball" cx="176" cy="141" r="8" fill="#fb7185" />

        {/* --- Student 3: reading a book --- */}
        <g>
          <rect x="231" y="116" width="18" height="24" rx="9" fill="#34d399" />
          <g className="kl-nod">
            <circle cx="240" cy="108" r="8" fill="#fcd34d" />
            <Face cx={240} cy={108} />
          </g>
          <line x1="233" y1="124" x2="230" y2="133" stroke="#fcd34d" strokeWidth="4" strokeLinecap="round" />
          <line x1="247" y1="124" x2="250" y2="133" stroke="#fcd34d" strokeWidth="4" strokeLinecap="round" />
          <g className="kl-book">
            <path d="M240 131 L227 127 L227 140 L240 143 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <path d="M240 131 L253 127 L253 140 L240 143 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="240" y1="131" x2="240" y2="143" stroke="#94a3b8" strokeWidth="1" />
          </g>
        </g>
      </svg>

      <h1 className="kl-title">Bachpan</h1>
      <p className="kl-msg" key={i}>{MESSAGES[i]}</p>
      <div className="kl-dots"><span /><span /><span /></div>
    </div>
  );
}

const KL_CSS = `
.kl-wrap {
  min-height: 100dvh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px;
  padding: 24px; text-align: center;
  background: linear-gradient(180deg, #e6f3ff 0%, #f2f9ff 55%, #f6fdf7 100%);
}
.kl-scene { width: 320px; max-width: 88vw; height: auto; overflow: visible; }
.kl-title { margin-top: 12px; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; color: #0f172a; }
.kl-msg { margin-top: 2px; font-size: 14px; color: #64748b; animation: kl-pop .4s ease; }
.kl-dots { margin-top: 12px; display: flex; gap: 6px; }
.kl-dots span { width: 7px; height: 7px; border-radius: 9999px; background: #93c5fd; animation: kl-bounce 1s ease-in-out infinite; }
.kl-dots span:nth-child(2) { background: #fca5a5; animation-delay: .15s; }
.kl-dots span:nth-child(3) { background: #86efac; animation-delay: .3s; }

.kl-hop  { transform-box: fill-box; transform-origin: center bottom; animation: kl-hop .55s ease-in-out infinite; }
.kl-rope { transform-box: fill-box; transform-origin: center; animation: kl-spin .55s linear infinite; }
.kl-ball { transform-box: fill-box; transform-origin: center bottom; animation: kl-ball .7s cubic-bezier(.5,0,.5,1) infinite; }
.kl-nod  { transform-box: fill-box; transform-origin: center bottom; animation: kl-nod 1.6s ease-in-out infinite; }
.kl-book { transform-box: fill-box; transform-origin: center bottom; animation: kl-book 2s ease-in-out infinite; }
.kl-sun  { transform-box: fill-box; transform-origin: center; animation: kl-spin 9s linear infinite; }
.kl-cloud  { transform-box: fill-box; transform-origin: center; animation: kl-drift 6s ease-in-out infinite alternate; }
.kl-cloud2 { animation-duration: 8s; animation-delay: .5s; }

@keyframes kl-hop { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes kl-spin { to { transform: rotate(360deg); } }
@keyframes kl-ball {
  0% { transform: translateY(-46px) scaleY(1); }
  46% { transform: translateY(0) scaleY(1); }
  54% { transform: translateY(0) scaleX(1.18) scaleY(.78); }
  62% { transform: translateY(0) scaleY(1); }
  100% { transform: translateY(-46px) scaleY(1); }
}
@keyframes kl-nod { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
@keyframes kl-book { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@keyframes kl-drift { from { transform: translateX(-7px); } to { transform: translateX(7px); } }
@keyframes kl-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes kl-pop { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .kl-hop, .kl-rope, .kl-ball, .kl-nod, .kl-book, .kl-sun, .kl-cloud, .kl-dots span { animation: none; }
}
`;
