# Who Wants to Be a Millionaire - Christmas Edition

A full-stack Laravel game show application with real-time features.

## Quick Start

The main application is in the `laravel-app/` directory. See the [detailed README](laravel-app/README.md) for setup instructions.

```bash
cd laravel-app
composer install
npm install
php artisan key:generate
php artisan db:seed
npm run build
```

## Project Structure

- `laravel-app/` - Main Laravel application
- `supabase/migrations/` - Database migrations
