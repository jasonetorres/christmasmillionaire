/*
  # Enable realtime for game_state table

  1. Changes
    - Add game_state table to supabase_realtime publication
    - This enables realtime updates for audio streaming and game state changes
  
  2. Notes
    - Required for display to receive audio updates from host in real-time
*/

ALTER PUBLICATION supabase_realtime ADD TABLE game_state;