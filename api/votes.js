import { castVote } from '../server/game.js';
import { errorResponse, json, readJson } from '../server/http.js';

export async function POST(request) {
  try {
    const body = await readJson(request);
    return json(await castVote(body.vote));
  } catch (error) {
    return errorResponse(error);
  }
}
