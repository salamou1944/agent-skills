import { spawn } from 'node:child_process';

const publicPort = Number(process.env.PORT || 8789);
const root = new URL('./', import.meta.url);
const children = [];
let shuttingDown = false;

function start(script, env) {
  const child = spawn(process.execPath, [new URL(script, root).pathname], {
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: false,
  });
  children.push(child);
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(JSON.stringify({ service: script, event: 'exit', code, signal }));
      shutdown(code || 1);
    }
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(code), 1000).unref();
}

start('./server.mjs', { PORT: '8790' });
start('./operator-api.mjs', { EASY_OPERATOR_PORT: '8792', EASY_OPERATOR_BIND: '127.0.0.1' });
start('./gateway.mjs', {
  GATEWAY_PORT: String(publicPort),
  EASY_PLATFORM_URL: 'http://127.0.0.1:8790',
  EASY_OPERATOR_URL: 'http://127.0.0.1:8792',
});

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
console.log(JSON.stringify({ service: 'easy-runtime', publicPort, platformPort: 8790, operatorPort: 8792 }));
