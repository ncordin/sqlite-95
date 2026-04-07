import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';

const readPackageVersion = (dir: string): string | null => {
  try {
    const content = JSON.parse(
      readFileSync(join(dir, 'package.json'), 'utf-8')
    );
    return content.name === 'sqlite-95' ? (content.version ?? null) : null;
  } catch {
    return null;
  }
};

const findVersion = (dir: string): string => {
  const version = existsSync(join(dir, 'package.json'))
    ? readPackageVersion(dir)
    : null;

  if (version !== null) {
    return version;
  }

  const parent = dirname(dir);

  if (parent === dir) {
    return '?';
  }

  return findVersion(parent);
};

export const getPackageVersion = (): string => findVersion(import.meta.dir);
