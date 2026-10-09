'use strict';

const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');

const StudentRequester = require('../StudentRequester');
const StaffRequester = require('../StaffRequester');
const ServiceRequest = require('../ServiceRequest');
const ICTSupportRequest = require('../ICTSupportRequest');
const MaintenanceRequest = require('../MaintenanceRequest');
const CleaningRequest = require('../CleaningRequest');
const GeneralServiceRequest = require('../GeneralServiceRequest');
const { makeTempDir, removeDir, makeManager, makeUsers, registerAll, ictData } = require('./helpers');

const dirsToClean = [];
after(async () => {
  for (const d of dirsToClean) await removeDir(d);
});

async function freshManager() {
  const dir = await makeTempDir();
  dirsToClean.push(dir);
  const manager = makeManager(dir);
  const users = makeUsers();
  await registerAll(manager, users);
  return { manager, users, dir };
}

const baseCommon = (users, id = 'R001') => ({
  requestId: id, requester: users.alice, title: 'Test', description: 'Desc', location: 'Library', priority: 'Normal',
});

// ---------------------------------------------------------------
describe('1. Valid object construction', () => {
  test('DT-01 StudentRequester builds with correct role and fields', () => {
    const s = new StudentRequester('U010', 'Ann', 'Lee', 'ann@dwu.ac.pg', 'Business', 2);
    assert.equal(s.getUserId(), 'U010');
    assert.equal(s.getRole(), 'Student Requester');
    assert.equal(s.getYearLevel(), 2);
  });

  test('DT-02 ICTSupportRequest builds with default Submitted status', () => {
    const { alice } = makeUsers();
    const r = new ICTSupportRequest(baseCommon({ alice }), ictData.specialised);
    assert.equal(r.getStatus(), 'Submitted');
    assert.equal(r.getCategory(), 'ICT Support');
    assert.equal(r.getRequestType(), 'ICTSupportRequest');
  });
});

describe('2. Invalid constructor values', () => {
  test('DT-03 invalid email is rejected', () => {
    assert.throws(() => new StaffRequester('U011', 'Bob', 'Kila', 'not-an-email', 'Library'), /not a valid email/);
  });

  test('DT-04 missing title is rejected', () => {
    const { alice } = makeUsers();
    assert.throws(
      () => new ICTSupportRequest({ ...baseCommon({ alice }), title: '' }, ictData.specialised),
      /title is required/
    );
  });

  test('DT-05 unsupported device type is rejected', () => {
    const { alice } = makeUsers();
    assert.throws(
      () => new ICTSupportRequest(baseCommon({ alice }), { ...ictData.specialised, deviceType: 'Spaceship' }),
      /not a supported device type/
    );
  });
});

describe('3. Duplicate identifiers', () => {
  test('DT-06 duplicate user ID and duplicate request ID are both rejected', async () => {
    const { manager, users } = await freshManager();
    await assert.rejects(
      manager.registerUser(new StaffRequester('U001', 'Dup', 'User', 'dup@dwu.ac.pg', 'Library')),
      /already registered/
    );
    await manager.submitRequest('ICT Support', { ...ictData.common }, ictData.specialised);
    await assert.rejects(
      manager.submitRequest('ICT Support', { ...ictData.common }, ictData.specialised),
      /already exists/
    );
  });
});

describe('4. Role permissions', () => {
  test('DT-07 only a Service Officer may assign a Technician', async () => {
    const { manager } = await freshManager();
    await manager.submitRequest('ICT Support', ictData.common, ictData.specialised);
    await manager.reviewRequest('R001', 'U002');
    await assert.rejects(manager.assignTechnician('R001', 'U003', 'U003'), /Only a Service Officer may assign/);
    await assert.rejects(manager.assignTechnician('R001', 'U001', 'U003'), /Only a Service Officer may assign/);
    const r = await manager.assignTechnician('R001', 'U002', 'U003');
    assert.equal(r.getStatus(), 'Assigned');
  });

  test('DT-08 only the assigned Technician may start work', async () => {
    const { manager } = await freshManager();
    await manager.submitRequest('ICT Support', ictData.common, ictData.specialised);
    await manager.reviewRequest('R001', 'U002');
    await manager.assignTechnician('R001', 'U002', 'U003');
    await assert.rejects(manager.startWork('R001', 'U004'), /Only the Technician assigned/);
    const r = await manager.startWork('R001', 'U003');
    assert.equal(r.getStatus(), 'InProgress');
  });

  test('DT-09 a requester cannot cancel or update someone else\'s request', async () => {
    const { manager } = await freshManager();
    await manager.submitRequest('ICT Support', ictData.common, ictData.specialised);
    await assert.rejects(manager.cancelRequest('R001', 'U002'), /only cancel your own/);
    await assert.rejects(manager.updateRequest('R001', 'U002', { title: 'x' }), /only update your own/);
  });
});

describe('5. Controlled status transitions', () => {
  test('DT-10 a request cannot skip steps or be closed before it is Resolved', async () => {
    const { manager } = await freshManager();
    await manager.submitRequest('ICT Support', ictData.common, ictData.specialised);
    await assert.rejects(manager.closeRequest('R001', 'U002'), /Only a Resolved request can be closed/);
    await assert.rejects(manager.assignTechnician('R001', 'U002', 'U003'), /Cannot assign a Technician/);
  });

  test('DT-11 a Cancelled request is final and cannot be reviewed', async () => {
    const { manager } = await freshManager();
    await manager.submitRequest('ICT Support', ictData.common, ictData.specialised);
    await manager.cancelRequest('R001', 'U001');
    assert.equal(manager.findRequestById('R001').getStatus(), 'Cancelled');
    await assert.rejects(manager.reviewRequest('R001', 'U002'), /Cannot review this request/);
    await assert.rejects(manager.cancelRequest('R001', 'U001'), /Cannot cancel this request/);
  });
});

describe('6. Specialised request behaviour', () => {
  test('DT-12 Maintenance hazard level drives SLA and priority score', () => {
    const { alice } = makeUsers();
    const high = new MaintenanceRequest(baseCommon({ alice }, 'M1'), { building: 'Hall 2', roomNumber: '204', hazardLevel: 'High' });
    const low = new MaintenanceRequest(baseCommon({ alice }, 'M2'), { building: 'Hall 2', roomNumber: '205', hazardLevel: 'Low' });
    assert.equal(high.getTargetResolutionHours(), 4);
    assert.equal(low.getTargetResolutionHours(), 72);
    assert.ok(high.calculatePriorityScore() > low.calculatePriorityScore());
  });

  test('DT-13 Cleaning hygiene risk shortens the SLA and raises the score', () => {
    const { alice } = makeUsers();
    const risky = new CleaningRequest(baseCommon({ alice }, 'C1'), { cleaningArea: 'Cafeteria', hygieneRisk: true });
    const routine = new CleaningRequest(baseCommon({ alice }, 'C2'), { cleaningArea: 'Corridor', hygieneRisk: false });
    assert.equal(risky.getTargetResolutionHours(), 2);
    assert.equal(routine.getTargetResolutionHours(), 48);
    assert.ok(risky.calculatePriorityScore() > routine.calculatePriorityScore());
  });
});

describe('7. Polymorphism and abstraction', () => {
  test('DT-14 one loop works on a mixed collection of request types', () => {
    const { alice } = makeUsers();
    const requests = [
      new ICTSupportRequest(baseCommon({ alice }, 'P1'), ictData.specialised),
      new MaintenanceRequest(baseCommon({ alice }, 'P2'), { building: 'Hall 2', roomNumber: '1', hazardLevel: 'High' }),
      new CleaningRequest(baseCommon({ alice }, 'P3'), { cleaningArea: 'Cafeteria', hygieneRisk: true }),
      new GeneralServiceRequest(baseCommon({ alice }, 'P4'), { generalServiceType: 'Signage' }),
    ];
    const hours = [];
    const summaries = [];
    for (const r of requests) {
      summaries.push(r.getRequestSummary());
      assert.equal(typeof r.calculatePriorityScore(), 'number');
      hours.push(r.getTargetResolutionHours());
    }
    assert.deepEqual(hours, [8, 4, 2, 72]);
    assert.match(summaries[0], /\[ICT Details\]/);
    assert.match(summaries[1], /\[Maintenance Details\]/);
    assert.match(summaries[2], /\[Cleaning Details\]/);
    assert.match(summaries[3], /\[General Details\]/);
  });

  test('DT-15 ServiceRequest cannot be instantiated directly', () => {
    const { alice } = makeUsers();
    assert.throws(() => new ServiceRequest('X1', alice, 't', 'd', 'l', 'ICT Support', 'Low'), /abstract/i);
  });

  test('DT-16 a subclass that does not override the abstract methods fails clearly', () => {
    const { alice } = makeUsers();
    class Broken extends ServiceRequest {
      constructor() {
        super('B1', alice, 't', 'd', 'l', 'ICT Support', 'Low');
      }
    }
    const b = new Broken();
    assert.throws(() => b.calculatePriorityScore(), /Abstract Method Error/);
    assert.throws(() => b.getTargetResolutionHours(), /Abstract Method Error/);
    assert.throws(() => b.getRequestSummary(), /Abstract Method Error/);
  });
});