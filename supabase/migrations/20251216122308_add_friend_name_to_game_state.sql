/*
  # Add Friend Name Field to Game State

  1. Changes
    - Add friend_name column to game_state table for Phone a Friend lifeline
    - Set default value to "Your Friend"
  
  2. Notes
    - This allows the host to customize the friend's name displayed during Phone a Friend
*/

-- Add friend_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_state' AND column_name = 'friend_name'
  ) THEN
    ALTER TABLE game_state ADD COLUMN friend_name text DEFAULT 'Your Friend';
  END IF;
END $$;
