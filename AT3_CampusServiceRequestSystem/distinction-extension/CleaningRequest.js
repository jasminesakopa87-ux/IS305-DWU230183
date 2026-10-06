'use strict';

const ServiceRequest = require('./ServiceRequest');

class CleaningRequest extends ServiceRequest {
  #cleaningArea;
  #hygieneRisk;
  #serviceType;
  #preferredServiceTime;

  constructor(commonData, specialisedData = {}) {
    const { requestId, requester, title, description, location, priority } = commonData;
    super(requestId, requester, title, description, location, 'Cleaning and Sanitation', priority);
    this.#cleaningArea = specialisedData.cleaningArea;
    this.#hygieneRisk = Boolean(specialisedData.hygieneRisk);
    this.#serviceType = specialisedData.serviceType ?? 'Routine Cleaning';
    this.#preferredServiceTime = specialisedData.preferredServiceTime ?? 'Anytime';
    this.validateSpecialisedFields();
  }

  getCleaningArea() { return this.#cleaningArea; }
  hasHygieneRisk() { return this.#hygieneRisk; }
  getServiceType() { return this.#serviceType; }
  getPreferredServiceTime() { return this.#preferredServiceTime; }

  validateSpecialisedFields() {
    if (typeof this.#cleaningArea !== 'string' || this.#cleaningArea.trim().length === 0) {
      throw new Error('Validation Error: Cleaning area cannot be empty.');
    }
  }

  calculatePriorityScore() {
    const base = this.getBasePriorityScore();
    const riskBonus = this.#hygieneRisk ? 3 : 0;
    return base + riskBonus;
  }

  getTargetResolutionHours() {
    return this.#hygieneRisk ? 2 : 48;
  }

  getRequestSummary() {
    return (
      `${this.getBaseSummary()}\n` +
      `  [Cleaning Details] Area: ${this.#cleaningArea} | Hygiene Risk: ${this.#hygieneRisk ? 'Yes' : 'No'} | ` +
      `Service Type: ${this.#serviceType} | Preferred Time: ${this.#preferredServiceTime}`
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      cleaningArea: this.#cleaningArea,
      hygieneRisk: this.#hygieneRisk,
      serviceType: this.#serviceType,
      preferredServiceTime: this.#preferredServiceTime,
    };
  }
}

module.exports = CleaningRequest;