import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  list, create, update, remove, usingSupabase,
  listPayments, addPayment, deletePayment,
} from './db/store.js';

const app = express();
app.use(cors());
app.use(express.json());

// Health / status
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, storage: usingSupabase ? 'supabase' : 'local file (db/data.json)' });
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

app.use('/api/students', crudRoutes('students'));
app.use('/api/teachers', crudRoutes('teachers'));
app.use('/api/inventory', crudRoutes('inventory'));
app.use('/api/classes', crudRoutes('classes'));

// ---- Fee payments (installment history) for a student ----
app.get('/api/students/:id/payments', async (req, res, next) => {
  try {
    res.json(await listPayments(req.params.id));
  } catch (e) { next(e); }
});

app.post('/api/students/:id/payments', async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    res.status(201).json(await addPayment(req.params.id, req.body));
  } catch (e) { next(e); }
});

app.delete('/api/students/:id/payments/:paymentId', async (req, res, next) => {
  try {
    const ok = await deletePayment(req.params.id, req.params.paymentId);
    if (!ok) return res.status(404).json({ error: 'Payment not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🏫  Bachpan API running on http://localhost:${PORT}`);
  console.log(`    Storage: ${usingSupabase ? 'Supabase (PostgreSQL)' : 'local file db/data.json (add Supabase creds in .env to switch)'}\n`);
});
