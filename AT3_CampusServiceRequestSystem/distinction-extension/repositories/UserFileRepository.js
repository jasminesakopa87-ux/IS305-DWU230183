'use strict';

const BaseFileRepository = require('./BaseFileRepository');

class UserFileRepository extends BaseFileRepository {
  constructor(filePath) {
    super(filePath, 'userId');
  }

  async findByRole(role) {
    const all = await this.loadAll();
    return all.filter((u) => u.role === role);
  }
}

module.exports = UserFileRepository;