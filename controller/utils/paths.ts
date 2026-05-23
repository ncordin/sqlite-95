import { join } from 'node:path';
import type { HandleRequestOptions } from '../types';
import { joinPrefix } from './http';

export const resolvePaths = (options: HandleRequestOptions) => ({
  // Front prefixes:
  appPrefix: joinPrefix(options.prefix || '', ''),
  adminPrefix: joinPrefix(options.prefix || '', options.admin?.prefix || ''),
  assetsPrefix: joinPrefix(options.prefix || '', options.assets?.prefix || ''),

  // Back directories :
  tablesDirectory: options.database?.check
    ? join(options.root, options.database.check)
    : undefined,
  controllersDirectory: options.controllers
    ? join(options.root, options.controllers.path)
    : undefined,
  assetsDirectory: options.assets
    ? join(options.root, options.assets.path)
    : undefined,
  catchAllFile: options.catchAll
    ? join(options.root, options.catchAll.path)
    : undefined,
});
