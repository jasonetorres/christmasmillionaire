import { timingSafeEqual } from 'node:crypto';
import { HttpError } from './http.js';

export function assertHost(request) {
  const expected = process.env.HOST_CODE || '';
  if (!expected) {
    throw new HttpError(503, 'HOST_CODE is not set');
  }

  const provided = request.headers.get('x-host-code') || '';
  const actual = Buffer.from(provided);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) {
    throw new HttpError(401, 'Host code was rejected');
  }
}
