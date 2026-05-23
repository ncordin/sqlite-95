import { initDatabase, checkSchema } from '../orm';
import type { HandleRequestOptions } from './types';
import { getPackageVersion } from './utils/version';
import { resolvePaths } from './utils/paths';

export const initialize = async (options: HandleRequestOptions) => {
  const paths = resolvePaths(options);
  const base = `http://localhost:${options.port}`;

  const line = '─'.repeat(50);
  const row = (emoji: string, label: string, value: string) =>
    `  ${emoji} ${label.padEnd(12)}${value}`;

  console.log('');
  console.log(`  ✨ SQLite 95 - v${getPackageVersion()}`);
  console.log(`  ${line}`);
  console.log('');
  console.log(row('🌍', 'App', `${base}${paths.appPrefix}`));
  console.log(row('🔒', 'Admin', `${base}${paths.adminPrefix}`));

  console.log('');
  console.log('  🔌', paths.controllersDirectory || '(none)');
  console.log('  📦', paths.assetsDirectory || '(none)');
  console.log('');

  if (options.database) {
    const { version } = initDatabase({ file: options.database.file });

    if (paths.tablesDirectory) {
      const result = await checkSchema({
        tables: paths.tablesDirectory,
        ignore: options.database.ignore,
        verbose: false,
      });

      if (result.ok) {
        console.log(
          `  💾 ${options.database.file} (SQLite ${version})  ✅  ${result.totalTables} tables synced`
        );
      } else {
        console.log(
          `  💾 ${options.database.file} (SQLite ${version})  ⚡  ${result.tablesWithDiffs} drift in ${result.totalTables} tables`
        );
        if (result.details.length > 0) {
          console.log('');
          console.log(result.details.join('\n'));
          console.log('');
        }
        console.log(
          `   → bun node_modules/sqlite-95/bin/cli check ${options.database.file} ${options.database.check}`
        );
      }
    } else {
      console.log(`  💾 ${options.database.file} (SQLite ${version})`);
    }
  } else {
    console.log(`  💾 (none)`);
  }

  console.log('');
  console.log(`  ${line}`);
  console.log('');
};
