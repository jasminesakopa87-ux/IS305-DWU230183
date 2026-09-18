'use strict';

const User = require('./User');

class StaffRequester extends User {
  #department;

  constructor(userId, firstName, lastName, email, department) {
    super(userId, firstName, lastName, email, 'Staff');
    this.setDepartment(department);
  }

  getDepartment() {
    return this.#department;
  }

  setDepartment(department) {
    if (typeof department !== 'string' || department.trim().length === 0) {
      throw new Error('Validation Error: Department cannot be empty.');
    }
    this.#department = department.trim();
  }
}

module.exports = StaffRequester;