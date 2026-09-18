'use strict';

const User = require('./User');

class ServiceOfficer extends User {
  #serviceSection;

  constructor(userId, firstName, lastName, email, serviceSection) {
    super(userId, firstName, lastName, email, 'Service Officer');
    this.setServiceSection(serviceSection);
  }

  getServiceSection() {
    return this.#serviceSection;
  }

  setServiceSection(serviceSection) {
    if (typeof serviceSection !== 'string' || serviceSection.trim().length === 0) {
      throw new Error('Validation Error: Service section cannot be empty.');
    }
    this.#serviceSection = serviceSection.trim();
  }

  reviewRequest(request) {
    request.review();
    return request;
  }

  assignPriority(request, priority) {
    request.setPriority(priority);
    return request;
  }

  assignTechnician(request, technician) {
    request.assignTechnician(technician);
    return request;
  }

  closeRequest(request) {
    request.close();
    return request;
  }
}

module.exports = ServiceOfficer;