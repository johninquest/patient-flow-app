# Clinic Patient Management App — Architecture Decisions

**Context:** Multi-tenant SaaS for small clinics. Each clinic is a tenant. Staff manage patient flow within their clinic. No hard regulatory compliance target yet (informal/best-effort privacy) — design choices below leave room to harden later without re-architecting.

**Stack:** NestJS (backend) · better-auth (auth) · PostgreSQL (DB) · React (frontend)

---

## 1. Multi-Tenancy

**Decision:** Single database, single schema, shared tables, tenant column (`clinic_id`) on every clinical table. Tenant = better-auth `Organization`.

- One clinic = one `Organization` (better-auth org plugin)
- One staff user = one clinic (no multi-clinic membership at launch — simplifies session/context handling, no active-org-switching needed)
- `Member` (better-auth) = staff person + their role within that clinic

**Isolation — defense in depth, two layers, both required:**
1. **App layer:** middleware/interceptor resolves `clinic_id` from the authenticated session and injects it into every query. Never trust a client-supplied tenant id.
2. **DB layer:** PostgreSQL Row-Level Security (RLS) on every clinical table.
   - `SET app.current_clinic_id = '<uuid>'` per request/connection
   - Policy: `USING (clinic_id = current_setting('app.current_clinic_id')::uuid)`
   - This is the backstop against a forgotten `WHERE` clause — treat it as non-negotiable, build it at MVP stage, not later.

**Rejected for now:** schema-per-tenant, database-per-tenant. Revisit only if a clinic requires physical data segregation (may surface later from a compliance need).

**Portability note:** Sticking to plain Postgres (RLS, standard SQL) and a self-hostable auth library keeps the system portable. Avoid vendor-specific multi-tenant DB features.

---

## 2. Authentication

**Decision:** better-auth, using the **organization plugin** as the foundation for tenancy + membership.

- Organization plugin provides: organizations, members, roles, invitations (`inviteMember`), direct add (`addMember`), role update (`updateMemberRole`), removal (`removeMember`)
- Built-in guard: the last `owner` of an org cannot be removed/demoted without promoting another owner first — don't duplicate this logic.
- Session carries `activeOrganizationId` — this is the tenant key used everywhere downstream (even though each user belongs to only one clinic at launch, this primitive is already there if multi-clinic staff is ever needed).

---

## 3. Authorization

**Decision:** Three-layer model — RBAC (coarse) + CASL (attribute-based exceptions) + RLS (tenant backstop, see §1).

### 3.1 Roles (launch set — expand later, don't pre-build more)
- `owner` — full access within their clinic (billing, staff management, all data)
- `doctor` — clinical access, scoped to their own assigned patients/encounters
- `receptionist` — scheduling, intake, demographics; no clinical notes
- *(Room reserved for up to 6–7 roles total, e.g. `nurse`, `lab_tech`, `pharmacist`, `billing` — same pattern, add as needed)*

### 3.2 Enforcement layers
1. **NestJS Guard** — role-level check: is this action even possible for this role? (e.g., `receptionist` can never hit `DELETE /patients/:id`)
2. **CASL ability check** — attribute/relationship-based exceptions that role alone can't express (e.g., "doctor sees only their own patients"). Defined as a single `defineAbilitiesFor(user)` function — one file, one switch statement per role, version-controlled and type-checked.
3. **Postgres RLS** — tenant isolation backstop (see §1). Independent of CASL/RBAC — fails closed even if app logic has a bug.

### 3.3 Why CASL (chosen over alternatives)
- Considered: Casbin (more "enterprise," similar tier, also fine), Oso (DSL-based, library now in maintenance mode, not a good fresh start), OpenFGA/Permit.io (Zanzibar-style relationship graphs — overkill for current role/relationship count, reconsider only if relationship complexity grows significantly).
- CASL chosen for: TypeScript-native API, **isomorphic** — same ability rules can be reused on the React frontend to hide/show UI elements, not just enforce server-side.
- Use it narrowly: RBAC handles "can this role do X," CASL only handles the attribute-based exceptions (e.g. doctor/patient assignment). Don't let it sprawl into a general rules engine prematurely.

### 3.4 Example shape (reference, not final code)
```ts
switch (user.role) {
  case 'owner':
    can('manage', 'all');
    break;
  case 'doctor':
    can('read', 'Patient', { assignedDoctorId: user.id });
    can('update', 'Encounter', { assignedTo: user.id });
    break;
  case 'receptionist':
    can('create', 'Patient');
    can('update', 'Patient', ['firstName', 'lastName', 'phone', 'address']);
    cannot('read', 'ClinicalNote');
    break;
}
```

### 3.5 Future extension (not built yet)
If clinics need *custom* roles beyond the fixed set, store rule overrides in a DB table and load them when building the ability object, instead of the hardcoded switch. Don't build until there's a real customer need.

---

## 4. User / Role Administration

**Decision:** Compose better-auth's org member APIs, with our own guard rails layered on top.

- Gate all member-management actions (`addMember`, `updateMemberRole`, `removeMember`, `inviteMember`) behind a CASL rule: `can('manage', 'Member')` — **owner only** at launch.
- **Policy:** an `owner` may assign any of the fixed roles freely within their own clinic. Tenant isolation (RLS) already prevents cross-clinic effects. Add a second restriction tier only if a real need emerges (e.g. platform-only roles).
- **Audit every role change** (see §5) — this is the single most important category of event to have a trail for.
- **No stale permissions:** if abilities are cached (e.g. Redis) or embedded in a session/JWT claim, a role change must take effect immediately — either avoid caching abilities (rebuild `defineAbilitiesFor(user)` per request, cheap at this scale) or synchronously invalidate the affected user's cache entry inside the role-update code path.
- **Frontend:** simple staff admin screen (list + role dropdown + remove button) — straightforward CRUD UI against better-auth's org member endpoints, no custom backend beyond the guard + audit wrapper.

---

## 5. Audit Trail

**Decision:** Single append-only `audit_log` table. No DB triggers/pgAudit needed yet (compliance-grade overhead, add later only if a regulation forces it).

### Schema (reference)
```
audit_log {
  id
  clinic_id
  actor_user_id
  actor_role
  action            -- e.g. 'patient.updated', 'member.role_changed', 'patient.viewed'
  resource_type
  resource_id
  diff              -- jsonb, nullable (before/after for mutations)
  created_at
  ip_address
}
```

### Two distinct audit needs — don't conflate
1. **Write/mutation audit** — who changed what. Call `AuditService.record(...)` from inside services (cleaner before/after diffs than a generic interceptor), or use an interceptor on mutating endpoints.
2. **Access/read audit** — who *viewed* a patient record. Cannot be captured by DB triggers (reads don't mutate). Must be explicit logging in the read path of sensitive endpoints (e.g. `GET /patients/:id`). Log asynchronously (queue or non-blocking insert) so it doesn't slow responses.

- No updates or deletes allowed on `audit_log`, even by `owner`.

---

## 6. Patient Flow / Process Steps (Encounter Workflow)

**Decision:** Hand-rolled finite state machine + ownership lock. No BPM engine (Camunda/Zeebe solve a different problem — long-running cross-system orchestration with a visual editor for analysts; not needed here).

### Model
The flow lives on its own entity, not on the patient record:
```
Encounter {
  id, patient_id, clinic_id
  status       -- REGISTERED | WAITING_FOR_DOCTOR | IN_CONSULTATION | AWAITING_LAB | READY_FOR_PHARMACY | COMPLETED
  assigned_to  -- staff_id currently owning this step
  version      -- optimistic lock (int)
}
```

- `assigned_to` is what prevents Doctor B from picking up Patient A mid-consultation — an ownership field, not a workflow abstraction.
- A transition is valid only if: (a) it's an allowed move for the current status, and (b) the actor is the current owner (or holds an override role like `owner`).

### Implementation tiers
1. **Leanest (start here):** plain TS map of allowed transitions + a `transitionEncounter(id, toStatus, actor)` service method. Checks the map, checks ownership, updates with `WHERE id = ? AND version = ?` (optimistic locking to catch races), writes to `audit_log`. No dependency. Sufficient for ~5–8 linear states.
2. **Upgrade trigger:** move to **XState** only once the flow needs branching paths, parallel states (e.g. lab + pharmacy concurrently), or time-based escalations. Persist `status` + context to Postgres; rehydrate the machine per request (don't run it as a long-lived in-memory process).

### Adjacent but separate concern
Scheduled/delayed/retryable work (e.g. "remind doctor if patient waits >20 min") is a **job queue** concern, not workflow — use **BullMQ** (Redis-backed, fits NestJS naturally). Keep it decoupled from the synchronous state machine above.

---

## Build Order (recommended sequence)

1. better-auth + organization plugin — one org per clinic signup, default role `owner`
2. `clinic_id` on all clinical tables + RLS policies + app-layer tenant-scoping middleware
3. Role-based Guards for the launch role set
4. `audit_log` table + `AuditService`, wired into patient read/write endpoints and member role changes
5. CASL ability definitions — only once attribute-based rules (e.g. doctor/patient scoping) are actually being built
6. `Encounter` entity + transition map + ownership lock + optimistic locking
7. Staff admin UI (React) for role management, gated by `can('manage', 'Member')`

---

## Explicitly Deferred (do not build until a real need appears)

- DB-backed custom/dynamic roles per clinic
- OpenFGA / Permit.io / relationship-graph authorization
- pgAudit or DB-trigger-based audit logging
- XState / BPM-engine workflow orchestration
- Multi-clinic staff membership / active-org switching
- Schema- or database-per-tenant isolation