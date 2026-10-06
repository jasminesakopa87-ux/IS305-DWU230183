'use strict';

const BaseFileRepository = require('./BaseFileRepository');

class RequestHistoryFileRepository extends BaseFileRepository {
  constructor(filePath) {
    super(filePath, 'historyId');
  }

  async findByRequestId(requestId) {
    const all = await this.loadAll();
    return all.filter((h) => h.requestId === requestId);
  }
}

module.exports = RequestHistoryFileRepository;