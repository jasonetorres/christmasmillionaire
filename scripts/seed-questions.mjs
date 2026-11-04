import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const reset = process.argv.includes('--reset');

if (!url || !serviceKey) {
  console.error('Set VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const questionsPath = join(root, 'database/data/questions.json');
const questions = JSON.parse(readFileSync(questionsPath, 'utf8'));

if (!Array.isArray(questions) || questions.length === 0) {
  console.error('questions.json is empty');
  process.exit(1);
}

const { count, error: countError } = await supabase
  .from('trivia_questions')
  .select('*', { count: 'exact', head: true });

if (countError) {
  console.error(countError.message);
  process.exit(1);
}

if (count && count > 0 && !reset) {
  console.log(`trivia_questions already has ${count} rows. Re-run with --reset to replace them.`);
  process.exit(0);
}

if (reset) {
  const { error } = await supabase
    .from('trivia_questions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
}

const batchSize = 200;
for (let i = 0; i < questions.length; i += batchSize) {
  const batch = questions.slice(i, i + batchSize).map((question) => ({
    question: question.question,
    answer_a: question.answer_a,
    answer_b: question.answer_b,
    answer_c: question.answer_c,
    answer_d: question.answer_d,
    correct_answer: question.correct_answer,
    difficulty_level: question.difficulty_level,
    category: question.category ?? 'General',
    is_used: false,
  }));

  const { error } = await supabase.from('trivia_questions').insert(batch);
  if (error) {
    console.error(`Insert failed at row ${i + 1}: ${error.message}`);
    process.exit(1);
  }
  console.log(`Inserted ${Math.min(i + batchSize, questions.length)} / ${questions.length}`);
}

console.log('Question bank loaded.');
