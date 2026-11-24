import { HttpError } from './http.js';
import { query } from './db.js';

const ALLOWED_EMOJI = new Set(['👏', '😮', '🤔', '😱', '🎉', '❤️', '🔥', '👍', '🎄', '🎅', '⛄', '🎁', '⭐', '🎊', '🤶', '🦌']);
const ALLOWED_SOUNDS = new Set(['bell', 'applause', 'drumroll', 'cheer']);

export async function listStreamEvents() {
  return query(
    `SELECT id, event_type, value, created_at
     FROM stream_overlay_events
     WHERE created_at > now() - interval '30 seconds'
     ORDER BY created_at ASC
     LIMIT 100`,
  );
}

export async function createStreamEvent({ type, value, actorKey }) {
  if (typeof actorKey !== 'string' || !/^[a-zA-Z0-9-]{12,80}$/.test(actorKey)) {
    throw new HttpError(400, 'A valid session is required');
  }
  if (!['emoji', 'message', 'sound'].includes(type)) throw new HttpError(400, 'Unknown stream event');
  if (type === 'emoji' && !ALLOWED_EMOJI.has(value)) throw new HttpError(400, 'Choose an available reaction');
  if (type === 'sound' && !ALLOWED_SOUNDS.has(value)) throw new HttpError(400, 'Choose an available sound');
  if (type === 'message' && (typeof value !== 'string' || !value.trim() || value.trim().length > 120)) {
    throw new HttpError(400, 'Messages must be between 1 and 120 characters');
  }

  const recent = await query(
    `SELECT id FROM stream_overlay_events
     WHERE actor_key = $1 AND created_at > now() - interval '1200 milliseconds'
     LIMIT 1`,
    [actorKey],
  );
  if (recent.length) throw new HttpError(429, 'Give it a second before sending another item');

  const cleanValue = type === 'message' ? value.trim() : value;
  const rows = await query(
    `INSERT INTO stream_overlay_events (event_type, value, actor_key)
     VALUES ($1, $2, $3)
     RETURNING id, event_type, value, created_at`,
    [type, cleanValue, actorKey],
  );
  await query(`DELETE FROM stream_overlay_events WHERE created_at < now() - interval '2 days'`);
  return rows[0];
}
