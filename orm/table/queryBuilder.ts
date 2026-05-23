import { AnyField, Fields, resolveField } from '../fields/declaration';
import { encode, encodeName } from '../fields/encode';
import { ComparisonSymbol, Limit, OrderBy, Set, Value, Where } from '../types';

const OPERATORS: ComparisonSymbol[] = [
  '=',
  '!=',
  '<',
  '<=',
  '>',
  '>=',
  'LIKE',
  'NOT LIKE',
];

const escapeOperator = (
  operator: ComparisonSymbol,
  value: Value,
  values: Value[]
) => {
  if (OPERATORS.includes(operator) === false) {
    throw new Error(`Invalid comparison operator ${operator}`);
  }

  if (operator === '=' && values.length) {
    return 'IN';
  }

  if (value === null) {
    return operator === '=' ? 'IS' : 'IS NOT';
  }

  return operator;
};

export function makeWhere(
  fields: Fields,
  conditions: ReadonlyArray<Where>,
  parameters: string[],
  tableName: string
) {
  if (Object.keys(conditions).length === 0) {
    return '1 = 1';
  }

  return conditions
    .map(({ fieldName, comparison, value, values }) => {
      const field = resolveField(fields, fieldName, tableName);
      const escapedField = encodeName(fieldName);
      const escapedOperator = escapeOperator(comparison, value, values);
      let escapedValue = '';

      if (values.length) {
        const inValues = values
          .map((singleValue) => encode(singleValue, field, parameters))
          .join(', ');

        escapedValue = `(${inValues})`;
      } else {
        escapedValue = encode(value, field, parameters);
      }

      return `${escapedField} ${escapedOperator} ${escapedValue}`;
    })
    .join(' AND ');
}

export function makeOrders(orders: ReadonlyArray<OrderBy>) {
  if (Object.keys(orders).length === 0) {
    return '';
  }

  return (
    ` ORDER BY ` +
    orders
      .map(({ fieldName, direction }) => {
        const escapedField = encodeName(fieldName);
        const escapedDirection = direction === 'ASC' ? 'ASC' : 'DESC';

        return `${escapedField} ${escapedDirection}`;
      })
      .join(', ')
  );
}

export function makeLimit(limit: Limit | null) {
  if (limit === null) {
    return '';
  }

  if (limit.position === undefined) {
    return ` LIMIT ${limit.quantity}`;
  }

  return ` LIMIT ${limit.quantity} OFFSET ${limit.position}`;
}

export function makeSet(
  fields: Fields,
  data: ReadonlyArray<Set>,
  parameters: string[],
  tableName: string
) {
  return data
    .map(({ fieldName, value }) => {
      const field = resolveField(fields, fieldName, tableName);
      const escaped = encode(value, field, parameters);

      return `${encodeName(fieldName)} = ${escaped}`;
    })
    .join(', ');
}

function makeField(name: string, field: AnyField) {
  let sql = `"${name}" ${field.type}`;

  if (field.type === 'string' && field.maxLength) {
    sql = `${sql}(${field.maxLength})`;
  }

  if (field.primaryKey) {
    sql = `${sql} PRIMARY KEY`;
  }

  if (field.type === 'integer' && field.autoIncrement) {
    sql = `${sql} AUTOINCREMENT`;
  }

  if (field.canBeNull === false) {
    sql = `${sql} NOT NULL`;
  }

  if (field.default !== null) {
    sql = `${sql} DEFAULT ${encode(field.default, field, [], false)}`;
  }

  return sql;
}

function makeFields(fields: Fields) {
  return Object.entries(fields)
    .map(([name, field]) => makeField(name, field))
    .join(', ');
}

export function makeCreateTable(
  name: string,
  fields: Fields,
  unique: (string | string[])[],
  indexes: (string | string[])[]
): string[] {
  const table = encodeName(name);
  const statements: string[] = [
    `CREATE TABLE ${table} (${makeFields(fields)});`,
  ];

  for (const entry of unique) {
    const cols = (Array.isArray(entry) ? entry : [entry])
      .map((col) => encodeName(col))
      .join(', ');
    statements.push(
      `CREATE UNIQUE INDEX \`idx_${name}_${String(entry)}\` ON ${table} (${cols});`
    );
  }

  for (const entry of indexes) {
    const cols = (Array.isArray(entry) ? entry : [entry])
      .map((col) => encodeName(col))
      .join(', ');
    statements.push(
      `CREATE INDEX \`idx_${name}_${String(entry)}\` ON ${table} (${cols});`
    );
  }

  return statements;
}
