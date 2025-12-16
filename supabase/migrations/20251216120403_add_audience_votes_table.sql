/*
  # Add Audience Voting Table

  1. New Tables
    - `audience_votes`
      - `id` (uuid, primary key)
      - `game_state_id` (uuid, foreign key to game_state)
      - `vote` (text, A/B/C/D)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `audience_votes` table
    - Add policy allowing anyone to insert votes (public voting)
    - Add policy allowing anyone to read votes (public poll results)
  
  3. Changes
    - Add `active_lifeline` field to game_state to track which lifeline is currently being shown
*/

-- Add active_lifeline field to game_state
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_state' AND column_name = 'active_lifeline'
  ) THEN
    ALTER TABLE game_state ADD COLUMN active_lifeline text;
  END IF;
END $$;

-- Create audience_votes table
CREATE TABLE IF NOT EXISTS audience_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id uuid REFERENCES game_state(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('A', 'B', 'C', 'D')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audience_votes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert votes (public voting)
CREATE POLICY "Anyone can vote"
  ON audience_votes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read votes (public poll results)
CREATE POLICY "Anyone can read votes"
  ON audience_votes
  FOR SELECT
  TO anon, authenticated
  USING (true);
