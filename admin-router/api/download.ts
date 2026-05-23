import fileSystem from 'fs';
import type { Controller } from '../..';
import { getError } from '../../orm/utils/error';

const controller: Controller = async (req, res) => {
  try {
    const path = process.cwd();
    const files = fileSystem.readdirSync(path).filter((name) => {
      return name === req.read('body', 'database', 'string', '');
    });

    const fileName = files[0];
    const file = Bun.file(fileName);

    if ((await file.exists()) === false) {
      return { error: 'No file' };
    }

    res.setContentType('file');
    return file;
  } catch (e) {
    const error = getError(e);

    return { error: { message: error.message } };
  }
};

export default controller;
