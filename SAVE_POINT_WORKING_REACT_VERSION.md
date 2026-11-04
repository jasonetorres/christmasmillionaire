> Historical note (November 2026): snapshot from December 2025. Routes in the current app are `/hostjt`, `/displayurl`, `/vote`, and `/santa`. The database column for a vote is `vote`, and question level is `difficulty_level`. Follow the README.

# SAVE POINT - Working React/Vite Version

**Date:** 2025-12-18
**Status:** FULLY WORKING ✅

This document serves as a complete save point for the working React/Vite/Supabase version of "Who Wants to Be a Christmasaire?" game.

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Database:** Supabase (PostgreSQL with Realtime)
- **Styling:** Tailwind CSS 4
- **Key Libraries:**
  - `@supabase/supabase-js` for database
  - `react-router-dom` for routing
  - `qrcode.react` for QR codes
  - `lucide-react` for icons

## Project Structure

```
/tmp/cc-agent/61556290/project/
├── src/
│   ├── App.tsx                     # Main app with routing
│   ├── main.tsx                    # Entry point
│   ├── index.css                   # Global styles
│   ├── vite-env.d.ts              # Vite types
│   ├── Components/
│   │   ├── EmojiReactions.tsx     # Floating emoji reactions
│   │   ├── Lifelines.tsx          # 50:50, Phone, Ask Audience buttons
│   │   ├── MoneyLadder.tsx        # Prize money display
│   │   ├── PhoneCallScreen.tsx    # Phone a Friend with Santa AI
│   │   ├── QuestionDisplay.tsx    # Question and answers display
│   │   └── SoundSystem.tsx        # Background music controller
│   ├── Pages/
│   │   ├── Display.tsx            # Main game display screen
│   │   ├── Host.tsx               # Host control panel
│   │   ├── Vote.tsx               # Audience voting page
│   │   └── Welcome.tsx            # Landing page
│   ├── lib/
│   │   └── supabase.ts            # Supabase client config
│   └── types/
│       └── index.ts               # TypeScript interfaces
├── supabase/
│   ├── functions/
│   │   └── santa-chat/
│   │       └── index.ts           # AI Santa edge function
│   └── migrations/
│       ├── 20251216212509_add_ai_response_to_game_state.sql
│       ├── 20251216215734_add_game_over_status.sql
│       ├── 20251217182059_remove_phone_call_fields.sql
│       ├── 20251217201356_fix_audience_votes_uuid.sql
│       ├── 20251217202203_add_audio_data_to_game_state.sql
│       ├── 20251217202309_enable_realtime_for_game_state.sql
│       └── 20251218115743_add_emoji_reactions_and_timer.sql
├── package.json
├── tsconfig.json
├── vite.config.js
├── tailwind.config.js
└── .env                           # Contains Supabase credentials

```

## Database Schema

### Tables

#### 1. `trivia_questions`
```sql
CREATE TABLE trivia_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer_a TEXT NOT NULL,
  answer_b TEXT NOT NULL,
  answer_c TEXT NOT NULL,
  answer_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 15),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. `game_state`
```sql
CREATE TABLE game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_question_id UUID REFERENCES trivia_questions(id),
  current_level INTEGER DEFAULT 1,
  total_winnings TEXT DEFAULT '£0',
  selected_answer TEXT CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  show_correct BOOLEAN DEFAULT false,
  lifeline_5050_used BOOLEAN DEFAULT false,
  lifeline_phone_used BOOLEAN DEFAULT false,
  lifeline_audience_used BOOLEAN DEFAULT false,
  removed_answers TEXT[] DEFAULT '{}',
  game_status TEXT DEFAULT 'waiting',
  active_lifeline TEXT,
  ai_response TEXT,
  audio_data TEXT,
  emoji_reactions JSONB DEFAULT '[]',
  timer_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON game_state FOR SELECT TO anon USING (true);
CREATE POLICY "Enable insert for all users" ON game_state FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON game_state FOR UPDATE TO anon USING (true);
CREATE POLICY "Enable delete for all users" ON game_state FOR DELETE TO anon USING (true);
```

#### 3. `audience_votes`
```sql
CREATE TABLE audience_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id UUID REFERENCES game_state(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('A', 'B', 'C', 'D')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audience_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON audience_votes FOR SELECT TO anon USING (true);
CREATE POLICY "Enable insert for all users" ON audience_votes FOR INSERT TO anon WITH CHECK (true);
```

### Realtime Enabled
All tables have Realtime replication enabled for live updates.

## Key Features

### 1. Display Page (`/display`)
- Shows current question with 4 answer options
- Money ladder showing prize progression
- Permanent QR code under money ladder for audience access
- When "Ask the Audience" is active, shows live voting results as bar charts
- Confetti animation on correct answers
- Game Over overlay on wrong answers
- Phone a Friend overlay with AI Santa
- Floating emoji reactions from audience

### 2. Host Control Panel (`/host`)
- Question management (load questions, navigate forward/back)
- Answer selection (A, B, C, D buttons)
- "Lock it in" to show correct answer
- Three lifelines:
  - **50:50** - Removes 2 wrong answers
  - **Phone a Friend** - AI Santa gives helpful response
  - **Ask the Audience** - Opens voting for audience
- "Continue to Next Question" button
- "Start Over" for new game

### 3. Audience Vote Page (`/vote`)
- Accessible via QR code on display
- Shows current question when Ask the Audience is active
- Vote buttons (A, B, C, D) appear when lifeline is active
- Emoji reaction buttons always available (😂, ❤️, 😮, 👏, 🔥, 😱)
- Vote confirmation after submission
- Real-time updates via Supabase

### 4. Welcome/Landing Page (`/`)
- Game introduction
- Links to Host and Display pages
- QR code for audience access

## Edge Functions

### `santa-chat`
**Purpose:** AI-powered Phone a Friend featuring Santa Claus

**Location:** `/supabase/functions/santa-chat/index.ts`

**Features:**
- Uses Anthropic Claude AI
- Santa character responds in character
- Provides helpful hints without giving away the answer
- Returns text-to-speech audio data
- CORS enabled for frontend access

**Endpoint:** `${SUPABASE_URL}/functions/v1/santa-chat`

**Request:**
```json
{
  "question": "What is the capital of France?",
  "answerA": "Paris",
  "answerB": "London",
  "answerC": "Berlin",
  "answerD": "Madrid",
  "correctAnswer": "A"
}
```

**Response:**
```json
{
  "text": "Ho ho ho! Well, let me think...",
  "audio": "base64_encoded_audio_data"
}
```

## Environment Variables (.env)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Routes

- `/` - Welcome/Landing page
- `/host` - Host control panel
- `/display` - Main game display
- `/vote` - Audience voting page

## Build & Deploy

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How Game Flow Works

1. **Setup:** Host navigates to `/host`, loads questions, starts game
2. **Display:** Display screen at `/display` shows question to audience
3. **Audience:** Audience scans QR code, goes to `/vote` for reactions
4. **Host Controls:** Host can:
   - Select answer (A, B, C, D)
   - Use lifelines (50:50, Phone Friend, Ask Audience)
   - Lock in answer to show correct/incorrect
   - Continue to next question
5. **Lifelines:**
   - **50:50:** Removes 2 wrong answers on display
   - **Phone:** Shows AI Santa overlay with voice response
   - **Ask Audience:** Vote buttons appear on `/vote`, results show on `/display`
6. **Progress:** After each question, host continues to next level
7. **Game Over:** Wrong answer triggers Game Over overlay showing winnings
8. **Win:** Reaching level 15 triggers winner celebration

## Known Working Behaviors

- ✅ Real-time updates across all screens using Supabase Realtime
- ✅ QR code always visible for audience access
- ✅ Emoji reactions float up screen in real-time
- ✅ Phone a Friend AI works with voice
- ✅ Ask the Audience shows live voting results
- ✅ 50:50 removes incorrect answers
- ✅ Game Over screen shows on wrong answer
- ✅ Confetti animation on correct answers
- ✅ Sound system with background music
- ✅ Responsive design for different screen sizes
- ✅ All lifelines only usable once
- ✅ Timer support in database (though not actively displayed)

## Important Implementation Notes

1. **Supabase Client:** Single instance in `src/lib/supabase.ts`
2. **Realtime Subscriptions:** All pages subscribe to `game_state` changes
3. **Polling Fallback:** 2-second polling interval for reliability
4. **Row Level Security:** All tables have permissive policies for `anon` role
5. **Audio Handling:** Phone a Friend includes base64 audio playback
6. **State Management:** All state in Supabase, no local state persistence
7. **Type Safety:** Full TypeScript with interfaces in `src/types/index.ts`

## Dependencies (package.json)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.88.0",
    "lucide-react": "^0.344.0",
    "qrcode.react": "^4.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.23",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18",
    "typescript": "^5.5.3",
    "vite": "^7.0.7"
  }
}
```

## Restoration Instructions

If you need to restore this exact version:

1. Ensure all files listed above exist with their exact content
2. Run `npm install` to restore dependencies
3. Ensure `.env` file has valid Supabase credentials
4. Verify all database tables exist with correct schema
5. Deploy the `santa-chat` edge function to Supabase
6. Run `npm run build` to verify build works
7. Run `npm run dev` to test locally

## Test Checklist

Before considering this version "working", verify:

- [ ] Host page loads and shows controls
- [ ] Display page shows questions
- [ ] Vote page accessible via QR code
- [ ] Emoji reactions appear on Display
- [ ] 50:50 removes 2 answers
- [ ] Phone a Friend shows Santa with voice
- [ ] Ask the Audience shows voting UI and results
- [ ] Lock in shows correct/wrong answer
- [ ] Game Over appears on wrong answer
- [ ] Confetti plays on correct answer
- [ ] Continue to next question works
- [ ] Start Over resets game
- [ ] All real-time updates work across screens

---

**This is the last known fully working version before Laravel conversion.**
**Restore to this point if Laravel conversion fails.**
