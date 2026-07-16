-- ============================================================
--  Bachpan School Management — Supabase / PostgreSQL schema
--  Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Users & sessions (login / roles) ----------
-- role is 'admin' | 'coordinator' (see backend/auth/roles.js for what each can access)
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  name          text,
  role          text not null,
  salt          text not null,
  password_hash text not null,
  created_at    timestamptz default now()
);

create table if not exists sessions (
  token       text primary key,
  user_id     uuid references users(id) on delete cascade,
  created_at  timestamptz default now()
);

-- ---------- Classes ----------
-- The list of class names (e.g. Nursery, First, Second). Students and teachers
-- reference a class by its name.
create table if not exists classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz default now()
);

-- ---------- Students ----------
create table if not exists students (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  registration_number  text,
  class                text,
  section              text,
  dob                  date,
  father_name          text,
  phone                text,
  address              text,
  adhar_number         text,
  total_fees           numeric default 0,   -- actual / total fees for the year
  paid_fees            numeric default 0,   -- how much has been paid so far
  -- "Fees left" is NOT stored; it is always computed as total_fees - paid_fees
  created_at           timestamptz default now()
);

-- ---------- Fee payments (installment history) ----------
-- One row per deposit. A student's paid_fees is kept in sync with the sum
-- of these rows by the backend. Deleting a student removes their payments.
create table if not exists fee_payments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references students(id) on delete cascade,
  amount      numeric not null,
  note        text,
  method      text default 'cash',   -- 'cash' or 'online'
  category    text default 'fee',    -- 'fee' (tuition) or 'admission' (₹300 form fee)
  paid_on     date default current_date,
  created_at  timestamptz default now()
);

create index if not exists idx_fee_payments_student on fee_payments(student_id);

-- ---------- Teachers ----------
create table if not exists teachers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  class         text,
  email         text,
  phone_1       text,
  phone_2       text,
  join_date     date,
  adhar_number  text,
  salary            numeric default 0,   -- base monthly salary
  leave_days        integer default 0,   -- total leaves taken (kept in sync with the register)
  chargeable_leaves integer default 0,   -- leaves beyond the 1-free-per-month allowance
  -- Net salary is NOT stored; it is computed as:
  --   salary - round(salary / 30 * chargeable_leaves)   (fixed 30-day month)
  created_at        timestamptz default now()
);

-- ---------- School holidays (general, everyone off) ----------
create table if not exists holidays (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  date        date not null,
  created_at  timestamptz default now()
);

-- ---------- Teacher leave register ----------
-- One row per leave a teacher takes. The backend keeps each teacher's
-- leave_days + chargeable_leaves in sync with these rows.
create table if not exists teacher_leaves (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid references teachers(id) on delete cascade,
  date        date not null,
  reason      text,
  type        text default 'full',   -- 'full' or 'half' (half-day = 0.5 day cut)
  created_at  timestamptz default now()
);

create index if not exists idx_teacher_leaves_teacher on teacher_leaves(teacher_id);

-- ---------- Payroll (saved monthly salary register) ----------
-- A snapshot of each teacher's pay for a month, locked in when generated so it
-- stays accurate even if salaries change later.
create table if not exists payroll (
  id           uuid primary key default gen_random_uuid(),
  month        text not null,        -- 'YYYY-MM'
  teacher_id   uuid,
  name         text,
  class        text,
  salary       numeric,
  leaves       integer,
  chargeable   numeric,      -- fractional (half-days count as 0.5)
  deduction    numeric,
  net          numeric,
  generated_at timestamptz default now()
);

create index if not exists idx_payroll_month on payroll(month);

-- ---------- Inventory ----------
-- Just counts (no ordering). Each item holds a "variants" array; a simple item
-- has one variant with a blank label, an item with a sub-parameter (e.g. Size)
-- has one variant per value: [{ "label": "8", "quantity": 10 }, ...].
create table if not exists inventory (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  variants   jsonb not null default '[]',    -- [{ "label": "Size 9", "quantity": 10 }, ...]
  created_at timestamptz default now()
);

-- Note: The backend connects with the Supabase SERVICE key and enforces access
-- itself (login + roles in backend/auth/roles.js), so Row Level Security is not
-- required. Keep the service key secret (server-side only, never in the frontend).
-- The default login users (admin / coordinator) are auto-created by the backend
-- on first connect if the users table is empty.
