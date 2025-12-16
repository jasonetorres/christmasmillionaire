# Who Wants to Be a Millionaire - Christmas Edition

A full-stack Laravel + React game show application with real-time features, built with Laravel, Inertia.js, React, and Supabase.

## Tech Stack

- **Backend**: Laravel 12
- **Frontend**: React + TypeScript + Inertia.js
- **Database**: Supabase PostgreSQL
- **Real-time**: Laravel Reverb (WebSockets)
- **Styling**: Tailwind CSS

## Features

- Host control panel for managing the game
- Display panel for streaming questions and answers
- Audience voting system
- Three lifelines: 50:50, Phone a Friend, Ask the Audience
- Real-time synchronization between all panels
- 15-level money ladder
- Christmas-themed questions

## Setup Instructions

### Prerequisites

- PHP 8.2+
- Composer
- Node.js & npm
- Supabase account

### 1. Install Dependencies

```bash
composer install
npm install
```

### 2. Configure Environment

Update the `.env` file with your Supabase credentials:

```env
DB_CONNECTION=pgsql
DB_HOST=your-supabase-db-host
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres.your-project-ref
DB_PASSWORD=your-database-password
```

The Reverb configuration is already set up for local development.

### 3. Generate Application Key

```bash
php artisan key:generate
```

### 4. Run Migrations

The Supabase migrations are in the `supabase/migrations/` directory. You can apply them using the Supabase CLI or dashboard.

For Laravel migrations (sessions, cache, etc.):

```bash
php artisan migrate
```

### 5. Seed Questions

```bash
php artisan db:seed
```

This will seed 21 Christmas-themed trivia questions across all 15 difficulty levels.

### 6. Build Frontend Assets

```bash
npm run build
```

For development:

```bash
npm run dev
```

## Running the Application

You need to run three separate processes:

### Terminal 1: Laravel Server
```bash
php artisan serve
```

### Terminal 2: Laravel Reverb
```bash
php artisan reverb:start
```

### Terminal 3: Vite Dev Server (Development only)
```bash
npm run dev
```

Visit `http://localhost:8000`

## Application Routes

- `/` - Welcome page with navigation
- `/host` - Host control panel
- `/display` - Display panel for streaming
- `/admin` - Admin panel
- `/vote` - Audience voting page

## API Endpoints

### Game State
- `GET /api/game-state` - Get current game state
- `POST /api/game-state` - Update game state
- `POST /api/game-state/start` - Start new game
- `POST /api/game-state/next` - Load next question
- `POST /api/game-state/reset` - Reset game

### Questions
- `GET /api/questions` - List all questions
- `POST /api/questions` - Create question
- `POST /api/questions/bulk` - Bulk create questions
- `PUT /api/questions/{id}` - Update question
- `DELETE /api/questions/{id}` - Delete question

### Audience Votes
- `POST /api/votes` - Submit vote
- `GET /api/votes/results` - Get vote results
- `POST /api/votes/clear` - Clear all votes

## Project Structure

```
├── app/
│   ├── Events/               # Broadcasting events
│   ├── Http/
│   │   ├── Controllers/      # Inertia page controllers
│   │   └── Controllers/Api/  # API controllers
│   └── Models/               # Eloquent models
├── resources/
│   ├── js/
│   │   ├── Components/       # React components
│   │   ├── Pages/            # Inertia pages
│   │   └── types/            # TypeScript types
│   └── views/                # Blade templates
├── routes/
│   ├── api.php               # API routes
│   └── web.php               # Web routes
├── database/
│   └── seeders/              # Database seeders
└── supabase/
    └── migrations/           # Supabase database migrations
```

## Real-time Broadcasting

The application uses Laravel Reverb for WebSocket broadcasting:

- Game state changes broadcast to all connected clients
- Audience votes update in real-time
- Lifeline activation syncs across panels

## License

MIT
