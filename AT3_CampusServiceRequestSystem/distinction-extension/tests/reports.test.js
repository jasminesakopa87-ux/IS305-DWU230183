'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const ReportService = require('../ReportService');
const { makeTempDir, removeDir, makeManager, makeUsers, registerAll } = require('./helpers');

let dir;
let manager;
let report;

before(async () => {
  dir = await makeTempDir();
  manager = makeManager(dir);
  await registerAll(manager, makeUsers());

  const c = (id, title, location, priority) => ({ requestId: id, requesterId: 'U001', title, description: 'desc', location, priority });

  await manager.submitRequest('ICT Support', c('R1', 'Wi-Fi down', 'Library', 'Urgent'),
    { deviceType: 'Network Equipment', systemName: 'Wi-Fi', faultType: 'Network', networkImpact: true });
  await manager.submitRequest('Facilities Maintenance', c('R2', 'Broken window', 'Library', 'High'),
    { building: 'Hall 2', roomNumber: '204', hazardLevel: 'High' });
  await manager.submitRequest('Cleaning and Sanitation', c('R3', 'Spill', 'Cafeteria', 'Normal'),
    { cleaningArea: 'Cafeteria', hygieneRisk: true });

  // Take R1 all the way to Closed, done by Grace.
  await manager.reviewRequest('R1', 'U002');
  await manager.assignTechnician('R1', 'U002', 'U003');
  await manager.startWork('R1', 'U003');
  await manager.resolveRequest('R1', 'U003', 'Fixed');
  await manager.closeRequest('R1', 'U002');

  report = new ReportService(manager);
});

after(async () => {
  await removeDir(dir);
});

describe('12. Report calculations', () => {
  test('DT-31 requests grouped by status', () => {
    assert.deepEqual(report.requestsByStatus(), { Closed: 1, Submitted: 2 });
  });

  test('DT-32 requests grouped by category and by priority', () => {
    assert.deepEqual(report.requestsByCategory(), {
      'ICT Support': 1, 'Facilities Maintenance': 1, 'Cleaning and Sanitation': 1,
    });
    assert.deepEqual(report.requestsByPriority(), { Urgent: 1, High: 1, Normal: 1 });
  });

  test('DT-33 urgent requests are listed', () => {
    const urgent = report.urgentRequests();
    assert.equal(urgent.length, 1);
    assert.equal(urgent[0].getRequestId(), 'R1');
  });

  test('DT-34 request volume by location is counted and sorted busiest first', () => {
    assert.deepEqual(report.requestVolumeByLocation(), [
      { location: 'Library', count: 2 },
      { location: 'Cafeteria', count: 1 },
    ]);
  });

  test('DT-35 assigned and completed requests per Technician', () => {
    assert.equal(report.requestsByTechnician()['Grace Gordan'], 1);
    assert.equal(report.requestsByTechnician()['John Kila'], 0);
    assert.equal(report.completedRequestsByTechnician()['Grace Gordan'], 1);
    assert.equal(report.completedRequestsByTechnician()['John Kila'], 0);
  });

  test('DT-36 average resolution time is a sensible number', () => {
    const avg = report.averageResolutionHours();
    assert.equal(typeof avg, 'number');
    assert.ok(avg >= 0 && avg < 1);
  });

  test('DT-37 overdue requests only include unfinished requests past their deadline', () => {
    // Nothing here is old enough to be overdue, and R1 is Closed.
    assert.equal(report.overdueRequests().length, 0);
  });

  test('DT-38 full report totals', () => {
    const full = report.fullReport();
    assert.equal(full.totalRequests, 3);
    assert.equal(full.totalUsers, 4);
    assert.ok('byStatus' in full && 'volumeByLocation' in full);
  });
});