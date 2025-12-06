import fileSystem from 'fs';
import { Controller } from '../..';
import { getError } from '../../orm/utils/error';

const controller: Controller = async (request) => {
  try {
    const path = process.cwd();
    const file = request.read('body', 'file', 'file', null);

    if (!file) {
      return { error: { message: 'No file provided' } };
    }

    const fileName = file.name;

    if (!fileName.endsWith('.db')) {
      return { error: { message: 'File must be a .db file' } };
    }

    // Check if file already exists
    const filePath = `${path}/${fileName}`;
    if (fileSystem.existsSync(filePath)) {
      return { error: { message: 'A database with this name already exists' } };
    }

    // Write the file
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    fileSystem.writeFileSync(filePath, uint8Array);

    return { success: true, name: fileName, size: uint8Array.length };
  } catch (e) {
    const error = getError(e);

    return { error: { message: error.message } };
  }
};

export default controller;
