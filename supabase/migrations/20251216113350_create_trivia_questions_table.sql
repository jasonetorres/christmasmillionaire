/*
  # Create Trivia Questions Table for Christmas Millionaire Game

  1. New Tables
    - `trivia_questions`
      - `id` (uuid, primary key) - Unique identifier for each question
      - `question` (text) - The trivia question text
      - `answer_a` (text) - First answer option
      - `answer_b` (text) - Second answer option
      - `answer_c` (text) - Third answer option
      - `answer_d` (text) - Fourth answer option
      - `correct_answer` (text) - The correct answer letter (A, B, C, or D)
      - `difficulty_level` (integer) - Question difficulty from 1-15 matching money ladder
      - `category` (text) - Category of question (e.g., "Christmas Movies", "Holiday Traditions")
      - `is_used` (boolean) - Track if question has been used in current session
      - `created_at` (timestamptz) - When question was added
      
  2. Security
    - Enable RLS on `trivia_questions` table
    - Add policy for public read access (for game display)
    - Add policy for authenticated insert/update (for admin panel)

  3. Indexes
    - Index on difficulty_level for efficient filtering
    - Index on is_used for filtering available questions
*/

CREATE TABLE IF NOT EXISTS trivia_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer_a text NOT NULL,
  answer_b text NOT NULL,
  answer_c text NOT NULL,
  answer_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  difficulty_level integer NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 15),
  category text DEFAULT 'General',
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trivia_difficulty ON trivia_questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_trivia_used ON trivia_questions(is_used);
CREATE INDEX IF NOT EXISTS idx_trivia_difficulty_used ON trivia_questions(difficulty_level, is_used);

-- Enable Row Level Security
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access for game display
CREATE POLICY "Anyone can view questions"
  ON trivia_questions
  FOR SELECT
  USING (true);

-- Allow anyone to insert questions (for demo purposes - restrict in production)
CREATE POLICY "Anyone can insert questions"
  ON trivia_questions
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update questions (for demo purposes - restrict in production)
CREATE POLICY "Anyone can update questions"
  ON trivia_questions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);