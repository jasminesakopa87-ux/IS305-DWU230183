'use strict';

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
  #history;

  constructor(requestId, requester, title, description, location, category, priority) {
    if (new.target === ServiceRequest) {
      throw new TypeError('Abstract Class Error: ServiceRequest is abstract and cannot be instantiated directly.');
    }
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
    this.#history = [];

    this.validateCommon();
    this.#addHistory(null, 'Submitted', 'Request submitted.', requester);
  }

  getRequestId() { return this.#requestId; }
  getRequester() { return this.#requester; }
  getRequesterId() { return this.#requester.getUserId(); }
  getTitle() { return this.#title; }
  getDescription() { return this.#description; }
  getLocation() { return this.#location; }
  getCategory() { return this.#category; }
  getPriority() { return this.#priority; }
  getStatus() { return this.#status; }
  getDateSubmitted() { return this.#dateSubmitted; }
  getDateUpdated() { return this.#dateUpdated; }
  getAssignedTechnician() { return this.#assignedTechnician; }
  getProgressNotes() { return [...this.#progressNotes]; }
  getResolutionSummary() { return this.#resolutionSummary; }
  getHistory() { return [...this.#history]; }
  getRequestType() { return this.constructor.name; }

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

  setPriority(priority, actor) {
    this.#requireRole(actor, 'Service Officer', 'Only a Service Officer may change the priority of a request.');
    if (!PRIORITIES.includes(priority)) {
      throw new Error(`Validation Error: "${priority}" is not a supported priority.`);
    }
    this.#priority = priority;
    this.#addHistory(this.#status, this.#status, `Priority changed to ${priority}`, actor);
  }

  validateCommon() {
    if (typeof this.#requestId !== 'string' || this.#requestId.trim().length === 0) {
      throw new Error('Validation Error: Request ID is required.');
    }
    if (!this.#requester || typeof this.#requester.getUserId !== 'function' || typeof this.#requester.getFullName !== 'function') {
      throw new Error('Validation Error: A valid requester is required.');
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

  validateSpecialisedFields() {
    throw new Error('Abstract Method Error: validateSpecialisedFields() must be implemented by a subclass.');
  }

  updateDetails(changes = {}, actor) {
    if (!actor || actor.getUserId() !== this.getRequesterId()) {
      throw new Error('Validation Error: You can only update your own requests.');
    }
    if (this.#status !== 'Submitted') {
      throw new Error('Validation Error: Only a Submitted request can be updated.');
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'title')) this.setTitle(changes.title);
    if (Object.prototype.hasOwnProperty.call(changes, 'description')) this.setDescription(changes.description);
    if (Object.prototype.hasOwnProperty.call(changes, 'location')) this.setLocation(changes.location);
    this.#dateUpdated = new Date();
    this.#addHistory(this.#status, this.#status, 'Request details updated.', actor);
    return this;
  }

  cancelRequest(actor) {
    if (!actor || actor.getUserId() !== this.getRequesterId()) {
      throw new Error('Validation Error: You can only cancel your own requests.');
    }
    const previous = this.#status;
    this.#transitionTo('Cancelled', 'cancel this request');
    this.#addHistory(previous, 'Cancelled', 'Request cancelled by requester.', actor);
    return this;
  }

  review(actor) {
    this.#requireRole(actor, 'Service Officer', 'Only a Service Officer may review a request.');
    const previous = this.#status;
    this.#transitionTo('Reviewed', 'review this request');
    this.#addHistory(previous, 'Reviewed', 'Request reviewed.', actor);
    return this;
  }

  assignTechnician(technician, actor) {
    this.#requireRole(actor, 'Service Officer', 'Only a Service Officer may assign a Technician.');
    if (!technician || typeof technician.getUserId !== 'function') {
      throw new Error('Validation Error: A valid Technician must be provided.');
    }
    this.#assignedTechnician = technician;
    const previous = this.#status;
    this.#transitionTo('Assigned', 'assign a Technician');
    this.#addHistory(previous, 'Assigned', `Assigned to ${technician.getFullName()}.`, actor);
    return this;
  }

  startWork(technician) {
    this.#requireAssignedTechnician(technician);
    const previous = this.#status;
    this.#transitionTo('InProgress', 'start work');
    this.#addHistory(previous, 'InProgress', 'Work started.', technician);
    return this;
  }

  addProgressNote(note, technician) {
    this.#requireAssignedTechnician(technician);
    if (typeof note !== 'string' || note.trim().length === 0) {
      throw new Error('Validation Error: Progress note cannot be empty.');
    }
    this.#progressNotes.push({ note: note.trim(), timestamp: new Date() });
    this.#dateUpdated = new Date();
    this.#addHistory(this.#status, this.#status, `Progress note: ${note.trim()}`, technician);
    return this;
  }

  resolve(resolutionSummary, technician) {
    this.#requireAssignedTechnician(technician);
    if (typeof resolutionSummary !== 'string' || resolutionSummary.trim().length === 0) {
      throw new Error('Validation Error: Resolution summary cannot be empty.');
    }
    this.#resolutionSummary = resolutionSummary.trim();
    const previous = this.#status;
    this.#transitionTo('Resolved', 'resolve this request');
    this.#addHistory(previous, 'Resolved', 'Request resolved.', technician);
    return this;
  }

  close(actor) {
    this.#requireRole(actor, 'Service Officer', 'Only a Service Officer may close a Resolved request.');
    if (this.#status !== 'Resolved') {
      throw new Error('Validation Error: Only a Resolved request can be closed.');
    }
    const previous = this.#status;
    this.#transitionTo('Closed', 'close this request');
    this.#addHistory(previous, 'Closed', 'Request closed and verified.', actor);
    return this;
  }

  #transitionTo(nextStatus, actionLabel) {
    const allowed = ALLOWED_TRANSITIONS[this.#status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(
        `Validation Error: Cannot ${actionLabel} - request is currently "${this.#status}", which does not allow moving to "${nextStatus}".`
      );
    }
    this.#status = nextStatus;
    this.#dateUpdated = new Date();
  }

  #requireRole(actor, roleName, message) {
    if (!actor || typeof actor.getRole !== 'function' || actor.getRole() !== roleName) {
      throw new Error(`Validation Error: ${message}`);
    }
  }

  #requireAssignedTechnician(technician) {
    if (
      !technician ||
      typeof technician.getUserId !== 'function' ||
      !this.#assignedTechnician ||
      technician.getUserId() !== this.#assignedTechnician.getUserId()
    ) {
      throw new Error('Validation Error: Only the Technician assigned to this request may perform this action.');
    }
  }

  #addHistory(previousStatus, newStatus, action, actor) {
    this.#history.push({
      previousStatus,
      newStatus,
      action,
      actorId: actor && typeof actor.getUserId === 'function' ? actor.getUserId() : null,
      actorRole: actor && typeof actor.getRole === 'function' ? actor.getRole() : null,
      timestamp: new Date(),
    });
  }

  calculatePriorityScore() {
    throw new Error('Abstract Method Error: calculatePriorityScore() must be implemented by a subclass.');
  }

  getTargetResolutionHours() {
    throw new Error('Abstract Method Error: getTargetResolutionHours() must be implemented by a subclass.');
  }

  getRequestSummary() {
    throw new Error('Abstract Method Error: getRequestSummary() must be implemented by a subclass.');
  }

  getBasePriorityScore() {
    const weights = { Low: 1, Normal: 2, High: 3, Urgent: 4 };
    return weights[this.#priority] ?? 0;
  }

  getBaseSummary() {
    return (
      `[${this.#requestId}] ${this.#title}\n` +
      `  Type        : ${this.getRequestType()}\n` +
      `  Category    : ${this.#category}\n` +
      `  Requester ID: ${this.getRequesterId()} (${this.#requester.getFullName()})\n` +
      `  Priority    : ${this.#priority}\n` +
      `  Status      : ${this.#status}\n` +
      `  Location    : ${this.#location}\n` +
      `  Technician  : ${this.#assignedTechnician ? this.#assignedTechnician.getFullName() : 'Unassigned'}\n` +
      `  Submitted   : ${this.#dateSubmitted.toLocaleString()}\n` +
      `  Description : ${this.#description}`
    );
  }

  toJSON() {
    return {
      requestId: this.#requestId,
      requestType: this.getRequestType(),
      requesterId: this.getRequesterId(),
      requesterName: this.#requester.getFullName(),
      title: this.#title,
      description: this.#description,
      location: this.#location,
      category: this.#category,
      priority: this.#priority,
      status: this.#status,
      assignedTechnicianId: this.#assignedTechnician ? this.#assignedTechnician.getUserId() : null,
      assignedTechnicianName: this.#assignedTechnician ? this.#assignedTechnician.getFullName() : null,
      progressNotes: this.#progressNotes.map((p) => ({ note: p.note, timestamp: p.timestamp.toISOString() })),
      resolutionSummary: this.#resolutionSummary,
      dateSubmitted: this.#dateSubmitted.toISOString(),
      dateUpdated: this.#dateUpdated.toISOString(),
      history: this.#history.map((h) => ({ ...h, timestamp: h.timestamp.toISOString() })),
    };
  }

  _restoreState(savedData) {
    this.#status = savedData.status;
    this.#dateSubmitted = new Date(savedData.dateSubmitted);
    this.#dateUpdated = new Date(savedData.dateUpdated);
    this.#resolutionSummary = savedData.resolutionSummary ?? null;
    this.#progressNotes = (savedData.progressNotes ?? []).map((p) => ({ note: p.note, timestamp: new Date(p.timestamp) }));
    this.#history = (savedData.history ?? []).map((h) => ({ ...h, timestamp: new Date(h.timestamp) }));
    if (savedData.assignedTechnicianId) {
      const techId = savedData.assignedTechnicianId;
      const techName = savedData.assignedTechnicianName;
      this.#assignedTechnician = { getUserId: () => techId, getFullName: () => techName, getRole: () => 'Technician' };
    } else {
      this.#assignedTechnician = null;
    }
    return this;
  }
}

module.exports = ServiceRequest;
module.exports.CATEGORIES = CATEGORIES;
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;