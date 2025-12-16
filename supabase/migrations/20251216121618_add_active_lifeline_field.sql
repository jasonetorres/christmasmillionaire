/*
  # Add active_lifeline field to game_state table

  1. Changes
    - Add `active_lifeline` column to `game_state` table
    - This field tracks which lifeline modal is currently active on display
  
  2. Notes
    - Values can be 'phone', 'audience', or NULL
    - Used to show/hide lifeline modals on display panel
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_state' AND column_name = 'active_lifeline'
  ) THEN
    ALTER TABLE game_state ADD COLUMN active_lifeline text CHECK (active_lifeline IN ('phone', 'audience') OR active_lifeline IS NULL);
  END IF;
END $$;
