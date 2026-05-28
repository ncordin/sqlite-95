# sqlite-95

A tiny, typed SQLite ORM for [Bun](https://bun.sh) — with a built-in web admin to browse and edit your tables.

- Fluent, immutable query builder
- TypeScript types inferred from your schema
- Minimal HTTP controller layer
- Web admin out of the box
- No runtime dependencies besides Bun

## Install

```sh
bun add sqlite-95
```

Requires Bun ≥ 1.0. Not compatible with Node.

## Quick start

```ts
import { Table, initDatabase } from 'sqlite-95';
import type { InferFromFields } from 'sqlite-95';

initDatabase({ file: 'app.db' });

const fields = {
  id: Table.number({ primaryKey: true, autoIncrement: true }),
  name: Table.string({ maxLength: 30 }),
  gold: Table.number({ canBeNull: true }),
  isCool: Table.boolean({ default: true }),
};

type Player = InferFromFields<typeof fields>;
const Players = Table.make<Player>({ name: 'players', fields });

Players.insert({ name: 'Coco', gold: 50, isCool: true });

const cool = Players.where('isCool', '=', true)
  .where('gold', '>=', 10)
  .orderBy('gold', 'DESC')
  .findAll();
```

## Documentation

- [Queries](./docs/queries.md) — `findAll`, `findOne`, `insert`, `update`, `remove`, `count`, `rawSql`, immutability, `toSQL` introspection.
- [Controllers](./docs/controllers.md) — JSON / HTML / text / file responses, redirects, cookies, headers, middleware.

> Reading from `node_modules`? The same docs ship inside the package — `cat node_modules/sqlite-95/docs/queries.md` — or browse them on [GitHub](https://github.com/ncordin/sqlite-95/tree/main/docs).

## Running in production

1. Create a `.env` file based on the template.
2. Start with pm2:

   ```sh
   pm2 start src/index.ts
   ```

3. Put Nginx in front for HTTPS.

If you can't use a config file, pass values as env vars:

```sh
PORT=3300 BASE_PATH=/sqlite-admin pm2 \
  start --node-args "--es-module-specifier-resolution=node" \
  server/index.js --name sqlite-admin
```

## License

MIT
