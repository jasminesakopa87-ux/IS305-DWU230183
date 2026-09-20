'use strict';

const ServiceRequest = require('./ServiceRequest');

const DEVICE_TYPES = ['Laptop', 'Desktop', 'Printer', 'Network Equipment', 'Software', 'Other'];

class ICTSupportRequest extends ServiceRequest {
  #deviceType;
  #systemName;

  constructor(requestId, requester, title, description, location, priority, deviceType, systemName) {
    super(requestId, requester, title, description, location, 'ICT Support', priority);
    this.setDeviceType(deviceType);
    this.setSystemName(systemName);
  }

  getDeviceType() {
    return this.#deviceType;
  }

  getSystemName() {
    return this.#systemName;
  }

  setDeviceType(deviceType) {
    if (!DEVICE_TYPES.includes(deviceType)) {
      throw new Error(`Validation Error: "${deviceType}" is not a supported device type.`);
    }
    this.#deviceType = deviceType;
  }

  setSystemName(systemName) {
    if (typeof systemName !== 'string' || systemName.trim().length === 0) {
      throw new Error('Validation Error: System name cannot be empty.');
    }
    this.#systemName = systemName.trim();
  }

  calculatePriorityScore() {
    const weights = { Low: 1, Normal: 2, High: 3, Urgent: 4 };
    const base = weights[this.getPriority()] ?? 0;
    const networkBonus = this.#deviceType === 'Network Equipment' ? 1 : 0;
    return base + networkBonus;
  }

  getRequestSummary() {
    return (
      `${super.getRequestSummary()}\n` +
      `  [ICT Details] Device: ${this.#deviceType} | System: ${this.#systemName}`
    );
  }
}

module.exports = ICTSupportRequest;
module.exports.DEVICE_TYPES = DEVICE_TYPES;