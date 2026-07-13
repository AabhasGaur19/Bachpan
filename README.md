# 🏫 Bachpan — School Management

A simple, clean school management app with three sections: **Students**, **Teachers**, and **Inventory** (with low-stock alerts and reordering).

- **Frontend:** React + Vite + Tailwind + React Router
- **Backend:** Node + Express (REST API)
- **Database:** Supabase (PostgreSQL) — *optional*; runs on built-in sample data until you connect it

```
Bachpan/
├── frontend/     React app (the UI)
└── backend/      Express API + data layer
```

---

## 1. Run it locally (no database needed)

Open **two terminals**.

**Terminal 1 — backend:**
```bash
cd backend
npm install
npm run dev
```
API runs at http://localhost:4000 with **sample data** (in memory).

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**. Done — you can browse, add, edit, delete, and place inventory orders right away.

> While no database is connected, data resets when the backend restarts. That's expected — it's sample mode.

---

## 2. Connect Supabase (to save data permanently) — free

1. Create a free project at **https://supabase.com**.
2. In the dashboard go to **SQL Editor → New query**, paste the contents of
   [`backend/db/schema.sql`](backend/db/schema.sql) and run it. This creates the
   `students`, `teachers`, and `inventory` tables.
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **`service_role` key** (secret)
4. In `backend/`, copy `.env.example` to `.env` and fill them in:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```
5. Restart the backend (`npm run dev`). It now reads/writes real data.
   The landing page footer / API `/api/health` will show `storage: supabase`.

> Want the sample rows in Supabase too? Copy the values from
> [`backend/db/seed.js`](backend/db/seed.js) into the table editor, or ask and
> I'll generate `INSERT` statements.

---

## 3. Deploy online — free

### Frontend → Vercel
1. Push this repo to GitHub.
2. On **https://vercel.com**, "Add New Project" → import the repo.
3. Set **Root Directory** to `frontend`.
4. Add an environment variable `VITE_API_URL` = your deployed backend URL
   (from the next step).
5. Deploy. Vercel gives you a free `*.vercel.app` URL with HTTPS.

*(SPA routing is already handled by `frontend/vercel.json`.)*

### Backend → Render (free)
1. On **https://render.com**, "New → Web Service" → connect the repo.
2. **Root Directory:** `backend` · **Build:** `npm install` · **Start:** `npm start`
3. Add env vars `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
4. Deploy. Copy the service URL back into Vercel's `VITE_API_URL`.

> ⚠️ Render's free tier sleeps after ~15 min idle, so the first request after
> a pause takes ~30s. Fine for a school back-office tool.

---

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Status + which storage is active |
| GET/POST | `/api/students` | List / create students |
| PUT/DELETE | `/api/students/:id` | Update / delete a student |
| GET/POST | `/api/teachers` | List / create teachers |
| PUT/DELETE | `/api/teachers/:id` | Update / delete a teacher |
| GET/POST | `/api/inventory` | List / create inventory items |
| PUT/DELETE | `/api/inventory/:id` | Update / delete an item |

## What's next (future phases)
- Staff **login** (Supabase Auth) so only authorized users can edit
- **Photo uploads** to Supabase Storage (fields already exist)
- Student ↔ class ↔ teacher relationships and reports
- CSV export / import
