'use strict';

const User = require('./User');

class StudentRequester extends User {
  #programme;
  #yearLevel;

  constructor(userId, firstName, lastName, email, programme, yearLevel) {
    super(userId, firstName, lastName, email, 'Student');
    this.setProgramme(programme);
    this.setYearLevel(yearLevel);
  }

  getProgramme() {
    return this.#programme;
  }

  getYearLevel() {
    return this.#yearLevel;
  }

  setProgramme(programme) {
    if (typeof programme !== 'string' || programme.trim().length === 0) {
      throw new Error('Validation Error: Programme cannot be empty.');
    }
    this.#programme = programme.trim();
  }

  setYearLevel(yearLevel) {
    const year = Number(yearLevel);
    if (!Number.isInteger(year) || year < 1 || year > 6) {
      throw new Error('Validation Error: Year level must be a whole number between 1 and 6.');
    }
    this.#yearLevel = year;
  }
}

module.exports = StudentRequester;