import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';

import { Table, initDatabase } from '..';
import { InferFromFields } from '../..';

const fields = {
  id: Table.number({ primaryKey: true, autoIncrement: true }),
  name: Table.string({ maxLength: 30 }),
  gold: Table.number({ canBeNull: true }),
  isCool: Table.boolean({ default: true }),
  state: Table.enumerated({ values: ['active', 'banned'] }),
  createdAt: Table.dateTime({ default: new Date() }),
};

type Player = InferFromFields<typeof fields>;
const Players = Table.make<Player>({ name: 'players_safety', fields });

const seed = () => {
  Players.insert({
    name: 'Alice',
    gold: 100,
    isCool: true,
    state: 'active',
    createdAt: new Date('2024-01-01T00:00:00'),
  });
  Players.insert({
    name: 'Bob',
    gold: 50,
    isCool: true,
    state: 'active',
    createdAt: new Date('2024-02-01T00:00:00'),
  });
  Players.insert({
    name: 'Carol',
    gold: null,
    isCool: false,
    state: 'banned',
    createdAt: new Date('2024-03-01T00:00:00'),
  });
};

beforeAll(() => {
  initDatabase({ file: ':memory:' });
  Players.count();
});

beforeEach(() => {
  Players.rawQuery('DELETE FROM players_safety', 'write');
  seed();
});

const tableStillHasSeed = () => {
  expect(Players.count()).toBe(3);
  expect(Players.where('name', '=', 'Alice').findOne()?.gold).toBe(100);
  expect(Players.where('name', '=', 'Bob').findOne()?.gold).toBe(50);
};

describe('increment() — numeric coercion guard', () => {
  test('rejects non-numeric values', () => {
    const injections = [
      '1; DROP TABLE players_safety; --',
      '1 OR 1=1',
      "1'); DELETE FROM players_safety; --",
      NaN,
      Infinity,
      -Infinity,
      null,
      undefined,
      {},
      '10',
    ];

    for (const evil of injections) {
      expect(() =>
        Players.increment('gold', evil as unknown as number)
      ).toThrow(/finite number/);
    }

    tableStillHasSeed();
  });
});

describe('limit() — integer coercion guard', () => {
  test('rejects non-integer quantity and position', () => {
    const evilNumbers = [
      '1; DROP TABLE players_safety; --',
      '1 UNION SELECT 1',
      '1 OR 1=1',
      1.5,
      -1,
      NaN,
      Infinity,
      null,
      {},
      '10',
    ];

    for (const evil of evilNumbers) {
      expect(() => Players.limit(evil as unknown as number)).toThrow(
        /quantity must be a non-negative integer/
      );
      expect(() => Players.limit(1, evil as unknown as number)).toThrow(
        /position must be a non-negative integer/
      );
    }
    // `undefined` is the legitimate sentinel for "no offset" — must pass.
    expect(() => Players.limit(1, undefined).findAll()).not.toThrow();
    tableStillHasSeed();
  });
});

describe('Parameterized value paths', () => {
  // Payloads kept ≤ 30 chars to stay within field.maxLength on `name` — the
  // separate string-truncation bug (see BUGS.md "Critique 1") would
  // otherwise mask verbatim-storage assertions in insert/set tests.
  const PAYLOADS = [
    "'; DROP TABLE t; --",
    "' OR '1'='1",
    "x'); DELETE; --",
    "' UNION SELECT 1--",
    "Alice' OR 1=1 --",
    "\\\"; DROP --",
  ];

  test('where() treats malicious string values as data, not SQL', () => {
    for (const payload of PAYLOADS) {
      expect(Players.where('name', '=', payload).findOne()).toBeNull();
    }
    tableStillHasSeed();
  });

  test('where() with LIKE treats wildcards inside the payload as data', () => {
    for (const payload of PAYLOADS) {
      expect(Players.where('name', 'LIKE', payload).count()).toBe(0);
    }
    tableStillHasSeed();
  });

  test('in() parameterizes every value in the list', () => {
    expect(Players.in('name', PAYLOADS).count()).toBe(0);
    expect(Players.in('name', [...PAYLOADS, 'Alice']).count()).toBe(1);
    tableStillHasSeed();
  });

  test('insert() stores malicious strings verbatim', () => {
    for (const payload of PAYLOADS) {
      Players.insert({
        name: payload,
        gold: 1,
        isCool: false,
        state: 'active',
        createdAt: new Date('2024-04-01T00:00:00'),
      });
      expect(Players.where('name', '=', payload).findOne()?.name).toBe(payload);
    }
    expect(Players.count()).toBe(3 + PAYLOADS.length);
  });

  test('set().update() stores malicious strings verbatim', () => {
    for (const payload of PAYLOADS) {
      Players.set('name', payload).where('name', '=', 'Alice').update();
      expect(Players.where('name', '=', payload).findOne()?.name).toBe(payload);
      Players.set('name', 'Alice').where('name', '=', payload).update();
    }
    tableStillHasSeed();
  });

  test('remove() with a malicious where value deletes nothing', () => {
    for (const payload of PAYLOADS) {
      expect(
        Players.where('name', '=', payload).remove().affectedRows
      ).toBe(0);
    }
    tableStillHasSeed();
  });

  test('count() with a malicious where value returns zero', () => {
    for (const payload of PAYLOADS) {
      expect(Players.where('name', '=', payload).count()).toBe(0);
    }
    tableStillHasSeed();
  });
});

describe('Operator allowlist', () => {
  test('where() rejects unknown comparison operators', () => {
    const evilOperators = [
      'DROP TABLE players_safety; --',
      '= 1 OR 1=1 --',
      'IS NOT NULL; DELETE FROM players_safety; --',
    ];

    for (const op of evilOperators) {
      expect(() =>
        Players.where('name', op as never, 'Alice').findAll()
      ).toThrow(/Invalid comparison operator/);
    }
    tableStillHasSeed();
  });
});

describe('String overflow warning', () => {
  test('encode warns when value exceeds field.maxLength', () => {
    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map((a) => String(a)).join(' '));
    };

    try {
      // `name` has maxLength 30 — push a 50-char value.
      const longName = 'A'.repeat(50);
      Players.insert({
        name: longName,
        gold: 1,
        isCool: true,
        state: 'active',
        createdAt: new Date('2024-06-01T00:00:00'),
      });

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toMatch(/truncated/);
      expect(warnings[0]).toMatch(/maxLength 30/);
      expect(warnings[0]).toMatch(/length 50/);
    } finally {
      console.warn = originalWarn;
    }
  });

  test('encode stays silent when value fits within maxLength', () => {
    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map((a) => String(a)).join(' '));
    };

    try {
      Players.where('name', '=', 'Alice').findOne();
      expect(warnings.length).toBe(0);
    } finally {
      console.warn = originalWarn;
    }
  });
});

describe('Schema/declaration sync guard', () => {
  // When a column name is not declared in the TS schema (forgotten ALTER
  // TABLE, stale declaration file, typo), accessing `fields[fieldName]`
  // used to return undefined and crash deep inside encode() with an opaque
  // "Cannot read properties of undefined" error. The resolver must throw
  // an actionable message naming the field and table.
  const ERR = /Unknown field "ghost" on table "players_safety"/;

  test('where() throws a clear error for an unknown field', () => {
    expect(() =>
      Players.where('ghost' as never, '=', 'x' as never).findAll()
    ).toThrow(ERR);
    expect(() =>
      Players.where('ghost' as never, '=', 'x' as never).count()
    ).toThrow(ERR);
    expect(() =>
      Players.where('ghost' as never, '=', 'x' as never).remove()
    ).toThrow(ERR);
  });

  test('in() throws a clear error for an unknown field', () => {
    expect(() =>
      Players.in('ghost' as never, ['x'] as never).findAll()
    ).toThrow(ERR);
  });

  test('set() throws a clear error for an unknown field on update', () => {
    expect(() =>
      Players.set('ghost' as never, 'x' as never)
        .where('name', '=', 'Alice')
        .update()
    ).toThrow(ERR);
  });

  test('insert() throws a clear error for an unknown field', () => {
    expect(() =>
      Players.insert({
        name: 'Dave',
        gold: 10,
        isCool: true,
        state: 'active',
        createdAt: new Date('2024-05-01T00:00:00'),
        ghost: 'x',
      } as never)
    ).toThrow(ERR);
  });
});

describe('Schema/declaration sync guard — missing DB column', () => {
  // The TS schema declares a column that the underlying DB table does not
  // have (forgotten ALTER TABLE, stale declaration). SELECT * cannot return
  // the column, so the raw row is missing the key. decode used to silently
  // return `undefined` typed as the field's declared type — a typed lie that
  // crashed deep in consumer code. The decoder must throw with an actionable
  // message naming the field and table.
  const ghostFields = {
    id: Table.number({ primaryKey: true, autoIncrement: true }),
    name: Table.string({ maxLength: 30 }),
    gold: Table.number({ canBeNull: true }),
    isCool: Table.boolean({ default: true }),
    state: Table.enumerated({ values: ['active', 'banned'] }),
    createdAt: Table.dateTime({ default: new Date() }),
    ghost: Table.string({ maxLength: 10, canBeNull: true }),
  };
  type GhostPlayer = InferFromFields<typeof ghostFields>;
  const GhostPlayers = Table.make<GhostPlayer>({
    name: 'players_safety',
    fields: ghostFields,
  });

  const ERR =
    /Decode failed: column "ghost" is declared in the schema for table "players_safety" but missing from the query result/;

  test('findAll() throws when a declared column is absent from the row', () => {
    expect(() => GhostPlayers.findAll()).toThrow(ERR);
    tableStillHasSeed();
  });

  test('findOne() throws when a declared column is absent from the row', () => {
    expect(() => GhostPlayers.where('name', '=', 'Alice').findOne()).toThrow(
      ERR
    );
    tableStillHasSeed();
  });
});
