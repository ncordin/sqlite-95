export function escapeFieldName(name) {
  return `\`${name}\``;
}

export function escapeValue(value) {
  if (value === null) {
    return 'NULL';
  }

  const escaped = `${value}`.split(`'`).join(`''`);
  return `'${escaped}'`;
}

function makeAssignment(field, value) {
  if (value === null) {
    return `${escapeFieldName(field)} = NULL`;
  }

  return `${escapeFieldName(field)} = ${escapeValue(value)}`;
}

export function makeSet(row) {
  return Object.keys(row)
    .filter((key) => key !== 'rowid')
    .map((key) => makeAssignment(key, row[key]))
    .join(', ');
}

function makeField(field) {
  const notNull = field.canBeNull ? '' : 'NOT NULL';
  const primary = field.primaryKey ? 'PRIMARY KEY' : '';
  const increment = field.autoIncrement ? 'AUTOINCREMENT' : '';
  const defaultValue =
    field.defaultValue !== null ? `DEFAULT "${field.defaultValue}"` : '';

  return `"${field.name}" ${field.type} ${primary} ${increment} ${notNull} ${defaultValue}`;
}

export function makeFields(fields) {
  return fields.map(makeField).join(',  ');
}

export function makeDelete(table, row) {
  return `DELETE FROM \`${table}\` WHERE rowid=${row.rowid};`;
}

export function makeCreateTable(table, fields) {
  return `CREATE TABLE \`${table}\` (${makeFields(fields)});`;
}

export function makeIndex({ name, fields, isUnique, tableName }) {
  return `CREATE ${
    isUnique ? 'UNIQUE' : ''
  } INDEX "${tableName}_${name}" ON "${tableName}"(${fields
    .map((name) => escapeFieldName(name))
    .join(', ')});`;
}

export function makeAddField({ field, tableName }) {
  return `ALTER TABLE "${tableName}" ADD COLUMN ${makeField(field)}`;
}

export function makeRenameField({ currentName, newName, tableName }) {
  return `ALTER TABLE "${tableName}" RENAME COLUMN "${currentName}" TO "${newName}";`;
}

export function makeDropField({ fieldName, tableName }) {
  return `ALTER TABLE "${tableName}" DROP COLUMN "${fieldName}";`;
}
