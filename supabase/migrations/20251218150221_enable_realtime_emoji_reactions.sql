/*
  # Enable Realtime for Emoji Reactions

  This migration enables realtime functionality for the emoji_reactions table
  so that emoji reactions can be seen in real-time on the display screen.

  1. Changes
    - Add emoji_reactions table to the supabase_realtime publication
*/

ALTER PUBLICATION supabase_realtime ADD TABLE emoji_reactions;
