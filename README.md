# Who Wants to Be a Christmasaire?

Real-time Christmas trivia game for Jason Torres' charity stream. The host drives the show, a projector shows the board, and the audience joins from their phones.

The site is a Vite + React app on Vercel. The browser never talks to the database. It calls `/api/*` functions, and those functions use Neon Postgres through `DATABASE_URL`.

## Routes

| Path | Who uses it |
| --- | --- |
| `/` | Picker for the host panel and the display |
| `/hostjt` | Host controls. Asks for the host code, then calls `/api/host` |
| `/displayurl` | Projector / stream view. Polls `/api/state` every 2 seconds |
| `/vote` | Audience phones. QR code on the display points here |
| `/santa` | Standalone Santa call. Same API as Phone a Friend |

## Environment variables

Set these on the Vercel project for Production, Preview, and Development. None of them are prefixed with `VITE_`, so they stay on the server.

| Name | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon Postgres connection string. Any standard Postgres URL also works, which is how local runs are checked |
| `HOST_CODE` | Yes | Shared secret for `/api/host`. The host page sends it as the `x-host-code` header. Chat cannot start the game, reveal answers, or use lifelines without it |
| `OPENAI_API_KEY` | No | Phone a Friend and `/santa`. `gpt-4o-mini` |
| `ELEVENLABS_API_KEY` | No | Speech audio for that same route |

If either AI key is missing, `/api/santa-chat` returns a clear error and the rest of the show still runs.

Copy `.env.example` to `.env` for local commands. `npm run db:migrate`, `npm run seed`, and the API server read that file. Do not commit it.

## Database

One idempotent migration, `db/migrations/001_schema.sql`, creates:

- `trivia_questions`
- `game_state`
- `audience_votes` (`vote` is `A`–`D`)
- `emoji_reactions`

```bash
npm run db:migrate
npm run seed
```

Both read `DATABASE_URL`. `db:migrate` can be run again. `npm run seed` loads `database/data/questions.json` (1,092 questions). If the table already has rows it leaves them alone. `npm run seed -- --reset` deletes and reloads them.

On Vercel, the Neon integration can create the database and inject `DATABASE_URL`. You still run the two commands above against that URL yourself. The old Supabase project is not used.

API routes use `@neondatabase/serverless` when `DATABASE_URL` points at `*.neon.tech`, and `pg` for any other Postgres URL.

## Local production build

Node.js 22.

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL and HOST_CODE
npm run db:migrate
npm run seed
npm run build
npm run preview
```

`npm run preview` serves the production build and the API together. `npm run dev` is the same pair with hot reload. The Vite server proxies `/api` to the local API on port 3001.

Open `/`. Host Panel asks for `HOST_CODE`. Display and Vote update from the database about every 2 seconds. There is no Supabase Realtime channel. The display already polled on a timer, and the vote page now does too, so votes and reactions stay in sync without a websocket.

## Deploy on Vercel

`vercel.json` builds with Vite, publishes `dist`, and rewrites non-API paths to `index.html`. Files in `api/` are the Node.js functions.

1. Import this repo. Framework preset: Vite. Node.js 22.
2. Add `DATABASE_URL` and `HOST_CODE`. Add the two AI keys only if Santa should talk.
3. Deploy.
4. From a machine that has the same `DATABASE_URL`, run `npm run db:migrate` and `npm run seed`.

## Show day

1. Open `/displayurl` on the stream PC.
2. Open `/hostjt` on a phone or laptop that stays off camera, and enter the host code.
3. The display QR code sends the audience to `/vote`.
4. Start New Game. Questions go from level 1 to level 15.
5. Lifelines, once each: 50/50, Phone a Friend, Ask the Audience.
6. Emoji reactions on `/vote` work whenever a game is in progress. Votes are accepted only while Ask the Audience is the active lifeline.

## Later: landing page, chat votes, donation lifelines

A separate site can link to `/displayurl` and `/vote`. Leave `/hostjt` off that page. The host code is what actually stops someone who finds the URL.

What already helps:

- One `game_state` row is still the show. Display and vote both read it from `GET /api/state`.
- Audience votes are `POST /api/votes` with `{ "vote": "A" }`. A chat bot can call that same route while Ask the Audience is open. It does not need the host code.
- Reactions are `POST /api/reactions` with `{ "emoji": "🎄" }`.
- Adding a column on `game_state` shows up on the next poll, which is at most about 2 seconds.

What still needs a server check:

- Votes have no voter id, so one person can submit many rows while voting is open.
- Lifelines turn on only through `/api/host`, which checks `HOST_CODE`. A donation webhook can set a new column such as `lifeline_phone_unlocked` if that webhook has its own secret. Do not put `DATABASE_URL` or `HOST_CODE` in the browser.
- Phone a Friend is `POST /api/santa-chat`. Chat text does not reach Santa unless something posts it there. The route does not receive the correct letter.

`BACKUP_REACT_VERSION/`, `LARAVEL_MIGRATION.md`, `SAVE_POINT_WORKING_REACT_VERSION.md`, and `TESTING_REPORT.md` are old snapshots. They describe Supabase, Laravel, and Twilio, which this app does not use.
