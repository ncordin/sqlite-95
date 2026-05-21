import { beforeAll, describe, expect, test } from 'bun:test';

import { Table, initDatabase } from '..';
import { InferFromFields } from '../..';

const fields = {
  id: Table.number({ primaryKey: true, autoIncrement: true }),
  uid: Table.string({ maxLength: 200 }),
  gold: Table.number({ canBeNull: true, default: null }),
};

type Item = InferFromFields<typeof fields>;
const Items = Table.make<Item>({ name: 'regression_items', fields }).option(
  'no-log'
);

beforeAll(() => {
  initDatabase({ file: ':memory:' });
  Items.insert({ uid: 'AAA', gold: 1 });
  Items.insert({ uid: 'BBB', gold: 2 });
  Items.insert({ uid: 'CCC', gold: 3 });
});

describe('Immutability', () => {
  test('builder does not pollute later queries', () => {
    const partial = Items.where('uid', '=', 'AAA');
    void partial;
    const query = Items.where('uid', '=', 'BBB');
    expect(query.toSQL()).toBe(
      "SELECT * FROM `regression_items` WHERE `uid` = 'BBB';"
    );
    expect(query.findOne()?.uid).toBe('BBB');
  });

  test('shared base feeds independent branches', () => {
    const base = Items.where('gold', '>=', 1);
    expect(base.where('uid', '=', 'AAA').toSQL()).toBe(
      "SELECT * FROM `regression_items` WHERE `gold` >= 1 AND `uid` = 'AAA';"
    );
    expect(base.where('uid', '=', 'CCC').toSQL()).toBe(
      "SELECT * FROM `regression_items` WHERE `gold` >= 1 AND `uid` = 'CCC';"
    );
  });

  test('builder produces same SQL each time', () => {
    const query = Items.where('gold', '>=', 2).orderBy('gold', 'ASC');
    const sql =
      'SELECT * FROM `regression_items` WHERE `gold` >= 2 ORDER BY `gold` ASC;';
    expect(query.toSQL()).toBe(sql);
    expect(query.toSQL()).toBe(sql);
  });

  test('long chain: where/orderBy/limit', () => {
    const query = Items.where('gold', '>=', 1)
      .where('uid', '!=', 'AAA')
      .orderBy('gold', 'DESC')
      .limit(1);
    expect(query.toSQL()).toBe(
      "SELECT * FROM `regression_items` WHERE `gold` >= 1 AND `uid` != 'AAA' ORDER BY `gold` DESC LIMIT 1;"
    );
  });

  test('setters do not mutate source', () => {
    const root = Items.where('uid', '=', 'AAA');
    root.where('uid', '=', 'XXX').orderBy('gold', 'DESC').limit(10);
    expect(root.toSQL()).toBe(
      "SELECT * FROM `regression_items` WHERE `uid` = 'AAA';"
    );
  });
});
