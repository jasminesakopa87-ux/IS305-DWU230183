'use strict';

const ServiceRequest = require('./ServiceRequest');

const HAZARD_LEVELS = ['Low', 'Medium', 'High'];

class MaintenanceRequest extends ServiceRequest {
  #building;
  #roomNumber;
  #hazardLevel;
  #equipmentAffected;

  constructor(commonData, specialisedData = {}) {
    const { requestId, requester, title, description, location, priority } = commonData;
    super(requestId, requester, title, description, location, 'Facilities Maintenance', priority);
    this.#building = specialisedData.building;
    this.#roomNumber = specialisedData.roomNumber;
    this.#hazardLevel = specialisedData.hazardLevel;
    this.#equipmentAffected = specialisedData.equipmentAffected ?? 'None';
    this.validateSpecialisedFields();
  }

  getBuilding() { return this.#building; }
  getRoomNumber() { return this.#roomNumber; }
  getHazardLevel() { return this.#hazardLevel; }
  getEquipmentAffected() { return this.#equipmentAffected; }

  validateSpecialisedFields() {
    if (typeof this.#building !== 'string' || this.#building.trim().length === 0) {
      throw new Error('Validation Error: Building is required.');
    }
    if (typeof this.#roomNumber !== 'string' || this.#roomNumber.trim().length === 0) {
      throw new Error('Validation Error: Room number is required.');
    }
    if (!HAZARD_LEVELS.includes(this.#hazardLevel)) {
      throw new Error(`Validation Error: "${this.#hazardLevel}" is not a supported hazard level.`);
    }
  }

  calculatePriorityScore() {
    const base = this.getBasePriorityScore();
    const hazardBonus = this.#hazardLevel === 'High' ? 3 : this.#hazardLevel === 'Medium' ? 1 : 0;
    return base + hazardBonus;
  }

  getTargetResolutionHours() {
    return this.#hazardLevel === 'High' ? 4 : this.#hazardLevel === 'Medium' ? 24 : 72;
  }

  getRequestSummary() {
    return (
      `${this.getBaseSummary()}\n` +
      `  [Maintenance Details] Building: ${this.#building}, Room: ${this.#roomNumber} | ` +
      `Hazard: ${this.#hazardLevel} | Equipment: ${this.#equipmentAffected}`
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      building: this.#building,
      roomNumber: this.#roomNumber,
      hazardLevel: this.#hazardLevel,
      equipmentAffected: this.#equipmentAffected,
    };
  }
}

module.exports = MaintenanceRequest;
module.exports.HAZARD_LEVELS = HAZARD_LEVELS;