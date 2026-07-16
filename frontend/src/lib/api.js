// Thin fetch wrapper around the backend REST API.
// In dev, Vite proxies /api -> http://localhost:4000 (see vite.config.js).
// In production set VITE_API_URL to your deployed backend URL.

const BASE = import.meta.env.VITE_API_URL || '';

export const TOKEN_KEY = 'bachpan_token';
export const USER_KEY = 'bachpan_user';

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // Session expired / not logged in -> clear and send to login (except on login).
  if (res.status === 401 && !path.includes('/auth/login')) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (!location.pathname.startsWith('/login')) location.assign('/login');
  }

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
  feesSummary: () => request('/api/payments/summary'),
  paymentsByMonth: (month) => request(`/api/payments/summary/${month}`),

  // Leave register for a teacher
  listLeaves: (teacherId) => request(`/api/teachers/${teacherId}/leaves`),
  addLeave: (teacherId, data) =>
    request(`/api/teachers/${teacherId}/leaves`, { method: 'POST', body: JSON.stringify(data) }),
  addLeaveRange: (teacherId, data) =>
    request(`/api/teachers/${teacherId}/leaves`, { method: 'POST', body: JSON.stringify(data) }),
  removeLeave: (teacherId, leaveId) =>
    request(`/api/teachers/${teacherId}/leaves/${leaveId}`, { method: 'DELETE' }),

  // Payroll (monthly salary register)
  getPayroll: (month) => request(`/api/payroll/${month}`),
  generatePayroll: (month) => request(`/api/payroll/${month}`, { method: 'POST' }),
  payrollMonths: () => request('/api/payroll/months'),

  // Auth
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),
};
