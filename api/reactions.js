import { sendReaction } from '../server/game.js';
import { errorResponse, json, readJson } from '../server/http.js';

export async function POST(request) {
  try {
    const body = await readJson(request);
    return json(await sendReaction(body.emoji));
  } catch (error) {
    return errorResponse(error);
  }
}
