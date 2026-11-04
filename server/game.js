import { HttpError } from './http.js';
import { query, withTransaction } from './db.js';

const ANSWERS = ['A', 'B', 'C', 'D'];
const REACTIONS = ['👏', '😮', '🤔', '😱', '🎉', '❤️', '🔥', '👍', '🎄', '🎅', '⛄', '🎁', '⭐', '🎊', '🤶', '🦌'];
const MONEY_LADDER = [
  '$100', '$200', '$300', '$500', '$1,000',
  '$2,000', '$4,000', '$8,000', '$16,000', '$32,000',
  '$64,000', '$125,000', '$250,000', '$500,000', '$1,000,000',
];

function emptyVotes() {
  return { A: 0, B: 0, C: 0, D: 0 };
}

function assertAnswer(value) {
  if (!ANSWERS.includes(value)) {
    throw new HttpError(400, 'Answer must be A, B, C, or D');
  }
}

function normalizeGame(row) {
  return {
    ...row,
    question_start_time: row.question_start_time == null ? null : Number(row.question_start_time),
    removed_answers: Array.isArray(row.removed_answers) ? row.removed_answers : [],
  };
}

export async function getState() {
  const games = await query(
    `SELECT * FROM game_state ORDER BY updated_at DESC LIMIT 1`,
  );
  if (games.length === 0) {
    return { game: null, votes: emptyVotes(), reactions: [] };
  }

  const game = games[0];
  let currentQuestion = null;
  if (game.current_question_id) {
    const questions = await query(
      `SELECT * FROM trivia_questions WHERE id = $1`,
      [game.current_question_id],
    );
    currentQuestion = questions[0] ?? null;
  }

  const voteRows = await query(
    `SELECT vote, count(*)::int AS count
     FROM audience_votes
     WHERE game_state_id = $1
     GROUP BY vote`,
    [game.id],
  );
  const votes = emptyVotes();
  for (const row of voteRows) {
    if (row.vote in votes) votes[row.vote] = row.count;
  }

  const reactions = await query(
    `SELECT id, emoji, created_at
     FROM emoji_reactions
     WHERE game_state_id = $1
       AND created_at > now() - interval '20 seconds'
     ORDER BY created_at ASC
     LIMIT 50`,
    [game.id],
  );

  return {
    game: { ...normalizeGame(game), current_question: currentQuestion },
    votes,
    reactions,
  };
}

async function latestGame(q) {
  const rows = await q(`SELECT * FROM game_state ORDER BY updated_at DESC LIMIT 1`);
  if (!rows[0]) throw new HttpError(409, 'No game is in progress');
  return rows[0];
}

async function questionFor(q, game) {
  const rows = await q(`SELECT * FROM trivia_questions WHERE id = $1`, [game.current_question_id]);
  if (!rows[0]) throw new HttpError(409, 'The current question is missing');
  return rows[0];
}

export async function startGame() {
  await withTransaction(async (q) => {
    await q(`DELETE FROM game_state`);
    await q(`UPDATE trivia_questions SET is_used = false WHERE is_used = true`);
    const questions = await q(
      `SELECT id FROM trivia_questions WHERE difficulty_level = 1 AND is_used = false`,
    );
    if (questions.length === 0) {
      throw new HttpError(409, 'No unused level 1 questions. Run npm run seed.');
    }
    const question = questions[Math.floor(Math.random() * questions.length)];
    await q(`UPDATE trivia_questions SET is_used = true WHERE id = $1`, [question.id]);
    await q(
      `INSERT INTO game_state (
         current_question_id, current_level, game_status, total_winnings,
         question_start_time, time_limit_seconds
       ) VALUES ($1, 1, 'question_shown', '$0', $2, 30)`,
      [question.id, Date.now()],
    );
  });
  return getState();
}

export async function selectAnswer(answer) {
  assertAnswer(answer);
  await withTransaction(async (q) => {
    const game = await latestGame(q);
    if (game.show_correct || game.game_status === 'game_over') {
      throw new HttpError(409, 'That answer is already locked in');
    }
    await q(`UPDATE game_state SET selected_answer = $1 WHERE id = $2`, [answer, game.id]);
  });
  return getState();
}

export async function revealAnswer() {
  await withTransaction(async (q) => {
    const game = await latestGame(q);
    if (!game.selected_answer) throw new HttpError(409, 'Select an answer first');
    const question = await questionFor(q, game);
    if (game.selected_answer === question.correct_answer) {
      await q(`UPDATE game_state SET show_correct = true WHERE id = $1`, [game.id]);
      return;
    }
    const guaranteed = game.current_level <= 5 ? '$0'
      : game.current_level <= 10 ? '$1,000'
        : '$32,000';
    await q(
      `UPDATE game_state
       SET show_correct = true, game_status = 'game_over', total_winnings = $2
       WHERE id = $1`,
      [game.id, guaranteed],
    );
  });
  return getState();
}

export async function nextQuestion() {
  await withTransaction(async (q) => {
    const game = await latestGame(q);
    if (game.game_status === 'game_over') throw new HttpError(409, 'The game is over');
    if (!game.show_correct) throw new HttpError(409, 'Show the correct answer first');
    const nextLevel = game.current_level + 1;
    if (nextLevel > 15) throw new HttpError(409, 'The contestant already won $1,000,000');

    const questions = await q(
      `SELECT id FROM trivia_questions WHERE difficulty_level = $1 AND is_used = false`,
      [nextLevel],
    );
    if (questions.length === 0) {
      throw new HttpError(409, `No unused questions left at level ${nextLevel}`);
    }
    const question = questions[Math.floor(Math.random() * questions.length)];
    await q(`UPDATE trivia_questions SET is_used = true WHERE id = $1`, [question.id]);
    await q(`DELETE FROM audience_votes WHERE game_state_id = $1`, [game.id]);
    await q(
      `UPDATE game_state
       SET current_question_id = $2,
           current_level = $3,
           selected_answer = NULL,
           show_correct = false,
           removed_answers = '[]'::jsonb,
           active_lifeline = NULL,
           total_winnings = $4,
           question_start_time = $5,
           time_limit_seconds = 30
       WHERE id = $1`,
      [game.id, question.id, nextLevel, MONEY_LADDER[nextLevel - 1], Date.now()],
    );
  });
  return getState();
}

export async function replaceQuestion() {
  await withTransaction(async (q) => {
    const game = await latestGame(q);
    if (game.current_question_id) {
      await q(`UPDATE trivia_questions SET is_used = false WHERE id = $1`, [game.current_question_id]);
    }
    const questions = await q(
      `SELECT id FROM trivia_questions WHERE difficulty_level = $1 AND is_used = false`,
      [game.current_level],
    );
    if (questions.length === 0) {
      throw new HttpError(409, 'No unused questions left at this level');
    }
    const question = questions[Math.floor(Math.random() * questions.length)];
    await q(`UPDATE trivia_questions SET is_used = true WHERE id = $1`, [question.id]);
    await q(`DELETE FROM audience_votes WHERE game_state_id = $1`, [game.id]);
    await q(
      `UPDATE game_state
       SET current_question_id = $2,
           selected_answer = NULL,
           show_correct = false,
           removed_answers = '[]'::jsonb,
           active_lifeline = NULL,
           question_start_time = $3,
           time_limit_seconds = 30
       WHERE id = $1`,
      [game.id, question.id, Date.now()],
    );
  });
  return getState();
}

export async function useFifty() {
  await withTransaction(async (q) => {
    const game = await latestGame(q);
    if (game.lifeline_fifty_fifty_used) throw new HttpError(409, '50:50 was already used');
    const question = await questionFor(q, game);
    const wrong = ANSWERS.filter((answer) => answer !== question.correct_answer)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
    await q(
      `UPDATE game_state
       SET lifeline_fifty_fifty_used = true, removed_answers = $2::jsonb
       WHERE id = $1`,
      [game.id, JSON.stringify(wrong)],
    );
  });
  return getState();
}

export async function usePhone() {
  await withTransaction(async (q) => {
    const game = await latestGame(q);
    if (game.lifeline_phone_used) throw new HttpError(409, 'Phone a Friend was already used');
    await q(
      `UPDATE game_state
       SET lifeline_phone_used = true, active_lifeline = 'phone'
       WHERE id = $1`,
      [game.id],
    );
  });
  return getState();
}

export async function useAudience() {
  await withTransaction(async (q) => {
    const game = await latestGame(q);
    if (game.lifeline_audience_used) throw new HttpError(409, 'Ask the Audience was already used');
    await q(`DELETE FROM audience_votes WHERE game_state_id = $1`, [game.id]);
    await q(
      `UPDATE game_state
       SET lifeline_audience_used = true, active_lifeline = 'audience'
       WHERE id = $1`,
      [game.id],
    );
  });
  return getState();
}

export async function endLifeline() {
  await withTransaction(async (q) => {
    const game = await latestGame(q);
    await q(`UPDATE game_state SET active_lifeline = NULL WHERE id = $1`, [game.id]);
  });
  return getState();
}

export async function hangUpPhone() {
  await query(
    `UPDATE game_state
     SET active_lifeline = NULL
     WHERE id = (
       SELECT id FROM game_state ORDER BY updated_at DESC LIMIT 1
     )
     AND active_lifeline = 'phone'`,
  );
  return getState();
}

export async function walkAway() {
  await withTransaction(async (q) => {
    const game = await latestGame(q);
    if (game.show_correct || game.current_level === 1) {
      throw new HttpError(409, 'Walk away is not available');
    }
    await q(
      `UPDATE game_state SET game_status = 'game_over', show_correct = true WHERE id = $1`,
      [game.id],
    );
  });
  return getState();
}

export async function resetGame() {
  await withTransaction(async (q) => {
    await q(`DELETE FROM game_state`);
    await q(`UPDATE trivia_questions SET is_used = false WHERE is_used = true`);
  });
  return getState();
}

export async function castVote(vote) {
  assertAnswer(vote);
  const current = await getState();
  const game = current.game;
  if (!game || game.game_status !== 'question_shown' || game.active_lifeline !== 'audience') {
    throw new HttpError(409, 'Audience voting is not open');
  }
  await query(
    `INSERT INTO audience_votes (game_state_id, vote) VALUES ($1, $2)`,
    [game.id, vote],
  );
  return getState();
}

export async function sendReaction(emoji) {
  if (!REACTIONS.includes(emoji)) throw new HttpError(400, 'Unknown reaction');
  const current = await getState();
  if (!current.game) throw new HttpError(409, 'No game is in progress');
  await query(
    `INSERT INTO emoji_reactions (game_state_id, emoji) VALUES ($1, $2)`,
    [current.game.id, emoji],
  );
  return getState();
}

export async function hostAction(action, body) {
  switch (action) {
    case 'ping':
      return getState();
    case 'start':
      return startGame();
    case 'select-answer':
      return selectAnswer(body.answer);
    case 'reveal':
      return revealAnswer();
    case 'next':
      return nextQuestion();
    case 'new-question':
      return replaceQuestion();
    case 'fifty':
      return useFifty();
    case 'phone':
      return usePhone();
    case 'audience':
      return useAudience();
    case 'end-lifeline':
      return endLifeline();
    case 'walk-away':
      return walkAway();
    case 'reset':
      return resetGame();
    default:
      throw new HttpError(400, 'Unknown host action');
  }
}
