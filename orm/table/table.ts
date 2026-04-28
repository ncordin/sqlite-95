import { queryRun, queryGet } from '../drivers';
import { makeLimit, makeOrders, makeSet, makeWhere } from './queryBuilder';
import {
  ComparisonSymbol,
  Insertable,
  Limit,
  OrderBy,
  QueryOption,
  RawRow,
  RawSQL,
  Set,
  Value,
  Where,
  WriteResult,
} from '../types';
import { Fields } from '../fields/declaration';
import { encode, encodeName, getAndFlushParameters } from '../fields/encode';
import { decodeRaws } from '../fields/decode';
import { getError } from '../utils/error';

type DeclarationOptions = {
  name: string;
  fields: Fields;
};

type NumberFieldName<TableType> = {
  [Field in keyof TableType]: TableType[Field] extends number ? Field : never;
}[keyof TableType];

export type TableInstance<TableType> = {
  // Internal states:
  sets: Array<Set>;
  wheres: Array<Where>;
  orders: Array<OrderBy>;
  limitState: Limit | null;
  options: Array<QueryOption>;
  clearState: () => void;

  // Setters:
  option: (optionName: QueryOption) => TableInstance<TableType>;
  set: <Field extends keyof TableType>(
    fieldName: Field,
    value: TableType[Field] | RawSQL
  ) => TableInstance<TableType>;
  increment: <Field extends NumberFieldName<TableType>>(
    fieldName: Field,
    value: number
  ) => TableInstance<TableType>;
  where: <Field extends keyof TableType>(
    fieldName: Field,
    operator: ComparisonSymbol,
    value: TableType[Field] | RawSQL
  ) => TableInstance<TableType>;
  in: <Field extends keyof TableType>(
    fieldName: Field,
    values: TableType[Field][] | RawSQL
  ) => TableInstance<TableType>;
  orderBy: <Field extends keyof TableType>(
    fieldName: Field,
    direction: 'ASC' | 'DESC'
  ) => TableInstance<TableType>;
  limit: (quantity: number, position?: number) => TableInstance<TableType>;

  // Action:
  findAll: () => TableType[];
  findOne: () => TableType | null;
  insert: (data: Insertable<TableType>) => WriteResult;
  insertIfPossible: (data: Insertable<TableType>) => WriteResult;
  remove: () => WriteResult;
  update: () => WriteResult;
  count: () => number;
  rawSql: (sql: string) => RawSQL;
  rawQuery: (sql: string, mode: 'read') => RawRow[];
};

export const declareTable = <TableType>({
  name,
  fields,
}: DeclarationOptions): TableInstance<TableType> => ({
  sets: [],
  wheres: [],
  orders: [],
  limitState: null,
  options: [],

  option: function (optionName) {
    this.options.push(optionName);
    return this;
  },

  /**
   * Set
   */
  set: function (fieldName, value) {
    const newSet: Set = {
      fieldName: String(fieldName),
      value: value as Value,
    };
    this.sets.push(newSet);
    return this;
  },

  /**
   * Increment
   */
  increment: function (fieldName, value) {
    const escapedField = encodeName(String(fieldName));
    this.sets.push({
      fieldName: String(fieldName),
      value: { _SQL: `${escapedField} + ${value}` },
    });
    return this;
  },

  /**
   * Where
   */
  where: function (fieldName, comparison, value) {
    const newWhere: Where = {
      fieldName: String(fieldName),
      comparison,
      value: value as Value,
      values: [],
    };
    this.wheres.push(newWhere);
    return this;
  },

  /**
   * In
   */
  in: function (fieldName, values) {
    const newWhere: Where = {
      fieldName: String(fieldName),
      comparison: '=',
      value: null,
      values: values as Value[],
    };
    this.wheres.push(newWhere);
    return this;
  },

  /**
   * Order By
   */
  orderBy: function (fieldName, direction) {
    this.orders.push({
      fieldName: String(fieldName),
      direction,
    });

    return this;
  },

  /**
   * Limit
   */
  limit: function (quantity, position) {
    this.limitState = { quantity, position };

    return this;
  },

  /**
   * FindAll
   */
  findAll: function () {
    const condition = makeWhere(name, fields, this.wheres);
    const orders = makeOrders(name, fields, this.orders);
    const limit = makeLimit(name, fields, this.limitState);

    const sql = `SELECT * FROM ${encodeName(
      name
    )} WHERE ${condition}${orders}${limit};`;
    const parameters = getAndFlushParameters();

    const options = this.options;
    this.clearState();

    const rows = queryGet({ sql, parameters, name, fields, options });

    return decodeRaws<TableType>(rows, fields);
  },

  /**
   * FindOne
   */
  findOne: function () {
    const rows = this.limit(1).findAll();

    return rows.length ? rows[0] : null;
  },

  /**
   * Insert
   */
  insert: function (data: Insertable<TableType>) {
    const fieldNames = Object.keys(data)
      .map((field) => encodeName(field))
      .join(', ');

    const values = Object.entries(data)
      .map(([field, value]) => encode(value as Value, fields[field]))
      .join(', ');

    const sql = `INSERT INTO ${encodeName(
      name
    )} (${fieldNames}) VALUES (${values});`;

    const parameters = getAndFlushParameters();
    const options = this.options;
    this.clearState();
    return queryRun({ sql, parameters, name, fields, options });
  },

  insertIfPossible: function (data: Insertable<TableType>) {
    try {
      return this.insert(data);
    } catch (e) {
      const error = getError(e);

      if (error.message.startsWith('UNIQUE constraint failed')) {
        return { affectedRows: 0 };
      }

      throw error;
    }
  },

  /**
   * Remove
   */
  remove: function () {
    if (this.wheres.length === 0) {
      throw new Error('Refused to flush the table to avoid disaster.');
    }

    const condition = makeWhere(name, fields, this.wheres);
    const limit = makeLimit(name, fields, this.limitState);

    const sql = `DELETE FROM ${encodeName(name)} WHERE ${condition}${limit};`;

    const parameters = getAndFlushParameters();
    const options = this.options;
    this.clearState();

    return queryRun({ sql, parameters, name, fields, options });
  },

  /**
   * Update
   */
  update: function () {
    const set = makeSet(name, fields, this.sets);
    const condition = makeWhere(name, fields, this.wheres);
    const limit = makeLimit(name, fields, this.limitState);

    const sql = `UPDATE ${encodeName(
      name
    )} SET ${set} WHERE ${condition}${limit};`;

    const parameters = getAndFlushParameters();
    const options = this.options;
    this.clearState();

    return queryRun({ sql, parameters, name, fields, options });
  },

  /**
   * Count
   */
  count: function () {
    const condition = makeWhere(name, fields, this.wheres);
    const sql = `SELECT COUNT(*) FROM ${encodeName(name)} WHERE ${condition};`;
    const parameters = getAndFlushParameters();
    const options = this.options;
    this.clearState();

    const rows = queryGet({ sql, parameters, name, fields, options });

    return parseInt(rows[0]['COUNT(*)'], 10);
  },

  /**
   * Pass raw Sql values:
   */
  rawSql: function (sqlString: string) {
    return { _SQL: sqlString };
  },

  /**
   * Execute raw Sql queries:
   */
  rawQuery: function (sql: string, mode: 'read' | 'write') {
    if (mode === 'read') {
      return queryGet({ sql, parameters: [], name, fields, options: [] });
    }

    const writeResult = queryRun({
      sql,
      parameters: [],
      name,
      fields,
      options: [],
    });
    return [{ affectedRows: writeResult.affectedRows.toString() }];
  },

  clearState: function () {
    this.sets = [];
    this.wheres = [];
    this.orders = [];
    this.limitState = null;
    this.options = [];
  },
});
