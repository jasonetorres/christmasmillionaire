/*
  # Create the trivia game tables

  Later migrations only alter these tables. This file was removed from the repo
  during a Laravel experiment, so a new Supabase project could not be created
  from the remaining SQL.

  Final columns the app uses are produced by the later migrations:
  game_state gains question_start_time, time_limit_seconds, and santa audio
  columns; friend_name is dropped; emoji_reactions is created separately.
*/

CREATE TABLE IF NOT EXISTS trivia_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer_a text NOT NULL,
  answer_b text NOT NULL,
  answer_c text NOT NULL,
  answer_d text NOT NULL,
  correct_answer varchar(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  difficulty_level integer NOT NULL CHECK (difficulty_level BETWEEN 1 AND 15),
  category text DEFAULT 'General' NOT NULL,
  is_used boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trivia_difficulty ON trivia_questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_trivia_is_used ON trivia_questions(is_used);
CREATE INDEX IF NOT EXISTS idx_trivia_difficulty_used ON trivia_questions(difficulty_level, is_used);

CREATE TABLE IF NOT EXISTS game_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_question_id uuid,
  current_level integer DEFAULT 1 NOT NULL,
  game_status text DEFAULT 'waiting' NOT NULL,
  selected_answer varchar(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  show_correct boolean DEFAULT false NOT NULL,
  lifeline_fifty_fifty_used boolean DEFAULT false NOT NULL,
  lifeline_phone_used boolean DEFAULT false NOT NULL,
  lifeline_audience_used boolean DEFAULT false NOT NULL,
  removed_answers jsonb,
  total_winnings text DEFAULT '$0' NOT NULL,
  active_lifeline text,
  friend_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audience_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id uuid NOT NULL REFERENCES game_state(id) ON DELETE CASCADE,
  vote varchar(1) NOT NULL CHECK (vote IN ('A', 'B', 'C', 'D')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audience_votes_game_state ON audience_votes(game_state_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trivia_questions_set_updated_at ON trivia_questions;
CREATE TRIGGER trivia_questions_set_updated_at
  BEFORE UPDATE ON trivia_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS game_state_set_updated_at ON game_state;
CREATE TRIGGER game_state_set_updated_at
  BEFORE UPDATE ON game_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS audience_votes_set_updated_at ON audience_votes;
CREATE TRIGGER audience_votes_set_updated_at
  BEFORE UPDATE ON audience_votes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view trivia questions" ON trivia_questions;
CREATE POLICY "Public can view trivia questions"
  ON trivia_questions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can update trivia questions" ON trivia_questions;
CREATE POLICY "Public can update trivia questions"
  ON trivia_questions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view game state" ON game_state;
CREATE POLICY "Public can view game state"
  ON game_state FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can insert game state" ON game_state;
CREATE POLICY "Public can insert game state"
  ON game_state FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update game state" ON game_state;
CREATE POLICY "Public can update game state"
  ON game_state FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete game state" ON game_state;
CREATE POLICY "Public can delete game state"
  ON game_state FOR DELETE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can view audience votes" ON audience_votes;
CREATE POLICY "Public can view audience votes"
  ON audience_votes FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can insert audience votes" ON audience_votes;
CREATE POLICY "Public can insert audience votes"
  ON audience_votes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete audience votes" ON audience_votes;
CREATE POLICY "Public can delete audience votes"
  ON audience_votes FOR DELETE
  TO anon, authenticated
  USING (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    GRANT SELECT, UPDATE ON trivia_questions TO anon, authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON game_state TO anon, authenticated;
    GRANT SELECT, INSERT, DELETE ON audience_votes TO anon, authenticated;
  END IF;
END $$;

-- The display and vote pages subscribe to audience_votes. Without this,
-- those subscriptions never fire. The display also polls every 2 seconds.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'audience_votes'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audience_votes;
  END IF;
END $$;
