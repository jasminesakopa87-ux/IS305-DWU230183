'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const ServiceRequestManager = require('../ServiceRequestManager');
const UserFileRepository = require('../repositories/UserFileRepository');
const ServiceRequestFileRepository = require('../repositories/ServiceRequestFileRepository');
const RequestHistoryFileRepository = require('../repositories/RequestHistoryFileRepository');
const AuditFileRepository = require('../repositories/AuditFileRepository');

const StudentRequester = require('../StudentRequester');
const ServiceOfficer = require('../ServiceOfficer');
const Technician = require('../Technician');

/** Creates a brand-new temporary folder so tests never touch the real data folder. */
async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'campus-test-'));
}

async function removeDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

/** Builds a Manager whose four repositories all point inside the given temp folder. */
function makeManager(dir) {
  return new ServiceRequestManager({
    userRepo: new UserFileRepository(path.join(dir, 'users.json')),
    requestRepo: new ServiceRequestFileRepository(path.join(dir, 'serviceRequests.json')),
    historyRepo: new RequestHistoryFileRepository(path.join(dir, 'requestHistory.json')),
    auditRepo: new AuditFileRepository(path.join(dir, 'auditLog.json')),
  });
}

function makeUsers() {
  return {
    alice: new StudentRequester('U001', 'Alice', 'Tau', 'alice@dwu.ac.pg', 'Information Systems', 3),
    peter: new ServiceOfficer('U002', 'Peter', 'Pan', 'peter@dwu.ac.pg', 'ICT Help-Desk'),
    grace: new Technician('U003', 'Grace', 'Gordan', 'grace@dwu.ac.pg', 'Networking'),
    john: new Technician('U004', 'John', 'Kila', 'john@dwu.ac.pg', 'Electrical'),
  };
}

/** Registers the standard four users on a manager. */
async function registerAll(manager, users) {
  for (const u of Object.values(users)) {
    await manager.registerUser(u);
  }
}

const ictData = {
  common: { requestId: 'R001', requesterId: 'U001', title: 'Wi-Fi down', description: 'No Wi-Fi', location: 'Library', priority: 'High' },
  specialised: { deviceType: 'Network Equipment', systemName: 'Campus Wi-Fi', faultType: 'Network', networkImpact: true },
};

module.exports = { makeTempDir, removeDir, makeManager, makeUsers, registerAll, ictData, fs, path };