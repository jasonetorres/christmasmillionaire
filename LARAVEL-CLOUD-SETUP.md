# Laravel Cloud Deployment Instructions

## CRITICAL: Set Database Password

Your `.env.cloud` file has been configured to use Supabase PostgreSQL, but you **MUST** add your database password in Laravel Cloud.

### Step-by-Step Setup

1. **Get your Supabase database password:**
   - Go to https://supabase.com/dashboard
   - Select your project: `ynhqkbamncpafesdtssm`
   - Navigate to: Settings → Database
   - Copy your database password (or reset it if you don't have it)

2. **Add environment variable in Laravel Cloud:**
   - Go to your Laravel Cloud project dashboard
   - Navigate to: Environment Variables
   - Add this variable:
     ```
     DB_PASSWORD=<paste-your-supabase-password-here>
     ```
   - Save changes

3. **Redeploy your application**
   - After adding the password, trigger a new deployment
   - The app will now connect to Supabase successfully

### What's Already Configured

The `.env.cloud` file includes:
```
DB_CONNECTION=pgsql
DB_HOST=aws-0-us-west-1.pooler.supabase.com
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres.ynhqkbamncpafesdtssm
DB_PASSWORD=
```

**You only need to add the `DB_PASSWORD` in Laravel Cloud environment variables.**

### Database Status

Your Supabase database already has:
- ✅ All tables created (trivia_questions, game_state, audience_votes)
- ✅ 1,092 trivia questions loaded across all difficulty levels (125 questions at level 1)
- ✅ Row Level Security policies configured

### Troubleshooting

**Error: "Database file at path [/storage/database.sqlite] does not exist"**
- This means DB_PASSWORD isn't set in Laravel Cloud environment variables
- Follow Step 2 above to add it

**Error: "No questions available for level 1"**
- Verify DB_PASSWORD is correct in Laravel Cloud
- Check database connection in application logs

**Migrations already run warning:**
- This is expected and safe to ignore
- Tables already exist in Supabase with data loaded
