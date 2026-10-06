'use strict';

const { loadJSONArray, saveJSONArray } = require('./fileStore');

/**
 * Shared load/save/create/find/update logic for every JSON-backed
 * collection. Each concrete repository just supplies its own file path
 * and the field name that acts as its ID.
 */
class BaseFileRepository {
  constructor(filePath, idField) {
    this.filePath = filePath;
    this.idField = idField;
  }

  async loadAll() {
    return loadJSONArray(this.filePath);
  }

  async saveAll(records) {
    return saveJSONArray(this.filePath, records);
  }

  async findById(id) {
    const all = await this.loadAll();
    return all.find((r) => r[this.idField] === id) ?? null;
  }

  async create(record) {
    const all = await this.loadAll();
    if (all.some((r) => r[this.idField] === record[this.idField])) {
      throw new Error(`Validation Error: A record with ${this.idField} "${record[this.idField]}" already exists.`);
    }
    all.push(record);
    await this.saveAll(all);
    return record;
  }

  async update(id, changes) {
    const all = await this.loadAll();
    const index = all.findIndex((r) => r[this.idField] === id);
    if (index === -1) {
      throw new Error(`Validation Error: No record found with ${this.idField} "${id}".`);
    }
    all[index] = { ...all[index], ...changes };
    await this.saveAll(all);
    return all[index];
  }

  async replace(id, record) {
    const all = await this.loadAll();
    const index = all.findIndex((r) => r[this.idField] === id);
    if (index === -1) {
      all.push(record);
    } else {
      all[index] = record;
    }
    await this.saveAll(all);
    return record;
  }
}

module.exports = BaseFileRepository;