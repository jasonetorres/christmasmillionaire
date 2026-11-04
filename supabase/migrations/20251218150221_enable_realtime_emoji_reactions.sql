/*
  # Enable Realtime for Emoji Reactions

  This migration enables realtime functionality for the emoji_reactions table
  so that emoji reactions can be seen in real-time on the display screen.

  1. Changes
    - Add emoji_reactions table to the supabase_realtime publication
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'emoji_reactions'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'emoji_reactions'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emoji_reactions;
  END IF;
END $$;
