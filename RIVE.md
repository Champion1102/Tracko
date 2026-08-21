# Swapping in a Rive character

The app ships with a hand-drawn SVG mascot ("Nimbus"). It's designed to be
replaced by a real Rive character without touching anything except one line.

## The state machine spec

Name the state machine **`Nimbus`** and give it exactly four inputs:

| Input       | Type    | Values | Fired when                                   |
| ----------- | ------- | ------ | -------------------------------------------- |
| `mood`      | Number  | 0–5    | Whenever the coach's mood changes             |
| `talking`   | Boolean | —      | True while speech synthesis is mid-sentence   |
| `tick`      | Trigger | —      | A single habit was logged                     |
| `celebrate` | Trigger | —      | Perfect day, streak milestone, reward unlock  |

Mood numbers map like this (see `components/character/contract.ts`):

| 0 happy | 1 hype | 2 proud | 3 worried | 4 sleepy | 5 cheeky |
| ------- | ------ | ------- | --------- | -------- | -------- |

## The cast that ships

Four characters live in `public/characters/`, each doing a different job. All
CC BY, all free, all downloaded from Rive:

| Slot | File | Author | Size |
| --- | --- | --- | --- |
| Everyday buddy | `nimbus-cloud.riv` | AnggaMotion | 158 KB |
| Chat face | `olly.riv` (011Y) | Patsom | 681 KB |
| Growth | `sprout.riv` | design-QYBVX | 1.9 MB |
| Celebrations | `point.riv` | hijenks72 | 167 KB |

Each page mounts only the roles it uses and the Rive runtime is lazy, so the
2MB sprout costs nothing on Today — it loads on Journey and Reward only.

She can reassign any slot under **You → Your cast**, including back to the
hand-drawn Nimbus.

**CC BY means credit.** The attribution line is already in the settings screen;
keep it there.

## Adding more

Any file on rive.app — community or marketplace — that shows a price of free is
CC BY. Grab the runtime file directly:

```bash
curl -sL "https://public.rive.app/community/runtime-files/<slug>.riv" \
  -o public/characters/name.riv
```

where `<slug>` is the path segment from the page URL. It appears in the picker
immediately — no config, no rebuild.

Watch the file size. Anything over ~2MB is a bad idea on mobile data; one file
I tried was 9.7MB and had to be dropped for that reason alone.

## Making a character mood-reactive

A file only changes expression if its state machine exposes these four inputs:

| Input | Type | Values |
| --- | --- | --- |
| `mood` | Number | 0 happy · 1 hype · 2 proud · 3 worried · 4 sleepy · 5 cheeky |
| `talking` | Boolean | true while speech synthesis is running |
| `tick` | Trigger | a habit was logged |
| `celebrate` | Trigger | perfect day, streak milestone, reward unlock |

The state machine can be called anything — the runtime reads whatever names the
file actually contains and drives the first one. A file without these inputs
still renders and animates; it just won't react. Remix it in the Rive editor to
add them.
