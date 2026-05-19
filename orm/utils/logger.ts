import { QueryOption } from '../types';

const MAX_PARAM_LENGTH = 50;

const injectParameters = (
  sql: string,
  parameters: string[],
  short: boolean
) => {
  const sqlSplit = sql.split('?');
  let sqlCool = sqlSplit[0];

  parameters.forEach((parameter, index) => {
    const display =
      short && parameter.length > MAX_PARAM_LENGTH ? '📦' : `'${parameter}'`;
    sqlCool += display + sqlSplit[index + 1];
  });

  return sqlCool;
};

export const logQuery = (
  sql: string,
  parameters: string[],
  options: ReadonlyArray<QueryOption>
) => {
  const short = options?.includes('short-log') ?? false;
  const silent = options?.includes('no-log') ?? false;

  if (!silent) {
    console.log(`⚡ ${injectParameters(sql, parameters, short)}`);
  }
};
