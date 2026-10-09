'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

/**
 * The ONLY file in this whole application that imports fs/promises.
 * Every repository goes through these two functions - nothing else
 * anywhere in the project reads or writes a file directly.
 */

async function loadJSONArray(filePath) {
  try {
        const content = await fs.readFile(filePath, 'utf-8');
    if (content.trim().length === 0) {
      return [];
    }
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error(`File Error: "${filePath}" does not contain a JSON array.`);
    }
    return parsed;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    if (err instanceof SyntaxError) {
      throw new Error(`File Error: "${filePath}" contains invalid JSON and could not be read.`);
    }
    throw err;
  }
}

async function saveJSONArray(filePath, records) {
  if (!Array.isArray(records)) {
    throw new Error(`File Error: Refusing to save non-array data to "${filePath}".`);
  }
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    throw new Error(`File Error: Could not write to "${filePath}" - ${err.message}`);
  }
}

module.exports = { loadJSONArray, saveJSONArray };