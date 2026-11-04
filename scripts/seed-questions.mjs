import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { loadEnv } from './load-env.mjs';

loadEnv();

const url = process.env.DATABASE_URL;
const reset = process.argv.includes('--reset');
if (!url) {
  console.error('Set DATABASE_URL in .env');
  process.exit(1);
}

const questionsPath = join(dirname(fileURLToPath(import.meta.url)), '../database/data/questions.json');
const questions = JSON.parse(readFileSync(questionsPath, 'utf8'));
if (!Array.isArray(questions) || questions.length === 0) {
  console.error('questions.json is empty');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const existing = await client.query('SELECT count(*)::int AS count FROM trivia_questions');
  const count = existing.rows[0].count;
  if (count > 0 && !reset) {
    console.log(`trivia_questions already has ${count} rows. Re-run with --reset to replace them.`);
    process.exit(0);
  }

  await client.query('BEGIN');
  if (reset) {
    await client.query('DELETE FROM trivia_questions');
  }

  const batchSize = 100;
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const values = [];
    const placeholders = batch.map((question, index) => {
      const offset = index * 8;
      values.push(
        question.question,
        question.answer_a,
        question.answer_b,
        question.answer_c,
        question.answer_d,
        question.correct_answer,
        question.difficulty_level,
        question.category ?? 'General',
      );
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
    });
    await client.query(
      `INSERT INTO trivia_questions (
         question, answer_a, answer_b, answer_c, answer_d, correct_answer, difficulty_level, category
       ) VALUES ${placeholders.join(', ')}`,
      values,
    );
    console.log(`Inserted ${Math.min(i + batchSize, questions.length)} / ${questions.length}`);
  }
  await client.query('COMMIT');
  console.log('Question bank loaded.');
} catch (error) {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Keep the original error.
  }
  console.error(error.message);
  process.exit(1);
} finally {
  await client.end();
}
