---
name: scaffold-react-feature
description: "Generate a React feature module following Patient Flow conventions"
---

# Scaffold React Feature

Generate a complete React feature module for the Patient Flow client.

## Input

Ask me for:
1. **Feature name** (e.g., `patients`, `encounters`, `tasks`)
2. **Entity fields** and their display types
3. **Which roles can see which views/actions**

## Output

Generate the following files:

### 1. `client/src/features/<name>/<Name>ListPage.tsx`
- Default export (for lazy loading)
- `useTranslation()` for all strings
- TanStack Query hook for data fetching (`useQuery`)
- Table or card list layout using shared `Table` or `Card` components
- Loading and error states
- Role-based action buttons (hidden for unauthorized roles)

### 2. `client/src/features/<name>/<Name>DetailPage.tsx`
- Default export (for lazy loading)
- `useParams()` for ID, TanStack Query for detail fetch
- Detail display with edit/delete actions (role-gated)
- Loading and error states

### 3. `client/src/features/<name>/<Name>Form.tsx`
- Create/edit form using shared `FormInput`, `Select` components
- TanStack Query mutation (`useMutation`) for submit
- Validation feedback
- i18n labels and placeholders

### 4. `client/src/features/<name>/<Name>Card.tsx`
- Compact card component for list views
- Key fields displayed
- Click-through to detail

### 5. `client/src/features/<name>/index.ts`
- Public exports for the feature

### 6. `client/src/hooks/use<Names>.ts`
- `use<Names>()` — list query
- `use<Name>(id)` — detail query
- `useCreate<Name>()` — create mutation
- `useUpdate<Name>()` — update mutation
- `useDelete<Name>()` — delete mutation
- All mutations invalidate relevant query keys on success

### 7. `client/src/lib/types/<name>.types.ts`
- TypeScript interface matching the backend entity
- Create and Update DTO types matching backend DTOs

### 8. Route registration
- Add lazy route(s) to the router config
- Wrap in `ProtectedRoute`
- Add navigation link to sidebar/nav

### 9. i18n keys
- Add translation keys to both `client/src/i18n/en.json` and `client/src/i18n/fr.json`

## Conventions Reference

- See `.github/instructions/react.instructions.md` for detailed patterns
- Function components only, named exports
- Tailwind CSS v4 for all styling
- `useTranslation()` for all user-facing strings
- TanStack Query for all server state
