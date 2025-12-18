# How to Restore React/Vite Version

This folder contains a complete backup of the working React/Vite/Supabase version.

## Quick Restore Steps

1. **Copy all files back to project root:**
   ```bash
   cp -r /tmp/cc-agent/61556290/project/BACKUP_REACT_VERSION/* /tmp/cc-agent/61556290/project/
   ```

2. **Reinstall dependencies:**
   ```bash
   cd /tmp/cc-agent/61556290/project
   npm install
   ```

3. **Verify .env file has Supabase credentials:**
   ```bash
   cat .env
   ```
   Should contain:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

4. **Test build:**
   ```bash
   npm run build
   ```

5. **Run dev server:**
   ```bash
   npm run dev
   ```

## What's Backed Up

- ✅ All source files (`/src`)
- ✅ Supabase migrations and edge functions (`/supabase`)
- ✅ Configuration files (package.json, tsconfig.json, vite.config.js, etc.)
- ✅ Environment variables (.env)
- ✅ HTML entry point (index.html)

## Database

The Supabase database schema is preserved in migrations. If you need to recreate the database:

1. Apply all migrations in `/supabase/migrations` in order
2. Deploy the santa-chat edge function from `/supabase/functions/santa-chat`

## Files NOT Backed Up

- `node_modules/` - Will be restored by `npm install`
- `dist/` - Will be created by `npm run build`
- `.vite/` - Vite cache, recreated automatically

## Verification

After restore, verify:
- Host page works at `/host`
- Display page works at `/display`
- Vote page works at `/vote`
- All lifelines function correctly
- Real-time updates work across screens

---

**Backup Date:** 2025-12-18
**Status:** Fully tested and working
