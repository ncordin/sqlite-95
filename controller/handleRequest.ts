import { dirname, join } from 'node:path';
import { cwd } from 'node:process';
import { callController } from './callController';
import { HandleRequestOptions } from './types';
import { CORS_HEADERS } from './cors';
import { make404, serveStaticFile, useIndex, displayPath } from './utils/http';
import { recordRequest } from './monitoring';
import { resolvePaths } from './utils/paths';
import { Server } from 'bun';

const ROOT_PATH = cwd();
const IS_ADMIN = Bun.main.includes('admin-router/start.ts');
const LIB_PATH = IS_ADMIN
  ? ROOT_PATH
  : join(ROOT_PATH, '/node_modules/sqlite-95');

export const handleRequest = async (
  request: Request,
  server: Server<undefined>,
  options: HandleRequestOptions
) => {
  recordRequest();

  const paths = resolvePaths(options);
  const requestPath = new URL(request.url).pathname;

  // Est-ce que ca ne concerne pas QUE l'api?
  // Est-ce qu'on veut traiter TOUTES les requêtes meme si elles matchent rien ?
  if (request.method === 'OPTIONS') {
    console.log(`🔍 OPTIONS ${requestPath}`);
    return new Response('Departed', { headers: CORS_HEADERS });
  }

  // Handle admin:
  if (options.admin && requestPath.startsWith(paths.adminPrefix)) {
    const shortPath = requestPath.slice(paths.adminPrefix.length);

    if (shortPath.startsWith('api/')) {
      if (
        options.admin.password &&
        options.admin.password === request.headers.get('password')
      ) {
        // TODO: the admin logic could be a middleware!
        const routeFile = join(LIB_PATH, '/admin-router', `${shortPath}.ts`);
        return callController(routeFile, request, server, undefined);
      } else {
        return new Response(
          JSON.stringify({
            error: {
              title: 'Invalid password',
              message:
                'The password is set in the server configuration and cannot be empty.',
            },
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const assetPath = useIndex(shortPath, 'index.html');
    const assetFile = join(LIB_PATH, '/admin-webapp/public', assetPath);
    return serveStaticFile(assetFile, 'admin asset');
  }

  // Handle assets:
  if (
    paths.assetsDirectory &&
    requestPath.startsWith(paths.assetsPrefix) &&
    request.method === 'GET'
  ) {
    const shortPath = requestPath.slice(paths.assetsPrefix.length);
    const assetPath = useIndex(shortPath, 'index.html');
    const assetFile = join(paths.assetsDirectory, assetPath);

    return serveStaticFile(assetFile, `asset`);
  }

  // Handle API:
  if (
    options.controllers &&
    paths.controllersDirectory &&
    requestPath.startsWith(paths.appPrefix)
  ) {
    const shortPath = requestPath.slice(paths.appPrefix.length);
    const controllerPath = useIndex(shortPath, 'index');
    const controllerFile = join(
      paths.controllersDirectory,
      `${controllerPath}.ts`
    );

    if (await Bun.file(controllerFile).exists()) {
      return callController(
        controllerFile,
        request,
        server,
        options.controllers.middleware
      );
    } else {
      console.log(`⚠️  Controller file missed! ${controllerFile}`);
    }
  }

  // CatchAll:
  if (
    options.catchAll &&
    options.catchAll.type === 'controller' &&
    paths.catchAllFile
  ) {
    return callController(
      paths.catchAllFile,
      request,
      server,
      options.controllers?.middleware
    );
  }

  if (
    options.catchAll &&
    options.catchAll.type === 'static' &&
    paths.catchAllFile
  ) {
    return serveStaticFile(
      paths.catchAllFile,
      `catch-all static ${displayPath(requestPath)}`
    );
  }

  return make404('final', requestPath);
};
