# Laravel Cloud Deployment Guide

## Database Configuration

Your app is configured to use **Supabase PostgreSQL** with all tables and 1,092 trivia questions already loaded.

### Supabase Project Details

```
Project ID: pvpdtmxcxjcogjgwlugz
URL: https://pvpdtmxcxjcogjgwlugz.supabase.co
Region: US West (Oregon)

Database Connection:
├─ Host: aws-0-us-west-1.pooler.supabase.com
├─ Port: 6543
├─ Database: postgres
├─ Username: postgres.pvpdtmxcxjcogjgwlugz
└─ Password: 12345678@
```

## Laravel Cloud Setup

The `.env.cloud` file is already configured with all necessary values.

**Important:** If deployment fails with database errors:
1. Verify Laravel Cloud is using `.env.cloud` as the environment file
2. Clear any cached configuration in Laravel Cloud dashboard
3. Ensure no environment variables in Laravel Cloud dashboard are overriding the `.env.cloud` settings

## Build & Deploy Commands

**Build Command:**
```bash
npm install && npm run build
```

**Deploy Command:**
```bash
bash deploy.sh
```

The deploy script only clears caches - no migrations needed as tables already exist in Supabase.

## Database Status

Your Supabase database contains:

- ✅ **trivia_questions** table - 1,092 questions across 15 difficulty levels
- ✅ **game_state** table - manages current game state
- ✅ **audience_votes** table - tracks audience poll votes
- ✅ Row Level Security enabled with public access policies (game context)
- ✅ All questions properly categorized by difficulty (1-15)

## Troubleshooting

### "Database file at path [/storage/database.sqlite] does not exist"

This means Laravel is still trying to use SQLite. Solutions:

1. **Check Laravel Cloud environment:** Ensure it's reading `.env.cloud` and not generating its own env file
2. **Verify database connection in Laravel Cloud dashboard:**
   - Should be set to `pgsql` (NOT `sqlite`)
   - All `DB_*` variables should match `.env.cloud`
3. **Clear configuration cache** by redeploying after changes

### Queue Configuration

The app uses `QUEUE_CONNECTION=sync` to avoid needing database queue tables. This is intentional.

### Reverb WebSocket Configuration

Real-time features use Laravel Reverb for broadcasting game state updates. Ensure:
- `REVERB_APP_ID`, `REVERB_APP_KEY`, and `REVERB_APP_SECRET` match between server and client
- WebSocket port and scheme are correctly configured for your deployment environment
