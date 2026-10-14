# Test Report

Campus Service Request Management System - IS305 AT3 Major Project

**Version tested:** final system (`distinction-extension`)  
**Runner:** Node.js built-in test runner (`node --test`), run on a Windows computer with Node.js v24  
**Result of this run:** **44 of 44 tests passed, 0 failed.**  
**Evidence:** `docs/evidence/test-run.txt` is the full output of the run.

Every test builds its own temporary folder and deletes it afterwards, so the real `data` folder is never touched. "Actual result" is read from the test runner's output for each test; the test file name and test ID match the code in `distinction-extension/tests/`.

| Test ID | Feature tested | Test input | Expected result | Actual result | Pass / Fail |
|---|---|---|---|---|---|
| DT-01 | Valid construction (user) | `new StudentRequester('U010','Ann','Lee','ann@dwu.ac.pg','Business',2)` | ID `U010`, role `Student Requester`, year level 2 | Matched expected result | **Pass** |
| DT-02 | Valid construction (request) | `ICTSupportRequest` with valid common and ICT data | Status `Submitted`, category `ICT Support`, type `ICTSupportRequest` | Matched expected result | **Pass** |
| DT-03 | Invalid constructor value | `StaffRequester` with email `not-an-email` | Throws "not a valid email" | Matched expected result | **Pass** |
| DT-04 | Invalid constructor value | `ICTSupportRequest` with empty title | Throws "title is required" | Matched expected result | **Pass** |
| DT-05 | Invalid constructor value | `ICTSupportRequest` with device type `Spaceship` | Throws "not a supported device type" | Matched expected result | **Pass** |
| DT-06 | Duplicate identifiers | Register `U001` again; submit `R001` twice | Both rejected: "already registered", "already exists" | Matched expected result | **Pass** |
| DT-07 | Role permission | Technician, then Requester, call `assignTechnician`; then the Officer does | First two rejected "Only a Service Officer may assign"; Officer succeeds, status `Assigned` | Matched expected result | **Pass** |
| DT-08 | Role permission | Unassigned Technician `U004` calls `startWork`; then assigned `U003` | `U004` rejected; `U003` succeeds, status `InProgress` | Matched expected result | **Pass** |
| DT-09 | Role permission | Another user cancels / updates `R001` | Rejected: "only cancel your own", "only update your own" | Matched expected result | **Pass** |
| DT-10 | Status transition | Close a `Submitted` request; assign before review | Rejected: "Only a Resolved request can be closed", "Cannot assign a Technician" | Matched expected result | **Pass** |
| DT-11 | Status transition | Owner cancels; then review; then cancel again | Status `Cancelled`; both later actions rejected | Matched expected result | **Pass** |
| DT-12 | Specialised behaviour | Maintenance requests with hazard High and Low | SLA 4h and 72h; High scores higher | Matched expected result | **Pass** |
| DT-13 | Specialised behaviour | Cleaning requests with and without hygiene risk | SLA 2h and 48h; risky scores higher | Matched expected result | **Pass** |
| DT-14 | Polymorphism | One loop over ICT, Maintenance, Cleaning and General requests | Hours `[8, 4, 2, 72]`; each summary has its own details tag | Matched expected result | **Pass** |
| DT-15 | Abstraction | `new ServiceRequest(...)` | Throws "abstract" | Matched expected result | **Pass** |
| DT-16 | Abstraction | Subclass with no overrides calls the three abstract methods | Each throws "Abstract Method Error" | Matched expected result | **Pass** |
| DT-17 | Saving JSON | Register 4 users, submit 1 ICT request | `users.json` has 4 records; `serviceRequests.json` has 1 with `requestType` `ICTSupportRequest` | Matched expected result | **Pass** |
| DT-18 | Saving JSON | Submit then review a request | History file has 2 entries (actor `U002` on the 2nd); audit file has 6 entries ending `Status Change` / `Success` | Matched expected result | **Pass** |
| DT-19 | Invalid data not saved | Rejected `closeRequest` | Saved status still `Submitted`; history still 1 entry | Matched expected result | **Pass** |
| DT-20 | Restoring objects | New Manager calls `init()` on a folder with a Cleaning request, Assigned | 4 users and 1 request loaded; `CleaningRequest`, `Assigned`, hygiene risk true, SLA 2h, 3 history entries, Technician `U003`; users restored as `ServiceOfficer` etc. | Matched expected result | **Pass** |
| DT-21 | Restoring objects | Restore, then start, resolve and close | Reaches `Closed`; wrong Technician still rejected | Matched expected result | **Pass** |
| DT-22 | Restoring objects | Restart, then perform an action | All audit IDs unique | Matched expected result | **Pass** |
| DT-23 | Missing file | Load a file that does not exist | `[]` | Matched expected result | **Pass** |
| DT-24 | Missing file | `init()` with no data files | 0 users, 0 requests, no error | Matched expected result | **Pass** |
| DT-25 | Empty file | Zero-byte file, whitespace-only file, file containing `[]` | All load as `[]` | Matched expected result | **Pass** |
| DT-26 | File error | File containing broken JSON | Throws "File Error ... invalid JSON" | Matched expected result | **Pass** |
| DT-27 | File error | Valid JSON that is not an array | Throws "does not contain a JSON array" | Matched expected result | **Pass** |
| DT-28 | File error | Save a non-array value | Throws "Refusing to save non-array" | Matched expected result | **Pass** |
| DT-29 | File error | Write to a path whose parent is a file | Throws "File Error: Could not write" | Matched expected result | **Pass** |
| DT-30 | Repository | Create duplicate ID; update unknown ID; find unknown ID | "already exists"; "No record found"; `null` | Matched expected result | **Pass** |
| DT-31 | Report | Requests by status (1 Closed, 2 Submitted) | `{Closed: 1, Submitted: 2}` | Matched expected result | **Pass** |
| DT-32 | Report | Requests by category and by priority | 1 per category; Urgent 1, High 1, Normal 1 | Matched expected result | **Pass** |
| DT-33 | Report | Urgent requests | Only `R1` | Matched expected result | **Pass** |
| DT-34 | Report | Volume by location | Library 2, then Cafeteria 1 (busiest first) | Matched expected result | **Pass** |
| DT-35 | Report | Assigned and completed per Technician | Grace 1 and 1; John 0 and 0 | Matched expected result | **Pass** |
| DT-36 | Report | Average resolution hours | A number from 0 up to (not including) 1 | Matched expected result | **Pass** |
| DT-37 | Report | Overdue requests | 0 (nothing old enough; closed requests excluded) | Matched expected result | **Pass** |
| DT-38 | Report | Full report totals | 3 requests, 4 users, status and location sections present | Matched expected result | **Pass** |
| DT-39 | Search | Search `WI-FI`, `r2`, `spill`, no match, empty text | `R1`; `R2`; `R3`; none; all 3 | Matched expected result | **Pass** |
| DT-40 | Filter | By category, status, priority | Correct request(s) each time; empty list when none match | Matched expected result | **Pass** |
| DT-41 | Filter | By assigned Technician `U003` and `U004` | `R2`; none | Matched expected result | **Pass** |
| DT-42 | Sort | By date submitted, both directions | `R1,R2,R3` and `R3,R2,R1` | Matched expected result | **Pass** |
| DT-43 | Sort | By priority score | `R3,R2,R1` with scores 6, 3, 1 | Matched expected result | **Pass** |
| DT-44 | Sort | Sort, then list all | Stored order unchanged | Matched expected result | **Pass** |

## Coverage of the required test areas

| Required area | Tests |
|---|---|
| Valid object construction | DT-01, DT-02 |
| Invalid constructor values | DT-03, DT-04, DT-05 |
| Duplicate identifiers | DT-06, DT-30 |
| Role permissions | DT-07, DT-08, DT-09 |
| Controlled status transitions | DT-10, DT-11 |
| Specialised request behaviour | DT-12, DT-13 |
| Polymorphic method calls and abstraction | DT-14, DT-15, DT-16 |
| Saving JSON data | DT-17, DT-18, DT-19 |
| Loading and restoring saved objects | DT-20, DT-21, DT-22 |
| Missing or empty data files | DT-23, DT-24, DT-25 |
| Report calculations | DT-31 to DT-38 |
| File-reading or file-writing errors | DT-26, DT-27, DT-28, DT-29 |
| Search, filter and sort | DT-39 to DT-44 |

## Manual testing of the console application

The console menu is not covered by automated tests. It was tested by hand by running the full workflow through the real menu:

| ID | Test | Result |
|---|---|---|
| MT-01 | Register a Student, a Service Officer and a Technician; leave and restart the program | Loaded "3 user(s)" on restart - Pass |
| MT-02 | Submit an ICT request as the student; leave and restart | Loaded "1 request(s)" with all fields - Pass |
| MT-03 | Officer reviews and assigns; Technician starts, adds a note, resolves; Officer closes | Status moved Submitted to Closed in order - Pass |
| MT-04 | Technician User ID typed as `5` (a menu number) when assigning | "No user found with ID 5"; request unchanged; menu continued - Pass |
| MT-05 | View request history (option 12) | 7 entries in order, each with its actor - Pass |
| MT-06 | Management reports (option 13) and audit log (option 14) | Figures and 10 audit lines matched the actions performed - Pass |
| MT-07 | Filter / Sort (option 15): by status Closed; by priority score | `R001` returned; score 5 shown - Pass |
| MT-08 | Wrong menu choices (`99`, `abc`, blank) | "Invalid choice" message each time; program continued - Pass |

## Defects found and fixed during testing

| Found by | Defect | Fix |
|---|---|---|
| Test script during the Credit stage | Any Technician could start work on a request assigned to someone else, because only the status change was checked. | Workflow methods now receive the acting user and check the role or the assigned Technician (DT-07, DT-08). |
| Review of the empty-file requirement | A zero-byte data file made the program refuse to start. | `loadJSONArray()` treats an empty file as an empty collection (DT-25). |
| Review against the brief | Filter and sort existed in the Manager but were not reachable from the menu and not tested. | Added menu option 15 and tests DT-39 to DT-44. |
| Manual test | A wrong menu number printed "not wired up yet". | Now prints an "Invalid choice" message. |
