# Queries

All examples use this table:

```ts
import { Table, initDatabase } from 'sqlite-95';
import type { InferFromFields } from 'sqlite-95';

initDatabase({ file: 'app.db' });

const fields = {
  id: Table.number({ primaryKey: true, autoIncrement: true }),
  name: Table.string({ maxLength: 30 }),
  gold: Table.number({ canBeNull: true }),
  isCool: Table.boolean({ default: true }),
  state: Table.enumerated({ values: ['active', 'banned'] }),
  createdAt: Table.dateTime({ default: new Date() }),
};

type Player = InferFromFields<typeof fields>;
export const Players = Table.make<Player>({ name: 'players', fields });
```

A query is a chain of clauses (`where`, `in`, `set`, `increment`, `orderBy`, `limit`, `option`) that ends with an **action** (`findAll`, `findOne`, `insert`, `update`, `remove`, `count`). Each clause returns a **new immutable builder** — the original is never mutated. Actions execute SQL and return data; they don't alter the builder either.

## Select

```ts
Players.findAll();                          // all rows
Players.where('id', '=', 42).findOne();     // one row or null
Players.where('gold', '>', 100).findAll();  // filtered
```

Stack `where` for AND, use `in` for IN, `orderBy` and `limit` to paginate:

```ts
Players
  .where('isCool', '=', true)
  .where('gold', '>=', 10)
  .in('state', ['active', 'banned'])
  .orderBy('gold', 'DESC')
  .orderBy('createdAt', 'ASC')
  .limit(20, 40)              // 20 rows, offset 40
  .findAll();
```

NULL is handled automatically (`= null` becomes `IS NULL`):

```ts
Players.where('gold', '=', null).findAll();
Players.where('gold', '!=', null).count();
```

LIKE / NOT LIKE:

```ts
Players.where('name', 'LIKE', 'Co%').findAll();
```

Operators: `=`, `!=`, `<`, `<=`, `>`, `>=`, `LIKE`, `NOT LIKE`.

## Count

```ts
Players.where('isCool', '=', true).count();   // number
```

## Insert

`id` is omitted (auto). Returns `{ affectedRows }`.

```ts
Players.insert({
  name: 'Coco',
  gold: 50,
  isCool: true,
  state: 'active',
  createdAt: new Date(),
});
```

`insertIfPossible` swallows UNIQUE conflicts and returns `{ affectedRows: 0 }`:

```ts
Players.insertIfPossible({ name: 'Coco', /* ... */ });
```

## Update

Chain `set` (and `where` to scope — without `where` it updates everything).

```ts
Players
  .set('name', 'Coca')
  .set('isCool', false)
  .where('id', '=', 7)
  .update();
```

`increment` for numeric deltas:

```ts
Players.increment('gold', 10).where('id', '=', 7).update();
Players.increment('gold', -5).where('id', '=', 7).update();
```

## Delete

`remove` **requires** at least one `where` (safety against accidental flush).

```ts
Players.where('id', '=', 7).remove();
Players.where('gold', '<', 10).limit(50).remove();
```

## Raw SQL

Use `rawSql` to pass a SQL expression as a value (not a parameter):

```ts
Players.insert({
  name: 'Bot',
  gold: Players.rawSql('10 + 10'),     // evaluated by SQLite
  /* ... */
});

Players
  .set('gold', Players.rawSql('gold * 2'))
  .where('isCool', '=', true)
  .update();
```

Use `rawQuery` for arbitrary SQL when the builder is not enough:

```ts
Players.rawQuery('SELECT name, COUNT(*) FROM players GROUP BY name', 'read');
Players.rawQuery('VACUUM;', 'write');
```

## Logging

Each query is logged. Silence or shorten per-call with `option`:

```ts
Players.option('no-log').findAll();
Players.option('short-log').where('id', '=', 1).findOne();
```

Available options: `'no-log'`, `'short-log'`.

## Immutability, reuse & branching

Builders are immutable — calling a clause returns a brand new builder. The original is untouched, which means partial builders are safe to share, reuse, and fork.

**Reuse the same builder multiple times:**

```ts
const cool = Players.where('isCool', '=', true);

const richCool = cool.where('gold', '>=', 100).findAll();
const poorCool = cool.where('gold', '<', 10).findAll();
const totalCool = cool.count();
// `cool` itself is unchanged after each call.
```

**Conditional branching is safe:**

```ts
let query = Players.where('state', '=', 'active');

if (filterByGold) {
  query = query.where('gold', '>=', minGold);
}
if (sortNewestFirst) {
  query = query.orderBy('createdAt', 'DESC');
}

return query.findAll();
```

> Earlier versions used a mutable singleton: a non-terminated chain (e.g. `Players.where(...)` whose terminal call was skipped by a branch) would leak its `where` clauses into the next query on the same table. That whole class of bugs is gone.

## Introspection: `toSQL`

Get the SQL a builder would execute, with parameters inlined. Useful for tests and debugging — **not** safe for execution (no escaping).

```ts
const query = Players
  .where('isCool', '=', true)
  .where('gold', '>=', 10)
  .orderBy('gold', 'DESC')
  .limit(5);

query.toSQL();
// SELECT * FROM `players` WHERE `isCool` = 1 AND `gold` >= 10 ORDER BY `gold` DESC LIMIT 5;
```

Pass a `kind` to inspect another terminal form built on the same state:

```ts
const target = Players.where('id', '=', 7);

target.toSQL();           // SELECT * FROM `players` WHERE `id` = 7;
target.toSQL('count');    // SELECT COUNT(*) FROM `players` WHERE `id` = 7;
target.toSQL('remove');   // DELETE FROM `players` WHERE `id` = 7;

Players.set('gold', 0).where('id', '=', 7).toSQL('update');
// UPDATE `players` SET `gold` = 0 WHERE `id` = 7;
```

Available kinds: `'find'` (default), `'count'`, `'update'`, `'remove'`. `insert` is not covered — its SQL is derived from the data argument, not from builder state.
