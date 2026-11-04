/*
  # Enable realtime for game_state table

  1. Changes
    - Add game_state table to supabase_realtime publication
    - This enables realtime updates for audio streaming and game state changes
  
  2. Notes
    - Required for display to receive audio updates from host in real-time
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'game_state'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'game_state'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;
  END IF;
END $$;