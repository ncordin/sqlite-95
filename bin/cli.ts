#!/usr/bin/env bun
import { initDatabase, checkSchema } from '../index';
import { resolve } from 'node:path';

const args = Bun.argv.slice(2);

if (args[0] !== 'check' || !args[1] || !args[2]) {
  console.log('Usage: sqlite-95 check <database-file> <tables-directory>');
  process.exit(1);
}

const dbFile = resolve(process.cwd(), args[1]);
const tablesDir = resolve(process.cwd(), args[2]);

console.log(`\n  🕵️  Checking schema for ${dbFile}...\n`);

try {
  initDatabase({ file: dbFile });
  await checkSchema({ tables: tablesDir });
} catch (error) {
  console.error('\n  ❌ Error during schema check:');
  console.error(error);
  process.exit(1);
}
