import { beforeAll, describe, expect, test } from 'bun:test';

import { Table, initDatabase } from '..';
import { InferFromFields } from '../..';

const fields = {
  id: Table.number({ primaryKey: true, autoIncrement: true }),
  uid: Table.string({ maxLength: 200 }),
  gold: Table.number({ canBeNull: true, default: null }),
};

type Item = InferFromFields<typeof fields>;

const Items = Table.make<Item>({ name: 'regression_items', fields });

beforeAll(() => {
  initDatabase({ file: ':memory:' });
  Items.insert({ uid: 'AAA', gold: 1 });
  Items.insert({ uid: 'BBB', gold: 2 });
  Items.insert({ uid: 'CCC', gold: 3 });
});

describe('immutable builder', () => {
  test('regression: a non-terminated builder does not pollute later queries', () => {
    const partial = Items.where('uid', '=', 'AAA');
    void partial;

    const query = Items.where('uid', '=', 'BBB');

    expect(query.toSQL()).toBe(
      "SELECT * FROM `regression_items` WHERE `uid` = 'BBB';"
    );
    expect(query.findOne()?.uid).toBe('BBB');
  });

  test('branching: a shared base builder feeds independent branches', () => {
    const base = Items.where('gold', '>=', 1);

    expect(base.where('uid', '=', 'AAA').toSQL()).toBe(
      "SELECT * FROM `regression_items` WHERE `gold` >= 1 AND `uid` = 'AAA';"
    );
    expect(base.where('uid', '=', 'CCC').toSQL()).toBe(
      "SELECT * FROM `regression_items` WHERE `gold` >= 1 AND `uid` = 'CCC';"
    );
    expect(base.toSQL()).toBe(
      'SELECT * FROM `regression_items` WHERE `gold` >= 1;'
    );
  });

  test('reuse: the same builder produces the same SQL each time', () => {
    const query = Items.where('gold', '>=', 2).orderBy('gold', 'ASC');
    const expected =
      'SELECT * FROM `regression_items` WHERE `gold` >= 2 ORDER BY `gold` ASC;';

    expect(query.toSQL()).toBe(expected);
    expect(query.toSQL()).toBe(expected);
  });

  test('long chain: where().where().orderBy().limit()', () => {
    const query = Items.where('gold', '>=', 1)
      .where('uid', '!=', 'AAA')
      .orderBy('gold', 'DESC')
      .limit(1);

    expect(query.toSQL()).toBe(
      "SELECT * FROM `regression_items` WHERE `gold` >= 1 AND `uid` != 'AAA' ORDER BY `gold` DESC LIMIT 1;"
    );
  });

  test('immutability: setters do not mutate the source builder', () => {
    const root = Items.where('uid', '=', 'AAA');
    const expected =
      "SELECT * FROM `regression_items` WHERE `uid` = 'AAA';";

    // Returned builder is discarded — root must stay unchanged.
    root.where('uid', '=', 'XXX');
    root.orderBy('gold', 'DESC');
    root.limit(10);

    expect(root.toSQL()).toBe(expected);
  });
});

describe('logging options', () => {
  const captureLogs = <T>(run: () => T): { result: T; logs: string[] } => {
    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    };
    try {
      const result = run();
      return { result, logs };
    } finally {
      console.log = original;
    }
  };

  test('default: queries are logged with a ⚡ prefix', () => {
    const { logs } = captureLogs(() => Items.findAll());
    expect(logs.some((l) => l.startsWith('⚡'))).toBe(true);
  });

  test("option('no-log') silences logging for that query", () => {
    const { logs } = captureLogs(() => Items.option('no-log').findAll());
    expect(logs.filter((l) => l.startsWith('⚡'))).toEqual([]);
  });

  test("option('short-log') truncates long string parameters with 📦", () => {
    // String fields go through `?` placeholders — feed one long enough
    // to trigger truncation (>50 chars).
    const long = 'x'.repeat(200);
    const { logs } = captureLogs(() =>
      Items.where('uid', '=', long).option('short-log').findAll()
    );
    const queryLog = logs.find((l) => l.startsWith('⚡')) ?? '';
    expect(queryLog).toContain('📦');
    expect(queryLog).not.toContain(long);
  });
});
