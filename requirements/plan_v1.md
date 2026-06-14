# Patient Flow — High-Level Requirements (MVP)

## 1. Overview

**Patient Flow** is a lightweight patient workflow orchestration system designed to help healthcare organizations track patients through care stages, assign tasks to staff, and ensure clear handoffs across the care journey.

It is designed to work across:
- Private practices
- Specialty clinics
- Hospitals (via scalable abstractions, not hospital-specific logic)

### Core Idea
> Provide a single source of truth for *where a patient is* and *what needs to happen next*.

---

## 2. Product Goals

### Primary Goal
Replace fragmented patient coordination (sticky notes, inbox messages, verbal handoffs) with a structured workflow + task system.

### Secondary Goals
- Reduce missed steps in patient care
- Improve staff coordination across roles
- Provide visibility into patient status in real time
- Be simple enough for small practices, but extensible for hospitals

---

## 3. Non-Goals (Important for MVP focus)

- Full EHR replacement
- Billing / claims processing
- Clinical decision support
- Inpatient bed management systems
- Deep medical coding systems (ICD, CPT automation)
- Specialty-specific clinical workflows

---

## 4. Core Concepts

### 4.1 Patient
A patient is a core entity with:
- Identity (name, DOB, contact info)
- Associated encounters/visits
- Workflow state

---

### 4.2 Encounter (or Visit)
A single care interaction instance:
- Scheduled appointment or admission event
- Moves through workflow states
- Contains tasks and notes

---

### 4.3 Workflow State (Canonical Model)
A simplified, universal lifecycle:

- Scheduled
- Checked-in
- In Progress
- Completed
- Cancelled / No-show

> This abstraction must remain stable and generic across all customer types.

---

### 4.4 Task
The atomic unit of work.

Each task has:
- Title
- Description (optional)
- Owner (user or role)
- Status: Todo / In Progress / Done
- Priority (Low / Medium / High)
- Linked Encounter
- Blocking flag (yes/no)

---

### 4.5 Role
Role-based assignment (not individual-first design):

MVP roles:
- Front Desk
- Clinical Staff
- Provider
- Admin

---

## 5. MVP Scope (What to Build First)

### Phase 1 — Core Workflow Engine (Highest Priority)

#### Must Have
- Patient record creation
- Encounter creation
- State machine (workflow states)
- Task creation tied to encounter/state
- Manual state transitions
- Basic audit log (who did what, when)

#### Why first
This is the **foundation of every use case** across practices, clinics, and hospitals.

---

### Phase 2 — Task Management Layer

#### Must Have
- Task assignment (user + role)
- Task dashboard (list view)
- Task status updates
- Filtering by:
  - Patient
  - Encounter
  - Status
  - Assignee

#### Why next
This is the **daily operational value** for staff.

---

### Phase 3 — Basic Patient Intake

#### Must Have
- Patient intake form builder (simple fields only)
- Digital submission form (patient-facing link)
- Attach intake data to patient + encounter
- Consent checkbox support

#### Why now
This is the **first external-facing value** and improves adoption speed.

---

### Phase 4 — Scheduling Lite (Minimal Viable Version)

#### Must Have
- Create scheduled encounters
- Basic calendar view (optional but useful)
- Manual appointment creation

#### Keep simple
Do NOT build full scheduling optimization or calendar sync yet.

---

### Phase 5 — Notifications (Lightweight)

#### Must Have
- Email or SMS notifications for:
  - Appointment scheduled
  - Check-in complete
  - Task assigned
- Trigger-based messaging (state change → message)

---

### Phase 6 — Admin & Setup

#### Must Have
- User management
- Role assignment
- Simple workflow configuration (toggle states only)
- Organization setup

---

## 6. Data Model (High Level)

### Entities

#### Patient
- id
- name
- date_of_birth
- contact_info

#### Encounter
- id
- patient_id
- status (workflow state)
- scheduled_time
- created_at

#### Task
- id
- encounter_id
- title
- description
- status
- priority
- assigned_user_id (nullable)
- assigned_role (nullable)

#### User
- id
- name
- role

#### AuditLog
- id
- actor_id
- action
- entity_type
- entity_id
- timestamp

---

## 7. UX Requirements (MVP-Level)

### 7.1 Staff Dashboard
- “Today’s patients”
- Task queue
- Patient status overview

### 7.2 Patient View (Optional but powerful)
- Intake form
- Appointment confirmation
- Basic updates (SMS/email-driven)

### 7.3 Encounter View
- Current state
- Task list
- Timeline of actions

---

## 8. System Design Requirements

### Architecture Principles
- Event-driven state transitions (lightweight at MVP stage)
- Stateless API backend preferred
- Clear separation of:
  - Patient data
  - Encounter workflow
  - Task engine

### Must support later expansion into:
- Multi-tenant SaaS
- EHR integrations (FHIR-ready abstraction layer eventually)
- Enterprise audit/compliance features

---

## 9. Prioritization Summary

### 🔴 Must Build First (Critical Path)
1. Patient + Encounter data model
2. Workflow state machine
3. Task engine (create, assign, complete)
4. Basic UI for staff task management

---

### 🟠 Next Priority
5. Intake forms
6. Scheduling (minimal)
7. Notifications

---

### 🟡 Later (Post-MVP)
8. Analytics / reporting
9. Integrations (EHR, labs, etc.)
10. Advanced permissions / departments
11. Mobile apps
12. Workflow customization per specialty

---

## 10. Success Criteria for MVP

You know MVP is working when:
- Staff can reliably see **what needs to be done next**
- No patient is “lost” in the system
- Task ownership is always clear
- A full patient visit can be tracked end-to-end

---

## 11. Key Product Insight

The product is not:
> a medical record system

It is:
> a **coordination layer for patient movement and staff execution**

That distinction is what keeps it viable across practices, clinics, and hospitals.