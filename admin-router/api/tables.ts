import Database from 'bun:sqlite';

import type { Controller } from '../../controller/types';
import { getError } from '../../orm/utils/error';
import { getDatabase } from '../utils';

const countLines = (database: Database, tableName: string) => {
  const result = database
    .query<{ 'COUNT(*)': number }, null>(`SELECT COUNT(*) FROM "${tableName}"`)
    .get(null);

  return result ? result['COUNT(*)'] : 0;
};

const removeQuotes = (string: string) => {
  for (const quote of ['"', "'", '`']) {
    if (string.startsWith(quote) && string.endsWith(quote)) {
      return string.slice(1, -1);
    }
  }

  return string;
};

const getStructure = (database: Database, tableName: string) => {
  const infos = database.query(`PRAGMA table_info('${tableName}')`).all();

  return infos.map((tableInfo: any) => ({
    name: tableInfo.name,
    type: tableInfo.type,
    canBeNull: !tableInfo.notnull,
    defaultValue: tableInfo.dflt_value && removeQuotes(tableInfo.dflt_value),
    isPrimaryKey: !!tableInfo.pk,
  }));
};

const getTables = (database: Database) => {
  const tables = database
    .query(
      "SELECT * FROM sqlite_master WHERE `type`='table' AND name NOT LIKE 'sqlite_%' ORDER BY `name` ASC;"
    )
    .all();

  return tables.map((table: any) => ({
    name: table.name,
    lines: countLines(database, table.name),
    structure: getStructure(database, table.name),
    describe: table.sql,
  }));
};

const controller: Controller = (request) => {
  try {
    const database = getDatabase(request.headers.database?.toString() || '');
    const tables = getTables(database);

    return tables;
  } catch (e) {
    const error = getError(e);
    return { error: { message: error.message } };
  }
};

export default controller;
