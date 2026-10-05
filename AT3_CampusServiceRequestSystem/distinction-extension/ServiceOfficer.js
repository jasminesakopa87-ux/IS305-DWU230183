'use strict';

const User = require('./User');

class ServiceOfficer extends User {
  #serviceSection;

  constructor(userId, firstName, lastName, email, serviceSection) {
    super(userId, firstName, lastName, email, 'Service Officer');
    this.setServiceSection(serviceSection);
  }

  getServiceSection() { return this.#serviceSection; }
  getRole() { return 'Service Officer'; }

  setServiceSection(serviceSection) {
    if (typeof serviceSection !== 'string' || serviceSection.trim().length === 0) {
      throw new Error('Validation Error: Service section cannot be empty.');
    }
    this.#serviceSection = serviceSection.trim();
  }

  reviewRequest(request) {
    request.review(this);
    return request;
  }

  assignPriority(request, priority) {
    request.setPriority(priority, this);
    return request;
  }

  assignTechnician(request, technician) {
    request.assignTechnician(technician, this);
    return request;
  }

  closeRequest(request) {
    request.close(this);
    return request;
  }

  toJSON() {
    return { ...super.toJSON(), serviceSection: this.#serviceSection };
  }

  static fromJSON(data) {
    return new ServiceOfficer(data.userId, data.firstName, data.lastName, data.email, data.serviceSection);
  }
}

module.exports = ServiceOfficer;