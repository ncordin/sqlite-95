import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';

import { Table, initDatabase } from '..';
import type { InferFromFields } from '../..';

const fields = {
  id: Table.number({ primaryKey: true, autoIncrement: true }),
  name: Table.string({ maxLength: 30 }),
  gold: Table.number({ canBeNull: true }),
  isCool: Table.boolean({ default: true }),
  state: Table.enumerated({ values: ['active', 'banned'] }),
  createdAt: Table.dateTime({ default: new Date() }),
};

type Player = InferFromFields<typeof fields>;
const Players = Table.make<Player>({ name: 'players_ops', fields }).option('no-log');

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
  // First query auto-creates the table; then we add a UNIQUE index so we
  // can exercise insertIfPossible.
  Players.count();
  Players.rawQuery(
    'CREATE UNIQUE INDEX idx_players_ops_name ON players_ops(name)',
    'write'
  );
});

beforeEach(() => {
  Players.rawQuery('DELETE FROM players_ops', 'write');
  seed();
});

describe('Select', () => {
  test('findAll returns every row', () => {
    const query = Players;

    expect(query.toSQL()).toBe('SELECT * FROM `players_ops` WHERE 1 = 1;');
    expect(query.findAll().length).toBe(3);
  });

  test('findOne returns a row or null', () => {
    const query = Players.where('name', '=', 'Alice');

    expect(query.toSQL()).toBe(
      "SELECT * FROM `players_ops` WHERE `name` = 'Alice';"
    );
    expect(query.findOne()?.name).toBe('Alice');
    expect(Players.where('name', '=', 'Nobody').findOne()).toBeNull();
  });

  test('stacked where clauses are combined with AND', () => {
    const query = Players.where('isCool', '=', true).where('gold', '>=', 100);

    expect(query.toSQL()).toBe(
      'SELECT * FROM `players_ops` WHERE `isCool` = 1 AND `gold` >= 100;'
    );
    expect(query.findAll().map((r) => r.name)).toEqual(['Alice']);
  });

  test('in filters with SQL IN', () => {
    const query = Players.in('state', ['active']);

    expect(query.toSQL()).toBe(
      "SELECT * FROM `players_ops` WHERE `state` IN ('active');"
    );
    expect(
      query
        .findAll()
        .map((r) => r.name)
        .sort()
    ).toEqual(['Alice', 'Bob']);
  });

  test('orderBy supports ASC, DESC, and stacking', () => {
    const query = Players.orderBy('isCool', 'DESC').orderBy('gold', 'ASC');

    expect(query.toSQL()).toBe(
      'SELECT * FROM `players_ops` WHERE 1 = 1 ORDER BY `isCool` DESC, `gold` ASC;'
    );
    // isCool=true (1) groups first, then gold ASC; Carol (isCool=false) last.
    expect(query.findAll().map((r) => r.name)).toEqual([
      'Bob',
      'Alice',
      'Carol',
    ]);
  });

  test('limit accepts quantity and optional offset', () => {
    expect(Players.orderBy('name', 'ASC').limit(1).toSQL()).toBe(
      'SELECT * FROM `players_ops` WHERE 1 = 1 ORDER BY `name` ASC LIMIT 1;'
    );
    expect(Players.orderBy('name', 'ASC').limit(1, 1).toSQL()).toBe(
      'SELECT * FROM `players_ops` WHERE 1 = 1 ORDER BY `name` ASC LIMIT 1 OFFSET 1;'
    );
    expect(Players.orderBy('name', 'ASC').limit(1, 1).findAll()[0]!.name).toBe(
      'Bob'
    );
  });

  test('= null and != null translate to IS / IS NOT NULL', () => {
    expect(Players.where('gold', '=', null).toSQL('count')).toBe(
      'SELECT COUNT(*) FROM `players_ops` WHERE `gold` IS null;'
    );
    expect(Players.where('gold', '=', null).count()).toBe(1);

    expect(Players.where('gold', '!=', null).toSQL('count')).toBe(
      'SELECT COUNT(*) FROM `players_ops` WHERE `gold` IS NOT null;'
    );
    expect(Players.where('gold', '!=', null).count()).toBe(2);
  });

  test('LIKE and NOT LIKE', () => {
    const query = Players.where('name', 'LIKE', 'A%');

    expect(query.toSQL()).toBe(
      "SELECT * FROM `players_ops` WHERE `name` LIKE 'A%';"
    );
    expect(query.findAll().map((r) => r.name)).toEqual(['Alice']);
    expect(Players.where('name', 'NOT LIKE', 'A%').count()).toBe(2);
  });

  test('every comparison operator works', () => {
    expect(Players.where('gold', '=', 100).count()).toBe(1);
    expect(Players.where('gold', '!=', 100).count()).toBe(1); // NULL excluded
    expect(Players.where('gold', '<', 100).count()).toBe(1);
    expect(Players.where('gold', '<=', 100).count()).toBe(2);
    expect(Players.where('gold', '>', 50).count()).toBe(1);
    expect(Players.where('gold', '>=', 50).count()).toBe(2);
  });
});

describe('Count', () => {
  test('count returns a number', () => {
    const query = Players.where('isCool', '=', true);

    expect(query.toSQL('count')).toBe(
      'SELECT COUNT(*) FROM `players_ops` WHERE `isCool` = 1;'
    );
    expect(query.count()).toBe(2);
  });
});

describe('Insert', () => {
  test('insert returns affectedRows and persists the row', () => {
    const result = Players.insert({
      name: 'Dave',
      gold: 200,
      isCool: true,
      state: 'active',
      createdAt: new Date(),
    });
    expect(result.affectedRows).toBe(1);
    expect(Players.where('name', '=', 'Dave').findOne()?.gold).toBe(200);
  });

  test('id is auto-assigned (omitted from Insertable)', () => {
    Players.insert({
      name: 'Eve',
      gold: 1,
      isCool: true,
      state: 'active',
      createdAt: new Date(),
    });
    const eve = Players.where('name', '=', 'Eve').findOne();
    expect(typeof eve?.id).toBe('number');
    expect(eve?.id).toBeGreaterThan(0);
  });

  test('insertIfPossible swallows UNIQUE conflicts', () => {
    // Alice already exists and `name` is UNIQUE.
    const result = Players.insertIfPossible({
      name: 'Alice',
      gold: 1,
      isCool: true,
      state: 'active',
      createdAt: new Date(),
    });
    expect(result.affectedRows).toBe(0);
    // Existing Alice is untouched.
    expect(Players.where('name', '=', 'Alice').findOne()?.gold).toBe(100);
  });
});

describe('Update', () => {
  test('set + update modifies matched rows', () => {
    const query = Players.set('gold', 999).where('name', '=', 'Alice');

    expect(query.toSQL('update')).toBe(
      "UPDATE `players_ops` SET `gold` = 999 WHERE `name` = 'Alice';"
    );
    expect(query.update().affectedRows).toBe(1);
    expect(Players.where('name', '=', 'Alice').findOne()?.gold).toBe(999);
  });

  test('multiple set clauses can be chained', () => {
    const query = Players.set('gold', 0)
      .set('isCool', false)
      .where('name', '=', 'Bob');

    expect(query.toSQL('update')).toBe(
      "UPDATE `players_ops` SET `gold` = 0, `isCool` = 0 WHERE `name` = 'Bob';"
    );
    query.update();

    const bob = Players.where('name', '=', 'Bob').findOne();
    expect(bob?.gold).toBe(0);
    expect(bob?.isCool).toBe(false);
  });

  test('increment adds a positive or negative delta', () => {
    const plus = Players.increment('gold', 10).where('name', '=', 'Alice');
    expect(plus.toSQL('update')).toBe(
      "UPDATE `players_ops` SET `gold` = `gold` + 10 WHERE `name` = 'Alice';"
    );
    plus.update();
    expect(Players.where('name', '=', 'Alice').findOne()?.gold).toBe(110);

    const minus = Players.increment('gold', -50).where('name', '=', 'Alice');
    expect(minus.toSQL('update')).toBe(
      "UPDATE `players_ops` SET `gold` = `gold` + -50 WHERE `name` = 'Alice';"
    );
    minus.update();
    expect(Players.where('name', '=', 'Alice').findOne()?.gold).toBe(60);
  });
});

describe('Delete', () => {
  test('remove deletes matched rows and returns affectedRows', () => {
    const query = Players.where('name', '=', 'Carol');

    expect(query.toSQL('remove')).toBe(
      "DELETE FROM `players_ops` WHERE `name` = 'Carol';"
    );
    expect(query.remove().affectedRows).toBe(1);
    expect(Players.where('name', '=', 'Carol').findOne()).toBeNull();
  });

  test('remove without where refuses to run', () => {
    expect(() => Players.remove()).toThrow(/Refused to flush/);
  });

  test('remove respects limit', () => {
    const query = Players.where('isCool', '=', true).limit(1);

    expect(query.toSQL('remove')).toBe(
      'DELETE FROM `players_ops` WHERE `isCool` = 1 LIMIT 1;'
    );
    query.remove();
    expect(Players.where('isCool', '=', true).count()).toBe(1);
  });
});

describe('Raw SQL', () => {
  test('rawSql injects a SQL expression as a value in update set', () => {
    const query = Players.set('gold', Players.rawSql('gold * 2')).where(
      'name',
      '=',
      'Alice'
    );

    expect(query.toSQL('update')).toBe(
      "UPDATE `players_ops` SET `gold` = gold * 2 WHERE `name` = 'Alice';"
    );
    query.update();
    expect(Players.where('name', '=', 'Alice').findOne()?.gold).toBe(200);
  });

  test('rawSql injects a SQL expression as a value in insert', () => {
    Players.insert({
      name: 'Bot',
      gold: Players.rawSql('10 + 20'),
      isCool: true,
      state: 'active',
      createdAt: new Date(),
    });
    expect(Players.where('name', '=', 'Bot').findOne()?.gold).toBe(30);
  });

  test("rawQuery 'read' returns rows", () => {
    const rows = Players.rawQuery(
      'SELECT COUNT(*) as c FROM players_ops',
      'read'
    );
    expect(parseInt(String(rows[0]!.c), 10)).toBe(3);
  });

  test("rawQuery 'write' returns affectedRows", () => {
    const rows = Players.rawQuery(
      "UPDATE players_ops SET gold = 0 WHERE name = 'Bob'",
      'write'
    );
    expect(rows[0]!.affectedRows).toBe('1');
    expect(Players.where('name', '=', 'Bob').findOne()?.gold).toBe(0);
  });
});
