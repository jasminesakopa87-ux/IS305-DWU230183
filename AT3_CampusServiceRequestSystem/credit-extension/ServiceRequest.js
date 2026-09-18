'use strict';

const User = require('./User');

const CATEGORIES = [
  'ICT Support',
  'Facilities Maintenance',
  'Cleaning and Sanitation',
  'General Campus Service',
];

const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const STATUSES = ['Submitted', 'Reviewed', 'Assigned', 'InProgress', 'Resolved', 'Closed', 'Cancelled'];

const ALLOWED_TRANSITIONS = {
  Submitted: ['Reviewed', 'Cancelled'],
  Reviewed: ['Assigned'],
  Assigned: ['InProgress'],
  InProgress: ['Resolved'],
  Resolved: ['Closed'],
  Closed: [],
  Cancelled: [],
};

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
    #assignedTechnician;
  #progressNotes;
  #resolutionSummary;

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
        this.#assignedTechnician = null;
    this.#progressNotes = [];
    this.#resolutionSummary = null;

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

    getAssignedTechnician() {
    return this.#assignedTechnician;
  }

  getProgressNotes() {
    return [...this.#progressNotes];
  }

  getResolutionSummary() {
    return this.#resolutionSummary;
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
    this.#transitionTo('Cancelled', 'cancel this request');
    return this;
  }

    review() {
    this.#transitionTo('Reviewed', 'review this request');
    return this;
  }

  assignTechnician(technician) {
    this.#assignedTechnician = technician;
    this.#transitionTo('Assigned', 'assign a Technician');
    return this;
  }

  startWork() {
    this.#transitionTo('InProgress', 'start work');
    return this;
  }

  addProgressNote(note) {
    if (typeof note !== 'string' || note.trim().length === 0) {
      throw new Error('Validation Error: Progress note cannot be empty.');
    }
    this.#progressNotes.push(note.trim());
    this.#dateUpdated = new Date();
    return this;
  }

  resolve(resolutionSummary) {
    if (typeof resolutionSummary !== 'string' || resolutionSummary.trim().length === 0) {
      throw new Error('Validation Error: Resolution summary cannot be empty.');
    }
    this.#resolutionSummary = resolutionSummary.trim();
    this.#transitionTo('Resolved', 'resolve this request');
    return this;
  }

  close() {
    this.#transitionTo('Closed', 'close this request');
    return this;
  }

    #transitionTo(nextStatus, actionLabel) {
    const allowed = ALLOWED_TRANSITIONS[this.#status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(
        `Validation Error: Cannot ${actionLabel} - request is "${this.#status}", but that action requires moving to "${nextStatus}" from an allowed status.`
      );
    }
    this.#status = nextStatus;
    this.#dateUpdated = new Date();
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