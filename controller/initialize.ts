import { initDatabase } from '../orm/drivers/bun';
import { HandleRequestOptions } from './types';
import { getPackageVersion } from './utils/version';
import { resolvePaths } from './utils/paths';

export const initialize = (options: HandleRequestOptions) => {
  const paths = resolvePaths(options);
  const base = `http://localhost:${options.port}`;

  const line = '─'.repeat(52);
  const row = (emoji: string, label: string, value: string) =>
    `  ${emoji}  ${label.padEnd(14)}${value}`;

  console.log('');
  console.log(`  ✨  SQLite 95 - v${getPackageVersion()}`);
  console.log(`  ${line}`);
  console.log('');
  console.log(row('🌍', 'App', `${base}${paths.appPrefix}`));
  console.log(row('🔒', 'Admin', `${base}${paths.adminPrefix}`));

  console.log('');
  console.log(row('📂', 'Controllers', paths.controllersDirectory || '(none)'));
  console.log(row('📦', 'Assets', paths.assetsDirectory || '(none)'));
  console.log('');

  if (options.database) {
    const { version } = initDatabase({ file: options.database.file });
    console.log(row('💾', 'Database', options.database.file));
    console.log(row('🗄️ ', 'SQLite', version));
  } else {
    console.log(row('💾', 'Database', '(none)'));
  }

  console.log('');
  console.log(`  ${line}`);
  console.log('');
};
