'use strict';

const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const path = require('node:path');

const StudentRequester = require('./StudentRequester');
const StaffRequester = require('./StaffRequester');
const ServiceOfficer = require('./ServiceOfficer');
const Technician = require('./Technician');

const { CATEGORIES, PRIORITIES, STATUSES } = require('./ServiceRequest');
const { DEVICE_TYPES } = require('./ICTSupportRequest');
const { HAZARD_LEVELS } = require('./MaintenanceRequest');

const ServiceRequestManager = require('./ServiceRequestManager');
const ReportService = require('./ReportService');

const UserFileRepository = require('./repositories/UserFileRepository');
const ServiceRequestFileRepository = require('./repositories/ServiceRequestFileRepository');
const RequestHistoryFileRepository = require('./repositories/RequestHistoryFileRepository');
const AuditFileRepository = require('./repositories/AuditFileRepository');

const DATA_DIR = path.join(__dirname, 'data');

const rl = readline.createInterface({ input, output });

const manager = new ServiceRequestManager({
  userRepo: new UserFileRepository(path.join(DATA_DIR, 'users.json')),
  requestRepo: new ServiceRequestFileRepository(path.join(DATA_DIR, 'serviceRequests.json')),
  historyRepo: new RequestHistoryFileRepository(path.join(DATA_DIR, 'requestHistory.json')),
  auditRepo: new AuditFileRepository(path.join(DATA_DIR, 'auditLog.json')),
});
const reportService = new ReportService(manager);

const MENU_TEXT = `
============================================
 CAMPUS SERVICE REQUEST SYSTEM (DISTINCTION)
============================================
 1. Register User
 2. Submit Service Request
 3. View Request by ID
 4. View My Requests
 5. View All Requests
 6. Update My Request
 7. Cancel My Request
 8. Search Requests
 9. View Request Summary
10. Service Officer Actions
11. Technician Actions
12. View Request History
13. View Management Reports
14. View Audit Log
15. Filter / Sort Requests
16. Exit
============================================`;

async function ask(question) {
  const answer = await rl.question(question);
  return answer.trim();
}

async function askRequired(question) {
  let value = '';
  while (!value) {
    value = await ask(question);
    if (!value) console.log('  This field is required. Please try again.');
  }
  return value;
}

async function askFromList(question, options) {
  console.log(question);
  options.forEach((opt, idx) => console.log(`  ${idx + 1}. ${opt}`));
  while (true) {
    const raw = await ask('Enter a number: ');
    const choice = Number(raw);
    if (Number.isInteger(choice) && choice >= 1 && choice <= options.length) {
      return options[choice - 1];
    }
    console.log(`  Please enter a number between 1 and ${options.length}.`);
  }
}

async function askYesNo(question) {
  const answer = (await ask(`${question} (y/n): `)).toLowerCase();
  return answer.startsWith('y');
}

async function safely(action) {
  try {
    await action();
  } catch (err) {
    console.log(`\n${err.message}`);
  }
}

function printRequestList(requests) {
  if (requests.length === 0) {
    console.log('(no requests found)');
    return;
  }
  console.log('--------------------------------------------------------');
  requests.forEach((r) => {
    console.log(r.getRequestSummary());
    console.log('--------------------------------------------------------');
  });
}

function printRankedList(requests, describe) {
  if (requests.length === 0) {
    console.log('(no requests found)');
    return;
  }
  requests.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.getRequestId()}] ${r.getTitle()} - ${describe(r)}`);
  });
}

// ---------------- Option 1 ----------------
async function registerUserFlow() {
  console.log('\n--- Register User ---');
  const role = await askFromList('Select a role:', [
    'Student Requester', 'Staff Requester', 'Service Officer', 'Technician',
  ]);
  const userId = await askRequired('User ID: ');
  const firstName = await askRequired('First name: ');
  const lastName = await askRequired('Last name: ');
  const email = await askRequired('Email address: ');

  let user;
  if (role === 'Student Requester') {
    const programme = await askRequired('Programme: ');
    const yearLevel = await askRequired('Year level: ');
    user = new StudentRequester(userId, firstName, lastName, email, programme, yearLevel);
  } else if (role === 'Staff Requester') {
    const department = await askRequired('Department: ');
    user = new StaffRequester(userId, firstName, lastName, email, department);
  } else if (role === 'Service Officer') {
    const serviceSection = await askRequired('Service section (e.g. ICT, Facilities): ');
    user = new ServiceOfficer(userId, firstName, lastName, email, serviceSection);
  } else {
    const speciality = await askRequired('Technical speciality (e.g. Networking, Electrical): ');
    user = new Technician(userId, firstName, lastName, email, speciality);
  }

  await manager.registerUser(user);
  console.log(`\nUser registered successfully:\n${user.displayInfo()}`);
}

// ---------------- Option 2 ----------------
async function submitRequestFlow() {
  console.log('\n--- Submit Service Request ---');
  const requesterId = await askRequired('Your User ID: ');
  const requester = manager.findUserById(requesterId);
  if (!requester) {
    console.log(`No registered user found with ID "${requesterId}". Please register first.`);
    return;
  }

  const requestId = await askRequired('New Request ID: ');
  const title = await askRequired('Title: ');
  const description = await askRequired('Description: ');
  const location = await askRequired('Campus location: ');
  const priority = await askFromList('Select a priority:', PRIORITIES);
  const category = await askFromList('Select a category:', CATEGORIES);

  const commonData = { requestId, requesterId, title, description, location, priority };
  let specialisedData = {};

  if (category === 'ICT Support') {
    specialisedData.deviceType = await askFromList('Device type:', DEVICE_TYPES);
    specialisedData.systemName = await askRequired('System/service name: ');
    specialisedData.faultType = await askFromList('Fault type:', ['Hardware', 'Software', 'Network', 'Account/Access', 'Other']);
    specialisedData.networkImpact = await askYesNo('Does this affect the network for multiple users?');
  } else if (category === 'Facilities Maintenance') {
    specialisedData.building = await askRequired('Building: ');
    specialisedData.roomNumber = await askRequired('Room number: ');
    specialisedData.hazardLevel = await askFromList('Hazard level:', HAZARD_LEVELS);
    specialisedData.equipmentAffected = await ask('Equipment affected (optional): ');
  } else if (category === 'Cleaning and Sanitation') {
    specialisedData.cleaningArea = await askRequired('Cleaning area: ');
    specialisedData.hygieneRisk = await askYesNo('Is this a hygiene risk (spill, waste)?');
    specialisedData.serviceType = await ask('Service type (optional): ');
    specialisedData.preferredServiceTime = await ask('Preferred service time (optional): ');
  } else {
    specialisedData.generalServiceType = await askRequired('General service type: ');
  }

  const request = await manager.submitRequest(category, commonData, specialisedData);
  console.log(`\nRequest submitted successfully:\n${request.getRequestSummary()}`);
}

async function viewRequestByIdFlow() {
  console.log('\n--- View Request by ID ---');
  const requestId = await askRequired('Request ID: ');
  const request = manager.findRequestById(requestId);
  if (!request) console.log(`No request found with ID "${requestId}".`);
  else console.log(`\n${request.getRequestSummary()}`);
}

async function viewMyRequestsFlow() {
  console.log('\n--- View My Requests ---');
  const userId = await askRequired('Your User ID: ');
  printRequestList(manager.getRequestsByUser(userId));
}

async function viewAllRequestsFlow() {
  console.log('\n--- View All Requests ---');
  printRequestList(manager.getAllRequests());
}

async function updateRequestFlow() {
  console.log('\n--- Update My Request ---');
  const userId = await askRequired('Your User ID: ');
  const requestId = await askRequired('Request ID to update: ');
  console.log('Leave a field blank to keep its current value.');
  const title = await ask('New title: ');
  const description = await ask('New description: ');
  const location = await ask('New campus location: ');
  const changes = {};
  if (title) changes.title = title;
  if (description) changes.description = description;
  if (location) changes.location = location;
  const updated = await manager.updateRequest(requestId, userId, changes);
  console.log(`\nRequest updated successfully:\n${updated.getRequestSummary()}`);
}

async function cancelRequestFlow() {
  console.log('\n--- Cancel My Request ---');
  const userId = await askRequired('Your User ID: ');
  const requestId = await askRequired('Request ID to cancel: ');
  const cancelled = await manager.cancelRequest(requestId, userId);
  console.log(`\nRequest ${cancelled.getRequestId()} is now "${cancelled.getStatus()}".`);
}

async function searchRequestsFlow() {
  console.log('\n--- Search Requests ---');
  const term = await askRequired('Enter a keyword (title or ID): ');
  printRequestList(manager.searchRequests(term));
}

async function viewSummaryFlow() {
  console.log('\n--- Request Summary by Status ---');
  const summary = manager.getRequestSummaryByStatus();
  const statuses = Object.keys(summary);
  if (statuses.length === 0) console.log('No requests have been submitted yet.');
  else for (const [status, count] of Object.entries(summary)) console.log(`  ${status.padEnd(12)}: ${count}`);
}

// ---------------- Option 10: Service Officer Actions ----------------
async function serviceOfficerFlow() {
  console.log('\n--- Service Officer Actions ---');
  const officerId = await askRequired('Your Service Officer User ID: ');
  const officer = manager.findUserById(officerId);
  if (!officer || officer.getRole() !== 'Service Officer') {
    console.log(`No Service Officer found with ID "${officerId}".`);
    return;
  }

  let inSubmenu = true;
  while (inSubmenu) {
    const action = await askFromList('\nChoose an action:', [
      'Review a request', 'Assign priority', 'Assign a Technician', 'Close a resolved request', 'Back to Main Menu',
    ]);

    if (action === 'Review a request') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        const request = await manager.reviewRequest(requestId, officerId);
        console.log(`\nRequest ${requestId} reviewed. Status: ${request.getStatus()}`);
      });
    } else if (action === 'Assign priority') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        const priority = await askFromList('Select new priority:', PRIORITIES);
        await manager.assignPriority(requestId, officerId, priority);
        console.log(`\nPriority updated to ${priority}.`);
      });
    } else if (action === 'Assign a Technician') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        const technicianId = await askRequired('Technician User ID: ');
        const request = await manager.assignTechnician(requestId, officerId, technicianId);
        console.log(`\nRequest ${requestId} assigned. Status: ${request.getStatus()}`);
      });
    } else if (action === 'Close a resolved request') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        await manager.closeRequest(requestId, officerId);
        console.log(`\nRequest ${requestId} closed.`);
      });
    } else {
      inSubmenu = false;
    }
  }
}

// ---------------- Option 11: Technician Actions ----------------
async function technicianFlow() {
  console.log('\n--- Technician Actions ---');
  const technicianId = await askRequired('Your Technician User ID: ');
  const technician = manager.findUserById(technicianId);
  if (!technician || technician.getRole() !== 'Technician') {
    console.log(`No Technician found with ID "${technicianId}".`);
    return;
  }

  let inSubmenu = true;
  while (inSubmenu) {
    const action = await askFromList('\nChoose an action:', [
      'View my assigned requests', 'Start work on a request', 'Add a progress note', 'Resolve a request', 'Back to Main Menu',
    ]);

    if (action === 'View my assigned requests') {
      printRequestList(manager.getRequestsByTechnician(technicianId));
    } else if (action === 'Start work on a request') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        await manager.startWork(requestId, technicianId);
        console.log(`\nWork started on request ${requestId}.`);
      });
    } else if (action === 'Add a progress note') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        const note = await askRequired('Progress note: ');
        await manager.addProgressNote(requestId, technicianId, note);
        console.log(`\nProgress note added to request ${requestId}.`);
      });
    } else if (action === 'Resolve a request') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        const summary = await askRequired('Resolution summary: ');
        await manager.resolveRequest(requestId, technicianId, summary);
        console.log(`\nRequest ${requestId} marked Resolved.`);
      });
    } else {
      inSubmenu = false;
    }
  }
}

async function viewHistoryFlow() {
  console.log('\n--- View Request History ---');
  const requestId = await askRequired('Request ID: ');
  const history = manager.getRequestHistory(requestId);
  history.forEach((entry, i) => {
    console.log(`  ${i + 1}. [${entry.newStatus}] ${entry.action} (actor: ${entry.actorId ?? 'n/a'}) - ${new Date(entry.timestamp).toLocaleString()}`);
  });
}

// ---------------- Option 13: Management Reports ----------------
async function viewReportsFlow() {
  const report = reportService.fullReport();
  console.log('\n============== MANAGEMENT REPORTS ==============');
  console.log(`Generated at        : ${report.generatedAt}`);
  console.log(`Total requests      : ${report.totalRequests}`);
  console.log(`Total users         : ${report.totalUsers}`);
  console.log(`Average resolution  : ${report.averageResolutionHours}h`);
  console.log(`Urgent requests     : ${report.urgentCount}`);
  console.log(`Overdue requests    : ${report.overdueCount}`);
  console.log('\nRequests by status:');
  for (const [k, v] of Object.entries(report.byStatus)) console.log(`  ${k.padEnd(12)}: ${v}`);
  console.log('\nRequests by category:');
  for (const [k, v] of Object.entries(report.byCategory)) console.log(`  ${k.padEnd(26)}: ${v}`);
  console.log('\nRequests by priority:');
  for (const [k, v] of Object.entries(report.byPriority)) console.log(`  ${k.padEnd(10)}: ${v}`);
  console.log('\nRequests assigned to each Technician (all statuses):');
  for (const [k, v] of Object.entries(report.requestsByTechnician)) console.log(`  ${k}: ${v}`);
  console.log('\nCompleted requests by Technician:');
  for (const [k, v] of Object.entries(report.completedByTechnician)) console.log(`  ${k}: ${v}`);
  console.log('\nRequest volume by campus location:');
  report.volumeByLocation.forEach((row) => console.log(`  ${row.location.padEnd(20)}: ${row.count}`));
}

// ---------------- Option 14: Audit Log ----------------
async function viewAuditLogFlow() {
  console.log('\n--- View Audit Log ---');
  const filterChoice = await askFromList('Filter by:', ['All entries', 'Request ID', 'Actor ID']);
  let entries = await manager.auditRepository.loadAll();
  if (filterChoice === 'Request ID') {
    const requestId = await askRequired('Request ID: ');
    entries = entries.filter((e) => e.requestId === requestId);
  } else if (filterChoice === 'Actor ID') {
    const actorId = await askRequired('Actor ID: ');
    entries = entries.filter((e) => e.actorId === actorId);
  }
  if (entries.length === 0) {
    console.log('(no audit entries found)');
    return;
  }
  entries.forEach((e) => {
    console.log(`  [${e.auditId}] ${e.timestamp} | ${e.actorId ?? 'n/a'} (${e.actorRole ?? 'n/a'}) | ${e.action} | Request: ${e.requestId ?? 'n/a'} | ${e.description} | ${e.outcome}`);
  });
}

// ---------------- Option 15: Filter / Sort Requests ----------------
async function filterSortFlow() {
  console.log('\n--- Filter / Sort Requests ---');
  const action = await askFromList('Choose an option:', [
    'Filter by category',
    'Filter by status',
    'Filter by priority',
    'Filter by assigned Technician',
    'Sort by date submitted (oldest first)',
    'Sort by date submitted (newest first)',
    'Sort by priority score (highest first)',
  ]);

  if (action === 'Filter by category') {
    const category = await askFromList('Select a category:', CATEGORIES);
    printRequestList(manager.filterByCategory(category));
  } else if (action === 'Filter by status') {
    const status = await askFromList('Select a status:', STATUSES);
    printRequestList(manager.filterByStatus(status));
  } else if (action === 'Filter by priority') {
    const priority = await askFromList('Select a priority:', PRIORITIES);
    printRequestList(manager.filterByPriority(priority));
  } else if (action === 'Filter by assigned Technician') {
    const technicianId = await askRequired('Technician User ID: ');
    printRequestList(manager.getRequestsByTechnician(technicianId));
  } else if (action === 'Sort by date submitted (oldest first)') {
    printRankedList(manager.sortByDateSubmitted(undefined, true), (r) => r.getDateSubmitted().toLocaleString());
  } else if (action === 'Sort by date submitted (newest first)') {
    printRankedList(manager.sortByDateSubmitted(undefined, false), (r) => r.getDateSubmitted().toLocaleString());
  } else {
    printRankedList(
      manager.sortByPriorityScore(),
      (r) => `score ${r.calculatePriorityScore()} (${r.getPriority()}, ${r.getCategory()})`
    );
  }
}

// ---------------- Main loop ----------------
async function main() {
  await safely(async () => {
    const result = await manager.init();
    console.log(`Loaded ${result.usersLoaded} user(s) and ${result.requestsLoaded} request(s) from ${DATA_DIR}.`);
  });

  let running = true;
  while (running) {
    console.log(MENU_TEXT);
    const choice = await ask('Enter your choice (1-16): ');

    if (choice === '1') await safely(registerUserFlow);
    else if (choice === '2') await safely(submitRequestFlow);
    else if (choice === '3') await safely(viewRequestByIdFlow);
    else if (choice === '4') await safely(viewMyRequestsFlow);
    else if (choice === '5') await safely(viewAllRequestsFlow);
    else if (choice === '6') await safely(updateRequestFlow);
    else if (choice === '7') await safely(cancelRequestFlow);
    else if (choice === '8') await safely(searchRequestsFlow);
    else if (choice === '9') await safely(viewSummaryFlow);
    else if (choice === '10') await safely(serviceOfficerFlow);
    else if (choice === '11') await safely(technicianFlow);
    else if (choice === '12') await safely(viewHistoryFlow);
    else if (choice === '13') await safely(viewReportsFlow);
    else if (choice === '14') await safely(viewAuditLogFlow);
    else if (choice === '15') await safely(filterSortFlow);
    else if (choice === '16') {
      console.log('\nGoodbye!');
      running = false;
    } else {
      console.log(`\nYou chose option ${choice} - not wired up yet.`);
    }
  }
  rl.close();
}

main().catch((err) => {
  console.error('\nThe application had to stop:', err.message);
  process.exit(1);
});