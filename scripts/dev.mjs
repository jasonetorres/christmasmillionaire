import { spawn } from 'node:child_process';
import { loadEnv } from './load-env.mjs';

loadEnv();

const children = [
  spawn(process.execPath, ['scripts/api-server.mjs'], { stdio: 'inherit', env: process.env }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit', env: process.env }),
];

function stop() {
  for (const child of children) child.kill('SIGTERM');
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stop();
      process.exit(code);
    }
  });
}
