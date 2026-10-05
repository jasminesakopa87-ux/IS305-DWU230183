'use strict';

const ServiceRequest = require('./ServiceRequest');

class CleaningRequest extends ServiceRequest {
  #cleaningArea;
  #hygieneRisk;

  constructor(requestId, requester, title, description, location, priority, cleaningArea, hygieneRisk) {
    super(requestId, requester, title, description, location, 'Cleaning and Sanitation', priority);
    this.setCleaningArea(cleaningArea);
    this.setHygieneRisk(hygieneRisk);
  }

  getCleaningArea() {
    return this.#cleaningArea;
  }

  hasHygieneRisk() {
    return this.#hygieneRisk;
  }

  setCleaningArea(cleaningArea) {
    if (typeof cleaningArea !== 'string' || cleaningArea.trim().length === 0) {
      throw new Error('Validation Error: Cleaning area cannot be empty.');
    }
    this.#cleaningArea = cleaningArea.trim();
  }

  setHygieneRisk(hygieneRisk) {
    if (typeof hygieneRisk !== 'boolean') {
      throw new Error('Validation Error: Hygiene risk must be true or false.');
    }
    this.#hygieneRisk = hygieneRisk;
  }

  calculatePriorityScore() {
    const weights = { Low: 1, Normal: 2, High: 3, Urgent: 4 };
    const base = weights[this.getPriority()] ?? 0;
    const riskBonus = this.#hygieneRisk ? 3 : 0;
    return base + riskBonus;
  }

  getRequestSummary() {
    return (
      `${super.getRequestSummary()}\n` +
      `  [Cleaning Details] Area: ${this.#cleaningArea} | Hygiene Risk: ${this.#hygieneRisk ? 'Yes' : 'No'}`
    );
  }
}

module.exports = CleaningRequest;