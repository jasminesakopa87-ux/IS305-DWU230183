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

async function main() {
  let running = true;
  while (running) {
    console.log(MENU_TEXT);
    const choice = await ask('Enter your choice (1-13): ');

        if (choice === '1') {
      await safely(registerUserFlow);
    } else if (choice === '2') {
      await safely(submitRequestFlow);
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