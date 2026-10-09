'use strict';

const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');

const { loadJSONArray, saveJSONArray } = require('../repositories/fileStore');
const UserFileRepository = require('../repositories/UserFileRepository');
const { makeTempDir, removeDir, makeManager, makeUsers, registerAll, ictData, fs, path } = require('./helpers');

const dirsToClean = [];
after(async () => {
  for (const d of dirsToClean) await removeDir(d);
});

async function tempDir() {
  const dir = await makeTempDir();
  dirsToClean.push(dir);
  return dir;
}

async function readJson(dir, name) {
  return JSON.parse(await fs.readFile(path.join(dir, name), 'utf-8'));
}

describe('8. Saving JSON data', () => {
  test('DT-17 registering users and submitting a request writes the JSON files', async () => {
    const dir = await tempDir();
    const manager = makeManager(dir);
    await registerAll(manager, makeUsers());
    await manager.submitRequest('ICT Support', ictData.common, ictData.specialised);

    const users = await readJson(dir, 'users.json');
    const requests = await readJson(dir, 'serviceRequests.json');
    assert.equal(users.length, 4);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].requestId, 'R001');
    assert.equal(requests[0].requestType, 'ICTSupportRequest');
    assert.equal(requests[0].requesterId, 'U001');
    assert.equal(requests[0].status, 'Submitted');
  });

  test('DT-18 workflow actions are saved to history and audit files', async () => {
    const dir = await tempDir();
    const manager = makeManager(dir);
    await registerAll(manager, makeUsers());
    await manager.submitRequest('ICT Support', ictData.common, ictData.specialised);
    await manager.reviewRequest('R001', 'U002');

    const history = await readJson(dir, 'requestHistory.json');
    const audit = await readJson(dir, 'auditLog.json');
    assert.equal(history.length, 2);
    assert.equal(history[1].newStatus, 'Reviewed');
    assert.equal(history[1].actorId, 'U002');
    // 4 registrations + 1 creation + 1 review
    assert.equal(audit.length, 6);
    assert.equal(audit[5].action, 'Status Change');
    assert.equal(audit[5].outcome, 'Success');
  });

  test('DT-19 a rejected action is NOT saved', async () => {
    const dir = await tempDir();
    const manager = makeManager(dir);
    await registerAll(manager, makeUsers());
    await manager.submitRequest('ICT Support', ictData.common, ictData.specialised);
    await assert.rejects(manager.closeRequest('R001', 'U002'));
    const requests = await readJson(dir, 'serviceRequests.json');
    const history = await readJson(dir, 'requestHistory.json');
    assert.equal(requests[0].status, 'Submitted');
    assert.equal(history.length, 1);
  });
});

describe('9. Loading and restoring saved objects', () => {
  test('DT-20 a new manager restores the correct classes, state and history', async () => {
    const dir = await tempDir();
    const first = makeManager(dir);
    await registerAll(first, makeUsers());
    await first.submitRequest('Cleaning and Sanitation',
      { requestId: 'R010', requesterId: 'U001', title: 'Spill', description: 'Liquid spill', location: 'Cafeteria', priority: 'High' },
      { cleaningArea: 'Cafeteria', hygieneRisk: true });
    await first.reviewRequest('R010', 'U002');
    await first.assignTechnician('R010', 'U002', 'U003');

    // Simulate closing and restarting the program: a brand-new manager reads the files.
    const second = makeManager(dir);
    const result = await second.init();
    assert.deepEqual(result, { usersLoaded: 4, requestsLoaded: 1 });

    const restored = second.findRequestById('R010');
    assert.equal(restored.constructor.name, 'CleaningRequest');
    assert.equal(restored.getStatus(), 'Assigned');
    assert.equal(restored.hasHygieneRisk(), true);
    assert.equal(restored.getTargetResolutionHours(), 2);
    assert.equal(restored.getHistory().length, 3);
    assert.equal(restored.getAssignedTechnician().getUserId(), 'U003');

    assert.equal(second.findUserById('U002').constructor.name, 'ServiceOfficer');
    assert.equal(second.findUserById('U003').getTechnicalSpeciality(), 'Networking');
  });

  test('DT-21 a restored request can continue through the workflow', async () => {
    const dir = await tempDir();
    const first = makeManager(dir);
    await registerAll(first, makeUsers());
    await first.submitRequest('ICT Support', ictData.common, ictData.specialised);
    await first.reviewRequest('R001', 'U002');
    await first.assignTechnician('R001', 'U002', 'U003');

    const second = makeManager(dir);
    await second.init();
    await second.startWork('R001', 'U003');
    await second.resolveRequest('R001', 'U003', 'Fixed.');
    const closed = await second.closeRequest('R001', 'U002');
    assert.equal(closed.getStatus(), 'Closed');
    // the wrong technician is still rejected after a restore
    await assert.rejects(second.startWork('R001', 'U004'));
  });

  test('DT-22 new IDs continue after a restart instead of colliding', async () => {
    const dir = await tempDir();
    const first = makeManager(dir);
    await registerAll(first, makeUsers());
    await first.submitRequest('ICT Support', ictData.common, ictData.specialised);

    const second = makeManager(dir);
    await second.init();
    await second.reviewRequest('R001', 'U002');
    const audit = await readJson(dir, 'auditLog.json');
    const ids = audit.map((a) => a.auditId);
    assert.equal(new Set(ids).size, ids.length);
  });
});

describe('10. Missing or empty data files', () => {
  test('DT-23 a missing file loads as an empty array', async () => {
    const dir = await tempDir();
    assert.deepEqual(await loadJSONArray(path.join(dir, 'nothing-here.json')), []);
  });

  test('DT-24 a manager starts cleanly when no data files exist', async () => {
    const dir = await tempDir();
    const result = await makeManager(dir).init();
    assert.deepEqual(result, { usersLoaded: 0, requestsLoaded: 0 });
  });

  test('DT-25 a zero-byte file and a file containing [] both load as empty', async () => {
    const dir = await tempDir();
    await fs.writeFile(path.join(dir, 'zero.json'), '');
    await fs.writeFile(path.join(dir, 'blank.json'), '   \n  ');
    await fs.writeFile(path.join(dir, 'empty-array.json'), '[]');
    assert.deepEqual(await loadJSONArray(path.join(dir, 'zero.json')), []);
    assert.deepEqual(await loadJSONArray(path.join(dir, 'blank.json')), []);
    assert.deepEqual(await loadJSONArray(path.join(dir, 'empty-array.json')), []);
  });
});

describe('11. File-reading and file-writing errors', () => {
  test('DT-26 corrupt JSON gives a clear File Error', async () => {
    const dir = await tempDir();
    await fs.writeFile(path.join(dir, 'bad.json'), '{ this is not valid JSON');
    await assert.rejects(loadJSONArray(path.join(dir, 'bad.json')), /File Error: .*invalid JSON/);
  });

  test('DT-27 valid JSON that is not an array is rejected', async () => {
    const dir = await tempDir();
    await fs.writeFile(path.join(dir, 'obj.json'), '{"oops": true}');
    await assert.rejects(loadJSONArray(path.join(dir, 'obj.json')), /does not contain a JSON array/);
  });

  test('DT-28 saving non-array data is refused', async () => {
    const dir = await tempDir();
    await assert.rejects(saveJSONArray(path.join(dir, 'x.json'), { not: 'an array' }), /Refusing to save non-array/);
  });

  test('DT-29 a write that cannot happen gives a clear File Error', async () => {
    const dir = await tempDir();
    // Make a FILE, then ask for a path that treats that file as a folder.
    await fs.writeFile(path.join(dir, 'iam-a-file'), 'x');
    const impossible = path.join(dir, 'iam-a-file', 'users.json');
    await assert.rejects(saveJSONArray(impossible, []), /File Error: Could not write/);
  });

  test('DT-30 repository rejects a duplicate id and an update of an unknown id', async () => {
    const dir = await tempDir();
    const repo = new UserFileRepository(path.join(dir, 'users.json'));
    await repo.create({ userId: 'U1', role: 'Technician' });
    await assert.rejects(repo.create({ userId: 'U1', role: 'Technician' }), /already exists/);
    await assert.rejects(repo.update('NOPE', { role: 'x' }), /No record found/);
    assert.equal((await repo.findById('U1')).role, 'Technician');
    assert.equal(await repo.findById('NOPE'), null);
  });
});