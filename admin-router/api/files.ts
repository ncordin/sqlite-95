import fileSystem from 'fs';
import { Controller } from '../..';
import { getError } from '../../orm/utils/error';

const controller: Controller = () => {
  try {
    const path = process.cwd();
    const files = fileSystem
      .readdirSync(path)
      .filter((name) => name.endsWith('.db'))
      .map((name) => {
        const stats = fileSystem.statSync(`${path}/${name}`);
        return { name, size: stats.size };
      });

    return files;
  } catch (e) {
    const error = getError(e);

    return { error: { message: error.message } };
  }
};

export default controller;
