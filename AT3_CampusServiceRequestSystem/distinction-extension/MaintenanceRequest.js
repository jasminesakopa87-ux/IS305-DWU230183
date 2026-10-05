'use strict';

const ServiceRequest = require('./ServiceRequest');

const HAZARD_LEVELS = ['Low', 'Medium', 'High'];

class MaintenanceRequest extends ServiceRequest {
  #building;
  #roomNumber;
  #hazardLevel;

  constructor(requestId, requester, title, description, location, priority, building, roomNumber, hazardLevel) {
    super(requestId, requester, title, description, location, 'Facilities Maintenance', priority);
    this.setBuilding(building);
    this.setRoomNumber(roomNumber);
    this.setHazardLevel(hazardLevel);
  }

  getBuilding() {
    return this.#building;
  }

  getRoomNumber() {
    return this.#roomNumber;
  }

  getHazardLevel() {
    return this.#hazardLevel;
  }

  setBuilding(building) {
    if (typeof building !== 'string' || building.trim().length === 0) {
      throw new Error('Validation Error: Building cannot be empty.');
    }
    this.#building = building.trim();
  }

  setRoomNumber(roomNumber) {
    if (typeof roomNumber !== 'string' || roomNumber.trim().length === 0) {
      throw new Error('Validation Error: Room number cannot be empty.');
    }
    this.#roomNumber = roomNumber.trim();
  }

  setHazardLevel(hazardLevel) {
    if (!HAZARD_LEVELS.includes(hazardLevel)) {
      throw new Error(`Validation Error: "${hazardLevel}" is not a supported hazard level.`);
    }
    this.#hazardLevel = hazardLevel;
  }

  calculatePriorityScore() {
    const weights = { Low: 1, Normal: 2, High: 3, Urgent: 4 };
    const base = weights[this.getPriority()] ?? 0;
    const hazardBonus = this.#hazardLevel === 'High' ? 2 : this.#hazardLevel === 'Medium' ? 1 : 0;
    return base + hazardBonus;
  }

  getRequestSummary() {
    return (
      `${super.getRequestSummary()}\n` +
      `  [Maintenance Details] Building: ${this.#building}, Room: ${this.#roomNumber} | Hazard: ${this.#hazardLevel}`
    );
  }
}

module.exports = MaintenanceRequest;
module.exports.HAZARD_LEVELS = HAZARD_LEVELS;