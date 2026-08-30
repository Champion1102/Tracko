# Tracko

A two-person habit tracker: she ticks ten small daily habits, you (the sponsor)
watch, write sealed letters, and cheer. No points, no rewards — one tick per
habit per day, a private journal, a money log, and a small cloud called Nimbus.

## Run it

```bash
npm install
npm run dev
```

With no Supabase keys in `.env.local`, everything writes to `.data/tracko.json`
— perfect for development. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
for the real thing, and run `supabase/schema.sql` (plus any dated migration
files) in the Supabase SQL editor first.

Copy `.env.example` to `.env.local` for the full list of knobs: PINs, push
notification keys (`npm run vapid`), and optional LLM provider keys for
Nimbus's daily lines and chat.

## The two sides

- **Hers** — `/today` (tick list), `/progress` (calendar + per-habit patterns),
  `/journal` (private diary), `/chat` (Nimbus), with Messages, Money, Gallery
  and Settings in the drawer.
- **Sponsor** — `/sponsor`: overview, chat, sealed letters, and Setup (names,
  the clock, habit list).

`npm run demo` fills the local file store with plausible history so every
screen has something to show.
