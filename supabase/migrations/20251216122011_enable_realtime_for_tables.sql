/*
  # Enable Realtime for Game Tables

  1. Changes
    - Add game_state table to supabase_realtime publication
    - Add audience_votes table to supabase_realtime publication
    - This enables real-time updates for these tables
  
  2. Notes
    - Required for the host panel and display panel to sync in real-time
    - Without this, changes won't be broadcast to subscribers
*/

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE audience_votes;
