# User Guide

Campus Service Request Management System - IS305 AT3 Major Project

The console examples below are real output from the program (shortened where noted).

## 1. Installation requirements

- **Node.js 18 or later.** Check with `node --version`.
- No database and no extra packages. `npm install` has nothing to download but creates `package-lock.json`.
- Windows, macOS or Linux, with a terminal.

## 2. Setup

1. Get the project (clone the GitHub repository or unzip the submission).
2. Open a terminal in the **`distinction-extension`** folder:
   ```
   cd AT3_CampusServiceRequestSystem\distinction-extension
   ```
3. Run `npm install`.

> **Windows PowerShell:** if you see "running scripts is disabled", use `npm.cmd install` and `npm.cmd test` instead. Nothing else changes.

The `data` folder already holds simulated sample data (three users and one closed request). If a data file is missing, the program creates it when needed.

## 3. Starting the application

```
node CampusServiceApp.js
```
(or `npm start`). The first line says how many users and requests were loaded:

```
Loaded 3 user(s) and 1 request(s) from ...\distinction-extension\data.

============================================
 CAMPUS SERVICE REQUEST SYSTEM (DISTINCTION)
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
13. View Management Reports
14. View Audit Log
15. Filter / Sort Requests
16. Exit
============================================
Enter your choice (1-16):
```

Type a number and press Enter. Always use option **16** to leave: data is saved after every action, so nothing is lost if you do close the window, but 16 exits cleanly. Avoid Ctrl+C while a prompt is waiting.

## 4. Registering or selecting a user

There is no password. Option 1 registers a person, and every other action simply asks you to type the User ID you registered with. Sample users already in the data folder: `U001` (Student), `U002` (Service Officer), `U003` (Technician).

```
Enter your choice (1-16): 1

--- Register User ---
Select a role:
  1. Student Requester
  2. Staff Requester
  3. Service Officer
  4. Technician
Enter a number: 1
User ID: U001
First name: Alice
Last name: Tau
Email address: alice@dwu.ac.pg
Programme: Information Systems
Year level: 3

User registered successfully:
User ID   : U001
Name      : Alice Tau
Email     : alice@dwu.ac.pg
User Type : Student
```

Each role asks its own extra question (Programme and Year level; Department; Service section; Technical speciality).

## 5. Submitting a request

Choose option 2 as a Student or Staff Requester. The questions after the category depend on the category.

```
--- Submit Service Request ---
Your User ID: U001
New Request ID: R001
Title: Wi-fi down
Description: No Wi-Fi in the library
Campus location: Library
Select a priority:
  1. Low
  2. Normal
  3. High
  4. Urgent
Enter a number: 3
Select a category:
  1. ICT Support
  2. Facilities Maintenance
  3. Cleaning and Sanitation
  4. General Campus Service
Enter a number: 1
Device type:
  1. Laptop
  2. Desktop
  3. Printer
  4. Network Equipment
  5. Software
  6. Other
Enter a number: 4
System/service name: Campus Wi-Fi
Fault type:
  1. Hardware
  2. Software
  3. Network
  4. Account/Access
  5. Other
Enter a number: 3
Does this affect the network for multiple users? (y/n): y

Request submitted successfully:
[R001] Wi-fi down
  Type        : ICTSupportRequest
  Category    : ICT Support
  Requester ID: U001 (Alice Tau)
  Priority    : High
  Status      : Submitted
  Location    : Library
  Technician  : Unassigned
  Description : No Wi-Fi in the library
  [ICT Details] Device: Network Equipment | System: Campus Wi-Fi | Fault: Network | Network Impact: Yes
```

(The summary also shows a "Submitted" date and time.) Each Request ID must be new.

## 6. Assigning and processing a request

This is done by three different people, in this order.

**Step 1 - Service Officer reviews and assigns** (option 10, User ID `U002`):

```
--- Service Officer Actions ---
Your Service Officer User ID: U002

Choose an action:
  1. Review a request
  2. Assign priority
  3. Assign a Technician
  4. Close a resolved request
  5. Back to Main Menu
Enter a number: 1
Request ID: R001

Request R001 reviewed. Status: Reviewed
...
Enter a number: 3
Request ID: R001
Technician User ID: U003

Request R001 assigned. Status: Assigned
```

Type the **Technician's User ID** (for example `U003`), not a menu number.

**Step 2 - Technician does the work** (option 11, User ID `U003`):

```
Choose an action:
  1. View my assigned requests
  2. Start work on a request
  3. Add a progress note
  4. Resolve a request
  5. Back to Main Menu
Enter a number: 2
Request ID: R001

Work started on request R001.
```
Then option 3 (add a note) and option 4 (resolve, with a short summary).

**Step 3 - Service Officer verifies and closes** (option 10, then "Close a resolved request"):

```
Request R001 closed.
```

Option **12** then shows the full history, including who did each step:

```
--- View Request History ---
Request ID: R001
  1. [Submitted] Request submitted. (actor: U001) - 10/8/2026, 10:35:02 AM
  2. [Reviewed] Request reviewed. (actor: U002) - 10/8/2026, 10:36:06 AM
  3. [Assigned] Assigned to Grace Gordan. (actor: U002) - 10/8/2026, 10:36:51 AM
  4. [InProgress] Work started. (actor: U003) - 10/8/2026, 10:37:31 AM
  5. [InProgress] Progress note: Replace the faulty access point (actor: U003) - 10/8/2026, 10:37:48 AM
  6. [Resolved] Request resolved. (actor: U003) - 10/8/2026, 10:38:21 AM
  7. [Closed] Request closed and verified. (actor: U002) - 10/8/2026, 10:39:05 AM
```

A Requester can change their mind while the request is still `Submitted`: option 6 updates it (leave a field blank to keep it) and option 7 cancels it.

## 7. Searching, filtering and sorting

**Option 8** searches by request ID or title, ignoring upper/lower case.

**Option 15** filters and sorts:

```
--- Filter / Sort Requests ---
Choose an option:
  1. Filter by category
  2. Filter by status
  3. Filter by priority
  4. Filter by assigned Technician
  5. Sort by date submitted (oldest first)
  6. Sort by date submitted (newest first)
  7. Sort by priority score (highest first)
Enter a number: 7
  1. [R001] Wi-fi down - score 5 (High, ICT Support)
```

The priority score combines the priority with a category rule (for example network impact for ICT, hazard level for Maintenance, hygiene risk for Cleaning).

## 8. Reports and the audit log

**Option 13 - Management reports:**

```
============== MANAGEMENT REPORTS ==============
Total requests      : 1
Total users         : 3
Average resolution  : 0.07h
Urgent requests     : 0
Overdue requests    : 0

Requests by status:
  Closed      : 1

Requests by category:
  ICT Support               : 1

Requests by priority:
  High      : 1

Requests assigned to each Technician (all statuses):
  Grace Gordan: 1

Completed requests by Technician:
  Grace Gordan: 1

Request volume by campus location:
  Library             : 1
```

**Option 14 - Audit log** (all entries, or filtered by request ID or actor ID):

```
  [AUD-4] 2026-10-08T00:35:02.647Z | U001 (Student Requester) | Request Creation | Request: R001 | Submitted "Wi-fi down". | Success
  [AUD-5] 2026-10-08T00:36:06.825Z | U002 (Service Officer) | Status Change | Request: R001 | Request reviewed. | Success
  [AUD-6] 2026-10-08T00:36:51.634Z | U002 (Service Officer) | Technician Assignment | Request: R001 | Assigned to Grace Gordan. | Success
```

## 9. Common errors and solutions

| Message | Meaning | Fix |
|---|---|---|
| `Invalid choice ... Please enter a number from 1 to 16.` | The main menu choice is not 1-16. | Type a number from the menu. |
| `Please enter a number between 1 and N.` | A numbered list was answered with something else (often an ID). | Type only the list number. |
| `This field is required. Please try again.` | A required answer was left blank. | Type a value. |
| `Validation Error: "..." is not a valid email address.` | The email is not in the form `name@domain.xx`. | Retype it, for example `alice@dwu.ac.pg`. |
| `Validation Error: Year level must be a whole number between 1 and 6.` | Year level was not 1-6. | Enter a whole number 1-6. |
| `Validation Error: A user with ID "U001" is already registered.` | That User ID is taken. | Use a new ID. |
| `Validation Error: A request with ID "R001" already exists.` | That Request ID is taken. | Use a new ID. |
| `No registered user found with ID "..."` / `Validation Error: No user found with ID "..."` | The ID does not belong to anyone. A common cause is typing a menu number where an ID is expected. | Type the real User ID. |
| `Validation Error: No request found with ID "..."` | No such request. | Check the ID (option 5 lists all requests). |
| `Validation Error: Only a Service Officer may review a request.` (also: assign a Technician, change the priority, close a Resolved request) | You used a Requester's or Technician's ID for an Officer action. | Use a Service Officer's ID. |
| `Validation Error: Only the Technician assigned to this request may perform this action.` | You are not the Technician on this request. | Use the assigned Technician's ID (option 3 shows who it is). |
| `Validation Error: Cannot review this request - request is currently "...", which does not allow moving to "Reviewed".` (similar for other steps) | A workflow step was skipped or repeated. | Follow the order: Submitted, Reviewed, Assigned, InProgress, Resolved, Closed. Option 12 shows where the request is. |
| `Validation Error: Only a Resolved request can be closed.` | The Technician has not resolved it yet. | Wait for the Technician. |
| `Validation Error: You can only cancel your own requests.` / `...update your own requests.` | You are not the original Requester. | Use the Requester's ID. |
| `Validation Error: Only a Submitted request can be updated.` | The request has already moved on. | Updates are only allowed while `Submitted`. |
| `File Error: "...users.json" contains invalid JSON and could not be read.` | A data file was edited by hand and broken. | Fix the file, or restore it from the repository. Do not edit `data` files while the program runs. |
