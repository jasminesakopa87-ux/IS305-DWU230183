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

async function safely(action) {
  try {
    await action();
  } catch (err) {
    console.log(`\n${err.message}`);
  }
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

async function main() {
  let running = true;
  while (running) {
    console.log(MENU_TEXT);
    const choice = await ask('Enter your choice (1-10): ');

    if (choice === '1') {
      await safely(registerUserFlow);
    } else if (choice === '10') {
      console.log('\nGoodbye!');
      running = false;
    } else {
      console.log(`\nYou chose option ${choice} - not wired up yet.`);
    }
  }
  rl.close();
}

main();