# Laravel Cloud Deployment Instructions

## Database Configuration

In your Laravel Cloud dashboard, set these environment variables:

```
DB_CONNECTION=sqlite
DB_DATABASE=/storage/database.sqlite
```

## Deploy Commands

In Laravel Cloud, set the deploy command to:

```bash
php artisan migrate --force && php artisan db:seed --force
```

This will:
1. Create all database tables
2. Load all 1,092 questions automatically

## If You See Database Errors

If you see PostgreSQL connection errors, it means old database credentials are still set in Laravel Cloud.

**To fix:**
1. Go to your Laravel Cloud dashboard
2. Go to Environment Variables
3. Remove any DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD variables
4. Set only: `DB_CONNECTION=sqlite` and `DB_DATABASE=/storage/database.sqlite`
5. Redeploy

## Build Command

```bash
npm install && npm run build
```

The app will work immediately after deployment with all questions loaded!
