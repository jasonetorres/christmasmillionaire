# Laravel Cloud Deployment Guide

## 🎯 Quick Start (TL;DR)

Your app needs ONE thing to work: **Set `DB_PASSWORD` in Laravel Cloud**

```
Laravel Cloud → Environment Variables → Add:
DB_PASSWORD = <your_supabase_password>
```

Then redeploy. That's it!

---

## 🔴 CRITICAL: Database Password Required

Your app is configured to use Supabase PostgreSQL. The database already has **1,092 trivia questions** loaded and ready. You just need the password.

### Current Configuration

**Supabase Project Details:**
```
Project ID: ynhqkbamncpafesdtssm
URL: https://ynhqkbamncpafesdtssm.supabase.co
Region: US West (Oregon)

Database Connection:
├─ Host: aws-0-us-west-1.pooler.supabase.com
├─ Port: 6543
├─ Database: postgres
├─ Username: postgres.ynhqkbamncpafesdtssm
└─ Password: ❌ MISSING - YOU NEED THIS
```

---

## Option 1: Access Your Existing Supabase (RECOMMENDED)

### Step 1: Log in to Supabase

Go to: **https://app.supabase.com/sign-in**

Try logging in with:
- GitHub account
- Google account
- Email/password

**Not sure which account?** Try all three methods. The project exists, so one of these will work.

### Step 2: Find Your Project

Once logged in:
- Look for project `ynhqkbamncpafesdtssm` in your dashboard
- Or go directly to: **https://app.supabase.com/project/ynhqkbamncpafesdtssm**

### Step 3: Get/Reset Database Password

In your Supabase project:
1. Click **Settings** (left sidebar)
2. Click **Database**
3. Scroll to "Database Settings"
4. Click **"Reset Database Password"**
5. **COPY THE PASSWORD IMMEDIATELY** (you can't view it again!)

### Step 4: Add to Laravel Cloud

1. Go to your Laravel Cloud dashboard
2. Navigate to **Environment Variables**
3. Add variable:
   ```
   Name: DB_PASSWORD
   Value: <paste_your_password_here>
   ```
4. Save
5. Trigger a new deployment

**Done!** Your app will connect to Supabase and work immediately.

---

## Option 2: Can't Access Supabase? Start Fresh

If you genuinely cannot access the Supabase account, you can create a new one:

### Step 1: Create New Supabase Project

1. Go to **https://supabase.com**
2. Sign up/login (remember which account you use!)
3. Click **"New Project"**
4. Choose a name, region, and **set a strong password**
5. **SAVE YOUR PASSWORD!** Write it down immediately

### Step 2: Get Your Connection Details

In your new project:
1. Go to **Settings** → **Database**
2. Find "Connection String" section
3. Note down:
   - Host (e.g., `db.xxxxx.supabase.co`)
   - Port (usually `5432` or `6543`)
   - Database name (usually `postgres`)
   - Username (e.g., `postgres.xxxxx`)
   - Your password from Step 1

### Step 3: Update Configuration Files

Update `.env.cloud`:
```env
DB_CONNECTION=pgsql
DB_HOST=<your_new_host>
DB_PORT=<your_new_port>
DB_DATABASE=postgres
DB_USERNAME=<your_new_username>
DB_PASSWORD=<your_new_password>
```

Also update these:
```env
VITE_SUPABASE_URL=https://<your_project_ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
```

Get your anon key from: Supabase Project → **Settings** → **API** → **anon public**

### Step 4: Deploy to Laravel Cloud

In Laravel Cloud:
1. Set all the DB_ variables as environment variables
2. Deploy

The migrations will automatically:
- Create all tables
- Load all 1,092 trivia questions
- Set up Row Level Security

---

## Database Status

Your existing Supabase database (`ynhqkbamncpafesdtssm`) contains:

- ✅ **trivia_questions** table - 1,092 questions across 15 difficulty levels
- ✅ **game_state** table - manages current game state
- ✅ **audience_votes** table - tracks audience poll votes
- ✅ Row Level Security enabled on all tables
- ✅ All questions properly categorized by difficulty (1-15)

**Everything is ready.** You just need the password!

---

## Troubleshooting

### ❌ "Database file at path [/storage/database.sqlite] does not exist"

**Cause:** Laravel Cloud is still trying to use SQLite instead of PostgreSQL.

**Solution:**
1. The `.env.cloud` file is configured correctly
2. You need to set `DB_PASSWORD` as an **environment variable in Laravel Cloud dashboard**
3. Do NOT edit `.env.cloud` in Laravel Cloud - set it in Environment Variables section
4. Redeploy after adding the password

### ❌ "Can't find Supabase project ynhqkbamncpafesdtssm"

**Cause:** You're not logged into the right Supabase account.

**Solutions:**
1. Try logging in with different methods (GitHub, Google, Email)
2. Ask whoever created this project for access
3. Or create a new Supabase project (see Option 2 above)

### ❌ "No questions available for level 1"

**Cause:** Database connection failed or questions not loaded.

**Solutions:**
1. Verify `DB_PASSWORD` is correct in Laravel Cloud
2. Check Laravel Cloud logs for database connection errors
3. Verify all DB_ environment variables are set

### ⚠️ "Migrations already run" warning

**This is NORMAL and SAFE to ignore.**

The tables already exist in Supabase with all data loaded. Laravel just detects they've already been migrated.

### 🆘 Still stuck? Want a fresh start?

Reply with "create new supabase" and I'll:
1. Set up a completely new Supabase project configuration
2. Update all files with the new credentials
3. Ensure everything loads on first deploy

---

## Laravel Cloud Build Configuration

**Build Command:**
```bash
npm install && npm run build
```

**Deploy Command:**
```bash
php artisan migrate --force
```

(Seeding happens automatically via the seeder if tables are empty)
