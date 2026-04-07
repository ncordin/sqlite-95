import { handleRequest, initialize } from '..';

const password = '1234';

const SERVER_OPTIONS = {
  port: 8080,
  admin: {
    prefix: '/',
    password,
  },
};

Bun.serve({
  port: SERVER_OPTIONS.port,
  async fetch(request, server) {
    return handleRequest(request, server, SERVER_OPTIONS);
  },
});

initialize(SERVER_OPTIONS);
console.log(`  🔑  Admin password: ${password}`);
console.log('');
