import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SlidePanel from '../components/SlidePanel.jsx';
import Icon from '../components/Icon.jsx';
import { Field, Avatar, EmptyState, RowsSkeleton, ErrorBanner } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

const BLANK = { username: '', name: '', password: '', role: '' };

export default function UserManager() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState(null);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setError('');
    try { setUsers(await api.listUsers()); }
    catch (e) { setError(e.message); setUsers([]); }
  }

  useEffect(() => {
    load();
    api.roles().then(setRoles).catch(() => {});
  }, []);

  const roleFeatures = useMemo(
    () => Object.fromEntries(roles.map((r) => [r.role, r.features])),
    [roles]
  );

  // Group users by role, in the roles-config order (developer, admin, coordinator…).
  const grouped = useMemo(() => {
    const byRole = {};
    for (const u of users || []) (byRole[u.role] ||= []).push(u);
    const order = roles.map((r) => r.role);
    const extras = Object.keys(byRole).filter((r) => !order.includes(r));
    return [...order, ...extras]
      .filter((r) => byRole[r]?.length)
      .map((r) => ({ role: r, users: byRole[r] }));
  }, [users, roles]);

  function startAdd() {
    setEditing({ ...BLANK, role: roles[0]?.role || 'coordinator' });
  }

  async function save(e) {
    e.preventDefault();
    if (!editing.username.trim()) return setError('Username is required');
    if (!editing.password) return setError('Password is required');
    setBusy(true); setError('');
    try {
      await api.createUser(editing);
      setEditing(null);
      await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function remove(u) {
    if (!confirm(`Delete user “${u.username}”? They will no longer be able to log in.`)) return;
    setError('');
    try { await api.deleteUser(u.id); await load(); }
    catch (e) { setError(e.message); }
  }

  async function toggleActive(u) {
    const enabling = u.is_active === false;
    setError('');
    try { await api.setUserActive(u.id, enabling); await load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f6f7f9]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="icon-btn -ml-2" aria-label="Home"><Icon name="arrow-left" size={20} /></Link>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Icon name="users" size={18} />
          </span>
          <div className="mr-auto">
            <h1 className="text-[15px] font-semibold leading-tight text-slate-900">User accounts</h1>
            <p className="text-xs text-slate-400">{users ? `${users.length} account${users.length === 1 ? '' : 's'}` : 'Loading…'}</p>
          </div>
          <button className="btn-primary h-10 px-3 sm:px-4" onClick={startAdd}>
            <Icon name="plus" size={18} /> <span className="hidden sm:inline">Add user</span>
          </button>
          <button className="icon-btn border border-slate-200" onClick={logout} title="Sign out" aria-label="Sign out">
            <Icon name="log-out" size={18} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <ErrorBanner message={error} />

        {users === null ? (
          <RowsSkeleton count={4} />
        ) : users.length === 0 ? (
          <EmptyState icon="users" message="No accounts yet. Tap “Add user” to create one." />
        ) : (
          <div className="space-y-7">
            {grouped.map((g) => (
              <section key={g.role}>
                <h2 className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{g.role}</span>
                  <span className="badge-slate">{g.users.length}</span>
                </h2>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {g.users.map((u) => (
                    <div key={u.id} className="card p-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name || u.username} />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate font-semibold text-slate-900">
                            {u.name || u.username}
                            {u.is_active === false
                              ? <span className="badge-slate">Disabled</span>
                              : <span className="badge-green">Active</span>}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            @{u.username}
                            {u.id === user.id && <span className="ml-1 text-slate-400">(you)</span>}
                          </p>
                        </div>
                      </div>
                      {u.id !== user.id && (
                        <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                          <button className="btn-secondary flex-1 py-2" onClick={() => toggleActive(u)}>
                            {u.is_active === false ? 'Enable' : 'Disable'}
                          </button>
                          <button className="btn-danger px-3 py-2" onClick={() => remove(u)} aria-label="Delete user">
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Add user */}
      <SlidePanel open={!!editing} title="Add user" onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Username">
              <input className="input" value={editing.username} autoFocus autoComplete="off"
                placeholder="e.g. reception1"
                onChange={(e) => setEditing({ ...editing, username: e.target.value })} />
            </Field>
            <Field label="Full name (optional)">
              <input className="input" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Password">
              <input className="input" value={editing.password} autoComplete="new-password"
                placeholder="Set a password to share with them"
                onChange={(e) => setEditing({ ...editing, password: e.target.value })} />
            </Field>
            <Field label="Role">
              <select className="input" value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                {roles.map((r) => (
                  <option key={r.role} value={r.role}>{r.role.charAt(0).toUpperCase() + r.role.slice(1)}</option>
                ))}
              </select>
            </Field>
            {roleFeatures[editing.role] && (
              <p className="-mt-1.5 text-xs text-slate-400">
                Can access: {roleFeatures[editing.role].length ? roleFeatures[editing.role].join(', ') : 'account management only'}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={busy}>
                {busy ? 'Creating…' : 'Create user'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        )}
      </SlidePanel>
    </div>
  );
}
