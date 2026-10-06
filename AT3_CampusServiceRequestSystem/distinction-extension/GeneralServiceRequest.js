'use strict';

const ServiceRequest = require('./ServiceRequest');

class GeneralServiceRequest extends ServiceRequest {
  #generalServiceType;

  constructor(commonData, specialisedData = {}) {
    const { requestId, requester, title, description, location, priority } = commonData;
    super(requestId, requester, title, description, location, 'General Campus Service', priority);
    this.#generalServiceType = specialisedData.generalServiceType ?? 'General';
    this.validateSpecialisedFields();
  }

  getGeneralServiceType() { return this.#generalServiceType; }

  validateSpecialisedFields() {
    if (typeof this.#generalServiceType !== 'string' || this.#generalServiceType.trim().length === 0) {
      throw new Error('Validation Error: General service type cannot be empty.');
    }
  }

  calculatePriorityScore() {
    return this.getBasePriorityScore();
  }

  getTargetResolutionHours() {
    return 72;
  }

  getRequestSummary() {
    return `${this.getBaseSummary()}\n  [General Details] Service Type: ${this.#generalServiceType}`;
  }

  toJSON() {
    return { ...super.toJSON(), generalServiceType: this.#generalServiceType };
  }
}

module.exports = GeneralServiceRequest;