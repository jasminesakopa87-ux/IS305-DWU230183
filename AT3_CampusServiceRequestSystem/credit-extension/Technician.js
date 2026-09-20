'use strict';

const User = require('./User');

class Technician extends User {
  #technicalSpeciality;
  #available;

  constructor(userId, firstName, lastName, email, technicalSpeciality) {
    super(userId, firstName, lastName, email, 'Technician');
    this.setTechnicalSpeciality(technicalSpeciality);
    this.#available = true;
  }

  getTechnicalSpeciality() {
    return this.#technicalSpeciality;
  }

  isAvailable() {
    return this.#available;
  }

  setTechnicalSpeciality(technicalSpeciality) {
    if (typeof technicalSpeciality !== 'string' || technicalSpeciality.trim().length === 0) {
      throw new Error('Validation Error: Technical speciality cannot be empty.');
    }
    this.#technicalSpeciality = technicalSpeciality.trim();
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
}

module.exports = Technician;