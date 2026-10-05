'use strict';

const User = require('./User');

class StaffRequester extends User {
  #department;

  constructor(userId, firstName, lastName, email, department) {
    super(userId, firstName, lastName, email, 'Staff');
    this.setDepartment(department);
  }

  getDepartment() { return this.#department; }
  getRole() { return 'Staff Requester'; }

  setDepartment(department) {
    if (typeof department !== 'string' || department.trim().length === 0) {
      throw new Error('Validation Error: Department cannot be empty.');
    }
    this.#department = department.trim();
  }

  toJSON() {
    return { ...super.toJSON(), department: this.#department };
  }

  static fromJSON(data) {
    return new StaffRequester(data.userId, data.firstName, data.lastName, data.email, data.department);
  }
}

module.exports = StaffRequester;