# Popaty – AI Agent Instructions

**Popaty** is a fullstack property management app for DIY landlords. Stack: NestJS API + SvelteKit client, PostgreSQL with Drizzle ORM, Better Auth.

## Project Layout

```
api/        # NestJS backend (Bun runtime)
client/     # SvelteKit frontend (SSR disabled, CSR only)
drizzle/    # Migration SQL files (generated, do not edit manually)
```

## Commands

### API (`cd api`)
| Task | Command |
|------|---------|
| Dev server | `bun run start:dev` |
| Build | `bun run build` |
| Unit tests | `bun test` |
| E2E tests | `bun run test:e2e` |
| Lint | `bun run lint` |
| Generate migration | `bun run db:generate` |
| Run migrations | `bun run db:migrate` |
| DB studio | `bun run db:studio` |

### Client (`cd client`)
| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Type check | `npm run check` |
| Lint | `npm run lint` |

### Docker (repo root)
```bash
docker-compose up            # Dev (API :3000, client :5173)
docker-compose up -d         # Background
docker-compose exec api bun run db:migrate  # Run migrations inside container
docker-compose -f docker-compose.prod.yml up  # Production
```

> **Package managers differ**: API uses **Bun**, client uses **npm**. Do not mix them.

## Environment Variables

Copy `.env.example` to `.env` at the repo root. Required vars:
- `DATABASE_URL` – PostgreSQL connection string
- `AUTH_SECRET` – random secret (generate: `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – Google OAuth
- `API_URL` / `CLIENT_URL` – service URLs

## Architecture

### API (NestJS)

- **Entry**: `api/src/main.ts`
- **Modules**: `api/src/modules/` — each feature (properties, units, tenants, rent, expenses, analytics, activity, user-access) is a self-contained NestJS module.
- **Database**: `api/src/core/db/schema.ts` — single Drizzle schema file. All IDs are UUIDs generated with `uuidv7()`, **not** `gen_random_uuid()`.
- **Auth**: Better Auth via `api/src/core/auth/auth.ts`. The `AuthGuard` resolves the session and attaches `request.user`. Use `@CurrentUser()` to access the user in controllers.
- **Access control**: Three tiers checked via `api/src/core/common/access.util.ts`:
  - **owner** – full access including delete
  - **manager** – read/write, no delete of the property itself
  - **viewer** – read only
  All controller methods that touch a property must verify access using these utilities.

#### Controller pattern
```ts
@Controller('resource')
@UseGuards(AuthGuard)          // Always at class level
export class ResourceController {
  @Get()
  findAll(@CurrentUser() user: any) { ... }
}
```

#### Adding a new module
1. Create `api/src/modules/<name>/` with `*.module.ts`, `*.controller.ts`, `*.service.ts`.
2. Register in `api/src/app.module.ts`.
3. All DB queries go in the service; controllers are thin.
4. Add access checks using `canAccessProperty` / `canEditProperty` / `isPropertyOwner` from `access.util.ts`.
5. Log mutations to the `activities` table (entity_type, action, changes).

#### Database / Drizzle workflow
- Schema: `api/src/core/db/schema.ts` (single file, do not split)
- After any schema change: `bun run db:generate` → review generated SQL → `bun run db:migrate`
- Never edit files in `drizzle/` manually.
- `drizzle.config.ts` references `./src/db/schema.ts` (note: path relative to `api/`).

### Client (SvelteKit)

- **SSR is disabled**: `export const ssr = false` in `client/src/routes/+layout.ts`. The app is a pure CSR SPA.
- **API client**: `client/src/lib/api/client.ts` — use the `api` object (`api.get`, `api.post`, `api.put`, `api.delete`). It always sends `credentials: 'include'` for cookie-based auth.
- **API URL**: resolved in `client/src/lib/config.ts` — automatically switches between `localhost:3000` (dev) and `https://api.popaty.com` (prod).
- **Auth**: Better Auth client-side SDK; auth state managed via stores in `client/src/lib/auth/`.
- **i18n**: `client/src/lib/i18n/` — supported locales: `en`, `fr`. Always add translation keys for user-facing strings.
- **Components**: `client/src/lib/components/` — reusable UI (Button, Modal, Table, FormInput, etc.). Prefer these over new one-off components.
- **Stores**: `client/src/lib/stores/` — Svelte stores for shared state.

#### SvelteKit route pattern
```
routes/
  <feature>/
    +page.svelte       # UI
    +page.ts           # load function (calls api.*)
```
No server-side load functions (`+page.server.ts`) — everything is client-side.

## Auth Flow

1. Browser → POST `/api/auth/sign-in` (or Google OAuth redirect) → Better Auth sets `session_token` cookie.
2. Every API request includes the cookie (`credentials: 'include'`).
3. `AuthGuard` calls `auth.api.getSession()` to validate; attaches `session.user` to `request.user`.
4. In production, cross-subdomain cookies are scoped to `.popaty.com` — API on `api.popaty.com`, client on `app2.popaty.com`.

## Production Deployment

- Traefik reverse proxy handles TLS termination and routing.
- API: `api.popaty.com` → container port 3000.
- Client: `app2.popaty.com` → container port 3000 (built static/adapter-node output).
- Migrations must be run manually after deploy: `docker-compose exec api bun run db:migrate`.
