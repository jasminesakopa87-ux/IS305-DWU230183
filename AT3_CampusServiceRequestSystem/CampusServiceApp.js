'use strict';

const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const User = require('./User');
const ServiceRequest = require('./ServiceRequest');
const { CATEGORIES, PRIORITIES } = require('./ServiceRequest');
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
10. Exit
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

async function registerUserFlow() {
  console.log('\n--- Register User ---');
  const userId = await askRequired('User ID: ');
  const firstName = await askRequired('First name: ');
  const lastName = await askRequired('Last name: ');
  const email = await askRequired('Email address: ');
  const userType = (await ask('User type (Student/Staff) [Student]: ')) || 'Student';

  const user = new User(userId, firstName, lastName, email, userType);
  manager.registerUser(user);
  console.log(`\nUser registered successfully:\n${user.displayInfo()}`);
}

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
  const category = await askFromList('Select a category:', CATEGORIES);
  const priority = await askFromList('Select a priority:', PRIORITIES);

  const request = new ServiceRequest(requestId, requester, title, description, location, category, priority);
  manager.submitRequest(request);
  console.log(`\nRequest submitted successfully:\n${request.getRequestSummary()}`);
}

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
  const requests = manager.getRequestsByUser(userId);
  printRequestList(requests);
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

async function main() {
  let running = true;
  while (running) {
    console.log(MENU_TEXT);
    const choice = await ask('Enter your choice (1-10): ');

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