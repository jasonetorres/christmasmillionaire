/*
  # Add Emoji Reactions and Countdown Timer

  1. New Tables
    - `emoji_reactions`
      - `id` (uuid, primary key)
      - `game_state_id` (uuid, foreign key to game_state)
      - `emoji` (text) - The emoji character
      - `created_at` (timestamp)

  2. Changes to existing tables
    - `game_state`
      - Add `question_start_time` (bigint) - Unix timestamp when question was shown
      - Add `time_limit_seconds` (integer) - Time limit for the question in seconds (default 30)

  3. Security
    - Enable RLS on `emoji_reactions` table
    - Add policy for anyone to insert reactions (public voting)
    - Add policy for anyone to read reactions
*/

-- Create emoji_reactions table
CREATE TABLE IF NOT EXISTS emoji_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'emoji_reactions_game_state_id_fkey'
  ) THEN
    ALTER TABLE emoji_reactions
      ADD CONSTRAINT emoji_reactions_game_state_id_fkey
      FOREIGN KEY (game_state_id)
      REFERENCES game_state(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add timer fields to game_state
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_state' AND column_name = 'question_start_time'
  ) THEN
    ALTER TABLE game_state ADD COLUMN question_start_time bigint;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_state' AND column_name = 'time_limit_seconds'
  ) THEN
    ALTER TABLE game_state ADD COLUMN time_limit_seconds integer DEFAULT 30;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE emoji_reactions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert emoji reactions
CREATE POLICY "Anyone can add emoji reactions"
  ON emoji_reactions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read emoji reactions
CREATE POLICY "Anyone can view emoji reactions"
  ON emoji_reactions
  FOR SELECT
  TO anon, authenticated
  USING (true);