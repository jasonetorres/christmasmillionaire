/*
  # Add audio data field to game_state

  1. Changes
    - Add santa_audio_data column to store audio from Phone a Friend
    - Add santa_audio_timestamp to track when audio was last updated
    - This enables realtime audio streaming from host to display
  
  2. Notes
    - Audio data is stored as JSONB array of numbers
    - Timestamp helps detect new audio
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_state' AND column_name = 'santa_audio_data'
  ) THEN
    ALTER TABLE game_state ADD COLUMN santa_audio_data jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_state' AND column_name = 'santa_audio_timestamp'
  ) THEN
    ALTER TABLE game_state ADD COLUMN santa_audio_timestamp bigint;
  END IF;
END $$;