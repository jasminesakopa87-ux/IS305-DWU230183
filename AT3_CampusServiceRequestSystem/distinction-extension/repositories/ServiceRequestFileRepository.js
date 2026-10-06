'use strict';

const BaseFileRepository = require('./BaseFileRepository');

class ServiceRequestFileRepository extends BaseFileRepository {
  constructor(filePath) {
    super(filePath, 'requestId');
  }

  async findByRequester(userId) {
    const all = await this.loadAll();
    return all.filter((r) => r.requesterId === userId);
  }

  async findByTechnician(technicianId) {
    const all = await this.loadAll();
    return all.filter((r) => r.assignedTechnicianId === technicianId);
  }

  async findByStatus(status) {
    const all = await this.loadAll();
    return all.filter((r) => r.status === status);
  }
}

module.exports = ServiceRequestFileRepository;