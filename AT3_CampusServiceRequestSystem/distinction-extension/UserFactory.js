'use strict';

const StudentRequester = require('./StudentRequester');
const StaffRequester = require('./StaffRequester');
const ServiceOfficer = require('./ServiceOfficer');
const Technician = require('./Technician');

const CLASS_BY_ROLE = {
  'Student Requester': StudentRequester,
  'Staff Requester': StaffRequester,
  'Service Officer': ServiceOfficer,
  'Technician': Technician,
};

class UserFactory {
  static createFromData(savedData) {
    const UserClass = CLASS_BY_ROLE[savedData.role];
    if (!UserClass) {
      throw new Error(`Validation Error: Cannot restore unknown user role "${savedData.role}".`);
    }
    return UserClass.fromJSON(savedData);
  }
}

module.exports = UserFactory;