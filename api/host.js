import { assertHost } from '../server/auth.js';
import { hostAction } from '../server/game.js';
import { errorResponse, json, readJson } from '../server/http.js';

export async function POST(request) {
  try {
    assertHost(request);
    const body = await readJson(request);
    return json(await hostAction(body.action, body));
  } catch (error) {
    return errorResponse(error);
  }
}
