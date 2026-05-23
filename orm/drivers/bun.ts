import { Database } from 'bun:sqlite';

import { Fields } from '../fields/declaration';
import { makeCreateTable } from '../table/queryBuilder';
import { DatabaseConfiguration, RawRow, WriteResult } from '../types';
import type { QueryOption } from '../types';
import { getError } from '../utils/error';
import { logQuery } from '../utils/logger';

let database: Database | null = null;

const NO_SUCH_TABLE = 'no such table: ';

type QueryOptions = {
  sql: string;
  parameters: string[];
  name: string;
  fields: Fields;
  options: ReadonlyArray<QueryOption>;
  unique?: (string | string[])[];
  indexes?: (string | string[])[];
  recursive?: boolean;
};

export const initDatabase = function (config: DatabaseConfiguration) {
  database = new Database(config.file);

  const rows = database
    .query<{ version: string }, null>('SELECT sqlite_version() AS version;')
    .all(null);

  const firstRow = rows[0];
  if (firstRow === undefined) {
    throw new Error('Failed to retrieve SQLite version.');
  }

  return { version: firstRow.version };
};

export const queryGet = ({
  sql,
  parameters,
  name,
  fields,
  options,
  unique = [],
  indexes = [],
  recursive,
}: QueryOptions): RawRow[] => {
  logQuery(sql, parameters, options);

  if (!database) {
    throw new Error('Query failed, connection is not ready. ' + sql);
  }

  try {
    return database.query<RawRow, string[]>(sql).all(...parameters);
  } catch (e) {
    const error = getError(e);

    if (error.message.startsWith(NO_SUCH_TABLE) && !recursive) {
      const createTableQueries = makeCreateTable(name, fields, unique, indexes);

      for (const createTable of createTableQueries) {
        logQuery(createTable, [], options);
        database.query(createTable).run();
      }

      return queryGet({
        sql,
        parameters,
        name,
        fields,
        options,
        unique,
        indexes,
        recursive: true,
      });
    }

    throw new Error(error.message);
  }
};

export const queryRun = ({
  sql,
  parameters,
  name,
  fields,
  recursive,
  options,
  unique = [],
  indexes = [],
}: QueryOptions): WriteResult => {
  logQuery(sql, parameters, options);

  if (!database) {
    throw new Error('Query failed, connection is not ready. ' + sql);
  }

  try {
    database.query(sql).run(...parameters);

    const result = database.query('SELECT CHANGES() as `changes`;').get() as {
      changes: number;
    };

    return {
      affectedRows: result.changes,
    };
  } catch (e) {
    const error = getError(e);

    if (error.message.startsWith(NO_SUCH_TABLE) && !recursive) {
      const createTableQueries = makeCreateTable(name, fields, unique, indexes);

      for (const createTable of createTableQueries) {
        logQuery(createTable, [], options);
        database.query(createTable).run();
      }

      return queryRun({
        sql,
        parameters,
        name,
        fields,
        options,
        unique,
        indexes,
        recursive: true,
      });
    }

    throw new Error(error.message);
  }
};
