import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

const CARDS = [
  {
    to: 'students', icon: 'graduation-cap', title: 'Students',
    desc: 'Enrollment, classes, guardians & fees',
    accent: 'bg-brand-50 text-brand-600',
  },
  {
    to: 'teachers', icon: 'book-open', title: 'Teachers',
    desc: 'Staff records, classes, leaves & payroll',
    accent: 'bg-violet-50 text-violet-600',
  },
  {
    to: 'inventory', icon: 'package', title: 'Inventory',
    desc: 'Stock levels, suppliers & reordering',
    accent: 'bg-amber-50 text-amber-600',
  },
  {
    to: 'users', icon: 'users', title: 'Users',
    desc: 'Create accounts & assign roles',
    accent: 'bg-slate-100 text-slate-600',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout, can } = useAuth();
  const [counts, setCounts] = useState({});
  const [lowStock, setLowStock] = useState(0);

  const cards = CARDS.filter((c) => can(c.to));

  useEffect(() => {
    (async () => {
      try {
        const next = {};
        if (can('students')) next.students = (await api.list('students')).length;
        if (can('teachers')) next.teachers = (await api.list('teachers')).length;
        if (can('inventory')) {
          const inv = await api.list('inventory');
          next.inventory = inv.length;
          setLowStock(inv.filter((i) => i.quantity <= i.reorder_level).length);
        }
        setCounts(next);
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-8 sm:py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Icon name="building" size={18} />
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">Bachpan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight text-slate-800">{user?.name}</p>
              <p className="text-[11px] capitalize leading-tight text-slate-400">{user?.role}</p>
            </div>
            <button className="icon-btn border border-slate-200" onClick={logout} title="Sign out" aria-label="Sign out">
              <Icon name="log-out" size={18} />
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="mt-12 sm:mt-16">
          <h1 className="text-[32px] font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl">
            Welcome back.
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-500">
            Choose a section to get started.
          </p>
        </div>

        {/* Sections (only those this role can access) */}
        <div className="mt-8 flex flex-col gap-3">
          {cards.map((c) => (
            <button
              key={c.to}
              onClick={() => navigate(`/${c.to}`)}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-card transition-all duration-200 hover:border-slate-300 hover:shadow-pop active:scale-[0.995]"
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${c.accent}`}>
                <Icon name={c.icon} size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-slate-900">{c.title}</h2>
                  {c.to === 'inventory' && lowStock > 0 && <span className="badge-amber">{lowStock} low</span>}
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-500">{c.desc}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-lg font-semibold tabular-nums text-slate-900">{counts[c.to] ?? '—'}</span>
                <span className="text-slate-300 transition-transform group-hover:translate-x-0.5">
                  <Icon name="chevron-right" size={20} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
