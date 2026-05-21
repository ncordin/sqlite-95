import { beforeAll, expect, test } from 'bun:test';
import { number, string } from '../fields/declaration';
import { initDatabase, queryGet, queryRun } from '.';

beforeAll(() => {
  initDatabase({ file: ':memory:' });
});

test('initDatabase returns sqlite version', () => {
  const { version } = initDatabase({ file: ':memory:' });
  expect(version).toBeString();
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});

test('queryGet returns the answer', () => {
  expect(
    queryGet({
      sql: 'SELECT 42 as answer;',
      parameters: [],
      name: 'fakeTable',
      fields: {},
      options: ['no-log'],
    })
  ).toEqual([
    {
      answer: 42,
    },
  ]);
});

test('queryGet works with parameters', () => {
  expect(
    queryGet({
      sql: 'SELECT ? as val, ? as text;',
      parameters: ['99', 'hello'],
      name: 'fakeTable',
      fields: {},
      options: ['no-log'],
    })
  ).toEqual([
    {
      val: '99',
      text: 'hello',
    },
  ]);
});

test('queryGet auto-creates table on no such table error', () => {
  const fields = {
    id: number({ primaryKey: true, autoIncrement: true }),
    name: string({ maxLength: 100 }),
  };

  const result = queryGet({
    sql: 'SELECT * FROM "users";',
    parameters: [],
    name: 'users',
    fields,
    options: ['no-log'],
  });

  expect(result).toEqual([]);
});

test('queryGet returns data after table auto-creation', () => {
  const fields = {
    id: number({ primaryKey: true, autoIncrement: true }),
    name: string({ maxLength: 100 }),
  };

  queryRun({
    sql: 'INSERT INTO "players" ("name") VALUES (?);',
    parameters: ['Alice'],
    name: 'players',
    fields,
    options: ['no-log'],
  });

  const result = queryGet({
    sql: 'SELECT * FROM "players";',
    parameters: [],
    name: 'players',
    fields,
    options: ['no-log'],
  });

  expect(result).toEqual([{ id: 1, name: 'Alice' }]);
});

test('queryRun returns affected rows for CREATE TABLE', () => {
  const result = queryRun({
    sql: 'CREATE TABLE "items" ("label" STRING(50) NOT NULL);',
    parameters: [],
    name: 'items',
    fields: {},
    options: ['no-log'],
  });

  expect(result).toEqual({ affectedRows: 1 });
});

test('queryRun returns affected rows for INSERT with data', () => {
  const fields = {
    id: number({ primaryKey: true, autoIncrement: true }),
    label: string({ maxLength: 50 }),
  };

  let result = queryRun({
    sql: 'INSERT INTO "products" ("label") VALUES (?);',
    parameters: ['Widget'],
    name: 'products',
    fields,
    options: ['no-log'],
  });

  expect(result).toEqual({ affectedRows: 1 });

  result = queryRun({
    sql: 'INSERT INTO "products" ("label") VALUES (?), (?), (?);',
    parameters: ['A', 'B', 'C'],
    name: 'products',
    fields,
    options: ['no-log'],
  });

  expect(result).toEqual({ affectedRows: 3 });
});

test('queryRun returns affected rows for UPDATE', () => {
  const fields = {
    id: number({ primaryKey: true, autoIncrement: true }),
    value: number({}),
  };

  queryRun({
    sql: 'INSERT INTO "scores" ("value") VALUES (?), (?), (?);',
    parameters: ['10', '20', '30'],
    name: 'scores',
    fields,
    options: ['no-log'],
  });

  const result = queryRun({
    sql: 'UPDATE "scores" SET "value" = ? WHERE "value" > ?;',
    parameters: ['99', '15'],
    name: 'scores',
    fields,
    options: ['no-log'],
  });

  expect(result).toEqual({ affectedRows: 2 });
});

test('queryRun returns affected rows for DELETE', () => {
  const fields = {
    id: number({ primaryKey: true, autoIncrement: true }),
    value: number({}),
  };

  queryRun({
    sql: 'INSERT INTO "logs" ("value") VALUES (?), (?), (?);',
    parameters: ['1', '2', '3'],
    name: 'logs',
    fields,
    options: ['no-log'],
  });

  const result = queryRun({
    sql: 'DELETE FROM "logs" WHERE "value" > ?;',
    parameters: ['1'],
    name: 'logs',
    fields,
    options: ['no-log'],
  });

  expect(result).toEqual({ affectedRows: 2 });
});

test('queryRun auto-creates table on no such table error', () => {
  const fields = {
    id: number({ primaryKey: true, autoIncrement: true }),
    title: string({ maxLength: 200 }),
  };

  const result = queryRun({
    sql: 'INSERT INTO "posts" ("title") VALUES (?);',
    parameters: ['Hello'],
    name: 'posts',
    fields,
    options: ['no-log'],
  });

  expect(result).toEqual({ affectedRows: 1 });
});

test('queryGet throws on invalid SQL', () => {
  expect(() =>
    queryGet({
      sql: 'SELECTT 1;',
      parameters: [],
      name: 'fakeTable',
      fields: {},
      options: ['no-log'],
    })
  ).toThrow();
});

test('queryRun throws on invalid SQL', () => {
  expect(() =>
    queryRun({
      sql: 'UPSERT INTO x VALUES (1);',
      parameters: [],
      name: 'fakeTable',
      fields: {},
      options: ['no-log'],
    })
  ).toThrow();
});
