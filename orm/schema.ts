import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { TABLE_REGISTRY } from './table/table';
import { queryGet } from './drivers';

export async function checkSchema(options: {
  tables: string;
  ignore?: RegExp;
  verbose?: boolean;
}): Promise<{
  ok: boolean;
  issues: number;
  tablesWithDiffs: number;
  totalTables: number;
  details: string[];
}> {
  const verbose = options.verbose !== false;
  const tablesDir = resolve(process.cwd(), options.tables);
  let files: string[] = [];
  try {
    files = readdirSync(tablesDir).filter(
      (f) =>
        (f.endsWith('.ts') || f.endsWith('.js')) && !options.ignore?.test(f)
    );
  } catch (e) {
    console.error(`  ❌ Cannot read tables directory: ${tablesDir}`);
    return { ok: false, issues: 0, tablesWithDiffs: 0, totalTables: 0, details: [] };
  }

  for (const file of files) {
    try {
      await import(join(tablesDir, file));
    } catch (e) {
      console.error(`  ❌ Error importing file ${file}:`, e);
    }
  }

  const dbTables = queryGet({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
    parameters: [],
    name: '',
    fields: {},
    options: ['no-log'],
  });

  const dbTableNames = dbTables.map((t) => t.name as string);
  const dbTableSet = new Set(
    dbTableNames.filter((n) => !options.ignore?.test(n))
  );

  let issues = 0;
  const tablesWithDiffsSet = new Set<string>();
  const missingTables: string[] = [];
  const lines: string[] = [];

  const registeredTables = Array.from(TABLE_REGISTRY.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const table of registeredTables) {
    let hasDiff = false;

    if (!dbTableSet.has(table.name)) {
      missingTables.push(table.name);
      lines.push(`  👻 [${table.name}] not in database`);
      continue;
    }

    const dbColumns = queryGet({
      sql: `PRAGMA table_info("${table.name}");`,
      parameters: [],
      name: '',
      fields: {},
      options: ['no-log'],
    }) as { name: string }[];

    const declared = new Set(Object.keys(table.fields));
    const actual = new Set(dbColumns.map((c) => c.name));

    const missing = [...declared].filter((c) => !actual.has(c));
    const extra = [...actual].filter((c) => !declared.has(c));

    let hasFieldDiff = false;
    const colOk = missing.length === 0 && extra.length === 0;
    if (!colOk) {
      hasDiff = true;
      hasFieldDiff = true;
    }

    // --- Check Indexes & Unique ---
    const dbIndexes = queryGet({
      sql: `PRAGMA index_list("${table.name}");`,
      parameters: [],
      name: '',
      fields: {},
      options: ['no-log'],
    }) as { name: string; unique: number; origin: string }[];

    const actualUnique: string[][] = [];
    const actualIndexes: string[][] = [];
    const pkUniqueCols: string[][] = [];

    for (const idx of dbIndexes) {
      const info = queryGet({
        sql: `PRAGMA index_info("${idx.name}");`,
        parameters: [],
        name: '',
        fields: {},
        options: ['no-log'],
      }) as { name: string }[];
      const cols = info.map((c) => c.name);

      if (idx.unique === 1) {
        actualUnique.push(cols);
        if (idx.origin === 'pk') {
          pkUniqueCols.push(cols);
        }
      } else {
        actualIndexes.push(cols);
      }
    }

    const normalize = (arr: (string | string[])[]) =>
      arr
        .map((item) => (Array.isArray(item) ? [...item].sort() : [item]))
        .map((item) => item.join(','))
        .sort();

    const declaredUnique = normalize(table.unique || []);
    const declaredIndexes = normalize(table.indexes || []);
    const foundUnique = normalize(actualUnique);
    const foundIndexes = normalize(actualIndexes);
    const normalizedPkUnique = normalize(pkUniqueCols);

    const missingUnique = declaredUnique.filter(
      (u) => !foundUnique.includes(u)
    );
    const extraUnique = foundUnique.filter(
      (u) => !declaredUnique.includes(u) && !normalizedPkUnique.includes(u)
    );
    const missingIdx = declaredIndexes.filter((i) => !foundIndexes.includes(i));
    const extraIdx = foundIndexes.filter((i) => !declaredIndexes.includes(i));

    let hasUniqueDiff = false;
    let hasIndexDiff = false;

    if (missingUnique.length || extraUnique.length) {
      hasDiff = true;
      hasUniqueDiff = true;
    }

    if (missingIdx.length || extraIdx.length) {
      hasDiff = true;
      hasIndexDiff = true;
    }

    if (hasDiff) {
      issues++;
      tablesWithDiffsSet.add(table.name);
      const icon = hasFieldDiff || hasUniqueDiff ? '❌' : '⚠️';
      lines.push(`  ${icon}  ${table.name}`);

      const detailItems: string[] = [];
      if (missing.length) detailItems.push(`missing in db col: ${missing.join(', ')}`);
      if (extra.length) detailItems.push(`extra in db col: ${extra.join(', ')}`);
      if (missingUnique.length) detailItems.push(`missing in db unique: ${missingUnique.join(' | ')}`);
      if (extraUnique.length) detailItems.push(`extra in db unique: ${extraUnique.join(' | ')}`);
      if (missingIdx.length) detailItems.push(`missing in db index: ${missingIdx.join(' | ')}`);
      if (extraIdx.length) detailItems.push(`extra in db index: ${extraIdx.join(' | ')}`);

      detailItems.forEach((item, idx) => {
        const symbol = idx === detailItems.length - 1 ? '└─' : '├─';
        lines.push(`    ${symbol} ${item}`);
      });
    } else {
      lines.push(
        `  ✅ [${table.name}] ok (${Object.keys(table.fields).length} columns)`
      );
    }
  }

  const declaredTableNames = new Set(registeredTables.map((s) => s.name));
  const orphanDbTables = [...dbTableSet].filter(
    (t) => !declaredTableNames.has(t)
  );
  if (orphanDbTables.length) {
    lines.push(
      `\n  ⚠️  Tables in database not declared in code: ${orphanDbTables.join(
        ', '
      )}`
    );
    issues++;
    for (const t of orphanDbTables) {
      tablesWithDiffsSet.add(t);
    }
  }

  const details = lines.filter((line) => !line.includes('✅') && !line.includes('👻'));

  if (verbose) {
    if (lines.length > 0) {
      console.log(lines.join('\n'));
    }
  }

  return {
    ok: tablesWithDiffsSet.size === 0,
    issues,
    tablesWithDiffs: tablesWithDiffsSet.size,
    totalTables: registeredTables.length,
    details,
  };
}
