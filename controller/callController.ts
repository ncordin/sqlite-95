import { BunFile, Server } from 'bun';
import { CORS_HEADERS } from './cors';
import { read } from './read';
import {
  ContentType,
  Controller,
  ControllerResponse,
  Method,
  Middleware,
} from './types';

function parseCookie(cookie: string) {
  return cookie
    .split(';')
    .map((part) => part.trim())
    .reduce((acc, current) => {
      const [name, value] = current.split('=').map((v) => v.trim());
      return { ...acc, [name]: value };
    }, {});
}

export async function callController(
  filePath: string,
  request: Request,
  server: Server,
  middleware: Middleware | undefined
) {
  const controllerModule = await import(filePath);

  if (typeof controllerModule.default !== 'function') {
    return new Response('Controller function must be default export.', {
      status: 500,
    });
  }

  const controller: Controller = controllerModule.default;
  // TODO: check if method matches.

  const url = new URL(request.url); // href, protocol, host, hostname, port, search
  const requestPath = url.pathname;
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const contentType = request.headers.get('content-type') || '';
  let body: Record<string, string | number | boolean | null | File> = {};

  // Used for file upload:
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    formData.forEach((value, key) => {
      body[key] = value as string | File;
    });
  }
  // All other request use JSON:
  else {
    const bodyText = await request.text();
    body = bodyText ? JSON.parse(bodyText) : {};
  }

  const controllerRequest = {
    url: String(request.url),
    path: requestPath,
    body,
    query,
    method: request.method as Method,
    headers: request.headers.toJSON(),
    requestIP: () => server?.requestIP(request) || null,
    read: (
      from: 'query' | 'body' | 'cookie',
      name: string,
      type: 'string' | 'number' | 'boolean' | 'file',
      defaultValue: unknown
    ) => {
      const source =
        from === 'query'
          ? query
          : from === 'body'
          ? body
          : parseCookie(request.headers.get('cookie') ?? '');
      const value = (source || {})[name];

      if (type === 'file') {
        return value instanceof File ? value : defaultValue;
      }
      if (type === 'boolean') {
        return read(value, 'boolean', defaultValue);
      }
      if (type === 'number') {
        return read(value, 'number', defaultValue);
      }
      if (type === 'string') {
        return read(value, 'string', defaultValue);
      }
    },
  };

  let responseCode = 200;
  let responseContentType: ContentType = 'json';
  let customerHeaders: [string, string][] = [];

  const controllerResponse: ControllerResponse = {
    setStatusCode: (code) => {
      responseCode = code;
    },
    setContentType: (type) => {
      responseContentType = type;
    },
    setCustomHeader: (name, value) => {
      customerHeaders.push([name, value]);
    },
    setCookie: (name, value, maxAge) => {
      customerHeaders.push([
        'Set-Cookie',
        `${name}=${value}; Max-Age=${maxAge}; Path=/`,
      ]);
    },
  };

  console.log(`🎯 ${request.method} ${requestPath}`);

  /**
   * Middleware TODO list:
   * - [!] allow to read request and respond in place of the controller.
   * - [!] accept one middleware.
   * - [ ] accept a list of middlewares.
   * - [ ] can be asynchrone
   *
   * Maybe not needed:
   * - [ ] can read and modify response. <- wrapResponse function can do the job.
   * - [ ] allow to edit request and pass data to the controller. <- wrapRequest function can do the job.
   * - [ ] has access to controller object in order to adapt behaviour. <- overkill.
   */
  if (middleware) {
    const middlewareResponse = middleware(
      controllerRequest,
      controllerResponse
    );

    if (middlewareResponse) {
      const response = new Response(JSON.stringify(middlewareResponse), {
        status: responseCode,
        headers: [...CORS_HEADERS, ['Content-Type', 'application/json']],
      });

      console.log(`🟠 ${responseCode} - Intercepted by middleware`);

      return response;
    }
  }

  return Promise.resolve(
    controller(controllerRequest, controllerResponse)
  ).then((value) => {
    console.log(`🟢 ${responseCode}`);

    switch (responseContentType) {
      case 'json':
        return new Response(JSON.stringify(value), {
          status: responseCode,
          headers: [
            ...CORS_HEADERS,
            ...customerHeaders,
            ['Content-Type', 'application/json'],
          ],
        });

      case 'html':
        return new Response(
          typeof value === 'string' ? value : JSON.stringify(value),
          {
            status: responseCode,
            headers: [
              ...CORS_HEADERS,
              ...customerHeaders,
              ['Content-Type', 'text/html; charset=utf-8'],
            ],
          }
        );

      case 'text':
        return new Response(
          typeof value === 'string' ? value : JSON.stringify(value),
          {
            status: responseCode,
            headers: [
              ...CORS_HEADERS,
              ...customerHeaders,
              ['Content-Type', 'text/plain'],
            ],
          }
        );

      case 'file':
        return new Response(value as BunFile, {
          headers: [...CORS_HEADERS, ...customerHeaders],
        });

      default:
        throw new Error('Impossible Content-Type');
    }
  });
}
