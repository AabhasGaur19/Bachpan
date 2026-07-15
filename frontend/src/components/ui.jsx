import Icon from './Icon.jsx';

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Avatar({ name, src, className = '' }) {
  const initials = (name || '?')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  if (src) {
    return <img src={src} alt={name} className={`h-10 w-10 rounded-full object-cover ${className}`} />;
  }
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-500 ${className}`}>
      {initials}
    </div>
  );
}

// Key/value pair used inside cards & detail views.
export function KV({ label, value, className = '' }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`mt-0.5 truncate text-sm font-medium text-slate-700 ${className}`}>{value || '—'}</dd>
    </div>
  );
}

export function EmptyState({ icon = 'layers', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon name={icon} size={22} />
      </div>
      <p className="max-w-xs text-sm text-slate-500">{message}</p>
      {action}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-24 text-slate-300">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-brand-600" />
    </div>
  );
}

// Shimmering placeholder block.
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200/70 ${className}`} />;
}

// A list of placeholder rows shown while a panel's list loads.
export function RowsSkeleton({ count = 3 }) {
  return (
    <ul className="space-y-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-xl border border-slate-200/80 px-3 py-2.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// A grid of placeholder cards shown while a section's data loads.
export function CardsSkeleton({ count = 6, cols = 'sm:grid-cols-2 xl:grid-cols-3' }) {
  return (
    <div className={`grid gap-3 ${cols}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-3.5 p-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <span className="flex items-center gap-2">
        <Icon name="alert" size={16} /> {message}
      </span>
      {onRetry && <button className="font-semibold underline" onClick={onRetry}>Retry</button>}
    </div>
  );
}
