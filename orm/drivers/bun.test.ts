import { beforeAll, expect, test } from 'bun:test';
import { initDatabase, queryGet, queryRun } from '.';

beforeAll(() => {
  initDatabase({ file: './test.db' });
});

test('queryGet returns the answer', () => {
  expect(
    queryGet({
      sql: 'SELECT 42 as answer;',
      parameters: [],
      name: 'fakeTable',
      fields: {},
      options: [],
    })
  ).toEqual([
    {
      answer: 42,
    },
  ]);
});

test('queryRun returns affected rows', () => {
  expect(
    queryRun({
      sql: 'SELECT DATE();',
      parameters: [],
      name: 'fakeTable',
      fields: {},
      options: [],
    })
  ).toEqual({ affectedRows: 0 });
});
