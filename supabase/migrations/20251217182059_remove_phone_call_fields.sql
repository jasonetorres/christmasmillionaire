/*
  # Remove Phone Call Fields
  
  1. Changes
    - Remove `friend_name` column from game_state table
    - Remove `ai_response` column from game_state table
  
  2. Notes
    - These fields were used for the phone-a-friend voice chat feature
    - The feature has been removed and these fields are no longer needed
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_state' AND column_name = 'friend_name'
  ) THEN
    ALTER TABLE game_state DROP COLUMN friend_name;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_state' AND column_name = 'ai_response'
  ) THEN
    ALTER TABLE game_state DROP COLUMN ai_response;
  END IF;
END $$;