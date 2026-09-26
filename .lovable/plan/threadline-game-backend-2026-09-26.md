# Threadline Game Backend

## Goal
Connect the existing Threadline dashboard to a persistent backend for player accounts and game progress.

## Scope
- Enable Lovable Cloud for player authentication and persistent game data.
- Add a player profile and mission-progress schema with row-level access controls; keep roles separate if roles are introduced.
- Let players create/sign into accounts and show session-aware account controls.
- Load saved player identity, XP, badges, and completed mission/activity data in the dashboard.
- Save mission completion and reward progress securely, preventing repeat reward claims.
- Keep the current mission descriptions and dashboard design; no new shop payments, multiplayer, or admin tooling.

## Technical Details
- Use the existing TanStack Start application and Lovable Cloud clients/server-function patterns.
- Add database tables and access policies, plus explicit Data API grants in the same migration.
- Use server-side authenticated validation for progress writes and keep per-player reads/writes scoped to the current account.
- Verify auth flow, progress persistence behavior, and public home rendering.
