-- Bug reports (same system as Hyrox Coach): screenshot, technical context, follow-up and exchanges.
-- For an existing project: SQL Editor > New query > paste this file > Run. (Already included in schema.sql.)

create table if not exists bug_reports (
  id uuid primary key default gen_random_uuid(),
  no bigint generated always as identity unique,           -- number to quote ("signalement n°12")
  member_id uuid references members(id) on delete set null,
  pseudo text not null default '',
  text text not null check (char_length(text) between 3 and 2000),
  ctx jsonb not null default '{}'::jsonb,
  img text check (img is null or length(img) < 900000),
  has_img boolean generated always as (img is not null) stored,
  status text not null default 'new' check (status in ('new', 'doing', 'done', 'wontfix')),
  note text,
  analysis text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bug_reports_member_idx on bug_reports (member_id, created_at);

create table if not exists bug_comments (
  id uuid primary key default gen_random_uuid(),
  bug_id uuid not null references bug_reports(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  pseudo text not null default '',
  text text not null check (char_length(text) between 1 and 2000),
  img text check (img is null or length(img) < 900000),
  from_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists bug_comments_bug_idx on bug_comments (bug_id, created_at);

-- Service access for Claude (route /api/bugs-api): can be switched off by an admin
create table if not exists app_config (key text primary key, value jsonb not null default '{}'::jsonb);
insert into app_config (key, value) values ('bugapi', '{"off": false, "n": 0}') on conflict do nothing;

alter table bug_reports enable row level security;
alter table bug_comments enable row level security;
alter table app_config enable row level security;
grant all on bug_reports, bug_comments, app_config to service_role;
grant all on all sequences in schema public to service_role;
