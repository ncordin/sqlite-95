import { handleRequest } from '..';

const port = 8080;
const prefix = '/';
const password = '1234';

const SERVER_OPTIONS = {
  admin: {
    prefix,
    password,
  },
};

const server = Bun.serve({
  port,
  async fetch(request, server) {
    return handleRequest(request, server, SERVER_OPTIONS);
  },
});

console.log('');
console.log(`SQLite 95 local admin ready! ✨`);
console.log('');
console.log(`http://${server.hostname}:${port}${prefix}`);

console.log('');

console.log(`🔑 Admin password: ${password}`);

console.log('');
