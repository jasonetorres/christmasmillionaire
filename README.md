# Who Wants to Be a Christmasaire?

Real-time Christmas trivia game used on Jason Torres' charity stream. The host drives the show, a projector shows the board, and the audience joins from their phones.

This is a Vite + React single-page app. It talks to Supabase from the browser. There is no Laravel app, no PHP server, and no Node game server in this repo.

## Routes

| Path | Who uses it |
| --- | --- |
| `/` | Picker for the host panel and the display |
| `/hostjt` | Host controls. Keep this URL off the public landing page and out of chat |
| `/displayurl` | Projector / stream view |
| `/vote` | Audience phones. QR code on the display points here |
| `/santa` | Standalone Santa call, same edge function as Phone a Friend |

`/hostjt` and `/displayurl` are the real paths. Older notes that say `/host` and `/display` are stale.

## Local production build

Requires Node.js 22.

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run build
npm run preview
```

Open the preview URL. `/`, `/hostjt`, `/displayurl`, `/vote`, and `/santa` all serve the app. Vite inlines `VITE_*` values when it builds, so change `.env` and run `npm run build` again.

A build with those two variables missing still starts. It shows a setup screen instead of a blank page.

`npm run dev` is the hot-reload server for local editing.

## Environment variables

### Vercel (required for the game)

Set both for Production, Preview, and Development, then redeploy. They are baked into the client bundle. Do not treat them as secret, and do not put the service role key in either of them.

| Name | Where it comes from |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL, `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |

### Your machine only (seed the question bank)

| Name | Where it comes from |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key. Bypasses row level security. Never prefix it with `VITE_` and never add it to Vercel |

### Supabase Edge Function secrets (Phone a Friend only)

The rest of the show works without these. Phone a Friend and `/santa` call `santa-chat`, which returns text plus speech audio.

| Name | Account |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI. The function calls `gpt-4o-mini` |
| `ELEVENLABS_API_KEY` | ElevenLabs. The function calls the text-to-speech API with a fixed voice id |

Set them in the Supabase dashboard under Edge Functions, or with the CLI:

```bash
supabase secrets set OPENAI_API_KEY=... ELEVENLABS_API_KEY=...
```

Twilio is not used. An older Fastify process bridged Twilio calls to the OpenAI Realtime API. That server is gone, and the current lifeline uses the microphone on the display computer.

## Supabase

The previous project ref checked into this repo was `pvpdtmxcxjcogjgwlugz`. As of 4 November 2026 that hostname does not resolve, so create a new project. The question bank is not inside that deleted project anymore. It is in `database/data/questions.json` (1,092 questions, 15 difficulty levels).

```bash
supabase login
supabase link --project-ref <new-project-ref>
supabase db push
```

`supabase db push` applies `supabase/migrations` in filename order. The first migration creates `trivia_questions`, `game_state`, and `audience_votes`, with public read/write policies for the anon key. Later migrations add the timer columns, emoji reactions, Santa audio columns, the `game_over` status, and Realtime.

Then load the questions. This uses the service role key from `.env`:

```bash
npm run seed
```

Run `npm run seed -- --reset` only when you mean to delete every row in `trivia_questions` and load them again.

Deploy the Phone a Friend function after the two secrets above exist:

```bash
supabase functions deploy santa-chat --project-ref <new-project-ref>
```

The source is `supabase/functions/santa-chat/index.ts`.

Tables the app reads and writes:

- `trivia_questions` — `difficulty_level` 1–15, `is_used` so a question is not drawn twice in one game
- `game_state` — one row for the live show. Host, display, and vote pages all follow the newest `updated_at`
- `audience_votes` — column name is `vote` (`A`–`D`), not `answer`
- `emoji_reactions` — one row per reaction from `/vote`

Realtime is enabled for `game_state`, `audience_votes`, and `emoji_reactions`. The display also polls every 2 seconds, so a missed Realtime event still catches up on the projector. The vote page does not poll.

Row level security is on, and the policies allow the anon key to read and write these tables. That is what lets the audience page work with no login. It also means anyone with the anon key can change the live game. The host URL is the only thing standing between chat and the controls, so do not publish `/hostjt`.

## Deploy on Vercel

`vercel.json` sets the framework to Vite, the build to `npm run build`, the output to `dist`, and rewrites every path to `index.html` so client-side routes work on a refresh.

1. Import this GitHub repo as a Vercel project. The framework preset should come out as Vite.
2. Node.js version: **22.x**. Vite 7 does not build on Node 18, and Node 18 is no longer available on Vercel.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production, Preview, and Development.
4. Deploy. Changing those variables requires a new deployment, because they are compiled into the JavaScript.
5. Finish the Supabase steps above before show day. A deploy with the keys set and an empty database loads the host page, and Start New Game reports that there are no questions.

No Vercel Marketplace database, Redis, or server function is required for the game as it works today.

## Show day

1. Open `/displayurl` on the stream PC and leave it full screen.
2. Open `/hostjt` on a phone or laptop that stays off camera.
3. The display QR code sends the audience to `/vote`.
4. Start New Game. Questions go from level 1 to level 15.
5. Lifelines, once each: 50/50, Phone a Friend (needs the edge function), Ask the Audience (opens voting on `/vote` and draws the bars on the display).
6. Emoji reactions on `/vote` are always available, including when Ask the Audience is off.

## Later: landing page, chat votes, donation lifelines

Nothing here has to be rewritten for a public page to link in. A separate site can send the stream to `/displayurl` and the audience to `/vote`. Deep links work on Vercel because of the SPA rewrite. Do not link `/hostjt` from that page.

What already helps:

- One `game_state` row is the sync bus. Host, display, and phones subscribe to it. A new column shows up on every screen without a new websocket server.
- Audience voting and emoji reactions already write plain rows. A chat bot can insert `{ game_state_id, vote }` into `audience_votes` the same way `/vote` does.
- The browser is the only backend. A Vercel Function or a small worker can write the same tables with the service role key.

What blocks those features if you leave the schema as it is:

- Votes have no voter id, so one person, or one chat account, can submit many rows. One-vote-per-person needs a new column and a unique constraint. The client cannot be trusted to enforce it.
- Lifelines are booleans the host page sets on itself (`lifeline_phone_used`, `lifeline_audience_used`, `lifeline_fifty_fifty_used`). There is no server check, so a "donation unlocks Phone a Friend" rule would be cosmetic unless a webhook sets something like `lifeline_phone_unlocked` with the service role and the host page reads that flag before enabling the button. Keep that key out of the client.
- Phone a Friend listens with the display computer's speech recognition and calls the Supabase function. Chat text does not reach Santa unless something posts those lines to `santa-chat` or writes a field the display already reads.
- The anon key will be in the public bundle. Any new table needs a deliberate policy. Copying the current public-write policies onto a donations or unlocks table would let the audience unlock lifelines without paying.

`BACKUP_REACT_VERSION/`, `LARAVEL_MIGRATION.md`, `SAVE_POINT_WORKING_REACT_VERSION.md`, and `TESTING_REPORT.md` are old snapshots. They mention Laravel, Twilio, Redis, and routes that this app does not use.
