'use strict';

const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const StudentRequester = require('./StudentRequester');
const StaffRequester = require('./StaffRequester');
const ServiceOfficer = require('./ServiceOfficer');
const Technician = require('./Technician');

const ServiceRequest = require('./ServiceRequest');
const { CATEGORIES, PRIORITIES } = require('./ServiceRequest');
const ICTSupportRequest = require('./ICTSupportRequest');
const { DEVICE_TYPES } = require('./ICTSupportRequest');
const MaintenanceRequest = require('./MaintenanceRequest');
const { HAZARD_LEVELS } = require('./MaintenanceRequest');
const CleaningRequest = require('./CleaningRequest');

const ServiceRequestManager = require('./ServiceRequestManager');

const rl = readline.createInterface({ input, output });
const manager = new ServiceRequestManager();

const MENU_TEXT = `
============================================
     CAMPUS SERVICE REQUEST SYSTEM
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
13. Exit
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

// ---------------- Option 1 ----------------

async function registerUserFlow() {
  console.log('\n--- Register User ---');
  const role = await askFromList('Select a role:', [
    'Student Requester',
    'Staff Requester',
    'Service Officer',
    'Technician',
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

  manager.registerUser(user);
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

  let request;

  if (category === 'ICT Support') {
    const deviceType = await askFromList('Device type:', DEVICE_TYPES);
    const systemName = await askRequired('System/service name (e.g. Student Portal): ');
    request = new ICTSupportRequest(requestId, requester, title, description, location, priority, deviceType, systemName);
  } else if (category === 'Facilities Maintenance') {
    const building = await askRequired('Building: ');
    const roomNumber = await askRequired('Room number: ');
    const hazardLevel = await askFromList('Hazard level:', HAZARD_LEVELS);
    request = new MaintenanceRequest(requestId, requester, title, description, location, priority, building, roomNumber, hazardLevel);
  } else if (category === 'Cleaning and Sanitation') {
    const cleaningArea = await askRequired('Cleaning area (e.g. Toilet, Cafeteria): ');
    const hygieneRisk = await askYesNo('Is this a hygiene risk (e.g. spill, waste)?');
    request = new CleaningRequest(requestId, requester, title, description, location, priority, cleaningArea, hygieneRisk);
  } else {
    request = new ServiceRequest(requestId, requester, title, description, location, category, priority);
  }

  manager.submitRequest(request);
  console.log(`\nRequest submitted successfully:\n${request.getRequestSummary()}`);
}

// ---------------- Options 3-9 ----------------

async function viewRequestByIdFlow() {
  console.log('\n--- View Request by ID ---');
  const requestId = await askRequired('Request ID: ');
  const request = manager.findRequestById(requestId);
  if (!request) {
    console.log(`No request found with ID "${requestId}".`);
  } else {
    console.log(`\n${request.getRequestSummary()}`);
  }
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

  const updated = manager.updateRequest(requestId, userId, changes);
  console.log(`\nRequest updated successfully:\n${updated.getRequestSummary()}`);
}

async function cancelRequestFlow() {
  console.log('\n--- Cancel My Request ---');
  const userId = await askRequired('Your User ID: ');
  const requestId = await askRequired('Request ID to cancel: ');
  const cancelled = manager.cancelRequest(requestId, userId);
  console.log(`\nRequest ${cancelled.getRequestId()} is now "${cancelled.getStatus()}".`);
}

async function searchRequestsFlow() {
  console.log('\n--- Search Requests ---');
  const term = await askRequired('Enter a keyword (title, description or ID): ');
  printRequestList(manager.searchRequests(term));
}

async function viewSummaryFlow() {
  console.log('\n--- Request Summary by Status ---');
  const summary = manager.getRequestSummaryByStatus();
  const statuses = Object.keys(summary);
  if (statuses.length === 0) {
    console.log('No requests have been submitted yet.');
  } else {
    for (const [status, count] of Object.entries(summary)) {
      console.log(`  ${status.padEnd(12)}: ${count}`);
    }
  }
}

// ---------------- Option 10: Service Officer Actions ----------------

async function serviceOfficerFlow() {
  console.log('\n--- Service Officer Actions ---');
  const officerId = await askRequired('Your Service Officer User ID: ');
  const officer = manager.findUserById(officerId);
  if (!officer || !(officer instanceof ServiceOfficer)) {
    console.log(`No Service Officer found with ID "${officerId}".`);
    return;
  }

  let inSubmenu = true;
  while (inSubmenu) {
    const action = await askFromList('\nChoose an action:', [
      'Review a request',
      'Assign priority',
      'Assign a Technician',
      'Close a resolved request',
      'Back to Main Menu',
    ]);

    if (action === 'Review a request') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        const request = manager.findRequestById(requestId);
        if (!request) throw new Error(`No request found with ID "${requestId}".`);
        officer.reviewRequest(request);
        console.log(`\nRequest ${requestId} reviewed. Status: ${request.getStatus()}`);
      });
    } else if (action === 'Assign priority') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        const request = manager.findRequestById(requestId);
        if (!request) throw new Error(`No request found with ID "${requestId}".`);
        const priority = await askFromList('Select new priority:', PRIORITIES);
        officer.assignPriority(request, priority);
        console.log(`\nPriority updated to ${priority}.`);
      });
    } else if (action === 'Assign a Technician') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        const request = manager.findRequestById(requestId);
        if (!request) throw new Error(`No request found with ID "${requestId}".`);
        const technicianId = await askRequired('Technician User ID: ');
        const technician = manager.findUserById(technicianId);
        if (!technician || !(technician instanceof Technician)) {
          throw new Error(`No Technician found with ID "${technicianId}".`);
        }
        officer.assignTechnician(request, technician);
        console.log(`\nRequest ${requestId} assigned to ${technician.getFullName()}.`);
      });
    } else if (action === 'Close a resolved request') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        const request = manager.findRequestById(requestId);
        if (!request) throw new Error(`No request found with ID "${requestId}".`);
        officer.closeRequest(request);
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
  if (!technician || !(technician instanceof Technician)) {
    console.log(`No Technician found with ID "${technicianId}".`);
    return;
  }

  let inSubmenu = true;
  while (inSubmenu) {
    const action = await askFromList('\nChoose an action:', [
      'View my assigned requests',
      'Start work on a request',
      'Add a progress note',
      'Resolve a request',
      'Back to Main Menu',
    ]);

    if (action === 'View my assigned requests') {
      await safely(async () => {
        printRequestList(manager.getRequestsByTechnician(technicianId));
      });
    } else if (action === 'Start work on a request') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        const request = manager.findRequestById(requestId);
        if (!request) throw new Error(`No request found with ID "${requestId}".`);
        technician.startWork(request);
        console.log(`\nWork started on request ${requestId}.`);
      });
    } else if (action === 'Add a progress note') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        const request = manager.findRequestById(requestId);
        if (!request) throw new Error(`No request found with ID "${requestId}".`);
        const note = await askRequired('Progress note: ');
        technician.addProgressNote(request, note);
        console.log(`\nProgress note added to request ${requestId}.`);
      });
    } else if (action === 'Resolve a request') {
      await safely(async () => {
        const requestId = await askRequired('Request ID: ');
        const request = manager.findRequestById(requestId);
        if (!request) throw new Error(`No request found with ID "${requestId}".`);
        const summary = await askRequired('Resolution summary: ');
        technician.resolveRequest(request, summary);
        console.log(`\nRequest ${requestId} marked Resolved.`);
      });
    } else {
      inSubmenu = false;
    }
  }
}

// ---------------- Option 12: View Request History ----------------

async function viewHistoryFlow() {
  console.log('\n--- View Request History ---');
  const requestId = await askRequired('Request ID: ');
  const history = manager.getRequestHistory(requestId);
  history.forEach((entry, i) => {
    console.log(`  ${i + 1}. [${entry.status}] ${entry.action} (${entry.timestamp.toLocaleString()})`);
  });
}

// ---------------- Main loop ----------------

async function main() {
  let running = true;
  while (running) {
    console.log(MENU_TEXT);
    const choice = await ask('Enter your choice (1-13): ');

    if (choice === '1') {
      await safely(registerUserFlow);
    } else if (choice === '2') {
      await safely(submitRequestFlow);
    } else if (choice === '3') {
      await safely(viewRequestByIdFlow);
    } else if (choice === '4') {
      await safely(viewMyRequestsFlow);
    } else if (choice === '5') {
      await safely(viewAllRequestsFlow);
    } else if (choice === '6') {
      await safely(updateRequestFlow);
    } else if (choice === '7') {
      await safely(cancelRequestFlow);
    } else if (choice === '8') {
      await safely(searchRequestsFlow);
    } else if (choice === '9') {
      await safely(viewSummaryFlow);
    } else if (choice === '10') {
      await safely(serviceOfficerFlow);
    } else if (choice === '11') {
      await safely(technicianFlow);
    } else if (choice === '12') {
      await safely(viewHistoryFlow);
    } else if (choice === '13') {
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