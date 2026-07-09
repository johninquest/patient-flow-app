# Use Text Type for Foreign Keys Referencing Better Auth User ID

**Date:** 2026-07-09  
**Status:** decided

## Problem
The `user` table uses `text('id')` as its primary key (Better Auth convention), but three business tables had foreign key columns defined as `uuid(...)`:
- `audit_log.actor_user_id`
- `encounters.assigned_to`
- `tasks.assigned_user_id`

PostgreSQL refused to create foreign key constraints between `uuid` and `text` columns due to type incompatibility, causing `drizzle-kit push` to fail with error 42804.

## Decision
Changed all three foreign key columns from `uuid(...)` to `text(...)` in the Drizzle schema to match Better Auth's text-based user ID type. Updated corresponding DTO validation decorators from `@IsUUID()` to `@IsString()`.

## Rationale
Better Auth uses text IDs by convention and we cannot change this without fighting the library. Aligning our FK columns to `text` is the correct approach because:
1. It matches the referenced table's primary key type
2. All services and client code already treat user IDs as plain strings (no UUID-specific logic)
3. PostgreSQL can implicitly cast `uuid` → `text` for existing data during migration
4. This is a minimal change that respects Better Auth's conventions rather than trying to customize the auth system

Considered changing Better Auth to use UUIDs, but rejected this as it would require custom configuration and fight the library's defaults.
