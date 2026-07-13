import { useMemo, useState } from 'react';
import SectionLayout from '../components/SectionLayout.jsx';
import SlidePanel from '../components/SlidePanel.jsx';
import Icon from '../components/Icon.jsx';
import { Field, EmptyState, Spinner, ErrorBanner, KV } from '../components/ui.jsx';
import { useCollection } from '../lib/useCollection.js';

const BLANK = {
  id: '', item_name: '', category: '', quantity: 0, unit: 'pcs',
  reorder_level: 0, supplier: '', last_ordered: '',
};

const isLow = (i) => Number(i.quantity) <= Number(i.reorder_level);

export default function Inventory() {
  const { items, error, saving, save, remove, setError } = useCollection('inventory');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [ordering, setOrdering] = useState(null);
  const [orderQty, setOrderQty] = useState(0);

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    const base = !q ? items : items.filter((i) =>
      [i.item_name, i.category, i.supplier].join(' ').toLowerCase().includes(q));
    return [...base].sort((a, b) => (isLow(b) ? 1 : 0) - (isLow(a) ? 1 : 0));
  }, [items, search]);

  const stats = useMemo(() => {
    if (!items) return null;
    return {
      total: items.length,
      low: items.filter(isLow).length,
      categories: new Set(items.map((i) => i.category).filter(Boolean)).size,
    };
  }, [items]);

  async function handleSave(e) {
    e.preventDefault();
    if (!editing.item_name.trim()) return setError('Item name is required');
    const payload = {
      ...editing,
      quantity: Number(editing.quantity) || 0,
      reorder_level: Number(editing.reorder_level) || 0,
    };
    if (await save(payload)) setEditing(null);
  }

  async function handleDelete(i) {
    if (confirm(`Delete "${i.item_name}"?`)) await remove(i.id);
  }

  function openOrder(i) {
    setOrdering(i);
    setOrderQty(Math.max(Number(i.reorder_level) * 2 - Number(i.quantity), 1));
  }

  async function confirmOrder(e) {
    e.preventDefault();
    const add = Number(orderQty) || 0;
    const payload = {
      ...ordering,
      quantity: Number(ordering.quantity) + add,
      last_ordered: new Date().toISOString().slice(0, 10),
    };
    delete payload.created_at;
    if (await save(payload)) setOrdering(null);
  }

  return (
    <SectionLayout
      iconName="package" title="Inventory" accent="bg-amber-50 text-amber-600"
      count={items ? items.length : null}
      search={search} onSearch={setSearch}
      onAdd={() => setEditing({ ...BLANK })} addLabel="Add"
    >
      <ErrorBanner message={error} />

      {stats && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Stat label="Total items" value={stats.total} tone="slate" />
          <Stat label="Low stock" value={stats.low} tone={stats.low ? 'red' : 'green'} />
          <Stat label="Categories" value={stats.categories} tone="slate" />
        </div>
      )}

      {filtered === null ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon="package" message={search ? 'No items match your search.' : 'No inventory yet. Tap “Add” to create one.'} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((i) => {
            const low = isLow(i);
            return (
              <div key={i.id} className={`card flex flex-col p-4 ${low ? 'ring-1 ring-rose-100' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-slate-900">{i.item_name}</p>
                    <p className="truncate text-[13px] text-slate-500">{i.category || '—'}</p>
                  </div>
                  {low
                    ? <span className="badge-red shrink-0"><Icon name="alert" size={13} /> Low</span>
                    : <span className="badge-green shrink-0"><Icon name="check" size={13} /> OK</span>}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
                  <KV label="In stock" value={`${i.quantity} ${i.unit || ''}`.trim()} className={low ? 'text-rose-600' : ''} />
                  <KV label="Reorder at" value={String(i.reorder_level)} />
                  <KV label="Supplier" value={i.supplier} />
                  <KV label="Last ordered" value={i.last_ordered} />
                </dl>
                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    className={`btn flex-1 py-2 ${low ? 'bg-amber-500 text-white hover:bg-amber-600' : 'btn-secondary'}`}
                    onClick={() => openOrder(i)}
                  >
                    <Icon name="cart" size={16} /> Order
                  </button>
                  <button className="btn-secondary px-3 py-2" onClick={() => setEditing(i)} aria-label="Edit">
                    <Icon name="pencil" size={15} />
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

      {/* Add / Edit item */}
      <SlidePanel open={!!editing} title={editing?.id ? 'Edit item' : 'Add item'} onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Item name">
              <input className="input" value={editing.item_name} placeholder="e.g. Notebooks"
                onChange={(e) => setEditing({ ...editing, item_name: e.target.value })} autoFocus />
            </Field>
            <Field label="Category">
              <input className="input" value={editing.category} placeholder="Stationery, Furniture…"
                onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity in stock">
                <input type="number" min="0" className="input" value={editing.quantity}
                  onChange={(e) => setEditing({ ...editing, quantity: e.target.value })} />
              </Field>
              <Field label="Unit">
                <input className="input" value={editing.unit} placeholder="pcs, box, kg…"
                  onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
              </Field>
              <Field label="Reorder level">
                <input type="number" min="0" className="input" value={editing.reorder_level}
                  onChange={(e) => setEditing({ ...editing, reorder_level: e.target.value })} />
              </Field>
              <Field label="Last ordered">
                <input type="date" className="input" value={editing.last_ordered || ''}
                  onChange={(e) => setEditing({ ...editing, last_ordered: e.target.value })} />
              </Field>
            </div>
            <Field label="Supplier">
              <input className="input" value={editing.supplier}
                onChange={(e) => setEditing({ ...editing, supplier: e.target.value })} />
            </Field>

            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving…' : 'Save item'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        )}
      </SlidePanel>

      {/* Order / restock */}
      <SlidePanel open={!!ordering} title="Place order" onClose={() => setOrdering(null)}>
        {ordering && (
          <form onSubmit={confirmOrder} className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
              <p className="font-semibold text-slate-900">{ordering.item_name}</p>
              <p className="mt-0.5 text-sm text-slate-500">
                {ordering.quantity} {ordering.unit} in stock · reorder at {ordering.reorder_level}
              </p>
              {ordering.supplier && <p className="mt-1 text-sm text-slate-500">Supplier: {ordering.supplier}</p>}
            </div>
            <Field label="Quantity to order">
              <input type="number" min="1" className="input" value={orderQty} autoFocus
                onChange={(e) => setOrderQty(e.target.value)} />
            </Field>
            <p className="text-sm text-slate-500">
              New stock after receiving:{' '}
              <span className="font-semibold text-slate-900">{Number(ordering.quantity) + (Number(orderQty) || 0)} {ordering.unit}</span>
            </p>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Recording…' : 'Confirm order'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setOrdering(null)}>Cancel</button>
            </div>
          </form>
        )}
      </SlidePanel>
    </SectionLayout>
  );
}

function Stat({ label, value, tone }) {
  const tones = { slate: 'text-slate-900', red: 'text-rose-600', green: 'text-emerald-600' };
  return (
    <div className="card p-3.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tones[tone]}`}>{value}</p>
    </div>
  );
}
