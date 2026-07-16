import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  list, create, update, remove, usingSupabase,
  listPayments, addPayment, deletePayment, paymentsSummary, paymentsByMonth,
  listLeaves, addLeave, addLeaveRange, deleteLeave, listTeachers,
  payrollPreview, getPayroll, generatePayroll, payrollMonths,
  authenticate, createSession, getSessionUser, deleteSession, ensureDefaultUsers,
} from './db/store.js';
import { featuresForRole } from './auth/roles.js';

const app = express();
app.use(cors());
app.use(express.json());

// Attach the logged-in user (if a valid token is sent) to every request.
app.use(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try { req.user = await getSessionUser(token); } catch { /* ignore */ }
    req.token = token;
  }
  next();
});

// Guards
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in' });
  next();
}
function requireFeature(feature) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Please log in' });
    if (!featuresForRole(req.user.role).includes(feature)) {
      return res.status(403).json({ error: 'You do not have access to this section' });
    }
    next();
  };
}

const userCan = (req, feature) => !!req.user && featuresForRole(req.user.role).includes(feature);

// Remove fee fields from a student for users without the 'fees' feature.
function stripFees(student) {
  const { total_fees, paid_fees, ...rest } = student;
  return rest;
}
// Prevent users without 'fees' from setting fee fields via create/update.
function stripFeesFromBody(req, _res, next) {
  if (!userCan(req, 'fees')) {
    delete req.body.total_fees;
    delete req.body.paid_fees;
  }
  next();
}

// Health / status (public)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, storage: usingSupabase ? 'supabase' : 'local file (db/data.json)' });
});

// ---- Auth (public login; logout/me require a token) ----
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await authenticate(username, password);
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    const token = await createSession(user.id);
    res.json({ token, user: { ...user, features: featuresForRole(user.role) } });
  } catch (e) { next(e); }
});

app.post('/api/auth/logout', requireAuth, async (req, res, next) => {
  try { await deleteSession(req.token); res.status(204).end(); } catch (e) { next(e); }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ ...req.user, features: featuresForRole(req.user.role) });
});

// Generic CRUD factory so Students / Teachers / Inventory share the same logic.
function crudRoutes(table) {
  const router = express.Router();

  router.get('/', async (_req, res, next) => {
    try {
      res.json(await list(table));
    } catch (e) { next(e); }
  });

  router.post('/', async (req, res, next) => {
    try {
      res.status(201).json(await create(table, req.body));
    } catch (e) { next(e); }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const row = await update(table, req.params.id, req.body);
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (e) { next(e); }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const ok = await remove(table, req.params.id);
      if (!ok) return res.status(404).json({ error: 'Not found' });
      res.status(204).end();
    } catch (e) { next(e); }
  });

  return router;
}

// Students list — hides fee fields from users without the 'fees' feature.
app.get('/api/students', requireFeature('students'), async (req, res, next) => {
  try {
    let rows = await list('students');
    if (!userCan(req, 'fees')) rows = rows.map(stripFees);
    res.json(rows);
  } catch (e) { next(e); }
});
app.use('/api/students', requireFeature('students'), stripFeesFromBody, crudRoutes('students'));
// Teachers GET is enriched with current-month leave stats (must be before the
// generic router so it handles the list request).
app.get('/api/teachers', requireFeature('teachers'), async (_req, res, next) => {
  try { res.json(await listTeachers()); } catch (e) { next(e); }
});
app.use('/api/teachers', requireFeature('teachers'), crudRoutes('teachers'));
app.use('/api/inventory', requireFeature('inventory'), crudRoutes('inventory'));
// Classes are shared (students & teachers both use them) -> any logged-in user.
app.use('/api/classes', requireAuth, crudRoutes('classes'));
app.use('/api/holidays', requireFeature('teachers'), crudRoutes('holidays'));

// ---- Fees: month-wise collection summary (all students) ----
app.get('/api/payments/summary', requireFeature('fees'), async (_req, res, next) => {
  try {
    res.json(await paymentsSummary());
  } catch (e) { next(e); }
});

app.get('/api/payments/summary/:month', requireFeature('fees'), async (req, res, next) => {
  try {
    res.json(await paymentsByMonth(req.params.month));
  } catch (e) { next(e); }
});

// ---- Fee payments (installment history) for a student ----
app.get('/api/students/:id/payments', requireFeature('fees'), async (req, res, next) => {
  try {
    res.json(await listPayments(req.params.id));
  } catch (e) { next(e); }
});

app.post('/api/students/:id/payments', requireFeature('fees'), async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    res.status(201).json(await addPayment(req.params.id, req.body));
  } catch (e) { next(e); }
});

app.delete('/api/students/:id/payments/:paymentId', requireFeature('fees'), async (req, res, next) => {
  try {
    const ok = await deletePayment(req.params.id, req.params.paymentId);
    if (!ok) return res.status(404).json({ error: 'Payment not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

// ---- Payroll (monthly salary register) ----
// NOTE: /months must be declared before /:month so it isn't treated as a month.
app.get('/api/payroll/months', requireFeature('teachers'), async (_req, res, next) => {
  try {
    res.json(await payrollMonths());
  } catch (e) { next(e); }
});

app.get('/api/payroll/:month', requireFeature('teachers'), async (req, res, next) => {
  try {
    const { month } = req.params;
    const saved = await getPayroll(month);
    if (saved.length) {
      return res.json({ month, saved: true, generated_at: saved[0].generated_at, rows: saved });
    }
    res.json({ month, saved: false, rows: await payrollPreview(month) });
  } catch (e) { next(e); }
});

app.post('/api/payroll/:month', requireFeature('teachers'), async (req, res, next) => {
  try {
    const { month } = req.params;
    const rows = await generatePayroll(month);
    res.status(201).json({ month, saved: true, generated_at: rows[0]?.generated_at, rows });
  } catch (e) { next(e); }
});

// ---- Leave register for a teacher ----
app.get('/api/teachers/:id/leaves', requireFeature('teachers'), async (req, res, next) => {
  try {
    res.json(await listLeaves(req.params.id));
  } catch (e) { next(e); }
});

app.post('/api/teachers/:id/leaves', requireFeature('teachers'), async (req, res, next) => {
  try {
    const { from, to, date } = req.body;
    if (from && to) {
      const added = await addLeaveRange(req.params.id, req.body);
      return res.status(201).json({ added });
    }
    if (!date) return res.status(400).json({ error: 'A date is required' });
    res.status(201).json(await addLeave(req.params.id, req.body));
  } catch (e) { next(e); }
});

app.delete('/api/teachers/:id/leaves/:leaveId', requireFeature('teachers'), async (req, res, next) => {
  try {
    const ok = await deleteLeave(req.params.id, req.params.leaveId);
    if (!ok) return res.status(404).json({ error: 'Leave not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`\n🏫  Bachpan API running on http://localhost:${PORT}`);
  console.log(`    Storage: ${usingSupabase ? 'Supabase (PostgreSQL)' : 'local file db/data.json (add Supabase creds in .env to switch)'}\n`);
  try {
    await ensureDefaultUsers();
  } catch (e) {
    console.error('Could not seed default users:', e.message);
  }
});
