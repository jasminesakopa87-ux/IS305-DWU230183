'use strict';

const ServiceRequest = require('./ServiceRequest');

const DEVICE_TYPES = ['Laptop', 'Desktop', 'Printer', 'Network Equipment', 'Software', 'Other'];
const FAULT_TYPES = ['Hardware', 'Software', 'Network', 'Account/Access', 'Other'];

class ICTSupportRequest extends ServiceRequest {
  #deviceType;
  #systemName;
  #faultType;
  #networkImpact;

  constructor(commonData, specialisedData = {}) {
    const { requestId, requester, title, description, location, priority } = commonData;
    super(requestId, requester, title, description, location, 'ICT Support', priority);
    this.#deviceType = specialisedData.deviceType;
    this.#systemName = specialisedData.systemName;
    this.#faultType = specialisedData.faultType;
    this.#networkImpact = Boolean(specialisedData.networkImpact);
    this.validateSpecialisedFields();
  }

  getDeviceType() { return this.#deviceType; }
  getSystemName() { return this.#systemName; }
  getFaultType() { return this.#faultType; }
  hasNetworkImpact() { return this.#networkImpact; }

  validateSpecialisedFields() {
    if (!DEVICE_TYPES.includes(this.#deviceType)) {
      throw new Error(`Validation Error: "${this.#deviceType}" is not a supported device type.`);
    }
    if (typeof this.#systemName !== 'string' || this.#systemName.trim().length === 0) {
      throw new Error('Validation Error: System name cannot be empty.');
    }
    if (!FAULT_TYPES.includes(this.#faultType)) {
      throw new Error(`Validation Error: "${this.#faultType}" is not a supported fault type.`);
    }
  }

  calculatePriorityScore() {
    const base = this.getBasePriorityScore();
    const networkBonus = this.#networkImpact ? 2 : 0;
    return base + networkBonus;
  }

  getTargetResolutionHours() {
    return this.#networkImpact ? 8 : 24;
  }

  getRequestSummary() {
    return (
      `${this.getBaseSummary()}\n` +
      `  [ICT Details] Device: ${this.#deviceType} | System: ${this.#systemName} | ` +
      `Fault: ${this.#faultType} | Network Impact: ${this.#networkImpact ? 'Yes' : 'No'}`
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      deviceType: this.#deviceType,
      systemName: this.#systemName,
      faultType: this.#faultType,
      networkImpact: this.#networkImpact,
    };
  }
}

module.exports = ICTSupportRequest;
module.exports.DEVICE_TYPES = DEVICE_TYPES;
module.exports.FAULT_TYPES = FAULT_TYPES;