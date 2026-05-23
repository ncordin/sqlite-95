# Controllers

A controller is a function that receives a `request` and a `response` builder, and returns data that the framework turns into an HTTP response.

```ts
export default function (request, response) {
  return { hello: 'world' };
}
```

---

## JSON (default)

Return any object, array, string, number, or `null`. The framework serializes it and sets `Content-Type: application/json`.

```ts
export default function () {
  return { id: 1, name: 'Coco' };
}
```

Set a custom status code:

```ts
export default function (request, response) {
  response.setStatusCode(201);
  return { created: true };
}
```

---

## HTML

```ts
export default function (request, response) {
  response.setContentType('html');
  return '<h1>Hello</h1>';
}
```

---

## Plain text

```ts
export default function (request, response) {
  response.setContentType('text');
  return 'Just some text';
}
```

---

## File

Return a `BunFile` directly (useful for downloads or images).

```ts
import { file } from 'bun';

export default function () {
  return file('./uploads/avatar.png');
}
```

---

## Redirect

Trigger a redirect with an empty body. Defaults to **302**.

```ts
export default function (request, response) {
  response.redirect('/login');
}
```

Permanent redirect (301):

```ts
export default function (request, response) {
  response.redirect('/new-path', 301);
}
```

---

## Raw Response

If you need full control (custom headers, cookies + redirect, streaming, etc.), return a native `Response` object.

```ts
export default function () {
  return new Response('Unauthorized', { status: 401 });
}
```

Redirect with a native Response:

```ts
export default function () {
  return new Response(null, {
    status: 302,
    headers: { Location: '/dashboard' },
  });
}
```

---

## Cookies

```ts
export default function (request, response) {
  response.setCookie('session', 'abc123', 3600); // name, value, maxAge (seconds)
  return { ok: true };
}
```

---

## Custom headers

```ts
export default function (request, response) {
  response.setCustomHeader('X-Rate-Limit', '100');
  return { ok: true };
}
```

---

## Middleware

Controllers can be protected by a single middleware defined globally in the server config:

```ts
// server.ts
controllers: {
  path: './app/controllers',
  cors: '*',
  middleware: (request, response) => {
    if (request.path.startsWith('/admin')) {
      response.setStatusCode(403);
      return { error: 'Forbidden' };
    }
  },
}
```

Return nothing (`undefined`) to let the request proceed to the controller. Return data to intercept it early. You can also return a raw `Response` from the middleware.

---

## Quick reference

| What you want | How to do it |
|---|---|
| JSON | `return { … }` (default) |
| HTML | `response.setContentType('html')` + `return '<h1>…</h1>'` |
| Text | `response.setContentType('text')` + `return '…'` |
| File | `return file('./path')` |
| Redirect | `response.redirect('/url', 302)` |
| Raw Response | `return new Response(…)` |
| Custom status | `response.setStatusCode(418)` |
| Set cookie | `response.setCookie('name', 'val', 3600)` |
| Custom header | `response.setCustomHeader('X-Thing', '1')` |
