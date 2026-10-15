# Campus Service Request Management System

| | |
|---|---|
| **Student name** | Jasmine SAKOPA |
| **Student ID** | DWU230183 |
| **Course / assessment** | IS305 Object-Oriented Programming - AT3 Major Project, Divine Word University |
| **GitHub repository** | https://github.com/jasminesakopa87-ux/IS305-DWU230183 (folder `AT3_CampusServiceRequestSystem`) |

## 1. Project description

A Node.js console application that records, assigns, processes and monitors campus service requests (ICT Support, Facilities Maintenance, Cleaning and Sanitation, General Campus Service). Four kinds of user take part: Student or Staff Requester, Service Officer and Technician. A request moves through a controlled workflow, every action is recorded in a history and an audit log, and all data is saved in JSON files (no database).

## 2. Achievement components attempted

**Pass, Credit and Distinction - all three.** Each stage is kept in its own folder. The **final, complete system is `distinction-extension/`**. It contains the Pass and Credit work and extends it. `pass-component/` and `credit-extension/` are the earlier stages, kept as evidence of progress.

## 3. Features completed

**Pass:** register users; submit requests; view a request by ID, view my requests, view all requests; update my request; cancel my request; search; request summary by status; validation of IDs, names, emails, categories and priorities; duplicate ID rejection; ownership checks.

**Credit:** `StudentRequester`, `StaffRequester`, `ServiceOfficer` and `Technician` extend `User`; `ICTSupportRequest`, `MaintenanceRequest`, `CleaningRequest` (and `GeneralServiceRequest`) extend `ServiceRequest`; constructor chaining with `super()`; controlled workflow `Submitted -> Reviewed -> Assigned -> InProgress -> Resolved -> Closed` (and `Cancelled`); role permissions; method overriding; search, filter and sort; request history.

**Distinction:** abstract-style `ServiceRequest` (cannot be instantiated; required methods throw until overridden); polymorphism over a mixed collection; JSON persistence with repository classes; factories that restore the right specialised object from saved data; audit trail; nine management reports built with `filter`, `map`, `reduce` and `sort`; clear file-error handling; 44 automated tests using temporary files.

## 4. Project folder structure

```
AT3_CampusServiceRequestSystem/
  README.md                       this file
  docs/                           requirements, UML diagrams, technical documentation,
                                  user guide, test report, AI use declaration, test evidence
  pass-component/                 Pass stage (earlier version)
  credit-extension/               Credit stage (earlier version)
  distinction-extension/          FINAL SYSTEM
    CampusServiceApp.js           console menu (start here)
    ServiceRequestManager.js  ReportService.js
    User.js  StudentRequester.js  StaffRequester.js  ServiceOfficer.js  Technician.js  UserFactory.js
    ServiceRequest.js  ICTSupportRequest.js  MaintenanceRequest.js  CleaningRequest.js
    GeneralServiceRequest.js  ServiceRequestFactory.js
    repositories/                 fileStore.js, BaseFileRepository.js and four file repositories
    data/                         users.json, serviceRequests.json, requestHistory.json, auditLog.json
    tests/                        helpers.js, domain.test.js, persistence.test.js, reports.test.js, search.test.js
    package.json  package-lock.json
```

## 5. Installation instructions

1. Install **Node.js 18 or later** (check with `node --version`).
2. Open a terminal in the final system folder:
   ```
   cd AT3_CampusServiceRequestSystem/distinction-extension
   ```
3. Run `npm install`. The project has no dependencies, so nothing is downloaded; this only creates `package-lock.json`.

> **Windows PowerShell:** if it says "running scripts is disabled", use `npm.cmd install` and `npm.cmd test`.

## 6. Commands for running the application

Run from inside `distinction-extension`:

```
node CampusServiceApp.js
```
or `npm start`. (The brief's example shows `node src/CampusServiceApp.js`; this project keeps its files in the `distinction-extension` folder instead of a `src` folder.) The data folder holds simulated sample data, so users `U001` (Student), `U002` (Service Officer) and `U003` (Technician) already exist.

## 7. The JSON data files

All four files are in `distinction-extension/data/`. They contain plain data only (no code, passwords or real records). Each file is a JSON array.

| File | One record per | Main fields |
|---|---|---|
| `users.json` | registered user | `role` (decides the class on reload), `userId`, `firstName`, `lastName`, `email`, plus role-specific fields (`programme`, `yearLevel`, `department`, `serviceSection`, `technicalSpeciality`, `available`) |
| `serviceRequests.json` | request | `requestId`, `requestType` (decides the class on reload), `requesterId`, `title`, `description`, `location`, `category`, `priority`, `status`, `assignedTechnicianId`, `progressNotes`, `resolutionSummary`, dates, `history`, plus category-specific fields |
| `requestHistory.json` | status change or action | `historyId`, `requestId`, `previousStatus`, `newStatus`, `action`, `actorId`, `actorRole`, `timestamp` |
| `auditLog.json` | audited action | `auditId`, `actorId`, `actorRole`, `action`, `requestId`, `description`, `timestamp`, `outcome` |

A missing or empty file is treated as an empty list. A broken file gives a clear `File Error` message.

## 8. How objects are restored from saved data

JSON holds plain data, not objects. When the program starts, `ServiceRequestManager.init()` loads the files and rebuilds each record:

- **Users:** `UserFactory.createFromData()` reads the saved `role` and calls the matching class (`StudentRequester`, `StaffRequester`, `ServiceOfficer` or `Technician`).
- **Requests:** `ServiceRequestFactory.createFromData()` reads the saved `requestType` and builds the matching subclass through its normal constructor (so it is validated again), then `_restoreState()` puts back the status, dates, assigned Technician, resolution summary, notes and history.

The restored objects behave exactly like new ones: they keep their overridden methods and can carry on through the workflow (tests DT-20 to DT-22).

## 9. Commands for running the tests

Run from inside `distinction-extension`:

```
npm test
```
or `node --test`. Expected result: **44 tests, 44 pass, 0 fail**. Run one file with `node --test tests/domain.test.js`. Tests write only to temporary folders and never change the `data` folder.

## 10. Sample user scenarios

1. **Full life of a request.** Register a Requester. Submit an ICT request (option 2). As Officer `U002`: review it, then assign Technician `U003` (option 10). As `U003`: start work, add a note, resolve (option 11). As `U002`: close it. Check the steps with option 12.
2. **Permissions.** Try to assign a Technician using `U003` (a Technician) or `U001` (a Student) in the Officer menu: it is rejected with "Only a Service Officer may assign a Technician." Try to start work as a different Technician: rejected.
3. **Persistence.** Register a user and submit a request, exit with option 16, start the program again: the first line reports the users and requests loaded.
4. **Finding and reporting.** Use option 8 (search), option 15 (filter and sort), option 13 (reports) and option 14 (audit log).

## 11. Known limitations

- No login or passwords: anyone can act as any registered user.
- No System Administrator role: reports and the audit log are open to all console users.
- Only successful actions are written to the audit log.
- `requestHistory.json` is written but the program reads history from each request's own record.
- Two copies of the program on one data folder can overwrite each other.
- The console menu is tested by hand; automated tests cover the classes, files and reports.
- No attachments or notifications.

## 12. Future improvements

Password login and a real Administrator role; audit entries for rejected actions; reading history from its own file; automated tests of the menu; email notifications; a web front end reusing the same classes.

## 13. Documentation

`docs/1-REQUIREMENTS_DOCUMENT.md`, `docs/2-UML_AND_SYSTEM_DESIGN.md` (diagrams also in `docs/diagrams/`), `docs/3-TECHNICAL_DOCUMENTATION.md`, `docs/4-USER_GUIDE.md`, `docs/5-TEST_REPORT.md`, `docs/6-AI_USE_DECLARATION.md`.

## 14. AI use declaration

I used an AI assistant (Claude, by Anthropic) while working on this project. The full declaration, describing what the AI did and what I did, is in `docs/6-AI_USE_DECLARATION.md`.
