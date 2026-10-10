'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { makeTempDir, removeDir, makeManager, makeUsers, registerAll } = require('./helpers');

let dir;
let manager;

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

before(async () => {
  dir = await makeTempDir();
  manager = makeManager(dir);
  await registerAll(manager, makeUsers());

  const c = (id, title, location, priority) => ({ requestId: id, requesterId: 'U001', title, description: 'desc', location, priority });

  // Submitted one after another so their dates are in a known order: R1 oldest, R3 newest.
  await manager.submitRequest('ICT Support', c('R1', 'Wi-Fi down', 'Library', 'Low'),
    { deviceType: 'Laptop', systemName: 'Wi-Fi', faultType: 'Network', networkImpact: false });
  await pause(10);
  await manager.submitRequest('Facilities Maintenance', c('R2', 'Broken window', 'Hall 2', 'Normal'),
    { building: 'Hall 2', roomNumber: '204', hazardLevel: 'Medium' });
  await pause(10);
  await manager.submitRequest('Cleaning and Sanitation', c('R3', 'Spill in cafeteria', 'Cafeteria', 'High'),
    { cleaningArea: 'Cafeteria', hygieneRisk: true });

  await manager.cancelRequest('R1', 'U001');                 // R1 -> Cancelled
  await manager.reviewRequest('R2', 'U002');                 // R2 -> Reviewed
  await manager.assignTechnician('R2', 'U002', 'U003');      // R2 -> Assigned to Grace
});

after(async () => {
  await removeDir(dir);
});

const ids = (requests) => requests.map((r) => r.getRequestId());

describe('13. Search, filter and sort', () => {
  test('DT-39 search matches request ID or title, ignoring case', () => {
    assert.deepEqual(ids(manager.searchRequests('WI-FI')), ['R1']);
    assert.deepEqual(ids(manager.searchRequests('r2')), ['R2']);
    assert.deepEqual(ids(manager.searchRequests('spill')), ['R3']);
    assert.deepEqual(ids(manager.searchRequests('no-such-thing')), []);
    assert.equal(manager.searchRequests('').length, 3);
  });

  test('DT-40 filter by category, status and priority', () => {
    assert.deepEqual(ids(manager.filterByCategory('Cleaning and Sanitation')), ['R3']);
    assert.deepEqual(ids(manager.filterByCategory('General Campus Service')), []);
    assert.deepEqual(ids(manager.filterByStatus('Cancelled')), ['R1']);
    assert.deepEqual(ids(manager.filterByStatus('Assigned')), ['R2']);
    assert.deepEqual(ids(manager.filterByStatus('Submitted')), ['R3']);
    assert.deepEqual(ids(manager.filterByPriority('High')), ['R3']);
    assert.deepEqual(ids(manager.filterByPriority('Urgent')), []);
  });

  test('DT-41 filter by assigned Technician', () => {
    assert.deepEqual(ids(manager.getRequestsByTechnician('U003')), ['R2']);
    assert.deepEqual(ids(manager.getRequestsByTechnician('U004')), []);
  });

  test('DT-42 sort by date submitted, oldest first and newest first', () => {
    assert.deepEqual(ids(manager.sortByDateSubmitted(undefined, true)), ['R1', 'R2', 'R3']);
    assert.deepEqual(ids(manager.sortByDateSubmitted(undefined, false)), ['R3', 'R2', 'R1']);
  });

  test('DT-43 sort by priority score uses each category\'s own scoring', () => {
    // R1 Low+0 = 1, R2 Normal+Medium hazard = 3, R3 High+hygiene risk = 6
    const sorted = manager.sortByPriorityScore();
    assert.deepEqual(ids(sorted), ['R3', 'R2', 'R1']);
    assert.deepEqual(sorted.map((r) => r.calculatePriorityScore()), [6, 3, 1]);
  });

  test('DT-44 sorting does not change the stored order', () => {
    manager.sortByPriorityScore();
    assert.deepEqual(ids(manager.getAllRequests()), ['R1', 'R2', 'R3']);
  });
});