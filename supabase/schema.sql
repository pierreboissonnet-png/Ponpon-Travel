-- Écosse 2027 · trip tracker schema
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Every table has row level security ON and no policy: only the server
-- (service role key, never sent to the browser) can read or write.

create extension if not exists pgcrypto;

-- People who can sign in. code_hash = HMAC-SHA256(AUTH_SECRET, personal code).
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('superadmin', 'admin', 'guest')),
  code_hash text not null unique,
  created_at timestamptz not null default now()
);

-- Programme activities and preparation tasks share one table.
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('activite', 'tache')),
  category text not null default 'Autre',
  title text not null,
  summary text,
  details text,
  -- programme
  day date,
  start_time time,
  end_time time,
  location text,
  address text,
  phone text,
  link text,
  -- preparation
  due_date date,
  due_time time,
  due_note text,
  need_date date,
  remind_offsets int[] not null default '{}',   -- days before the deadline
  reminders_sent int[] not null default '{}',
  -- state
  status text not null default 'a_faire' check (status in ('a_faire', 'en_cours', 'termine')),
  done_at timestamptz,
  done_by uuid references members(id) on delete set null,
  -- admins only
  price_amount numeric(10, 2),
  price_currency text default '€',
  price_note text,
  booking_ref text,
  private_note text,
  guest_visible boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists items_day_idx on items (day, start_time);
create index if not exists items_due_idx on items (due_date);

-- Chats with the organisers. urgency: 1 = urgent (every 2 min), 2 = important (hourly), 3 = info (once)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references members(id) on delete cascade,
  subject text not null,
  urgency int not null check (urgency in (1, 2, 3)),
  status text not null default 'ouvert' check (status in ('ouvert', 'pris_en_compte', 'clos')),
  acked_by uuid references members(id) on delete set null,
  acked_at timestamptz,
  last_alert_at timestamptz,
  alert_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  author_id uuid references members(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx on messages (conversation_id, created_at);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table if not exists login_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists login_attempts_idx on login_attempts (ip, at);

alter table members enable row level security;
alter table items enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table push_subscriptions enable row level security;
alter table login_attempts enable row level security;
