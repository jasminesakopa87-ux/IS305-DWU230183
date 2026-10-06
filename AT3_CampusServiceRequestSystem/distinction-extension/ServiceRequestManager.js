'use strict';

const UserFactory = require('./UserFactory');
const ServiceRequestFactory = require('./ServiceRequestFactory');

class ServiceRequestManager {
  #users;
  #requests;
  #userRepo;
  #requestRepo;
  #historyRepo;
  #auditRepo;
  #historyCounter;
  #auditCounter;

  constructor({ userRepo, requestRepo, historyRepo, auditRepo }) {
    this.#users = [];
    this.#requests = [];
    this.#userRepo = userRepo;
    this.#requestRepo = requestRepo;
    this.#historyRepo = historyRepo;
    this.#auditRepo = auditRepo;
    this.#historyCounter = 0;
    this.#auditCounter = 0;
  }

  // ---------------- Startup: load everything from disk ----------------
  async init() {
    const userRecords = await this.#userRepo.loadAll();
    this.#users = userRecords.map((data) => UserFactory.createFromData(data));

    const requestRecords = await this.#requestRepo.loadAll();
    this.#requests = requestRecords.map((data) => {
      const requesterRef = { getUserId: () => data.requesterId, getFullName: () => data.requesterName };
      return ServiceRequestFactory.createFromData(data, requesterRef);
    });

    const historyRecords = await this.#historyRepo.loadAll();
    this.#historyCounter = historyRecords.length;

    const auditRecords = await this.#auditRepo.loadAll();
    this.#auditCounter = auditRecords.length;

    return { usersLoaded: this.#users.length, requestsLoaded: this.#requests.length };
  }

  // ---------------- Users ----------------
  async registerUser(user) {
    if (this.findUserById(user.getUserId())) {
      throw new Error(`Validation Error: A user with ID "${user.getUserId()}" is already registered.`);
    }
    this.#users.push(user);
    await this.#userRepo.create(user.toJSON());
    await this.#audit(user.getUserId(), user.getRole(), 'User Registration', null, `Registered as ${user.getRole()}.`);
    return user;
  }

  findUserById(userId) {
    return this.#users.find((u) => u.getUserId() === userId) ?? null;
  }

  getUsersByType(role) {
    return this.#users.filter((u) => u.getRole() === role);
  }

  // ---------------- Requests: create / find ----------------
  async submitRequest(category, commonData, specialisedData) {
    const requester = this.findUserById(commonData.requesterId);
    if (!requester) {
      throw new Error(`Validation Error: Requester "${commonData.requesterId}" must be a registered user.`);
    }
    if (this.findRequestById(commonData.requestId)) {
      throw new Error(`Validation Error: A request with ID "${commonData.requestId}" already exists.`);
    }

    const { ServiceRequestFactoryInput } = { ServiceRequestFactoryInput: { ...commonData, requester } };
    const request = require('./ServiceRequestFactory').createRequest(category, ServiceRequestFactoryInput, specialisedData);

    this.#requests.push(request);
    await this.#requestRepo.create(request.toJSON());
    await this.#appendLatestHistory(request);
    await this.#audit(requester.getUserId(), requester.getRole(), 'Request Creation', request.getRequestId(), `Submitted "${request.getTitle()}".`);
    return request;
  }

  findRequestById(requestId) {
    return this.#requests.find((r) => r.getRequestId() === requestId) ?? null;
  }

  getRequestsByUser(userId) {
    return this.#requests.filter((r) => r.getRequesterId() === userId);
  }

  getRequestsByTechnician(technicianId) {
    return this.#requests.filter((r) => {
      const tech = r.getAssignedTechnician();
      return tech && tech.getUserId() === technicianId;
    });
  }

  getAllRequests() {
    return [...this.#requests];
  }

  // ---------------- Requester-facing actions ----------------
  async updateRequest(requestId, userId, changes) {
    const request = this.#requireRequest(requestId);
    const actor = this.#requireUser(userId);
    request.updateDetails(changes, actor);
    await this.#persistRequest(request);
    await this.#audit(userId, actor.getRole(), 'Request Update', requestId, 'Updated request details.');
    return request;
  }

  async cancelRequest(requestId, userId) {
    const request = this.#requireRequest(requestId);
    const actor = this.#requireUser(userId);
    request.cancelRequest(actor);
    await this.#persistRequest(request);
    await this.#audit(userId, actor.getRole(), 'Request Cancellation', requestId, 'Request cancelled.');
    return request;
  }

  // ---------------- Service Officer workflow ----------------
  async reviewRequest(requestId, officerId) {
    const request = this.#requireRequest(requestId);
    const officer = this.#requireUser(officerId);
    request.review(officer);
    await this.#persistRequest(request);
    await this.#audit(officerId, officer.getRole(), 'Status Change', requestId, 'Request reviewed.');
    return request;
  }

  async assignPriority(requestId, officerId, priority) {
    const request = this.#requireRequest(requestId);
    const officer = this.#requireUser(officerId);
    request.setPriority(priority, officer);
    await this.#persistRequest(request);
    await this.#audit(officerId, officer.getRole(), 'Priority Change', requestId, `Priority set to ${priority}.`);
    return request;
  }

  async assignTechnician(requestId, officerId, technicianId) {
    const request = this.#requireRequest(requestId);
    const officer = this.#requireUser(officerId);
    const technician = this.#requireUser(technicianId);
    request.assignTechnician(technician, officer);
    await this.#persistRequest(request);
    await this.#audit(officerId, officer.getRole(), 'Technician Assignment', requestId, `Assigned to ${technician.getFullName()}.`);
    return request;
  }

  async closeRequest(requestId, officerId) {
    const request = this.#requireRequest(requestId);
    const officer = this.#requireUser(officerId);
    request.close(officer);
    await this.#persistRequest(request);
    await this.#audit(officerId, officer.getRole(), 'Request Closure', requestId, 'Request closed.');
    return request;
  }

  // ---------------- Technician workflow ----------------
  async startWork(requestId, technicianId) {
    const request = this.#requireRequest(requestId);
    const technician = this.#requireUser(technicianId);
    technician.startWork(request);
    await this.#persistRequest(request);
    await this.#audit(technicianId, technician.getRole(), 'Status Change', requestId, 'Work started.');
    return request;
  }

  async addProgressNote(requestId, technicianId, note) {
    const request = this.#requireRequest(requestId);
    const technician = this.#requireUser(technicianId);
    technician.addProgressNote(request, note);
    await this.#persistRequest(request);
    await this.#audit(technicianId, technician.getRole(), 'Request Update', requestId, `Progress note: ${note}`);
    return request;
  }

  async resolveRequest(requestId, technicianId, resolutionSummary) {
    const request = this.#requireRequest(requestId);
    const technician = this.#requireUser(technicianId);
    technician.resolveRequest(request, resolutionSummary);
    await this.#persistRequest(request);
    await this.#audit(technicianId, technician.getRole(), 'Request Resolution', requestId, 'Request resolved.');
    return request;
  }

  // ---------------- Search, filter, sort ----------------
  searchRequests(searchText) {
    const term = (searchText ?? '').trim().toLowerCase();
    if (!term) return this.getAllRequests();
    return this.#requests.filter(
      (r) => r.getTitle().toLowerCase().includes(term) || r.getRequestId().toLowerCase().includes(term)
    );
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

  getRequestSummaryByStatus() {
    const summary = {};
    for (const request of this.#requests) {
      summary[request.getStatus()] = (summary[request.getStatus()] ?? 0) + 1;
    }
    return summary;
  }

  getRequestHistory(requestId) {
    return this.#requireRequest(requestId).getHistory();
  }

  get auditRepository() {
    return this.#auditRepo;
  }

  // ---------------- Private helpers ----------------
  #requireRequest(requestId) {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`Validation Error: No request found with ID "${requestId}".`);
    return request;
  }

  #requireUser(userId) {
    const user = this.findUserById(userId);
    if (!user) throw new Error(`Validation Error: No user found with ID "${userId}".`);
    return user;
  }

  async #persistRequest(request) {
    await this.#requestRepo.replace(request.getRequestId(), request.toJSON());
    await this.#appendLatestHistory(request);
  }

  async #appendLatestHistory(request) {
    const entries = request.getHistory();
    const latest = entries[entries.length - 1];
    if (!latest) return;
    this.#historyCounter += 1;
    await this.#historyRepo.create({
      historyId: `HIST-${this.#historyCounter}`,
      requestId: request.getRequestId(),
      previousStatus: latest.previousStatus,
      newStatus: latest.newStatus,
      action: latest.action,
      actorId: latest.actorId,
      actorRole: latest.actorRole,
      timestamp: latest.timestamp.toISOString(),
    });
  }

  async #audit(actorId, actorRole, action, requestId, description) {
    this.#auditCounter += 1;
    await this.#auditRepo.create({
      auditId: `AUD-${this.#auditCounter}`,
      actorId,
      actorRole,
      action,
      requestId,
      description,
      timestamp: new Date().toISOString(),
      outcome: 'Success',
    });
  }
}

module.exports = ServiceRequestManager;