import { RawRow } from '../types';
import { AnyField, Fields } from './declaration';

function decode(value: unknown, field: AnyField) {
  if (value === null) {
    return null;
  }

  switch (field.type) {
    case 'boolean':
      return !!value;

    case 'integer':
      return parseInt(value as string, 10);

    case 'string':
      return `${value}`;

    case 'enumerated':
      return `${value}`;

    case 'datetime':
      return new Date(Date.parse(value as string));

    default:
      throw new Error('This can not happen.');
  }
}

function decodeRaw<TableType>(raw: RawRow, fields: Fields, tableName: string) {
  return Object.entries(fields).reduce((previous, [key, field]) => {
    if (!(key in raw)) {
      throw new Error(
        `Decode failed: column "${key}" is declared in the schema for table ` +
          `"${tableName}" but missing from the query result. The database may ` +
          `be out of sync with the declaration (forgotten ALTER TABLE, stale ` +
          `declaration file).`
      );
    }
    return { ...previous, [key]: decode(raw[key], field) };
  }, {}) as TableType;
}

export function decodeRaws<TableType>(
  rows: RawRow[],
  fields: Fields,
  tableName: string
) {
  return rows.map((row) => decodeRaw<TableType>(row, fields, tableName));
}
