-- ---------------------------------------------------------------------------
-- Tracko simplification (Aug 2026): every habit is a single daily tick — no
-- points, no weekly cadence, no counters on her seeded habits; gym offers a
-- photo, posts a link, sleep an hours selector; plus a private journal.
-- Paste this whole file into the Supabase SQL editor and Run. Safe to re-run.
-- Run it BEFORE deploying the matching app build.
-- ---------------------------------------------------------------------------

-- Photos can now belong to a habit (the gym row's camera).
alter table photos add column if not exists habit_id text;

-- Optional extra a habit offers next to its tick.
alter table habits add column if not exists proof text;
alter table habits drop constraint if exists habits_proof_check;
alter table habits add constraint habits_proof_check check (proof is null or proof in ('photo','link','hours'));

-- Old counter/checklist progress becomes a plain done/not-done BEFORE the
-- kinds flip below, and only while the old kind is still in place — so this
-- whole file stays safe to re-run.
update entries set value = case when value >= 8 then 1 else 0 end
  where habit_id = 'h_water' and (select kind from habits where id = 'h_water') = 'counter';
update entries set value = case when value >= 2 then 1 else 0 end
  where habit_id = 'h_premeal' and (select kind from habits where id = 'h_premeal') = 'counter';
update entries set value = case when value >= 3 then 1 else 0 end, sub_done = '[]'::jsonb
  where habit_id = 'h_nutrition' and (select kind from habits where id = 'h_nutrition') = 'checklist';

-- Minutes and sleep-time habits are single ticks now.
update habits set kind = 'binary', target = 1, unit = '' where kind in ('duration','sleep');

-- Her seeded habits, one tick each.
update habits set kind = 'binary', target = 1, unit = '', sub_items = null,
       name = 'Supplements', blurb = 'Fibre, protein, supplements — one tick for all of it.'
  where id = 'h_nutrition';
update habits set kind = 'binary', target = 1, unit = '', blurb = 'The whole bottle, across the day.'
  where id = 'h_water';
update habits set kind = 'binary', target = 1, unit = '', blurb = 'Twenty minutes before eating.'
  where id = 'h_premeal';
update habits set proof = 'hours', blurb = 'In bed by eleven. Log how long, if you like.'
  where id = 'h_sleep';

-- The two weekly habits become daily, one tick each, with their proof.
update habits set cadence = 'daily', kind = 'binary', target = 1, unit = '', proof = 'photo',
       blurb = 'A session today. Add a photo if you like.'
  where id = 'h_movement';
update habits set cadence = 'daily', kind = 'binary', target = 1, unit = '', proof = 'link',
       blurb = 'Posted something today? Paste the link.'
  where id = 'h_content';

alter table habits drop constraint if exists habits_kind_check;
alter table habits add constraint habits_kind_check check (kind in ('binary','counter','checklist'));

-- Points and cadence are no longer read; keep the columns, stop requiring values.
alter table habits alter column points set default 0;
alter table habits alter column cadence set default 'daily';

-- Her journal. One entry per day, hers only.
create table if not exists journal (
  day        date primary key,
  body       text not null default '',
  mood       int check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table journal enable row level security;
