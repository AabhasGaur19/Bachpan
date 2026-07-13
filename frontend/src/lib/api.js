// Thin fetch wrapper around the backend REST API.
// In dev, Vite proxies /api -> http://localhost:4000 (see vite.config.js).
// In production set VITE_API_URL to your deployed backend URL.

const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// resource is one of: 'students' | 'teachers' | 'inventory'
export const api = {
  list: (resource) => request(`/api/${resource}`),
  create: (resource, data) =>
    request(`/api/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (resource, id, data) =>
    request(`/api/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (resource, id) =>
    request(`/api/${resource}/${id}`, { method: 'DELETE' }),
  health: () => request('/api/health'),

  // Fee payment history for a student
  listPayments: (studentId) => request(`/api/students/${studentId}/payments`),
  addPayment: (studentId, data) =>
    request(`/api/students/${studentId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  removePayment: (studentId, paymentId) =>
    request(`/api/students/${studentId}/payments/${paymentId}`, { method: 'DELETE' }),
};
