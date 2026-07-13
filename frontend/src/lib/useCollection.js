import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

// Handles loading, saving, deleting and search for one resource.
export function useCollection(resource) {
  const [items, setItems] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setItems(await api.list(resource));
    } catch (e) {
      setError(e.message);
      setItems([]);
    }
  }, [resource]);

  useEffect(() => { load(); }, [load]);

  // Returns the saved record on success, or null on failure.
  async function save(record) {
    setSaving(true);
    setError('');
    try {
      let result;
      if (record.id && !String(record.id).startsWith('new')) {
        const { id, created_at, ...patch } = record;
        result = await api.update(resource, id, patch);
      } else {
        const { id, ...data } = record;
        result = await api.create(resource, data);
      }
      await load();
      return result;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    setError('');
    try {
      await api.remove(resource, id);
      await load();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  return { items, error, saving, reload: load, save, remove, setError };
}
