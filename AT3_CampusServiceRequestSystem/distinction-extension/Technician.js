'use strict';

const User = require('./User');

class Technician extends User {
  #technicalSpeciality;
  #available;

  constructor(userId, firstName, lastName, email, technicalSpeciality, available = true) {
    super(userId, firstName, lastName, email, 'Technician');
    this.setTechnicalSpeciality(technicalSpeciality);
    this.#available = Boolean(available);
  }

  getTechnicalSpeciality() { return this.#technicalSpeciality; }
  isAvailable() { return this.#available; }
  getRole() { return 'Technician'; }

  setTechnicalSpeciality(technicalSpeciality) {
    if (typeof technicalSpeciality !== 'string' || technicalSpeciality.trim().length === 0) {
      throw new Error('Validation Error: Technical speciality cannot be empty.');
    }
    this.#technicalSpeciality = technicalSpeciality.trim();
  }

  setAvailable(available) {
    this.#available = Boolean(available);
  }

  startWork(request) {
    request.startWork(this);
    this.#available = false;
    return request;
  }

  addProgressNote(request, note) {
    request.addProgressNote(note, this);
    return request;
  }

  resolveRequest(request, resolutionSummary) {
    request.resolve(resolutionSummary, this);
    this.#available = true;
    return request;
  }

  toJSON() {
    return { ...super.toJSON(), technicalSpeciality: this.#technicalSpeciality, available: this.#available };
  }

  static fromJSON(data) {
    return new Technician(data.userId, data.firstName, data.lastName, data.email, data.technicalSpeciality, data.available);
  }
}

module.exports = Technician;