# 2026-04-25 UI And Tooling Lessons

This archive preserves older full-detail lessons moved out of
`docs/project/lesson-learn.md` when the main retrieval file approached the
30k-character compaction threshold.

### 2026-04-25 - Cline-Style Chat Composer Triggers And Attachments

**Signal:** Typing `/` or `@` in the project-detail chat input changed text
only; no command menu, context menu, or attachment flow appeared.

**Cause:**

- The composer kept only a plain string value and submitted only text.
- Toolbar buttons for context, files, and workflows were visual-only.
- `ProjectDetailPage` regenerated detail data on local UI renders, which could
  reset chat messages when toggling the side panel.

**Fix:**

- Port the core Cline composer state machine locally: slash detection, context
  mention detection, accessible suggestion lists, keyboard selection, toolbar
  triggers, selected attachments, drag/drop, and attachment-only sends.
- Use project-detail data as the mention source for files, folders, git changes,
  problems, and URLs.
- Memoize project detail data so local chat state survives right-panel toggles.
- Render empty file-filter results as an empty state instead of showing a file
  outside the visible result set.

**UI/UX:** `/` now gives immediate workflow feedback; `@` exposes project
context instead of being a dead character; file attachments appear as compact
Cline-style tiles before send and as file chips on sent messages. The fix
improves user goals, task flow, visual feedback, keyboard accessibility, empty
states, and product consistency with Cline.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`
- `bun run --cwd apps/shell build`

**Remember:** For Cline-like chat UI, the composer is a state machine, not a
plain textarea. If a toolbar advertises context, workflows, or attachments,
typing the trigger and clicking the icon must produce visible, keyboard-usable
feedback and preserve the payload through send.

### 2026-04-25 - Explicit Multi-Dimensional UI/UX Optimization

**Signal:** UI-facing work can be functionally complete while the reusable
lesson only records files, commands, or implementation details.

**Cause:**

- UI/UX improvements are often spread across layout, copy, state handling,
  responsiveness, and performance instead of one obvious bug fix.
- Future agents need to know why an interface changed, not only what changed.

**Fix:**

- Treat UI/UX as a required analysis dimension for app-facing changes.
- In future UI lessons, record how the agent optimized user goals, task flow,
  information architecture, visual hierarchy, accessibility, responsive
  behavior, loading/empty/error states, performance, and product context.
- Prefer concise before/after reasoning tied to the changed screens or
  components.

**UI/UX:** Multi-dimensional UI/UX analysis is now part of the project agent
protocol and the lesson template, so interface improvements must be described as
experience improvements rather than only code changes.

**Verify:**

- Review `AGENTS.md` for the first-class UI/UX optimization rule.
- Review this file for the UI/UX protocol bullet, reusable pattern category,
  template field, and resolved case.

**Remember:** For app-facing work, future agents must explain how the UI became
clearer, faster, more accessible, more resilient, or easier to use from multiple
user and product perspectives.

### 2026-04-25 - Root Dev Desktop And Electrobun Build Lock

**Signal:** `bun run dev` failed before starting with Turbo
`package_json_parse_error`, then later failed with
`EACCES: permission denied, rm 'apps\shell\build\dev-win-x64'`. After the
lock was fixed, `bun run dev` could leave `launcher.exe` and bundled `bun.exe`
running but no shell UI appeared.

**Cause:**

- `apps/shell/package.json` had a JavaScript-style comment, but Turbo parses
  package manifests as strict JSON.
- Root `dev` was routed through `turbo run dev`, while the expected workflow is
  the shell app desktop dev script.
- A previous Electrobun dev session can keep `build/dev-win-x64` locked on
  Windows via `electrobun.exe`, `launcher.exe`, or the bundled `bun.exe`.
- In flat-file dev mode, Electrobun's launcher loads
  `Resources/app/bun/index.js`. A Bun entrypoint named `main.ts` builds to
  `main.js`, so the app worker does not run and no `BrowserWindow` is created.

**Fix:**

- Keep package manifests strict JSON; do not comment scripts inside
  `package.json`.
- Set root `package.json` `dev` to
  `bun run --cwd apps/shell desktop:dev`, and keep workspace-wide Turbo dev as
  `dev:turbo` if needed.
- If Electrobun reports `EACCES` removing `build/dev-win-x64`, run
  `make stop` to stop stale FPTClaw/Electrobun dev processes for this project,
  then run dev again. If no matching process remains but the generated build
  directory is still locked, verify the resolved path is inside the workspace
  and remove only `apps/shell/build/dev-win-x64` before rebuilding. The shell
  Electrobun wrapper now pre-cleans that generated directory on Windows before
  `electrobun build`.
- Keep the Electrobun Bun entrypoint basename as `index.ts` so the build emits
  `Resources/app/bun/index.js`. Use `src/electrobun/index.ts` as the configured
  entrypoint and import the actual window setup from `src/electrobun/main.ts`.

**Verify:**

- `bunx turbo run dev --dry=json`
- `make stop`
- `bun run --cwd apps/shell desktop:build`
- `Test-Path apps/shell/build/dev-win-x64/FPTClaw-dev/Resources/app/bun/index.js`
- `bun run dev` starts Electrobun and logs `Loaded identifier:
dev.fptclaw.agent` plus `Loading app code from flat files`, and
  `Get-Process` shows the bundled `bun.exe` with `MainWindowTitle` `FPTClaw`.

**Remember:** Root `bun run dev` is the desktop app workflow. Turbo cannot parse
JSON comments, and Electrobun dev output can be locked by an earlier still-open
desktop process or stale generated output. Use `make stop` before retrying dev
when the build folder is locked; if no process exists, delete only the verified
generated `build/dev-win-x64` directory. For Electrobun dev flat files, the
configured Bun entrypoint must emit `index.js`.

### 2026-04-25 - Electrobun Startup WebView Layout Sync

**Signal:** The desktop shell opened with the bottom chat/footer area hidden.
Maximizing the window and restoring it made the footer appear in the correct
position.

**Cause:**

- The React shell used `h-svh` on the top-level sidebar layout, but the Windows
  WebView viewport can be stale during Electrobun's first native paint.
- The `BrowserWindow` was not retained and shown with a small post-show size
  synchronization, so the WebView bounds were not forced to recalculate until
  the user resized the window.

**Fix:**

- Use `h-full min-h-0 overflow-hidden` for the root `SidebarProvider` and
  `SidebarInset` app shell containers in `apps/shell/src/App.tsx`.
- Keep the `BrowserWindow` in `apps/shell/src/electrobun/main.ts`, call
  `show()`, then nudge the native height by one pixel and restore it after the
  window is visible.

**UI/UX:** The shell now opens directly into a stable work area with the chat
footer visible, so users do not need to maximize/restore before typing or
seeing the bottom controls.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell build`
- `bun run --cwd apps/shell desktop:build`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`

**Remember:** For Electrobun Windows app shells, prefer full-height flex
containers over `svh` at the app root and force one post-show WebView bounds
sync if first paint only corrects itself after a native resize.

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
