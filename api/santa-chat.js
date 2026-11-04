import { santaChat } from '../server/santa.js';
import { errorResponse, json, readJson } from '../server/http.js';

export async function POST(request) {
  try {
    const body = await readJson(request);
    return json(await santaChat(body));
  } catch (error) {
    return errorResponse(error);
  }
}
