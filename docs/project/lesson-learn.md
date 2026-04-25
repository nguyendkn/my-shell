# Lessons Learned

This file captures reusable, hard-won lessons from project development. Its job
is to keep future coding agents from rediscovering the same solution path.

## Agent Protocol

- Read this file before changing an area that appears in "Resolved Cases".
- Update this file automatically after solving a reusable issue, especially when
  the solution required non-obvious debugging, multiple failed attempts, tooling
  investigation, cross-package reasoning, UI/UX optimization, or
  performance/typing optimization.
- Keep updates compact. Merge into an existing entry when the lesson is the same;
  add a new entry only when the case teaches a distinct pattern.
- Record verified solutions, not guesses. Every lesson should include the
  successful fix and the command or check that proved it.
- For UI-facing work, record how the coding agent improved the experience, not
  just which components changed.
- Do not store secrets, tokens, connection strings, or `.env` values.

## What Belongs Here

- Non-obvious build, lint, type, test, Cypress, Turbo, Bun, Vite, or workspace
  fixes.
- Patterns that prevent repeated codebase exploration.
- Project-specific conventions discovered during implementation.
- Reusable UI/UX optimization patterns: user goals, task flow, information
  architecture, visual hierarchy, accessibility, responsive behavior,
  loading/empty/error states, performance, and product context.
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
**UI/UX:** For UI-facing work, how the agent improved the experience across
goals, flow, hierarchy, accessibility, responsiveness, states, or performance.
**Verify:** Exact commands or checks.
**Remember:** The reusable rule for future agents.
```

## Resolved Cases

### 2026-04-26 - Projects And Detail Responsive UX Sweep

**Signal:** UI/UX review found that Projects was hard to search across 1,000
workspaces, compact project rows overlapped on mobile, and Project Detail
inspector features disappeared below `xl`.

**Cause:**

- Projects virtualized rows used a desktop row height even when mobile metadata
  wrapped.
- Filtering/sorting did not exist before virtualization, so users had to scroll
  through the full list.
- Project Detail rendered the inspector and collapsed rail only at `xl`, while
  the header toggle was also hidden below `xl`.

**Fix:**

- Add a dense Projects toolbar for search, status filter, priority filter, and
  sort before virtual slicing.
- Use responsive virtual row heights and compact mobile row content, plus
  keyboard-open behavior on focused rows.
- Expose the Project Detail inspector toggle at all sizes and render the side
  panel inside a responsive `Sheet` below `xl`.
- Keep mobile chat width stable with `min-w-0` layout constraints and leave the
  composer overflow visible so slash/context menus can rise above the footer.

**UI/UX:** Users can now find a project directly, open rows with the keyboard,
scan mobile project cards without overlap, and access Wiki/Files/Context/
Timeline/Git from mobile Project Detail. Chat menus stay visible and the
composer remains within the viewport.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/projects-scroll.cy.ts`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`

**Remember:** For virtualized work lists, filter before slicing and make row
height responsive to the layout density. For inspector-heavy detail screens,
desktop rails need a mobile Sheet path and Cypress should assert mobile
geometry, not just rendering.

### 2026-04-26 - Desktop Cypress Electrobun Bridge

**Signal:** Some flows, especially native folder selection, could not be
trusted from web-mode Cypress because the app was not running inside
Electrobun.

**Cause:**

- Cypress can launch supported browsers, but it does not directly attach to the
  Electrobun system WebView running inside the desktop app.
- Electrobun `BrowserView.executeJavascript()` can inject code into the real
  desktop WebView, but it does not return a value directly.

**Fix:**

- Add an opt-in Electrobun desktop test server behind
  `FPTCLAW_DESKTOP_TEST_PORT`.
- Let Cypress call `/eval`; the Bun process injects code into the desktop
  WebView and the WebView posts the result back to the local test server.
- Add `cy:run:desktop` to start Electrobun dev mode, wait for desktop health,
  run `cypress/desktop/**/*.cy.ts`, and close the app afterward.
- Keep normal web Cypress on `cypress/e2e/**` by default and switch patterns
  only through `CYPRESS_SPEC_PATTERN`.

**UI/UX:** Desktop-mode tests now cover the actual Electrobun runtime and native
project-folder flow instead of only the browser fallback path, so local-machine
features can be validated before users hit them.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd packages/cypress check-types`
- `bun run --cwd apps/shell cy:run:desktop`
- `bun run --cwd apps/shell cy:run --spec cypress/e2e/project-detail.cy.ts`

**Remember:** For Electrobun desktop-only behavior, keep Cypress as the test
runner but drive the real desktop WebView through an opt-in localhost bridge;
do not pretend web-mode Cypress validates native RPC, dialogs, clipboard,
filesystem, or other OS integrations.

### 2026-04-26 - Route And Workspace Chunk Splitting

**Signal:** After fixing the CodeMirror warning, the entry chunk was still close
to the Vite warning threshold and project detail carried terminal/chat code that
was not needed for every interaction.

**Cause:**

- `App.tsx` statically imported route pages, the app sidebar, and the toaster,
  so they were bundled into the app entry.
- `ProjectDetailPage` statically imported the terminal panel and chat shell,
  even though terminal is tab-only and chat can be its own workspace chunk.
- Dashboard's chart used the full Radix `Select` for a simple mobile time-range
  dropdown.

**Fix:**

- Lazy-load route pages, `AppSidebar`, and `Toaster` from `App.tsx`.
- Lazy-load `ProjectChatShell` and `ProjectTerminalPanel` inside project detail.
- Use `NativeSelect` for the chart time range so Dashboard does not pull the
  heavier Radix Select chunk just for that control.

**UI/UX:** The app keeps the same route behavior and controls, but initial shell
startup and project-detail route loading are broken into smaller, task-specific
chunks.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell build`
- `bun run --cwd apps/shell desktop:build`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`

**Remember:** Keep route pages and optional workspaces behind lazy boundaries.
For simple mobile-only option controls, prefer the local native select over
pulling Radix Select into an otherwise lightweight chunk.

### 2026-04-26 - Project Detail Composer Fullscreen Pinning

**Signal:** Project Detail chat composer looked like it was floating instead of
sticking to the bottom edge in fullscreen.

**Cause:**

- Project Detail reused the inset app shell margin/rounding while its chat
  workspace expected a flush fullscreen canvas.
- Cypress covered chat rendering and scrolling, but not the composer/footer
  geometry at a fullscreen viewport.

**Fix:**

- Override the inset shell margin, radius, and shadow only while Project Detail
  is active in `apps/shell/src/App.tsx`.
- Keep `ProjectChatShell` full-height and make `ProjectChatComposer` an explicit
  `sticky bottom-0` footer with stable test ids.
- Add a Cypress geometry assertion that checks the composer, shell, and scroller
  edges at 1920x1080 before and after collapsing the right panel.

**UI/UX:** The coding-agent chat now behaves like a true fullscreen work
surface: the composer is always at the bottom edge, the scroll region ends
cleanly above it, and closing the inspector does not leave the input visually
detached.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`

**Remember:** For sticky bottom controls inside an inset shell, test actual
`getBoundingClientRect()` edges at fullscreen sizes. A render-only Cypress test
will not catch clipped or floating composers.

### 2026-04-26 - CodeMirror Lazy Chunk Split

**Signal:** Vite/Electrobun build completed but warned that
`project-git-panel` was larger than 500 kB after minification.

**Cause:**

- The Git panel was lazy-loaded, but it statically imported the CodeMirror diff
  viewer.
- The viewer statically imported `codemirror` plus every language package, so
  one Git chunk carried all editor and language code.

**Fix:**

- Lazy-load `ProjectCodeViewer` from `ProjectGitPanel`.
- In `ProjectCodeViewer`, dynamically import `codemirror` and only the language
  package that matches the selected file extension.

**UI/UX:** The Git tab still opens the same diff viewer, but the first Git panel
payload is small and only pays the CodeMirror/language cost when a diff viewer
is mounted.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell build`
- `bun run --cwd apps/shell desktop:build`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`

**Remember:** For optional editor surfaces, lazy-load both the feature panel and
the editor internals. Avoid static imports for all CodeMirror language packages
inside a panel-level lazy chunk.

### 2026-04-26 - Project Detail Tabs Preserve Flex Scroll

**Signal:** After adding main `Coding Agent` / `Terminal` tabs to Project
Detail, Cypress reported the last chat message was not visible because it was
clipped by an overflow parent.

**Cause:**

- `ProjectChatShell` relied on being a direct flex child of the detail main
  column.
- Wrapping it in `TabsContent` changed the layout context; the content was a
  flex item but not an active flex container for the chat shell.

**Fix:**

- Set active project-detail `TabsContent` panes to flex containers with
  `data-[state=active]:flex` and hide inactive panes with
  `data-[state=inactive]:hidden`.
- Keep chat scroll restoration synchronous with `useLayoutEffect` so the latest
  messages remain visible after layout changes.

**UI/UX:** The new workspace tabs can switch between the coding agent and the
terminal manager without clipping the chat history or hiding the active
composer context.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd apps/shell cy:run --spec cypress/e2e/project-detail.cy.ts`
- `bun run --cwd apps/shell build`

**Remember:** When moving a full-height flex screen into Radix tabs, make the
active `TabsContent` a flex container and verify scroll-sensitive content in
Cypress, not just that the tab renders.

### 2026-04-26 - Project Detail Right Rail Controls

**Signal:** Project detail had two right-panel close/open controls, and the
collapsed rail only showed a generic reopen button.

**Cause:**

- The panel-local close button duplicated the header toggle.
- The collapsed state did not preserve the panel's feature map.

**Fix:**

- Keep the header button as the single right-panel toggle.
- Drive the right panel with a controlled active tab.
- Reuse the same feature metadata for open tabs and collapsed rail icons with
  compact hover previews.

**UI/UX:** Closing the panel no longer leaves a redundant control. The rail now
keeps Wiki, Files, Context, Timeline, and Git discoverable, and each icon gives
a compact status preview before opening the matching feature.

**Verify:**

- `bun run check-types` from `apps/shell`
- `bunx eslint src/pages/project-detail-page.tsx src/components/project-detail/project-side-panel.tsx cypress/e2e/project-detail.cy.ts --max-warnings 0`
- `bun run cy:run -- --spec cypress/e2e/project-detail.cy.ts`

**Remember:** When a collapsible inspector has feature tabs, use one global
toggle and let the collapsed rail summarize/select features instead of adding a
second close/open button.

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
