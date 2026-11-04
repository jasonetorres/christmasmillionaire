import { createServer } from 'node:http';
import { loadEnv } from './load-env.mjs';
import { GET as getState } from '../api/state.js';
import { POST as postHost } from '../api/host.js';
import { POST as postVote } from '../api/votes.js';
import { POST as postReaction } from '../api/reactions.js';
import { POST as postHangup } from '../api/phone/hangup.js';
import { POST as postSanta } from '../api/santa-chat.js';

loadEnv();

const routes = new Map([
  ['GET /api/state', getState],
  ['POST /api/host', postHost],
  ['POST /api/votes', postVote],
  ['POST /api/reactions', postReaction],
  ['POST /api/phone/hangup', postHangup],
  ['POST /api/santa-chat', postSanta],
]);

function toRequest(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => {
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
        else if (value != null) headers.set(key, value);
      }
      const url = new URL(req.url, 'http://127.0.0.1');
      const method = req.method || 'GET';
      const body = method === 'GET' || method === 'HEAD' ? undefined : Buffer.concat(chunks);
      resolve(new Request(url, { method, headers, body }));
    });
  });
}

const port = Number(process.env.API_PORT || 3001);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const handler = routes.get(`${req.method} ${url.pathname}`);
    if (!handler) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    const response = await handler(await toRequest(req));
    const headers = Object.fromEntries(response.headers.entries());
    res.writeHead(response.status, headers);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Request failed' }));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`API listening on http://127.0.0.1:${port}`);
});
