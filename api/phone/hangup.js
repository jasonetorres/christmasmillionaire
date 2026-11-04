import { hangUpPhone } from '../../server/game.js';
import { errorResponse, json } from '../../server/http.js';

export async function POST() {
  try {
    return json(await hangUpPhone());
  } catch (error) {
    return errorResponse(error);
  }
}
