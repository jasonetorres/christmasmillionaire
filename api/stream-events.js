import { assertHost } from '../server/auth.js';
import { createStreamEvent, listStreamEvents } from '../server/stream-events.js';
import { errorResponse, json, readJson } from '../server/http.js';

export async function GET() {
  try {
    return json({ events: await listStreamEvents() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request) {
  try {
    const body = await readJson(request);
    if (body.type === 'message' || body.type === 'sound') assertHost(request);
    const event = await createStreamEvent({
      type: body.type,
      value: body.value,
      actorKey: body.actorKey,
    });
    return json({ event }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
