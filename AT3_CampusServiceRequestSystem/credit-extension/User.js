'use strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class User {
  #userId;
  #firstName;
  #lastName;
  #email;
  #userType;

  constructor(userId, firstName, lastName, email, userType) {
    this.#userId = userId;
    this.#firstName = firstName;
    this.#lastName = lastName;
    this.#email = email;
    this.#userType = userType;

    this.validate();
  }
    getUserId() {
    return this.#userId;
  }

  getFirstName() {
    return this.#firstName;
  }

  getLastName() {
    return this.#lastName;
  }

  getEmail() {
    return this.#email;
  }

  getUserType() {
    return this.#userType;
  }
    setFirstName(firstName) {
    if (typeof firstName !== 'string' || firstName.trim().length === 0) {
      throw new Error('Validation Error: First name cannot be empty.');
    }
    this.#firstName = firstName.trim();
  }

  setLastName(lastName) {
    if (typeof lastName !== 'string' || lastName.trim().length === 0) {
      throw new Error('Validation Error: Last name cannot be empty.');
    }
    this.#lastName = lastName.trim();
  }

  setEmail(email) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      throw new Error(`Validation Error: "${email}" is not a valid email address.`);
    }
    this.#email = email.trim().toLowerCase();
  }
    getFullName() {
    return `${this.#firstName} ${this.#lastName}`;
  }

  validate() {
    if (typeof this.#userId !== 'string' || this.#userId.trim().length === 0) {
      throw new Error('Validation Error: User ID is required.');
    }
    if (typeof this.#firstName !== 'string' || this.#firstName.trim().length === 0) {
      throw new Error('Validation Error: First name is required.');
    }
    if (typeof this.#lastName !== 'string' || this.#lastName.trim().length === 0) {
      throw new Error('Validation Error: Last name is required.');
    }
    if (typeof this.#email !== 'string' || !EMAIL_REGEX.test(this.#email.trim())) {
      throw new Error(`Validation Error: "${this.#email}" is not a valid email address.`);
    }
    if (typeof this.#userType !== 'string' || this.#userType.trim().length === 0) {
      throw new Error('Validation Error: User type is required.');
    }
    return true;
  }

  displayInfo() {
    return (
      `User ID   : ${this.#userId}\n` +
      `Name      : ${this.getFullName()}\n` +
      `Email     : ${this.#email}\n` +
      `User Type : ${this.#userType}`
    );
  }
}

module.exports = User;