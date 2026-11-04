export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function json(body, status = 200) {
  return Response.json(body, { status });
}

export function errorResponse(error) {
  const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  return json({ error: error.message || 'Request failed' }, status);
}

export async function readJson(request) {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Request body must be JSON');
  }
}
