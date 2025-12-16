/*
  # Add 'game_over' to game_status constraint

  1. Changes
    - Drop existing check constraint on game_status
    - Add new check constraint that includes 'game_over' as a valid status
  
  2. Notes
    - This allows the game to properly end when a contestant answers incorrectly
*/

ALTER TABLE game_state DROP CONSTRAINT IF EXISTS game_state_game_status_check;

ALTER TABLE game_state ADD CONSTRAINT game_state_game_status_check 
  CHECK (game_status = ANY (ARRAY['waiting'::text, 'question_shown'::text, 'answer_selected'::text, 'correct'::text, 'incorrect'::text, 'won'::text, 'game_over'::text]));