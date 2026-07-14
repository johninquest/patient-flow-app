# Agentic Engineering System with Contract-First Development

**Date:** 2026-07-15  
**Status:** decided

## Problem

As the Patient Flow codebase grows, relying on a single generic Copilot chat session for all tasks leads to context bloat, structural drift between frontend and backend, and inconsistent code quality. There was no single source of truth for API shapes or database schema that both the developer and Copilot agents could reference, resulting in frontend/backend mismatches and ad-hoc endpoint definitions. Verification (tests, review, contract conformance) was manual and easy to skip.

## Decision

Adopt a structured **agentic engineering system** built on four pillars:

1. **Contracts as source of truth** — Created `docs/contracts/api_spec.md` and `docs/contracts/schema.md` as authoritative, hand-maintained blueprints. All code generation attaches these via `#api_spec.md` / `#schema.md`. Contracts are updated *before* code (contract-first development).

2. **Specialized agent profiles** — Created five role-based prompt files in `.github/prompts/`: `architect.md`, `backend-engineer.md`, `frontend-engineer.md`, `tester.md`, `reviewer.md`. Each profile defines responsibilities, implementation patterns, and a conformance checklist the agent must verify before marking a task complete.

3. **Plan → Execute → Verify workflow** — Documented in `AGENTS_WORKFLOW.md`. Plan with `/architect`, execute with `/backend-engineer` + `/frontend-engineer` in parallel sessions, verify with `/tester` + `/reviewer` + `/check-contract-drift`. Sessions are kept lean and split by concern (backend, frontend, tests, review).

4. **Reliability engineering** — Agents self-correct by running lint/build, pulling diagnostics, and (for frontend) launching the integrated browser to verify layout. A `/check-contract-drift` prompt audits live code against the contracts and reports drift.

## Rationale

The core insight from agentic engineering in 2026 is that **cluttered context destroys model reasoning** and **agents excel at strict constraint matching**. By providing explicit contract files, we eliminate up to 90% of structural bugs between frontend and backend — the agent cross-references the contract rather than guessing shapes. Splitting work into specialized, parallel sessions keeps each agent's context focused on one concern, preventing the degradation that happens in long, multi-purpose sessions.

We chose a **hybrid contract strategy** (seed from existing code, then hand-maintain) rather than fully generated contracts because: (a) the initial seed captured the current API surface accurately, and (b) hand-maintained contracts act as a design driver rather than a byproduct — you think about the API shape before writing code, not after.

We kept prompts in the existing `.github/prompts/` directory (rather than `.github/copilot/prompts/`) for consistency with the project's established structure and to avoid breaking existing slash commands.

The `software-architect` skill (previously empty) was filled to support the `/architect` agent profile with system design, database design, performance, and security architecture expertise.

Alternatives considered:
- **Generated contracts from code** (e.g., extract from Swagger/DTOs) — rejected because contracts become a byproduct, not a design driver; drift goes unnoticed until runtime.
- **Single-session workflow** — rejected because context bloat degrades agent performance on multi-feature work.
- **Minimal profiles (architect + tester only)** — rejected because the full Plan → Execute → Verify loop needs separate backend, frontend, and review perspectives to be effective.
