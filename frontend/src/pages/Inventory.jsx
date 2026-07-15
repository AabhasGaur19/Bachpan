import { useMemo, useState } from 'react';
import SectionLayout from '../components/SectionLayout.jsx';
import SlidePanel from '../components/SlidePanel.jsx';
import Icon from '../components/Icon.jsx';
import { Field, EmptyState, Skeleton, CardsSkeleton, ErrorBanner } from '../components/ui.jsx';
import { useCollection } from '../lib/useCollection.js';

const BLANK = { id: '', name: '', variants: [{ label: '', quantity: '' }] };

const variantsOf = (i) =>
  Array.isArray(i.variants) && i.variants.length
    ? i.variants
    : [{ label: '', quantity: i.quantity ?? 0 }];

const totalUnits = (i) => variantsOf(i).reduce((s, v) => s + (Number(v.quantity) || 0), 0);

export default function Inventory() {
  const { items, error, saving, save, remove, setError } = useCollection('inventory');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      [i.name, ...variantsOf(i).map((v) => v.label)].join(' ').toLowerCase().includes(q));
  }, [items, search]);

  const stats = useMemo(() => {
    if (!items) return null;
    return { count: items.length, units: items.reduce((s, i) => s + totalUnits(i), 0) };
  }, [items]);

  function startAdd() {
    setEditing({ ...BLANK, variants: [{ label: '', quantity: '' }] });
  }
  function startEdit(i) {
    setEditing({
      id: i.id,
      name: i.name || '',
      variants: variantsOf(i).map((v) => ({ label: v.label || '', quantity: v.quantity ?? '' })),
    });
  }

  function setVariant(idx, patch) {
    setEditing((e) => ({ ...e, variants: e.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)) }));
  }
  function addVariant() {
    setEditing((e) => ({ ...e, variants: [...e.variants, { label: '', quantity: '' }] }));
  }
  function removeVariant(idx) {
    setEditing((e) => ({ ...e, variants: e.variants.filter((_, i) => i !== idx) }));
  }

  const editingTotal = editing
    ? editing.variants.reduce((s, v) => s + (Number(v.quantity) || 0), 0)
    : 0;

  async function handleSave(e) {
    e.preventDefault();
    if (!editing.name.trim()) return setError('Item name is required');

    let variants = editing.variants
      .filter((v) => String(v.label).trim() !== '' || Number(v.quantity) > 0)
      .map((v) => ({ label: String(v.label).trim(), quantity: Number(v.quantity) || 0 }));
    if (variants.length === 0) variants = [{ label: '', quantity: 0 }];

    const payload = { id: editing.id, name: editing.name.trim(), variants };
    if (await save(payload)) setEditing(null);
  }

  async function handleDelete(i) {
    if (confirm(`Delete "${i.name}"?`)) await remove(i.id);
  }

  return (
    <SectionLayout
      iconName="package" title="Inventory" accent="bg-amber-50 text-amber-600"
      count={items ? items.length : null}
      search={search} onSearch={setSearch}
      onAdd={startAdd} addLabel="Add item"
    >
      <ErrorBanner message={error} />

      {stats && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Stat label="Items" value={stats.count} />
          <Stat label="Total quantity" value={stats.units} />
        </div>
      )}

      {filtered === null ? (
        <>
          {!stats && (
            <div className="mb-5 grid grid-cols-2 gap-3">
              <Skeleton className="h-[70px] rounded-2xl" />
              <Skeleton className="h-[70px] rounded-2xl" />
            </div>
          )}
          <CardsSkeleton cols="sm:grid-cols-2 xl:grid-cols-3" />
        </>
      ) : filtered.length === 0 ? (
        <EmptyState icon="package" message={search ? 'No items match your search.' : 'No items yet. Tap “Add item” to create one.'} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((i) => {
            const vs = variantsOf(i);
            const labelled = vs.some((v) => v.label);
            return (
              <div key={i.id} className="card flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-900">{i.name}</p>
                  <span className="badge-slate shrink-0">{totalUnits(i)}</span>
                </div>

                {labelled && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {vs.map((v, idx) => (
                      <span key={idx} className="badge-slate">
                        {v.label} · <b className="text-slate-900">{v.quantity}</b>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  <button className="btn-secondary flex-1 py-2" onClick={() => startEdit(i)}>
                    <Icon name="pencil" size={15} /> Edit
                  </button>
                  <button className="btn-danger px-3 py-2" onClick={() => handleDelete(i)} aria-label="Delete">
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit */}
      <SlidePanel open={!!editing} title={editing?.id ? 'Edit item' : 'Add item'} onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Item name">
              <input className="input" value={editing.name} placeholder="e.g. Shoes"
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            </Field>

            {/* Parameters */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Parameters</p>
                <span className="text-xs text-slate-400">Total: <b className="text-slate-700">{editingTotal}</b></span>
              </div>

              <div className="space-y-2">
                {editing.variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      className="input" value={v.label} placeholder="e.g. Size 9"
                      onChange={(e) => setVariant(idx, { label: e.target.value })}
                    />
                    <input
                      type="number" min="0" className="input w-24 shrink-0" value={v.quantity} placeholder="Qty"
                      onChange={(e) => setVariant(idx, { quantity: e.target.value })}
                    />
                    <button
                      type="button" className="icon-btn shrink-0 text-rose-500 hover:bg-rose-50 disabled:opacity-30"
                      onClick={() => removeVariant(idx)} disabled={editing.variants.length <= 1} aria-label="Remove"
                    >
                      <Icon name="x" size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="btn-secondary mt-2 w-full py-2" onClick={addVariant}>
                <Icon name="plus" size={15} /> Add parameter
              </button>
              <p className="mt-2 text-xs text-slate-400">
                Name each row yourself (e.g. “Size 9”) with its quantity. For a single count, use one row and leave the name blank.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving…' : 'Save item'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        )}
      </SlidePanel>
    </SectionLayout>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card p-3.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
