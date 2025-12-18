# Who Wants to Be a Millionaire - Christmas Edition

A real-time trivia game built with Laravel, Inertia.js, React, and Supabase.

## Features

- **Host Panel**: Control the game, manage lifelines, show answers
- **Display Panel**: Big screen display with real-time updates
- **Audience Voting**: Allow audience participation with live polls
- **Lifelines**: 50/50, Phone a Friend (real Twilio calls!), Ask the Audience
- **Real-time Updates**: Powered by Supabase Realtime
- **AI-Powered Santa**: OpenAI/Anthropic-powered Santa Claus calls you with advice
- **1,092 Questions**: Across 15 difficulty levels

## Tech Stack

- Laravel 11 (Backend Framework)
- Inertia.js (React Integration)
- React 18 with TypeScript
- Supabase (Database + Realtime)
- Tailwind CSS
- Vite

## Setup

### 1. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install JavaScript dependencies
npm install
```

### 2. Environment Variables

Your `.env` file is already configured with Supabase credentials. The key variables are:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
APP_KEY=your_laravel_app_key
```

### 2. Configure Twilio for Real Phone Calls (Optional)

To enable the "Phone a Friend" lifeline with real phone calls:

1. Sign up for a [Twilio account](https://www.twilio.com/try-twilio)
2. Get your Account SID, Auth Token, and a Twilio phone number
3. In your Supabase Dashboard, go to **Project Settings > Edge Functions**
4. Add these secrets:
   - `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
   - `TWILIO_PHONE_NUMBER` - Your Twilio phone number (format: +1234567890)
   - `OPENAI_API_KEY` - Your OpenAI API key (or use `ANTHROPIC_API_KEY`)

**Note**: When you click "Phone a Friend", Santa Claus will call the phone number you provide with AI-generated advice using Twilio's voice service!

### 3. Database

The Supabase database is already set up with:
- 1,092 trivia questions (15 difficulty levels)
- Game state management tables
- Audience voting tables
- Real-time subscriptions enabled

### 4. Build Assets

```bash
npm run build
```

### 5. Start the Server

```bash
php artisan serve
```

The application will be available at http://localhost:8000

## Development Mode

For development with hot module replacement:

```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Laravel server
php artisan serve
```

## How to Play

1. Open **/host** on your phone or tablet
2. Open **/display** on the TV/projector
3. Share **/vote** link with the audience for polls
4. Start a new game and have fun!

## Game Flow

1. Host starts new game
2. Questions progress from level 1 to 15
3. Host can use lifelines:
   - **50/50**: Eliminates two wrong answers
   - **Phone a Friend**: Santa Claus calls your phone with AI-generated advice (requires Twilio)
   - **Ask the Audience**: Audience votes on their phones
4. Host selects answer and shows correct answer
5. Move to next question when ready
6. Win $1,000,000 by reaching level 15!

## How Phone a Friend Works

When you click "Phone a Friend":
1. You enter your phone number (with country code)
2. Twilio initiates a real phone call to your number
3. Santa Claus answers with AI-generated advice from OpenAI or Anthropic
4. Santa thinks through the question and gives you his jolly recommendation
5. The call automatically hangs up after the advice is given

## License

MIT
