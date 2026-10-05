'use strict';

const User = require('./User');
const ServiceRequest = require('./ServiceRequest');

class ServiceRequestManager {
  #users;
  #requests;

  constructor() {
    this.#users = [];
    this.#requests = [];
  }

  // ---------------- Users ----------------

  registerUser(user) {
    if (!(user instanceof User)) {
      throw new Error('Validation Error: registerUser() requires a User instance.');
    }
    user.validate();

    const existing = this.findUserById(user.getUserId());
    if (existing) {
      throw new Error(`Validation Error: A user with ID "${user.getUserId()}" is already registered.`);
    }

    this.#users.push(user);
    return user;
  }

  findUserById(userId) {
    return this.#users.find((u) => u.getUserId() === userId);
  }

  getUsersByType(userType) {
    return this.#users.filter((u) => u.getUserType() === userType);
  }

  // ---------------- Requests: create / find ----------------

  submitRequest(request) {
    if (!(request instanceof ServiceRequest)) {
      throw new Error('Validation Error: submitRequest() requires a ServiceRequest instance.');
    }
    request.validate();

    if (this.findRequestById(request.getRequestId())) {
      throw new Error(`Validation Error: A request with ID "${request.getRequestId()}" already exists.`);
    }

    const requester = request.getRequester();
    if (!this.findUserById(requester.getUserId())) {
      throw new Error(
        `Validation Error: Requester "${requester.getUserId()}" must be a registered user before submitting a request.`
      );
    }

    this.#requests.push(request);
    return request;
  }

  findRequestById(requestId) {
    return this.#requests.find((r) => r.getRequestId() === requestId);
  }

  getRequestsByUser(userId) {
    return this.#requests.filter((r) => r.getRequester().getUserId() === userId);
  }

  getRequestsByTechnician(technicianId) {
    return this.#requests.filter((r) => {
      const technician = r.getAssignedTechnician();
      return technician && technician.getUserId() === technicianId;
    });
  }

  getAllRequests() {
    return [...this.#requests];
  }

  // ---------------- Requester-facing actions ----------------

  updateRequest(requestId, userId, changes) {
    const request = this.findRequestById(requestId);
    if (!request) {
      throw new Error(`Validation Error: No request found with ID "${requestId}".`);
    }
    if (request.getRequester().getUserId() !== userId) {
      throw new Error('Validation Error: You can only update your own requests.');
    }
    request.updateDetails(changes);
    return request;
  }

  cancelRequest(requestId, userId) {
    const request = this.findRequestById(requestId);
    if (!request) {
      throw new Error(`Validation Error: No request found with ID "${requestId}".`);
    }
    if (request.getRequester().getUserId() !== userId) {
      throw new Error('Validation Error: You can only cancel your own requests.');
    }
    request.cancelRequest();
    return request;
  }

  // ---------------- Search, filter, sort ----------------

  searchRequests(searchText) {
    const term = (searchText ?? '').trim().toLowerCase();
    if (!term) return this.getAllRequests();
    return this.#requests.filter((r) => {
      return (
        r.getTitle().toLowerCase().includes(term) ||
        r.getDescription().toLowerCase().includes(term) ||
        r.getRequestId().toLowerCase().includes(term)
      );
    });
  }

  filterByCategory(category) {
    return this.#requests.filter((r) => r.getCategory() === category);
  }

  filterByStatus(status) {
    return this.#requests.filter((r) => r.getStatus() === status);
  }

  filterByPriority(priority) {
    return this.#requests.filter((r) => r.getPriority() === priority);
  }

  sortByPriorityScore(requests = this.#requests) {
    return [...requests].sort((a, b) => b.calculatePriorityScore() - a.calculatePriorityScore());
  }

  sortByDateSubmitted(requests = this.#requests, ascending = true) {
    return [...requests].sort((a, b) => {
      const diff = a.getDateSubmitted().getTime() - b.getDateSubmitted().getTime();
      return ascending ? diff : -diff;
    });
  }

  // ---------------- Reporting ----------------

  getRequestSummaryByStatus() {
    const summary = {};
    for (const request of this.#requests) {
      const status = request.getStatus();
      summary[status] = (summary[status] ?? 0) + 1;
    }
    return summary;
  }

  getRequestHistory(requestId) {
    const request = this.findRequestById(requestId);
    if (!request) {
      throw new Error(`Validation Error: No request found with ID "${requestId}".`);
    }
    return request.getHistory();
  }
}

module.exports = ServiceRequestManager;