import Database from 'bun:sqlite';
import { Controller } from '../../controller/types';
import { getError } from '../../orm/utils/error';
import { getDatabase } from '../utils';

const executeSql = (
  database: Database,
  query: string,
  params: string[] = []
) => {
  const lowerSql = query.trim().toLowerCase();

  if (lowerSql.startsWith('select ') || lowerSql.startsWith('pragma ')) {
    return database.query(query).all(...params);
  } else {
    database.query(query).run(...params);
    const result = database.query('SELECT CHANGES() as `changes`;').get() as {
      changes: number;
    };
    return [{ affectedRows: result.changes }];
  }
};

const controller: Controller = (request, response) => {
  const params = request.body.params as unknown as string[];

  try {
    const database = getDatabase(String(request.headers.database));
    const start = Bun.nanoseconds();

    const data = executeSql(
      database,
      String(request.body.query),
      params
    ) as Array<{
      [key: string]: string;
    }>;

    const durationInMs = (Bun.nanoseconds() - start) / 1000000;
    const duration = Math.round(durationInMs * 100) / 100;

    response.setStatusCode(202);
    return { data, duration };
  } catch (e) {
    const error = getError(e);

    return { error: { title: 'SQL error!', message: error.message } };
  }
};

export default controller;
