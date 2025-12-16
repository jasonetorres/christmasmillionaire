/*
  # Add Game State Management Table

  1. New Tables
    - `game_state`
      - `id` (uuid, primary key) - Unique identifier
      - `current_question_id` (uuid) - Reference to current question
      - `current_level` (integer) - Current difficulty level (1-15)
      - `game_status` (text) - Status: 'waiting', 'question_shown', 'answer_selected', 'correct', 'incorrect', 'won'
      - `selected_answer` (text) - The answer the contestant selected
      - `show_correct` (boolean) - Whether to show the correct answer
      - `lifeline_fifty_fifty_used` (boolean) - If 50:50 was used
      - `lifeline_phone_used` (boolean) - If Phone a Friend was used
      - `lifeline_audience_used` (boolean) - If Ask Audience was used
      - `removed_answers` (text[]) - Array of removed answers from 50:50
      - `total_winnings` (text) - Current winnings amount
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on `game_state` table
    - Allow public read access (for display to read state)
    - Allow public write access (for host to control - can be restricted later)

  3. Notes
    - Only one active game state row should exist
    - The display panel reads this to show current state
    - The host panel writes to this to control the game
*/

CREATE TABLE IF NOT EXISTS game_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_question_id uuid REFERENCES trivia_questions(id),
  current_level integer DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 15),
  game_status text DEFAULT 'waiting' CHECK (game_status IN ('waiting', 'question_shown', 'answer_selected', 'correct', 'incorrect', 'won')),
  selected_answer text CHECK (selected_answer IN ('A', 'B', 'C', 'D') OR selected_answer IS NULL),
  show_correct boolean DEFAULT false,
  lifeline_fifty_fifty_used boolean DEFAULT false,
  lifeline_phone_used boolean DEFAULT false,
  lifeline_audience_used boolean DEFAULT false,
  removed_answers text[] DEFAULT '{}',
  total_winnings text DEFAULT '$0',
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- Allow public read access for display panel
CREATE POLICY "Anyone can view game state"
  ON game_state
  FOR SELECT
  USING (true);

-- Allow public write access for host panel
CREATE POLICY "Anyone can insert game state"
  ON game_state
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update game state"
  ON game_state
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete game state"
  ON game_state
  FOR DELETE
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_game_state_updated ON game_state(updated_at DESC);
