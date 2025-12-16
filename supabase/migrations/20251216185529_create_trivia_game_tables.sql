/*
  # Create Trivia Game Tables
  
  1. New Tables
    - `trivia_questions`
      - `id` (uuid, primary key)
      - `question` (text)
      - `answer_a`, `answer_b`, `answer_c`, `answer_d` (text)
      - `correct_answer` (single character: A, B, C, or D)
      - `difficulty_level` (integer, 1-15)
      - `category` (text)
      - `is_used` (boolean)
      - `created_at`, `updated_at` (timestamps)
    
    - `game_state`
      - `id` (uuid, primary key)
      - `current_question_id` (uuid, nullable)
      - `current_level` (integer)
      - `game_status` (text: waiting/playing/finished)
      - `selected_answer` (single character, nullable)
      - `show_correct` (boolean)
      - `lifeline_fifty_fifty_used`, `lifeline_phone_used`, `lifeline_audience_used` (boolean)
      - `removed_answers` (jsonb, nullable)
      - `total_winnings` (text)
      - `active_lifeline`, `friend_name` (text, nullable)
      - `created_at`, `updated_at` (timestamps)
    
    - `audience_votes`
      - `id` (uuid, primary key)
      - `game_state_id` (uuid, foreign key)
      - `vote` (single character: A, B, C, or D)
      - `created_at`, `updated_at` (timestamps)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public read/write access (game context)
*/

-- Create trivia_questions table
CREATE TABLE IF NOT EXISTS trivia_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer_a text NOT NULL,
  answer_b text NOT NULL,
  answer_c text NOT NULL,
  answer_d text NOT NULL,
  correct_answer varchar(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  difficulty_level integer NOT NULL CHECK (difficulty_level BETWEEN 1 AND 15),
  category text DEFAULT 'General' NOT NULL,
  is_used boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trivia_difficulty ON trivia_questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_trivia_is_used ON trivia_questions(is_used);
CREATE INDEX IF NOT EXISTS idx_trivia_difficulty_used ON trivia_questions(difficulty_level, is_used);

-- Create game_state table
CREATE TABLE IF NOT EXISTS game_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_question_id uuid,
  current_level integer DEFAULT 1 NOT NULL,
  game_status text DEFAULT 'waiting' NOT NULL,
  selected_answer varchar(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  show_correct boolean DEFAULT false NOT NULL,
  lifeline_fifty_fifty_used boolean DEFAULT false NOT NULL,
  lifeline_phone_used boolean DEFAULT false NOT NULL,
  lifeline_audience_used boolean DEFAULT false NOT NULL,
  removed_answers jsonb,
  total_winnings text DEFAULT '$0' NOT NULL,
  active_lifeline text,
  friend_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audience_votes table
CREATE TABLE IF NOT EXISTS audience_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id uuid NOT NULL REFERENCES game_state(id) ON DELETE CASCADE,
  vote varchar(1) NOT NULL CHECK (vote IN ('A', 'B', 'C', 'D')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audience_votes_game_state ON audience_votes(game_state_id);

-- Enable RLS
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_votes ENABLE ROW LEVEL SECURITY;

-- Public access policies (for game play)
CREATE POLICY "Public can view trivia questions"
  ON trivia_questions FOR SELECT
  USING (true);

CREATE POLICY "Public can update trivia questions"
  ON trivia_questions FOR UPDATE
  USING (true);

CREATE POLICY "Public can view game state"
  ON game_state FOR SELECT
  USING (true);

CREATE POLICY "Public can insert game state"
  ON game_state FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update game state"
  ON game_state FOR UPDATE
  USING (true);

CREATE POLICY "Public can delete game state"
  ON game_state FOR DELETE
  USING (true);

CREATE POLICY "Public can view audience votes"
  ON audience_votes FOR SELECT
  USING (true);

CREATE POLICY "Public can insert audience votes"
  ON audience_votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can delete audience votes"
  ON audience_votes FOR DELETE
  USING (true);
