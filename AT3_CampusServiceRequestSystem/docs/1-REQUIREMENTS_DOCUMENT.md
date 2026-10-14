# Requirements Document

**Campus Service Request Management System**
Divine Word University - Faculty of Business and Informatics - Department of Information Systems
IS305 Object-Oriented Programming - AT3 Major Project

---

## 1. Project background

A university campus only works if its ICT equipment, buildings and shared spaces work. When something fails (a lab network, a cracked window, a spill in the cafeteria) the people who notice first are students and staff, not the service teams who fix it. At Divine Word University these problems are currently reported by telephone, in conversation, or on handwritten notes. This project replaces that informal process with a structured console application that records, assigns, processes and monitors campus service requests.

## 2. Problem statement

- **No record.** A phone call or hallway conversation leaves nothing to refer back to.
- **No tracking.** Once reported, a requester cannot see whether anything is happening.
- **Unclear responsibility.** Nobody is formally assigned to a report.
- **No prioritisation.** A safety hazard and a minor annoyance are reported the same way.
- **No verification.** There is no step that confirms a fix actually worked.
- **No history.** Management cannot see which locations or categories generate the most reports, or how long fixes take.

## 3. Project objectives

1. Give every request a permanent, structured record (who, what, where, when).
2. Make each request's status visible from `Submitted` to `Closed`.
3. Enforce a controlled workflow so a request can only move through valid steps.
4. Assign clear responsibility: a Service Officer reviews and assigns, a named Technician does the work.
5. Capture category-specific information (ICT, Maintenance, Cleaning, General) with category-specific urgency rules.
6. Keep data between sessions in JSON files (no database).
7. Keep an attributable audit trail and per-request history.
8. Produce management reports using array algorithms.
9. Demonstrate encapsulation, inheritance, polymorphism and abstraction in JavaScript.

## 4. Project scope

### 4.1 In scope
- Registration of four roles: Student Requester, Staff Requester, Service Officer, Technician.
- Four request categories (ICT Support, Facilities Maintenance, Cleaning and Sanitation, General Campus Service), each a specialised class.
- The workflow `Submitted -> Reviewed -> Assigned -> InProgress -> Resolved -> Closed`, with `Cancelled` reachable only from `Submitted`.
- Role-restricted actions, search, filter and sort, request history, audit log, nine management reports.
- JSON file persistence with `fs/promises`, restoring saved data into correctly specialised objects.
- A Node.js console interface and 44 automated tests using the built-in test runner.

### 4.2 Out of scope
- Any database (MongoDB, Mongoose, MySQL, SQLite or similar).
- A graphical or web interface; notifications (email/SMS); file attachments.
- Authentication or password login (see Section 8).
- Multi-user network access or concurrent use of one data folder.
- Automatic escalation of overdue requests (the system reports them but does not notify anyone).

## 5. Actors and user roles

| Actor | Description |
|---|---|
| Student Requester | Reports issues and tracks them. Holds programme and year level. |
| Staff Requester | Same capabilities as a Student Requester. Holds a department. |
| Service Officer | Reviews requests, sets priority, assigns a Technician, verifies and closes. Holds a service section. |
| Technician | Starts work, records progress notes, resolves. Holds a technical speciality. |
| System Administrator (conceptual) | Reviews reports and the audit log. **Not implemented as a separate class or login**: in this version the reports, audit log and history are menu options available to any console user. |

## 6. Functional requirements

### 6.1 User management
| ID | Requirement |
|---|---|
| FR-1 | The system shall let a person register as a Student Requester, Staff Requester, Service Officer or Technician. |
| FR-2 | The system shall reject a user with a missing ID, first name, last name or invalid email. |
| FR-3 | The system shall reject a user ID that is already registered. |
| FR-4 | The system shall capture role-specific details (programme and year level; department; service section; technical speciality). |

### 6.2 Request submission
| ID | Requirement |
|---|---|
| FR-5 | A registered Requester shall be able to submit a request in one of four categories. |
| FR-6 | A title, description and campus location shall be required. |
| FR-7 | Category-specific details shall be captured (ICT: device, system, fault type, network impact; Maintenance: building, room, hazard level, equipment; Cleaning: area, hygiene risk, service type, preferred time; General: service type). |
| FR-8 | Unsupported categories, priorities or category-specific values shall be rejected. |
| FR-9 | A duplicate request ID shall be rejected. |
| FR-10 | A new request shall start with status `Submitted`. |

### 6.3 Workflow and permissions
| ID | Requirement |
|---|---|
| FR-11 | Status shall only move `Submitted -> Reviewed -> Assigned -> InProgress -> Resolved -> Closed`, or `Submitted -> Cancelled`. Any other change shall be rejected. |
| FR-12 | Only a Service Officer may review a request. |
| FR-13 | Only a Service Officer may change a request's priority. |
| FR-14 | Only a Service Officer may assign a Technician, and only to a Reviewed request. |
| FR-15 | Only the assigned Technician may start work, add progress notes or resolve the request. |
| FR-16 | Only a Service Officer may close a Resolved request. |
| FR-17 | Only the original Requester may update or cancel a request, and only while it is `Submitted`. |

### 6.4 Viewing, searching, filtering and sorting
| ID | Requirement |
|---|---|
| FR-18 | Any user shall be able to view a request by ID, view all requests, and view their own requests. |
| FR-19 | The system shall search requests by request ID or title (case-insensitive). |
| FR-20 | The system shall filter requests by category, status, priority and assigned Technician. |
| FR-21 | The system shall sort requests by date submitted (either direction) and by a category-aware priority score. |
| FR-22 | The system shall show a count of requests by status. |

### 6.5 History and audit
| ID | Requirement |
|---|---|
| FR-23 | Every request shall keep a history of status changes and actions: previous status, new status, action, actor ID and role, and time. |
| FR-24 | The system shall record an audit entry (audit ID, actor ID and role, action, request ID, description, time, outcome) for user registration, request creation, update, priority change, Technician assignment, status change, cancellation, resolution and closure. |
| FR-25 | The audit log shall be viewable in full or filtered by request ID or actor ID. |

### 6.6 Persistence
| ID | Requirement |
|---|---|
| FR-26 | Users, requests, request history and audit records shall be saved to `users.json`, `serviceRequests.json`, `requestHistory.json` and `auditLog.json` using only `fs/promises`. |
| FR-27 | On start-up the system shall load saved data and rebuild each record as an object of the correct specialised class. |
| FR-28 | A missing or empty data file shall be treated as an empty collection. |
| FR-29 | An invalid or rejected action shall never be written to disk. |
| FR-30 | A corrupt data file or a failed write shall produce a clear error message naming the file. |

### 6.7 Reporting
| ID | Requirement |
|---|---|
| FR-31 | Reports shall cover requests by status, by category and by priority. |
| FR-32 | Reports shall list urgent requests and overdue requests (overdue is based on each request type's own target resolution hours). |
| FR-33 | Reports shall show requests assigned to each Technician and requests each Technician has completed. |
| FR-34 | Reports shall show the average resolution time and request volume by campus location. |

## 7. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Usability | The console menu shall be numbered, and every rejected action shall print a specific, readable message (not a stack trace). |
| NFR-2 | Reliability | A failed or rejected operation shall not corrupt data already saved. |
| NFR-3 | Maintainability | All file access shall be isolated in the repository layer (`fileStore.js` is the only module that imports `fs`). |
| NFR-4 | Maintainability | Adding a new request category shall need one new subclass and one entry in the factory, not changes to the other categories. |
| NFR-5 | Data integrity | Every field shall be private and changed only through a validated setter or workflow method. |
| NFR-6 | Portability | The system shall run on Node.js 18 or later with no external packages. |
| NFR-7 | Testability | Automated tests shall use temporary folders and never touch the real `data` folder. |
| NFR-8 | Performance | Operations shall feel instant for the data volume of a single campus (hundreds to low thousands of requests). |
| NFR-9 | Data safety | Only simulated data shall be used; no passwords or confidential information shall be stored. |
| NFR-10 | Security (limitation) | Users are identified by a typed User ID, not a password. See Section 8. |

## 8. Assumptions and limitations

### 8.1 Assumptions
- Users enter their own correct User ID and choose the correct role.
- One person uses one copy of the program at a time, on one computer.
- Data volumes stay small enough for flat JSON files.
- Node.js 18 or later is installed.

### 8.2 Limitations
- **No authentication.** Anyone at the console can act as any registered user. This is the biggest limitation and the first candidate for future work.
- **No System Administrator role.** Reports, history and the audit log are open to every console user.
- **No concurrency control.** Two copies of the program on the same data folder can overwrite each other.
- **Only successful actions are audited.** Rejected attempts (wrong role, invalid transition) are reported on screen but not written to the audit log, so every audit entry has outcome `Success`.
- **`requestHistory.json` is write-only.** History is also embedded in each request record, and the application reads it from there. The separate file exists for querying and audit purposes but the program does not read it back.
- **No attachments, no notifications.**
- **JSON files are not a database.** They suit this scale but would not suit enterprise use.
- **Names are copied, not linked.** A request stores the requester's and Technician's name at the time of the action; renaming a user later does not change old records.

## 9. User stories

| ID | Story | Acceptance criteria |
|---|---|---|
| US-1 | As a student, I want to register, so that I can submit and track requests. | Registration fails with a clear message for a missing field, a bad email or a duplicate ID. |
| US-2 | As a staff member, I want to submit a Facilities Maintenance request with building, room and hazard level, so that the team knows where and how urgent it is. | The request is saved as `Submitted` with all specialised fields; invalid input is rejected. |
| US-3 | As a requester, I want to see only my own requests, so that I do not have to search through everyone's. | "View My Requests" lists only requests where I am the requester. |
| US-4 | As a Service Officer, I want to review a request and set its priority, so that urgent work is identified first. | Only a Service Officer can do this; anyone else is rejected. |
| US-5 | As a Service Officer, I want to assign a named Technician to a Reviewed request, so that responsibility is clear. | Only a Service Officer can assign, only from `Reviewed`. |
| US-6 | As a Technician, I want to start work, add progress notes and resolve my assigned request, so that there is a record of what was done. | Only the assigned Technician can do this. |
| US-7 | As a Service Officer, I want to verify a resolved request before closing it, so that work is not marked complete until I am satisfied. | Closing works only from `Resolved`, and only for a Service Officer. |
| US-8 | As a requester, I want to update or cancel my request while it is still `Submitted`, so that I can fix a mistake or withdraw it. | Works only for my own request and only while `Submitted`. |
| US-9 | As any user, I want to search, filter and sort requests, so that I can find what I need. | Search by ID/title; filter by category, status, priority, Technician; sort by date and priority score. |
| US-10 | As a Service Officer, I want to see a request's full history, so that I know exactly what has happened and who did it. | History is listed in order with the actor for each step. |
| US-11 | As any user, I want my data to be there next time I open the program, so that I do not start again. | After a restart, users and requests are reloaded with their status and history. |
| US-12 | As a manager, I want reports by status, category, priority, location and Technician, so that I can plan staffing. | Each report reflects the saved data. |
| US-13 | As a manager, I want to look up every action on a request or by a person, so that I can resolve disputes. | The audit log can be filtered by request ID or actor ID. |
