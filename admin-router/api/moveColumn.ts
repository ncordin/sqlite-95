import Database from 'bun:sqlite';
import { Controller } from '../../controller/types';
import { getError } from '../../orm/utils/error';
import { getDatabase } from '../utils';

interface MoveColumnParams {
  tableName: string;
  fieldToMove: string;
  position: 'before' | 'after';
  relativeField: string;
}

interface FieldInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface IndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

interface IndexColumn {
  seqno: number;
  cid: number;
  name: string;
}

const getTableStructure = (database: Database, tableName: string) => {
  const fields = database
    .query(`PRAGMA table_info('${tableName}')`)
    .all() as FieldInfo[];
  return fields;
};

const getTableIndexes = (database: Database, tableName: string) => {
  const indexes = database
    .query(`PRAGMA index_list('${tableName}')`)
    .all() as IndexInfo[];

  // Filtrer les index auto-créés par SQLite pour les PRIMARY KEY
  return indexes.filter((index) => index.origin !== 'pk');
};

const getIndexColumns = (database: Database, indexName: string) => {
  const columns = database
    .query(`PRAGMA index_info('${indexName}')`)
    .all() as IndexColumn[];

  return columns.map((col) => col.name);
};

const createIndexQuery = (
  indexName: string,
  tableName: string,
  columns: string[],
  unique: boolean
) => {
  const uniqueKeyword = unique ? 'UNIQUE ' : '';
  const columnList = columns.map((col) => `"${col}"`).join(', ');
  return `CREATE ${uniqueKeyword}INDEX "${indexName}" ON "${tableName}" (${columnList});`;
};

const reorderFields = (
  fields: FieldInfo[],
  fieldToMove: string,
  position: 'before' | 'after',
  relativeField: string
): FieldInfo[] => {
  // Trouver le champ à déplacer
  const fieldToMoveIndex = fields.findIndex((f) => f.name === fieldToMove);
  const relativeFieldIndex = fields.findIndex((f) => f.name === relativeField);

  if (fieldToMoveIndex === -1 || relativeFieldIndex === -1) {
    throw new Error('Field not found');
  }

  // Créer un nouveau tableau sans le champ à déplacer
  const newFields = fields.filter((f) => f.name !== fieldToMove);

  // Calculer la nouvelle position
  let insertIndex = newFields.findIndex((f) => f.name === relativeField);
  if (position === 'after') {
    insertIndex++;
  }

  // Insérer le champ à la nouvelle position
  newFields.splice(insertIndex, 0, fields[fieldToMoveIndex]);

  return newFields;
};

const buildFieldDefinition = (field: FieldInfo): string => {
  let definition = `"${field.name}" ${field.type}`;

  if (field.pk) {
    definition += ' PRIMARY KEY';
  }

  if (field.notnull && !field.pk) {
    definition += ' NOT NULL';
  }

  if (field.dflt_value !== null) {
    definition += ` DEFAULT ${field.dflt_value}`;
  }

  return definition;
};

const controller: Controller = (request, response) => {
  try {
    const params = request.body as unknown as MoveColumnParams;
    const { tableName, fieldToMove, position, relativeField } = params;

    const database = getDatabase(String(request.headers.database));

    // 1. Récupérer la structure actuelle de la table
    const currentFields = getTableStructure(database, tableName);

    // 2. Réorganiser les champs
    const reorderedFields = reorderFields(
      currentFields,
      fieldToMove,
      position,
      relativeField
    );

    // 3. Créer la définition de la nouvelle table
    const fieldDefinitions = reorderedFields.map(buildFieldDefinition);
    const transitionTableName = `${tableName}_transition`;

    // 4. Créer la table de transition
    const createTableQuery = `CREATE TABLE "${transitionTableName}" (
      ${fieldDefinitions.join(',\n      ')}
    );`;

    database.query(createTableQuery).run();

    // 5. Copier les données
    const fieldNames = reorderedFields.map((f) => `"${f.name}"`).join(', ');
    const copyDataQuery = `INSERT INTO "${transitionTableName}" (${fieldNames})
      SELECT ${fieldNames} FROM "${tableName}";`;

    database.query(copyDataQuery).run();

    // 6. Copier les index
    const indexes = getTableIndexes(database, tableName);

    for (const index of indexes) {
      const columns = getIndexColumns(database, index.name);
      // Créer un nouveau nom d'index unique pour la table de transition
      const newIndexName = `${transitionTableName}_${index.name.replace(
        `${tableName}_`,
        ''
      )}`;
      const createIndexSql = createIndexQuery(
        newIndexName,
        transitionTableName,
        columns,
        index.unique === 1
      );

      database.query(createIndexSql).run();
    }

    // 7. Renommer la table d'origine et la table de transition
    const randomSuffix = Math.floor(Math.random() * 900) + 100; // Nombre entre 100 et 999
    const oldTableName = `${tableName}_old_${randomSuffix}`;

    console.log(`\nRenaming original table to: ${oldTableName}`);
    database
      .query(`ALTER TABLE "${tableName}" RENAME TO "${oldTableName}";`)
      .run();

    console.log(`Renaming transition table to: ${tableName}`);
    database
      .query(`ALTER TABLE "${transitionTableName}" RENAME TO "${tableName}";`)
      .run();

    response.setStatusCode(202);
    return {
      success: true,
      oldTableName,
      message: 'Column moved successfully',
    };
  } catch (e) {
    const error = getError(e);

    return { error: { title: 'Move column error!', message: error.message } };
  }
};

export default controller;
