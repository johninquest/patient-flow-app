---
applyTo: "client/src/**"
description: "React frontend conventions for Patient Flow"
---

# React Instructions

## Component Rules

- **Function components only** — no class components
- **Named exports** — `export function PatientList()` not `export default`
- **Co-locate** — keep component file, styles (if any), and tests together
- **Small components** — extract sub-components when a file exceeds ~200 lines

## File Naming

- Components: `PascalCase.tsx` → `PatientCard.tsx`
- Hooks: `camelCase.ts` → `useAuth.ts`
- Utils: `camelCase.ts` → `formatDate.ts`
- Types: `camelCase.types.ts` → `patient.types.ts`
- Route pages: `PascalCase.tsx` → `PatientListPage.tsx`

## Data Fetching — TanStack Query

All server state goes through TanStack Query. Never use `fetch` or `axios` directly in components.

### API Client

Centralized API client in `client/src/lib/api/client.ts` with `credentials: 'include'` for cookie-based auth.

### Query Hooks

Create custom hooks per feature in `client/src/hooks/`:

```typescript
// hooks/usePatients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api/client';

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then(r => r.json()),
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePatientDto) => api.post('/patients', data).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });
}
```

### Query Key Convention

Use arrays for hierarchical keys:
- `['patients']` — list
- `['patients', id]` — detail
- `['encounters', { patientId }]` — filtered list

## Auth — React Context

Auth/session state lives in a React Context. This is the **only** use of Context for shared state.

```typescript
// hooks/useAuth.ts
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) { ... }
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

## i18n — react-i18next

All user-facing strings must use the `useTranslation()` hook. Never hardcode English text.

```typescript
import { useTranslation } from 'react-i18next';

function PatientCard({ patient }: Props) {
  const { t } = useTranslation();
  return <h2>{t('patients.detail.title')}</h2>;
}
```

Translation files: `client/src/i18n/en.json` and `client/src/i18n/fr.json`.
Always add keys for **both** locales when adding new user-facing strings.

## Styling — Tailwind CSS v4

- **Tailwind only** — no inline styles, no CSS modules, no styled-components
- Use utility classes directly: `className="flex items-center gap-2 text-sm text-gray-600"`
- For complex repeated patterns, extract to a component, not a CSS class
- Design tokens (colors, spacing) configured in `tailwind.config.ts`

## Routing — React Router v7

All feature routes are lazy-loaded:

```typescript
// routes/AppRoutes.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const PatientListPage = lazy(() => import('../features/patients/PatientListPage'));
const PatientDetailPage = lazy(() => import('../features/patients/PatientDetailPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/patients" element={<PatientListPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Protected Routes

Wrap authenticated routes in a `ProtectedRoute` component that checks `useAuth()`:

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth/login" />;
  return <>{children}</>;
}
```

## Feature Module Structure

```
features/<name>/
  <Name>ListPage.tsx       # List view
  <Name>DetailPage.tsx     # Detail view
  <Name>Form.tsx           # Create/edit form
  <Name>Card.tsx           # Card/list item component
  index.ts                 # Public exports
```

## Reusable Components

Shared UI primitives live in `client/src/components/`:
- Button, Modal, Table, FormInput, Select, Alert, EmptyState, ConfirmDialog, Tooltip
- Prefer these over creating new one-off components
- All shared components accept `className` prop for Tailwind customization

## Error Handling

- Use TanStack Query's `error` state for API errors
- Show user-friendly error messages (translated via i18n)
- Never show raw API error responses to users
- Use error boundaries for unexpected React errors

## TypeScript

- Strict mode enabled
- Define types in `client/src/lib/types/` — one file per entity
- Use interfaces for object shapes, types for unions/aliases
- API response types should match backend DTOs
