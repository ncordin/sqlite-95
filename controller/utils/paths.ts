import { dirname, join } from 'node:path';
import { HandleRequestOptions } from '../types';
import { joinPrefix } from './http';

const ENTRY_PATH = dirname(Bun.main); // TODO: use meta instead

export const resolvePaths = (options: HandleRequestOptions) => ({
  // Front prefixes:
  appPrefix: joinPrefix(options.prefix || '', ''),
  adminPrefix: joinPrefix(options.prefix || '', options.admin?.prefix || ''),
  assetsPrefix: joinPrefix(options.prefix || '', options.assets?.prefix || ''),

  // Back directories :
  controllersDirectory: options.controllers
    ? join(ENTRY_PATH, options.controllers.path)
    : undefined,
  assetsDirectory: options.assets
    ? join(ENTRY_PATH, options.assets.path)
    : undefined,
  catchAllFile: options.catchAll
    ? join(ENTRY_PATH, options.catchAll.path)
    : undefined,
});
