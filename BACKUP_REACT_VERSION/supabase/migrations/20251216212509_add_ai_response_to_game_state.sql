/*
  # Add AI Response Field to Game State

  1. Changes
    - Add `ai_response` column to `game_state` table to store Phone a Friend AI responses
  
  2. Notes
    - This allows the display screen to show the AI friend's response
    - Nullable text field with default empty string
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_state' AND column_name = 'ai_response'
  ) THEN
    ALTER TABLE game_state ADD COLUMN ai_response text DEFAULT '';
  END IF;
END $$;
