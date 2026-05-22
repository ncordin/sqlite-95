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
import { Fields, resolveField } from '../fields/declaration';
import { encode, encodeName } from '../fields/encode';
import { decodeRaws } from '../fields/decode';
import { getError } from '../utils/error';

type ConstraintEntry<TableType> = (keyof TableType & string) | (keyof TableType & string)[];

type DeclarationOptions<TableType> = {
  name: string;
  fields: Fields;
  unique?: ConstraintEntry<TableType>[];
  indexes?: ConstraintEntry<TableType>[];
};

type NumberFieldName<TableType> = {
  [Field in keyof TableType]: TableType[Field] extends number | null
    ? Field
    : never;
}[keyof TableType];

export type TableInstance<TableType> = {
  // Internal states (read-only — each builder is immutable):
  readonly sets: ReadonlyArray<Set>;
  readonly wheres: ReadonlyArray<Where>;
  readonly orders: ReadonlyArray<OrderBy>;
  readonly limitState: Limit | null;
  readonly options: ReadonlyArray<QueryOption>;

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
  rawQuery: (sql: string, mode: 'read' | 'write') => RawRow[];

  // Introspection — returns the SQL the builder would run, with parameters
  // inlined. For debugging and tests, not for execution. Default is the
  // SELECT form (used by `findAll`); pass a kind to inspect a different
  // operation built on the same state.
  toSQL: (kind?: 'find' | 'count' | 'update' | 'remove') => string;
};

const inlineParameters = (sql: string, parameters: string[]): string => {
  const parts = sql.split('?');
  return parameters.reduce(
    (acc, param, index) => acc + `'${param}'` + parts[index + 1],
    parts[0]
  );
};

type BuilderState = {
  sets: ReadonlyArray<Set>;
  wheres: ReadonlyArray<Where>;
  orders: ReadonlyArray<OrderBy>;
  limitState: Limit | null;
  options: ReadonlyArray<QueryOption>;
};

const EMPTY_STATE: BuilderState = {
  sets: [],
  wheres: [],
  orders: [],
  limitState: null,
  options: [],
};

function createBuilder<TableType>(
  name: string,
  fields: Fields,
  state: BuilderState,
  unique: ConstraintEntry<TableType>[],
  indexes: ConstraintEntry<TableType>[]
): TableInstance<TableType> {
  const { sets, wheres, orders, limitState, options } = state;

  const next = (patch: Partial<BuilderState>): TableInstance<TableType> =>
    createBuilder<TableType>(name, fields, { ...state, ...patch }, unique, indexes);

  const insertFn = (data: Insertable<TableType>): WriteResult => {
    const parameters: string[] = [];

    const fieldNames = Object.keys(data)
      .map((field) => encodeName(field))
      .join(', ');

    const values = Object.entries(data)
      .map(([fieldName, value]) =>
        encode(
          value as Value,
          resolveField(fields, fieldName, name),
          parameters
        )
      )
      .join(', ');

    const sql = `INSERT INTO ${encodeName(
      name
    )} (${fieldNames}) VALUES (${values});`;

    return queryRun({ sql, parameters, name, fields, options, unique, indexes });
  };

  return {
    sets,
    wheres,
    orders,
    limitState,
    options,

    option: (optionName) => next({ options: [...options, optionName] }),

    /**
     * Set
     */
    set: (fieldName, value) =>
      next({
        sets: [
          ...sets,
          { fieldName: String(fieldName), value: value as Value },
        ],
      }),

    /**
     * Increment
     */
    increment: (fieldName, value) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(
          `increment() requires a finite number, got ${String(value)}.`
        );
      }
      const escapedField = encodeName(String(fieldName));
      return next({
        sets: [
          ...sets,
          {
            fieldName: String(fieldName),
            value: { _SQL: `${escapedField} + ${value}` },
          },
        ],
      });
    },

    /**
     * Where
     */
    where: (fieldName, comparison, value) =>
      next({
        wheres: [
          ...wheres,
          {
            fieldName: String(fieldName),
            comparison,
            value: value as Value,
            values: [],
          },
        ],
      }),

    /**
     * In
     */
    in: (fieldName, values) =>
      next({
        wheres: [
          ...wheres,
          {
            fieldName: String(fieldName),
            comparison: '=',
            value: null,
            values: values as Value[],
          },
        ],
      }),

    /**
     * Order By
     */
    orderBy: (fieldName, direction) =>
      next({
        orders: [...orders, { fieldName: String(fieldName), direction }],
      }),

    /**
     * Limit
     */
    limit: (quantity, position) => {
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new Error(
          `limit() quantity must be a non-negative integer, got ${String(quantity)}.`
        );
      }
      if (
        position !== undefined &&
        (!Number.isInteger(position) || position < 0)
      ) {
        throw new Error(
          `limit() position must be a non-negative integer, got ${String(position)}.`
        );
      }
      return next({ limitState: { quantity, position } });
    },

    /**
     * FindAll
     */
    findAll: () => {
      const parameters: string[] = [];
      const condition = makeWhere(fields, wheres, parameters, name);
      const ordersSql = makeOrders(orders);
      const limit = makeLimit(limitState);

      const sql = `SELECT * FROM ${encodeName(
        name
      )} WHERE ${condition}${ordersSql}${limit};`;

      const rows = queryGet({ sql, parameters, name, fields, options, unique, indexes });

      return decodeRaws<TableType>(rows, fields, name);
    },

    /**
     * FindOne
     */
    findOne: () => {
      const limited = createBuilder<TableType>(name, fields, {
        ...state,
        limitState: { quantity: 1 },
      }, unique, indexes);
      const rows = limited.findAll();

      return rows.length ? rows[0] : null;
    },

    /**
     * Insert
     */
    insert: insertFn,

    insertIfPossible: (data) => {
      try {
        return insertFn(data);
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
    remove: () => {
      if (wheres.length === 0) {
        throw new Error('Refused to flush the table to avoid disaster.');
      }

      const parameters: string[] = [];
      const condition = makeWhere(fields, wheres, parameters, name);
      const limit = makeLimit(limitState);

      const sql = `DELETE FROM ${encodeName(name)} WHERE ${condition}${limit};`;

      return queryRun({ sql, parameters, name, fields, options, unique, indexes });
    },

    /**
     * Update
     */
    update: () => {
      const parameters: string[] = [];
      const set = makeSet(fields, sets, parameters, name);
      const condition = makeWhere(fields, wheres, parameters, name);
      const limit = makeLimit(limitState);

      const sql = `UPDATE ${encodeName(
        name
      )} SET ${set} WHERE ${condition}${limit};`;

      return queryRun({ sql, parameters, name, fields, options, unique, indexes });
    },

    /**
     * Count
     */
    count: () => {
      const parameters: string[] = [];
      const condition = makeWhere(fields, wheres, parameters, name);
      const sql = `SELECT COUNT(*) FROM ${encodeName(name)} WHERE ${condition};`;

      const rows = queryGet({ sql, parameters, name, fields, options, unique, indexes });

      return parseInt(String(rows[0]['COUNT(*)']), 10);
    },

    /**
     * Pass raw Sql values:
     */
    rawSql: (sqlString: string) => ({ _SQL: sqlString }),

    /**
     * Returns the SQL the builder would execute, with parameters inlined.
     * Intended for tests and debugging — never feed this back into the
     * driver (no escaping). `kind` picks which terminal form to render:
     *   - 'find' (default): SELECT *
     *   - 'count':          SELECT COUNT(*)
     *   - 'update':         UPDATE ... SET ...
     *   - 'remove':         DELETE FROM ...
     */
    toSQL: (kind: 'find' | 'count' | 'update' | 'remove' = 'find'): string => {
      const parameters: string[] = [];
      const condition = makeWhere(fields, wheres, parameters, name);
      const limit = makeLimit(limitState);
      const table = encodeName(name);

      let sql: string;
      switch (kind) {
        case 'find': {
          const ordersSql = makeOrders(orders);
          sql = `SELECT * FROM ${table} WHERE ${condition}${ordersSql}${limit};`;
          break;
        }
        case 'count':
          sql = `SELECT COUNT(*) FROM ${table} WHERE ${condition};`;
          break;
        case 'update': {
          const set = makeSet(fields, sets, parameters, name);
          sql = `UPDATE ${table} SET ${set} WHERE ${condition}${limit};`;
          break;
        }
        case 'remove':
          sql = `DELETE FROM ${table} WHERE ${condition}${limit};`;
          break;
      }

      return inlineParameters(sql, parameters);
    },

    /**
     * Execute raw Sql queries:
     */
    rawQuery: (sql: string, mode: 'read' | 'write') => {
      if (mode === 'read') {
        return queryGet({ sql, parameters: [], name, fields, options, unique, indexes });
      }

      const writeResult = queryRun({
        sql,
        parameters: [],
        name,
        fields,
        options,
        unique,
        indexes,
      });
      return [{ affectedRows: writeResult.affectedRows.toString() }];
    },
  };
}

export const TABLE_REGISTRY = new Map<string, DeclarationOptions<any>>();

export const declareTable = <TableType>(
  options: DeclarationOptions<TableType>
): TableInstance<TableType> => {
  TABLE_REGISTRY.set(options.name, options);
  return createBuilder<TableType>(
    options.name,
    options.fields,
    EMPTY_STATE,
    options.unique || [],
    options.indexes || []
  );
};
