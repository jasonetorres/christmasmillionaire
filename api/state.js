import { getState } from '../server/game.js';
import { errorResponse, json } from '../server/http.js';

export async function GET() {
  try {
    return json(await getState());
  } catch (error) {
    return errorResponse(error);
  }
}
