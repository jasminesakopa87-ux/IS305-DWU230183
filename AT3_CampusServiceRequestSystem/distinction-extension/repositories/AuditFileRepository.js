'use strict';

const BaseFileRepository = require('./BaseFileRepository');

class AuditFileRepository extends BaseFileRepository {
  constructor(filePath) {
    super(filePath, 'auditId');
  }

  async findByRequestId(requestId) {
    const all = await this.loadAll();
    return all.filter((a) => a.requestId === requestId);
  }

  async findByActor(actorId) {
    const all = await this.loadAll();
    return all.filter((a) => a.actorId === actorId);
  }
}

module.exports = AuditFileRepository;