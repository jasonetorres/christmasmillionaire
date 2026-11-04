-- Idempotent schema for Who Wants to Be a Christmasaire.
-- Safe to run more than once against an empty or already-migrated database.
-- gen_random_uuid() is built into Postgres 13 and newer.

CREATE TABLE IF NOT EXISTS trivia_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer_a text NOT NULL,
  answer_b text NOT NULL,
  answer_c text NOT NULL,
  answer_d text NOT NULL,
  correct_answer varchar(1) NOT NULL,
  difficulty_level integer NOT NULL,
  category text NOT NULL DEFAULT 'General',
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_question_id uuid,
  current_level integer NOT NULL DEFAULT 1,
  game_status text NOT NULL DEFAULT 'waiting',
  selected_answer varchar(1),
  show_correct boolean NOT NULL DEFAULT false,
  lifeline_fifty_fifty_used boolean NOT NULL DEFAULT false,
  lifeline_phone_used boolean NOT NULL DEFAULT false,
  lifeline_audience_used boolean NOT NULL DEFAULT false,
  removed_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_winnings text NOT NULL DEFAULT '$0',
  active_lifeline text,
  question_start_time bigint,
  time_limit_seconds integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audience_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id uuid NOT NULL REFERENCES game_state(id) ON DELETE CASCADE,
  vote varchar(1) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emoji_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id uuid NOT NULL REFERENCES game_state(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trivia_questions ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'General';
ALTER TABLE trivia_questions ADD COLUMN IF NOT EXISTS is_used boolean NOT NULL DEFAULT false;
ALTER TABLE trivia_questions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS removed_answers jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS active_lifeline text;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS question_start_time bigint;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS time_limit_seconds integer NOT NULL DEFAULT 30;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE trivia_questions DROP CONSTRAINT IF EXISTS trivia_questions_correct_answer_check;
ALTER TABLE trivia_questions ADD CONSTRAINT trivia_questions_correct_answer_check
  CHECK (correct_answer IN ('A', 'B', 'C', 'D'));

ALTER TABLE trivia_questions DROP CONSTRAINT IF EXISTS trivia_questions_difficulty_level_check;
ALTER TABLE trivia_questions ADD CONSTRAINT trivia_questions_difficulty_level_check
  CHECK (difficulty_level BETWEEN 1 AND 15);

ALTER TABLE game_state DROP CONSTRAINT IF EXISTS game_state_selected_answer_check;
ALTER TABLE game_state ADD CONSTRAINT game_state_selected_answer_check
  CHECK (selected_answer IS NULL OR selected_answer IN ('A', 'B', 'C', 'D'));

ALTER TABLE game_state DROP CONSTRAINT IF EXISTS game_state_game_status_check;
ALTER TABLE game_state ADD CONSTRAINT game_state_game_status_check
  CHECK (game_status IN (
    'waiting',
    'question_shown',
    'answer_selected',
    'correct',
    'incorrect',
    'won',
    'game_over'
  ));

ALTER TABLE audience_votes DROP CONSTRAINT IF EXISTS audience_votes_vote_check;
ALTER TABLE audience_votes ADD CONSTRAINT audience_votes_vote_check
  CHECK (vote IN ('A', 'B', 'C', 'D'));

CREATE INDEX IF NOT EXISTS idx_trivia_difficulty_used
  ON trivia_questions (difficulty_level, is_used);
CREATE INDEX IF NOT EXISTS idx_audience_votes_game_state
  ON audience_votes (game_state_id);
CREATE INDEX IF NOT EXISTS idx_emoji_reactions_game_state
  ON emoji_reactions (game_state_id, created_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trivia_questions_set_updated_at ON trivia_questions;
CREATE TRIGGER trivia_questions_set_updated_at
  BEFORE UPDATE ON trivia_questions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS game_state_set_updated_at ON game_state;
CREATE TRIGGER game_state_set_updated_at
  BEFORE UPDATE ON game_state
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
