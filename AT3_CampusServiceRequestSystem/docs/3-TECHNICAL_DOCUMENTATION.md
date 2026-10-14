# Technical Documentation

Campus Service Request Management System - IS305 AT3 Major Project

This describes the **final system**, which lives in the `distinction-extension` folder. (`pass-component` and `credit-extension` are kept as the earlier stages of the same project.) Names of classes and methods are copied from the source code.

## 1. Project folder structure

```
AT3_CampusServiceRequestSystem/
  README.md
  docs/                          requirements, UML, technical doc, user guide, test report, AI declaration
  pass-component/                Pass stage (earlier version, kept as evidence of progress)
  credit-extension/              Credit stage (earlier version, kept as evidence of progress)
  distinction-extension/         THE FINAL SYSTEM
    CampusServiceApp.js          console menu (entry point)
    ServiceRequestManager.js     coordinates users, requests, persistence and audit
    ReportService.js             management reports
    User.js                      base class for people
    StudentRequester.js  StaffRequester.js  ServiceOfficer.js  Technician.js
    UserFactory.js               rebuilds the right User subclass from saved data
    ServiceRequest.js            abstract base class for requests
    ICTSupportRequest.js  MaintenanceRequest.js  CleaningRequest.js  GeneralServiceRequest.js
    ServiceRequestFactory.js     creates new requests and rebuilds saved ones
    repositories/
      fileStore.js               the ONLY module that imports fs/promises
      BaseFileRepository.js      load / save / create / find / update / replace
      UserFileRepository.js  ServiceRequestFileRepository.js
      RequestHistoryFileRepository.js  AuditFileRepository.js
    data/                        users.json, serviceRequests.json, requestHistory.json, auditLog.json (simulated data)
    tests/                       helpers.js, domain.test.js, persistence.test.js, reports.test.js, search.test.js
    package.json  package-lock.json
```

The code is in four layers and each layer only calls the one below it: **console** (`CampusServiceApp`) -> **coordination** (`ServiceRequestManager`, `ReportService`) -> **domain** (users and requests) and **persistence** (repositories -> `fileStore`).

## 2. Responsibility of each class

| Class | Responsibility |
|---|---|
| `User` | Identity (ID, name, email), validation, `getRole()`, `toJSON()`. Cannot be a role on its own in practice: each role is a subclass. |
| `StudentRequester`, `StaffRequester` | Add programme/year level or department. Fixed role labels. |
| `ServiceOfficer` | Adds a service section. Methods `reviewRequest`, `assignPriority`, `assignTechnician`, `closeRequest` call the matching `ServiceRequest` method, passing itself as the actor. |
| `Technician` | Adds a speciality and an `available` flag. Methods `startWork`, `addProgressNote`, `resolveRequest`. |
| `UserFactory` | Reads the saved `role` and returns the correct `User` subclass. |
| `ServiceRequest` | Abstract base. Common fields, the status workflow, permission checks, history, JSON conversion. |
| `ICTSupportRequest`, `MaintenanceRequest`, `CleaningRequest`, `GeneralServiceRequest` | Category-specific fields, validation, priority score, target resolution hours, summary. |
| `ServiceRequestFactory` | `createRequest()` builds a new request from a category; `createFromData()` rebuilds a saved one from its `requestType`. |
| `fileStore.js` | `loadJSONArray()` and `saveJSONArray()`: the only file reading and writing in the project. |
| `BaseFileRepository` and four subclasses | One JSON file each. Generic `loadAll`, `saveAll`, `findById`, `create`, `update`, `replace`, plus small finders such as `findByRequester`. |
| `ServiceRequestManager` | Holds users and requests in arrays, looks people and requests up, calls the domain method, then saves the request, a history entry and an audit entry. |
| `ReportService` | Read-only reports. |
| `CampusServiceApp` | Menus and prompts. One Manager or report call per action. Prints results and errors. |

## 3. Where encapsulation is used

Every field in every class is a private `#` field. There are no public fields. For example:

```js
class User {
  #userId;
  #firstName;
  #lastName;
  #email;
  #userType;
```

Fields are read through getters (`getUserId()`) and changed only through validated setters (`setEmail()` re-checks the format every time) or workflow methods. There is deliberately **no `setStatus()`**: status changes only through `review`, `assignTechnician`, `startWork`, `resolve`, `close` and `cancelRequest`, each of which checks the rules first. `getHistory()` and `getProgressNotes()` return copies (`[...this.#history]`) so outside code cannot edit the real arrays.

## 4. Where inheritance and constructor chaining are used

```
User                                  ServiceRequest (abstract)
  StudentRequester                      ICTSupportRequest
  StaffRequester                        MaintenanceRequest
  ServiceOfficer                        CleaningRequest
  Technician                            GeneralServiceRequest

BaseFileRepository
  UserFileRepository, ServiceRequestFileRepository, RequestHistoryFileRepository, AuditFileRepository
```

Each subclass constructor starts with `super(...)`, so the parent validates its own fields before the subclass adds its own:

```js
// StudentRequester.js
constructor(userId, firstName, lastName, email, programme, yearLevel) {
  super(userId, firstName, lastName, email, 'Student');
  this.setProgramme(programme);
  this.setYearLevel(yearLevel);
}

// ICTSupportRequest.js
constructor(commonData, specialisedData = {}) {
  const { requestId, requester, title, description, location, priority } = commonData;
  super(requestId, requester, title, description, location, 'ICT Support', priority);
  this.#deviceType = specialisedData.deviceType;
  ...
  this.validateSpecialisedFields();
}
```

The category (`'ICT Support'`) and the user type (`'Student'`) are fixed by the subclass, so a caller cannot create an ICT request with a different category.

## 5. Where overriding and polymorphism are used

`ServiceRequest` declares four methods that throw `Abstract Method Error` unless overridden: `calculatePriorityScore()`, `getTargetResolutionHours()`, `getRequestSummary()`, `validateSpecialisedFields()`. Each of the four request subclasses overrides all four. `new ServiceRequest(...)` itself throws, using `new.target`:

```js
if (new.target === ServiceRequest) {
  throw new TypeError('Abstract Class Error: ServiceRequest is abstract and cannot be instantiated directly.');
}
```

Each User subclass overrides `getRole()` and `toJSON()`.

Polymorphism in practice: the Manager keeps all requests in one array. `ReportService`, the sorting methods and the console call the same methods on every item:

```js
for (const r of requests) {
  r.getRequestSummary();
  r.calculatePriorityScore();
  r.getTargetResolutionHours();
}
```

and each object answers in its own way. Test DT-14 runs exactly this loop on one request of each type and checks the results.

## 6. How the request workflow is controlled

`ServiceRequest` holds a transition table:

```js
const ALLOWED_TRANSITIONS = {
  Submitted: ['Reviewed', 'Cancelled'],
  Reviewed: ['Assigned'],
  Assigned: ['InProgress'],
  InProgress: ['Resolved'],
  Resolved: ['Closed'],
  Closed: [],
  Cancelled: [],
};
```

Every status change goes through the private `#transitionTo()`, which throws if the table does not allow the move. Who may act is checked first by two private helpers:

```js
#requireRole(actor, roleName, message) {
  if (!actor || typeof actor.getRole !== 'function' || actor.getRole() !== roleName) {
    throw new Error(`Validation Error: ${message}`);
  }
}
```

`#requireAssignedTechnician()` compares the caller's ID with the assigned Technician's ID. Both checks run **before** anything changes, so a rejected action leaves the request untouched and nothing is saved. Because the checks live in `ServiceRequest`, they apply no matter what calls the methods.

## 7. How validation and errors are handled

- **Construction:** every constructor validates, so an invalid object cannot exist.
- **Setters and workflow methods:** re-validate and throw before changing state.
- **Persistence:** `fileStore.js` throws messages beginning `File Error:`.
- **Message prefixes:** `Validation Error:`, `Abstract Method Error:`, `Abstract Class Error:`, `File Error:` show where a problem came from.
- **Console:** every menu action runs inside `safely()`, which catches the error and prints only its message. `main()` also has a last-resort `.catch()`. Typing a wrong choice never crashes the program.

## 8. How JSON data is stored and restored

**Storing.** After the domain object has accepted a change, `ServiceRequestManager` writes three things: the request (`serviceRequests.json`, via `create` or `replace`), the newest history entry (`requestHistory.json`) and an audit entry (`auditLog.json`). A user registration writes the user and an audit entry. Records hold plain data only. A saved request looks like this (shortened):

```json
{
  "requestId": "R001",
  "requestType": "ICTSupportRequest",
  "requesterId": "U001",
  "title": "Wi-fi down",
  "status": "Closed",
  "assignedTechnicianId": "U003",
  "deviceType": "Network Equipment",
  "dateSubmitted": "2026-10-08T00:35:02.647Z"
}
```

`fileStore.loadJSONArray()` returns `[]` when the file does not exist **or is empty**, and throws a clear `File Error` for broken JSON or JSON that is not an array. `saveJSONArray()` refuses non-array data and creates the folder if needed.

**Restoring.** `ServiceRequestManager.init()` loads each file. For users, `UserFactory.createFromData()` uses the saved `role` to pick the class. For requests, `ServiceRequestFactory.createFromData()` uses the saved `requestType`, builds the object through its normal constructor (so it is validated again), then calls `_restoreState()` to put back what a constructor cannot know: status, dates, assigned Technician, resolution summary, progress notes and history. The requester and Technician are restored as small reference objects with `getUserId()` and `getFullName()`, and permission checks compare IDs, so a restored request keeps working through the workflow (test DT-21). History and audit ID counters continue from the saved counts, so new IDs never collide (test DT-22).

## 9. How tests are organised

All 44 tests use Node's built-in `node:test` and `node:assert/strict`, with no extra packages.

| File | Tests | Covers |
|---|---|---|
| `tests/domain.test.js` | DT-01 to DT-16 | construction, invalid values, duplicates, role permissions, status transitions, specialised behaviour, polymorphism, abstraction |
| `tests/persistence.test.js` | DT-17 to DT-30 | saving, restoring, missing/empty files, file errors |
| `tests/reports.test.js` | DT-31 to DT-38 | report calculations |
| `tests/search.test.js` | DT-39 to DT-44 | search, filter, sort |
| `tests/helpers.js` | (shared) | builds a Manager that writes to a temporary folder |

Every test that touches files uses a new folder from `fs.mkdtemp()` under the operating system's temp directory and deletes it afterwards, so the real `data` folder is never read or changed. Run all tests with `npm test` (or `node --test`), or one file with `node --test tests/domain.test.js`. The console menu itself is tested by hand, not by automated tests.

## 10. Known limitations and future improvements

| Limitation | Possible improvement |
|---|---|
| No login: anyone can act as any registered user. | Add passwords (hashed) and a login step before the role menus. |
| No System Administrator role; reports and audit log are open to all. | Add an Administrator class and restrict those menu options. |
| Only successful actions are audited. | Also log rejected attempts with outcome `Rejected`. |
| `requestHistory.json` is written but never read back; history is stored twice. | Read history from the file, or drop the embedded copy. |
| Two copies of the program on one data folder can overwrite each other. | A real database with transactions (not allowed in this assignment). |
| The console layer has no automated tests. | Test the menu flows with scripted input. |
| No attachments, no notifications. | Store file paths for photos; send email when status changes. |
| Console only. | The domain and persistence layers do not use the console, so a web front end could reuse them. |
