# Lessons Learned

This file captures reusable, hard-won lessons from project development. Its job
is to keep future coding agents from rediscovering the same solution path.

## Agent Protocol

- Read this file before changing an area that appears in "Resolved Cases".
- Update this file automatically after solving a reusable issue, especially when
  the solution required non-obvious debugging, multiple failed attempts, tooling
  investigation, cross-package reasoning, or performance/typing optimization.
- Keep updates compact. Merge into an existing entry when the lesson is the same;
  add a new entry only when the case teaches a distinct pattern.
- Record verified solutions, not guesses. Every lesson should include the
  successful fix and the command or check that proved it.
- Do not store secrets, tokens, connection strings, or `.env` values.

## What Belongs Here

- Non-obvious build, lint, type, test, Cypress, Turbo, Bun, Vite, or workspace
  fixes.
- Patterns that prevent repeated codebase exploration.
- Project-specific conventions discovered during implementation.
- Tooling interactions that are easy to misconfigure.

## What Does Not Belong Here

- One-off feature summaries.
- Changelog-style release notes.
- Large implementation narratives.
- Unverified ideas or speculative advice.

## Compact Entry Template

```md
### YYYY-MM-DD - Short Case Name

**Signal:** User-visible error, failing command, or repeated trap.
**Cause:** The root issue in one or two bullets.
**Fix:** The solution that worked, including key files.
**Verify:** Exact commands or checks.
**Remember:** The reusable rule for future agents.
```

## Resolved Cases

### 2026-04-25 - Cypress Shared Config And Turbo Env

**Signal:** TypeScript reported `Cannot find name 'process'` in
`apps/shell/cypress.config.ts`, and ESLint Turbo reported
`CYPRESS_BASE_URL is not listed as a dependency in turbo.json`.

**Cause:**

- Cypress config runs in a Node context, but the shell app tsconfig is scoped for
  browser/Vite types.
- `CYPRESS_BASE_URL` is read by the shared Cypress config, so Turbo needs it in
  the Cypress task env list.
- Unscoped `cy:run` or `cy:open` task definitions in root `turbo.json` apply to
  every workspace, including packages without Cypress scripts.

**Fix:**

- Keep app config minimal:
  `apps/shell/cypress.config.ts` should call `createCypressConfig()`.
- Keep `process.env.CYPRESS_BASE_URL` inside
  `packages/cypress/src/config.ts`, where Node types are available.
- In `turbo.json`, scope Cypress task definitions to the workspaces that own
  them: `@repo/cypress#cy:run`, `@repo/cypress#cy:open`, `shell#cy:run`, and
  `shell#cy:open`.
- When a Cypress helper terminates with `cy.wrap(undefined)`, type the chain as
  `Cypress.Chainable<undefined>`, not `Cypress.Chainable<unknown>`.

**Verify:**

- `bunx eslint cypress.config.ts --max-warnings 0` from `apps/shell`
- `bun run check-types` from `apps/shell`
- `bun run check-types` from `packages/cypress`
- `bunx prettier --check turbo.json apps/shell/cypress.config.ts packages/cypress/src/virtual-list.ts`
- `bunx turbo run cy:run --dry=json`
- `bunx turbo run cy:open --dry=json`

**Remember:** Prefer moving Node-only config logic into a shared config package
over widening browser app tsconfig types. Scope Turbo tasks when only specific
workspaces own the scripts.
