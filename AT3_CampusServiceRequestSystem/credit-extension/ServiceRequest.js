'use strict';

const User = require('./User');

const CATEGORIES = [
  'ICT Support',
  'Facilities Maintenance',
  'Cleaning and Sanitation',
  'General Campus Service',
];

const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const STATUSES = ['Submitted', 'Cancelled'];

class ServiceRequest {
  #requestId;
  #requester;
  #title;
  #description;
  #location;
  #category;
  #priority;
  #status;
  #dateSubmitted;
  #dateUpdated;

  constructor(requestId, requester, title, description, location, category, priority) {
    this.#requestId = requestId;
    this.#requester = requester;
    this.#title = title;
    this.#description = description;
    this.#location = location;
    this.#category = category;
    this.#priority = priority;
    this.#status = 'Submitted';
    this.#dateSubmitted = new Date();
    this.#dateUpdated = new Date();

    this.validate();
  }

  getRequestId() {
    return this.#requestId;
  }

  getRequester() {
    return this.#requester;
  }

  getTitle() {
    return this.#title;
  }

  getDescription() {
    return this.#description;
  }

  getLocation() {
    return this.#location;
  }

  getCategory() {
    return this.#category;
  }

  getPriority() {
    return this.#priority;
  }

  getStatus() {
    return this.#status;
  }

  getDateSubmitted() {
    return this.#dateSubmitted;
  }

  getDateUpdated() {
    return this.#dateUpdated;
  }

    setTitle(title) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Validation Error: Request title cannot be empty.');
    }
    this.#title = title.trim();
  }

  setDescription(description) {
    if (typeof description !== 'string' || description.trim().length === 0) {
      throw new Error('Validation Error: Request description cannot be empty.');
    }
    this.#description = description.trim();
  }

  setLocation(location) {
    if (typeof location !== 'string' || location.trim().length === 0) {
      throw new Error('Validation Error: Campus location cannot be empty.');
    }
    this.#location = location.trim();
  }

  setCategory(category) {
    if (!CATEGORIES.includes(category)) {
      throw new Error(`Validation Error: "${category}" is not a supported category.`);
    }
    this.#category = category;
  }

  setPriority(priority) {
    if (!PRIORITIES.includes(priority)) {
      throw new Error(`Validation Error: "${priority}" is not a supported priority.`);
    }
    this.#priority = priority;
  }

    validate() {
    if (typeof this.#requestId !== 'string' || this.#requestId.trim().length === 0) {
      throw new Error('Validation Error: Request ID is required.');
    }
    if (!(this.#requester instanceof User)) {
      throw new Error('Validation Error: A valid requester (User) is required.');
    }
    if (typeof this.#title !== 'string' || this.#title.trim().length === 0) {
      throw new Error('Validation Error: Request title is required.');
    }
    if (typeof this.#description !== 'string' || this.#description.trim().length === 0) {
      throw new Error('Validation Error: Request description is required.');
    }
    if (typeof this.#location !== 'string' || this.#location.trim().length === 0) {
      throw new Error('Validation Error: Campus location is required.');
    }
    if (!CATEGORIES.includes(this.#category)) {
      throw new Error(`Validation Error: "${this.#category}" is not a supported category.`);
    }
    if (!PRIORITIES.includes(this.#priority)) {
      throw new Error(`Validation Error: "${this.#priority}" is not a supported priority.`);
    }
    return true;
  }

    updateDetails(changes = {}) {
    if (this.#status === 'Cancelled') {
      throw new Error('Validation Error: A cancelled request cannot be updated.');
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'title')) {
      this.setTitle(changes.title);
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'description')) {
      this.setDescription(changes.description);
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'location')) {
      this.setLocation(changes.location);
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'category')) {
      this.setCategory(changes.category);
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'priority')) {
      this.setPriority(changes.priority);
    }
    this.#dateUpdated = new Date();
    return this;
  }

  cancelRequest() {
    if (this.#status === 'Cancelled') {
      throw new Error(`Validation Error: Request ${this.#requestId} is already Cancelled.`);
    }
    this.#status = 'Cancelled';
    this.#dateUpdated = new Date();
    return this;
  }

  getRequestSummary() {
    return (
      `[${this.#requestId}] ${this.#title}\n` +
      `  Requester   : ${this.#requester.getFullName()} (${this.#requester.getUserId()})\n` +
      `  Category    : ${this.#category}\n` +
      `  Priority    : ${this.#priority}\n` +
      `  Status      : ${this.#status}\n` +
      `  Location    : ${this.#location}\n` +
      `  Description : ${this.#description}`
    );
  }
}

module.exports = ServiceRequest;
module.exports.CATEGORIES = CATEGORIES;
module.exports.PRIORITIES = PRIORITIES;