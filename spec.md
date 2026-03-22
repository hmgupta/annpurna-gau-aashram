# Annpurna Gau Aashram

## Current State
The app is a full-featured bilingual gaushala management system. It supports cow registry, health records, milk management, donations, announcements, offspring records, QR scanning, fodder management, role-based PIN login, and change log. The backend uses ICP canister with stable storage.

## Requested Changes (Diff)

### Add
- Backend: `createUser` now enforces a maximum of 50 total users; if limit is reached, the call traps with a clear message
- Frontend Admin Panel: Show "X/50 users" progress bar/counter above the create form; disable create button when limit is reached
- Backend: Safe guard in initial `do` block -- check `users.containsKey(1)` before calling `users.add(1, ...)` to prevent traps on re-init

### Modify
- Admin Panel: `createUser` form shows remaining slots (e.g. "45 slots remaining"); create button disabled when users.length >= 50
- Online card: also show total users out of 50 (e.g. "3 online / 12 total / 50 max")

### Remove
- Nothing removed

## Implementation Plan
1. Update `src/backend/main.mo`: add 50-user limit check in `createUser`; fix `do` block with containsKey guard
2. Update `src/frontend/src/pages/AdminPage.tsx`: show X/50 counter, disable form when at limit
