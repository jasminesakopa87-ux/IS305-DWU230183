# UML and System Design

All diagrams were written for the **final submitted code** (the `distinction-extension` folder). They are Mermaid diagrams: GitHub draws them automatically when you open this page. The same diagrams are also saved as separate files in `docs/diagrams/`. Every class, field and method named in the class diagram was checked against the source files.

## 1. Use case diagram

```mermaid
flowchart LR
    Student(["Student Requester"])
    Staff(["Staff Requester"])
    Officer(["Service Officer"])
    Tech(["Technician"])
    Admin(["System Administrator<br/>(reports and audit only)"])

    UC1(("Register user"))
    UC2(("Submit request"))
    UC3(("View requests"))
    UC4(("Update own request"))
    UC5(("Cancel own request"))
    UC6(("Search / filter / sort"))
    UC7(("Review request"))
    UC8(("Assign priority"))
    UC9(("Assign Technician"))
    UC10(("Verify and close"))
    UC11(("Start work"))
    UC12(("Add progress note"))
    UC13(("Resolve request"))
    UC14(("View management reports"))
    UC15(("View audit log"))
    UC16(("View request history"))

    Student --- UC1
    Student --- UC2
    Student --- UC3
    Student --- UC4
    Student --- UC5
    Student --- UC6
    Staff --- UC1
    Staff --- UC2
    Staff --- UC3
    Staff --- UC4
    Staff --- UC5
    Staff --- UC6
    Officer --- UC1
    Officer --- UC3
    Officer --- UC6
    Officer --- UC7
    Officer --- UC8
    Officer --- UC9
    Officer --- UC10
    Tech --- UC1
    Tech --- UC3
    Tech --- UC11
    Tech --- UC12
    Tech --- UC13
    Admin --- UC14
    Admin --- UC15
    Admin --- UC16

    UC9 -. "requires" .-> UC7
    UC11 -. "requires" .-> UC9
    UC13 -. "requires" .-> UC11
    UC10 -. "requires" .-> UC13
```

Four roles act on the system. The dotted "requires" lines show the workflow order that the code enforces: a Technician cannot be assigned before a review, work cannot start before an assignment, and so on. The System Administrator is drawn because the brief names the role, but in this version it has no login or class: reports, history and the audit log are open menu options.

## 2. Class diagram

```mermaid
classDiagram
    class User {
        -userId
        -firstName
        -lastName
        -email
        -userType
        +getUserId()
        +getFullName()
        +getRole()
        +setEmail(email)
        +validate()
        +displayInfo()
        +toJSON()
    }
    class StudentRequester {
        -programme
        -yearLevel
        +getRole()
        +toJSON()
        +fromJSON(data)$
    }
    class StaffRequester {
        -department
        +getRole()
        +toJSON()
        +fromJSON(data)$
    }
    class ServiceOfficer {
        -serviceSection
        +getRole()
        +reviewRequest(request)
        +assignPriority(request, priority)
        +assignTechnician(request, technician)
        +closeRequest(request)
        +toJSON()
        +fromJSON(data)$
    }
    class Technician {
        -technicalSpeciality
        -available
        +getRole()
        +isAvailable()
        +startWork(request)
        +addProgressNote(request, note)
        +resolveRequest(request, summary)
        +toJSON()
        +fromJSON(data)$
    }
    User <|-- StudentRequester
    User <|-- StaffRequester
    User <|-- ServiceOfficer
    User <|-- Technician

    class UserFactory {
        +createFromData(savedData)$
    }
    UserFactory ..> StudentRequester : creates
    UserFactory ..> StaffRequester : creates
    UserFactory ..> ServiceOfficer : creates
    UserFactory ..> Technician : creates

    class ServiceRequest {
        <<abstract>>
        -requestId
        -requester
        -title
        -description
        -location
        -category
        -priority
        -status
        -assignedTechnician
        -progressNotes
        -resolutionSummary
        -history
        +getRequestType()
        +getStatus()
        +validateCommon()
        +validateSpecialisedFields()*
        +calculatePriorityScore()*
        +getTargetResolutionHours()*
        +getRequestSummary()*
        +getBasePriorityScore()
        +getBaseSummary()
        +updateDetails(changes, actor)
        +cancelRequest(actor)
        +review(actor)
        +setPriority(priority, actor)
        +assignTechnician(technician, actor)
        +startWork(technician)
        +addProgressNote(note, technician)
        +resolve(summary, technician)
        +close(actor)
        +getHistory()
        +toJSON()
        +_restoreState(savedData)
    }
    class ICTSupportRequest {
        -deviceType
        -systemName
        -faultType
        -networkImpact
        +validateSpecialisedFields()
        +calculatePriorityScore()
        +getTargetResolutionHours()
        +getRequestSummary()
        +toJSON()
    }
    class MaintenanceRequest {
        -building
        -roomNumber
        -hazardLevel
        -equipmentAffected
        +validateSpecialisedFields()
        +calculatePriorityScore()
        +getTargetResolutionHours()
        +getRequestSummary()
        +toJSON()
    }
    class CleaningRequest {
        -cleaningArea
        -hygieneRisk
        -serviceType
        -preferredServiceTime
        +hasHygieneRisk()
        +validateSpecialisedFields()
        +calculatePriorityScore()
        +getTargetResolutionHours()
        +getRequestSummary()
        +toJSON()
    }
    class GeneralServiceRequest {
        -generalServiceType
        +validateSpecialisedFields()
        +calculatePriorityScore()
        +getTargetResolutionHours()
        +getRequestSummary()
        +toJSON()
    }
    ServiceRequest <|-- ICTSupportRequest
    ServiceRequest <|-- MaintenanceRequest
    ServiceRequest <|-- CleaningRequest
    ServiceRequest <|-- GeneralServiceRequest

    class ServiceRequestFactory {
        +createRequest(category, commonData, specialisedData)$
        +createFromData(savedData, requesterRef)$
    }
    ServiceRequestFactory ..> ICTSupportRequest : creates
    ServiceRequestFactory ..> MaintenanceRequest : creates
    ServiceRequestFactory ..> CleaningRequest : creates
    ServiceRequestFactory ..> GeneralServiceRequest : creates

    class BaseFileRepository {
        -filePath
        -idField
        +loadAll()
        +saveAll(records)
        +findById(id)
        +create(record)
        +update(id, changes)
        +replace(id, record)
    }
    class UserFileRepository {
        +findByRole(role)
    }
    class ServiceRequestFileRepository {
        +findByRequester(userId)
        +findByTechnician(technicianId)
        +findByStatus(status)
    }
    class RequestHistoryFileRepository {
        +findByRequestId(requestId)
    }
    class AuditFileRepository {
        +findByRequestId(requestId)
        +findByActor(actorId)
    }
    BaseFileRepository <|-- UserFileRepository
    BaseFileRepository <|-- ServiceRequestFileRepository
    BaseFileRepository <|-- RequestHistoryFileRepository
    BaseFileRepository <|-- AuditFileRepository

    class fileStore {
        <<module>>
        +loadJSONArray(filePath)
        +saveJSONArray(filePath, records)
    }
    BaseFileRepository ..> fileStore : only file I/O

    class ServiceRequestManager {
        -users
        -requests
        +init()
        +registerUser(user)
        +findUserById(userId)
        +getUsersByType(role)
        +submitRequest(category, commonData, specialisedData)
        +findRequestById(requestId)
        +getRequestsByUser(userId)
        +getRequestsByTechnician(technicianId)
        +updateRequest(requestId, userId, changes)
        +cancelRequest(requestId, userId)
        +reviewRequest(requestId, officerId)
        +assignPriority(requestId, officerId, priority)
        +assignTechnician(requestId, officerId, technicianId)
        +closeRequest(requestId, officerId)
        +startWork(requestId, technicianId)
        +addProgressNote(requestId, technicianId, note)
        +resolveRequest(requestId, technicianId, summary)
        +searchRequests(searchText)
        +filterByCategory(category)
        +filterByStatus(status)
        +filterByPriority(priority)
        +sortByPriorityScore(requests)
        +sortByDateSubmitted(requests, ascending)
        +getRequestSummaryByStatus()
        +getRequestHistory(requestId)
    }
    ServiceRequestManager "1" *-- "many" User : holds in memory
    ServiceRequestManager "1" *-- "many" ServiceRequest : holds in memory
    ServiceRequestManager "1" o-- "4" BaseFileRepository : persists through
    ServiceRequestManager ..> UserFactory : restores users
    ServiceRequestManager ..> ServiceRequestFactory : creates and restores

    class ReportService {
        +requestsByStatus()
        +requestsByCategory()
        +requestsByPriority()
        +urgentRequests()
        +overdueRequests()
        +requestsByTechnician()
        +completedRequestsByTechnician()
        +averageResolutionHours()
        +requestVolumeByLocation()
        +fullReport()
    }
    ReportService ..> ServiceRequestManager : reads

    class CampusServiceApp {
        <<console>>
        +main()
    }
    CampusServiceApp ..> ServiceRequestManager : uses
    CampusServiceApp ..> ReportService : uses
```

### 2.1 How the classes relate

- **Inheritance.** `StudentRequester`, `StaffRequester`, `ServiceOfficer` and `Technician` extend `User`. `ICTSupportRequest`, `MaintenanceRequest`, `CleaningRequest` and `GeneralServiceRequest` extend `ServiceRequest`. The four repositories extend `BaseFileRepository`. Every subclass constructor starts with `super(...)`.
- **Abstraction.** `ServiceRequest` is abstract: `new ServiceRequest(...)` throws, and `calculatePriorityScore()`, `getTargetResolutionHours()`, `getRequestSummary()` and `validateSpecialisedFields()` throw `Abstract Method Error` until a subclass overrides them. Subclasses reuse common code through two ordinary helper methods, `getBasePriorityScore()` and `getBaseSummary()`.
- **Polymorphism.** `ServiceRequestManager` stores every request as a plain `ServiceRequest`. Reports, sorting and the console call the same method names on each one and get category-specific results (for example target resolution hours 8, 4, 2 and 72 for ICT with network impact, Maintenance with high hazard, Cleaning with hygiene risk, and General).
- **Composition.** The Manager holds its users and requests in memory (they exist as long as the Manager does). A `ServiceRequest` owns its history entries.
- **Aggregation.** The Manager is given four repository objects when it is built, which is how the tests point it at temporary folders.
- **Dependency.** The two factories are used by the Manager but hold no state. `ReportService` only reads from the Manager. `CampusServiceApp` calls the Manager and `ReportService` and never touches a file.
- **Why permission checks sit in `ServiceRequest`.** Each workflow method receives the person acting and checks their role (or, for a Technician, their ID against the assigned Technician) before changing anything. The rules therefore hold no matter what calls the method.

## 3. Sequence diagram - submitting a request

```mermaid
sequenceDiagram
    actor R as Student / Staff Requester
    participant App as CampusServiceApp
    participant Mgr as ServiceRequestManager
    participant Fac as ServiceRequestFactory
    participant Req as ICTSupportRequest
    participant RR as ServiceRequestFileRepository
    participant HR as RequestHistoryFileRepository
    participant AR as AuditFileRepository

    R->>App: choose "Submit Service Request" and answer the prompts
    App->>Mgr: findUserById(requesterId)
    App->>Mgr: submitRequest(category, commonData, specialisedData)
    Mgr->>Mgr: findUserById(), findRequestById() - reject unknown requester or duplicate ID
    Mgr->>Fac: createRequest(category, factoryInput, specialisedData)
    Fac->>Req: new ICTSupportRequest(commonData, specialisedData)
    Req->>Req: super(...) runs validateCommon() and records first history entry
    Req->>Req: validateSpecialisedFields()
    Req-->>Fac: request (status Submitted)
    Fac-->>Mgr: request
    Mgr->>RR: create(request.toJSON())
    Mgr->>HR: create(latest history entry)
    Mgr->>AR: create(audit entry "Request Creation")
    Mgr-->>App: request
    App-->>R: "Request submitted successfully" + getRequestSummary()
    Note over Req,AR: If any validation throws, nothing is saved.
```

## 4. Sequence diagram - assigning a Technician

```mermaid
sequenceDiagram
    actor O as Service Officer
    participant App as CampusServiceApp
    participant Mgr as ServiceRequestManager
    participant Req as ServiceRequest (status Reviewed)
    participant RR as ServiceRequestFileRepository
    participant HR as RequestHistoryFileRepository
    participant AR as AuditFileRepository

    O->>App: Service Officer Actions > Assign a Technician (Request ID, Technician ID)
    App->>Mgr: assignTechnician(requestId, officerId, technicianId)
    Mgr->>Mgr: requireRequest(), requireUser(officer), requireUser(technician)
    Mgr->>Req: assignTechnician(technician, officer)
    Req->>Req: requireRole(officer, "Service Officer") - throws otherwise
    Req->>Req: transitionTo("Assigned") - only allowed from Reviewed
    Req->>Req: addHistory(Reviewed to Assigned, actor = officer)
    Req-->>Mgr: request (status Assigned)
    Mgr->>RR: replace(requestId, request.toJSON())
    Mgr->>HR: create(latest history entry)
    Mgr->>AR: create(audit entry "Technician Assignment")
    Mgr-->>App: request
    App-->>O: "Request assigned. Status: Assigned"
    Note over Req: A Technician or Requester calling this is rejected before any state changes.
```

## 5. Sequence diagram - resolving and closing a request

```mermaid
sequenceDiagram
    actor T as Assigned Technician
    actor O as Service Officer
    participant App as CampusServiceApp
    participant Mgr as ServiceRequestManager
    participant Tech as Technician
    participant Req as ServiceRequest (InProgress)
    participant RR as ServiceRequestFileRepository
    participant AR as AuditFileRepository

    rect rgb(235, 245, 255)
    Note over T,AR: Part 1 - Technician resolves the work
    T->>App: Technician Actions > Resolve a request (Request ID, summary)
    App->>Mgr: resolveRequest(requestId, technicianId, summary)
    Mgr->>Tech: resolveRequest(request, summary)
    Tech->>Req: resolve(summary, technician)
    Req->>Req: requireAssignedTechnician(technician) - must be THIS request's Technician
    Req->>Req: transitionTo("Resolved"), addHistory(...)
    Req-->>Mgr: request (status Resolved)
    Mgr->>RR: replace(requestId, request.toJSON())
    Mgr->>AR: create(audit entry "Request Resolution")
    Mgr-->>App: request
    App-->>T: "Request marked Resolved"
    end

    rect rgb(255, 245, 230)
    Note over O,AR: Part 2 - Service Officer verifies and closes
    O->>App: Service Officer Actions > Close a resolved request (Request ID)
    App->>Mgr: closeRequest(requestId, officerId)
    Mgr->>Req: close(officer)
    Req->>Req: requireRole(officer, "Service Officer") and status must be Resolved
    Req->>Req: transitionTo("Closed"), addHistory(...)
    Req-->>Mgr: request (status Closed)
    Mgr->>RR: replace(requestId, request.toJSON())
    Mgr->>AR: create(audit entry "Request Closure")
    Mgr-->>App: request
    App-->>O: "Request closed."
    end
```
