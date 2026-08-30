-- ---------------------------------------------------------------------------
-- Tracko schema. Paste this whole file into the Supabase SQL editor and Run.
-- Safe to re-run. Existing databases from before Aug 2026 should also run
-- 2026-08-31-simplify.sql once.
-- ---------------------------------------------------------------------------

create table if not exists config (
  id   int primary key default 1 check (id = 1),
  data jsonb not null
);

create table if not exists habits (
  id         text primary key,
  slug       text unique not null,
  name       text not null,
  blurb      text not null default '',
  emoji      text not null default '✅',
  icon       text,
  kind       text not null check (kind in ('binary','counter','checklist')),
  -- Legacy columns from the points era. The app writes constants into them.
  cadence    text not null default 'daily',
  points     numeric not null default 0,
  target     numeric not null default 1,
  unit       text not null default '',
  sub_items  jsonb,
  proof      text check (proof is null or proof in ('photo','link','hours')),
  sort_order int not null default 0,
  active     boolean not null default true
);

-- Added later; safe to run on an existing database.
alter table habits add column if not exists icon text;
alter table habits add column if not exists proof text;

create table if not exists entries (
  habit_id   text not null references habits(id) on delete cascade,
  day        date not null,
  value      numeric not null default 0,
  sub_done   jsonb not null default '[]'::jsonb,
  note       text,
  updated_at timestamptz not null default now(),
  primary key (habit_id, day)
);
create index if not exists entries_day_idx on entries(day);

create table if not exists letters (
  id         text primary key,
  unlock_day int not null,
  title      text not null,
  body       text not null,
  opened_at  timestamptz
);

create table if not exists nudges (
  id      text primary key,
  sender  text not null default 'sponsor',
  body    text not null,
  sent_at timestamptz not null default now(),
  read_at timestamptz
);
-- Backfills the column on databases created before `sender` existed. Placed
-- after the create so a fresh run doesn't hit a table that isn't there yet.
alter table nudges add column if not exists sender text not null default 'sponsor';
-- Chat photo attachments: a storage path in the proof bucket, or null.
alter table nudges add column if not exists image_path text;

create table if not exists celebrations (
  key        text primary key,
  kind       text not null,
  title      text not null,
  body       text not null,
  meta       jsonb not null default '{}'::jsonb,
  seen       boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists coach (
  id   int primary key default 1 check (id = 1),
  data jsonb not null
);

create table if not exists photos (
  id         text primary key,
  day        date not null,
  path       text not null,
  habit_id   text,
  created_at timestamptz not null default now()
);
create index if not exists photos_day_idx on photos(day);
alter table photos add column if not exists habit_id text;

create table if not exists chat (
  id         text primary key,
  who        text not null check (who in ('her','nimbus')),
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_created_idx on chat(created_at);

-- Her private expense log. Categories are a fixed catalogue in lib/finance.ts,
-- so category_id is stored as plain text rather than a foreign key.
create table if not exists expenses (
  id          text primary key,
  day         date not null,
  amount      numeric not null check (amount > 0),
  category_id text not null,
  verdict     text not null check (verdict in ('worth','meh','regret')),
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists expenses_day_idx on expenses(day);

-- Her journal. One entry per day, hers only.
create table if not exists journal (
  day        date primary key,
  body       text not null default '',
  mood       int check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists push_subs (
  endpoint   text primary key,
  role       text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

-- Every read/write goes through the Next.js server using the service-role key,
-- so no browser ever talks to these tables directly. RLS on + no policies means
-- the anon key can read nothing even if it leaks.
alter table config       enable row level security;
alter table habits       enable row level security;
alter table entries      enable row level security;
alter table letters      enable row level security;
alter table nudges       enable row level security;
alter table celebrations enable row level security;
alter table push_subs    enable row level security;
alter table coach        enable row level security;
alter table photos       enable row level security;
alter table chat         enable row level security;
alter table expenses     enable row level security;
alter table journal      enable row level security;

-- Private bucket for her photos. Served through short-lived signed URLs from
-- the server, never public.
insert into storage.buckets (id, name, public)
values ('proof', 'proof', false)
on conflict (id) do nothing;
