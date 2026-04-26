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

Older full-detail lessons were moved losslessly into archives when this file
approached the compaction threshold:

- [2026-04-25 UI and tooling lessons](lesson-learn-archive/2026-04-25-ui-tooling.md)

### 2026-04-26 - Chat Markdown Code Fence Rendering

**Keywords:** `project-chat-markdown.tsx`, `marked`, `highlight.js`,
`assistant_delta`, `assistant_message`, `project-chat-code-block`,
`bun run --cwd apps/shell cy:run:desktop`.

**Signal:** Project chat showed Python, TypeScript, JavaScript, Markdown, and
other fenced code as plain message text instead of formatted code blocks.

**Cause:**

- `ProjectChatMessage` rendered `message.body` directly inside a
  `whitespace-pre-wrap` paragraph.
- The native runtime already emits assistant text as Markdown through the
  stream-json bridge; the shell renderer was the missing browser-side Markdown
  adapter.
- Runtime's own terminal UI uses `marked` plus lazy syntax highlighting, so the
  shell should mirror that contract without importing Ink runtime components.

**Fix:**

- Add a browser React Markdown renderer for chat messages using `marked` token
  rendering and safe React nodes instead of raw HTML.
- Render fenced code blocks with lazy `highlight.js` language chunks, language
  headers, copy buttons, horizontal overflow containment, and compact syntax
  colors.
- Keep streaming assistant/reasoning messages efficient with a stable-prefix
  parser and token cache so only the growing Markdown block is reparsed.
- Add direct `apps/shell` dependencies on `marked` and `highlight.js`.

**UI/UX:** Chat now preserves the structure users expect from coding agents:
headings, lists, inline code, tables, links, blockquotes, and readable code
blocks stay inside the message bubble across desktop and mobile widths.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`
- `bun run --cwd apps/shell cy:run:desktop`

**Remember:** Runtime chat Markdown belongs in the shell renderer. Do not render
assistant/user bodies as plain paragraphs, and do not import Ink Markdown UI
into the browser; adapt the runtime contract with browser-safe `marked` tokens
and lazy syntax-highlight chunks.

### 2026-04-26 - Native Runtime Chat Bridge

**Signal:** Project chat needed to call `packages/runtime` natively from the
Electrobun shell, but the runtime package was only partially restored and the
SDK-looking entrypoints still threw stub errors.

**Cause:**

- Renderer code cannot safely import the runtime package directly because it
  depends on Bun/Node process behavior and mutable runtime globals.
- The stable local contract is the runtime CLI stream protocol, not
  `src/entrypoints/agentSdkTypes.ts`.
- Electrobun dev launches the Bun main process from
  `apps/shell/build/dev-win-x64/FPTClaw-dev/bin`, so resolving
  `../../packages/runtime` from `process.cwd()` points outside the workspace and
  makes chat show `Runtime package entrypoint was not found.`
- `bun run --cwd packages/runtime dev:restore-check` still reported the missing
  `vendor/image-processor.node`, so chat UX must surface restore-pending status
  instead of assuming the runtime is fully runnable.
- `bun packages/runtime/src/bootstrap-entry.ts --help` can still fail after the
  entrypoint is found when runtime dependencies are not installed or package
  exports drift. Verified local failures included
  `Cannot find module 'lodash-es/memoize.js' from
'D:\Projects\MyShell\packages\runtime\src\utils\debug.ts'` and a later
  `lru-cache` constructor/export mismatch.

**Fix:**

- Add an Electrobun RPC boundary for runtime turn start, cancel, status, and
  streamed `projectRuntimeEvent` messages.
- Spawn one Bun-side runtime process per chat turn and translate stream-json
  messages into assistant, reasoning, tool, permission, system, and result rows.
- Resolve runtime root via `FPTCLAW_RUNTIME_ROOT` plus ancestor search, and set
  the env from `apps/shell/scripts/electrobun.ts` so desktop builds do not depend
  on the Electrobun process cwd.
- Keep `@repo/orchestration` and `@repo/schemas` present as workspace packages
  when runtime references them, install dependencies, and pin/align runtime deps
  such as `lru-cache` when package exports break the restored entrypoint.
- Write runtime bridge traces to `apps/shell/logs/runtime-bridge.log` with
  runtime-root candidates, command exit codes, stderr, spawn args, pid, stdin
  availability, and turn exit state.
- Use `--input-format stream-json`, keep stdin piped for the whole turn, send
  permission decisions back as `control_response`, and include
  `--permission-prompt-tool stdio` so `can_use_tool` requests reach the shell UI.
- Keep the renderer as a UI adapter with stop/retry-ready state, runtime status,
  near-bottom autoscroll, and web-mode fallback behavior.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`
- `bun run --cwd apps/shell cy:run:desktop`
- `bun run --cwd packages/runtime dev:restore-check`
- `bun packages/runtime/src/bootstrap-entry.ts --help`
- `bun run --cwd packages/schemas check-types`
- `bun run --cwd packages/orchestration check-types`

**Remember:** Integrate `packages/runtime` through a native Electrobun process
facade and the stream-json message contract. Do not wire the chat UI directly to
the stub SDK facade. Always trace desktop runtime failures to
`apps/shell/logs/runtime-bridge.log`, distinguish entrypoint-resolution failures
from dependency/runtime-load failures, and keep restore-pending native-module
status visible while `dev:restore-check` still reports missing restored sources.

### 2026-04-26 - Native Terminal And Browser Profile Flow Integrity

**Signal:** Chat could reach the runtime, but Terminal and Browser Profiles
needed desktop-native behavior and the UI still had labels or actions implying
nonexistent browser launch/harness behavior.

**Cause:**

- `TabsContent forceMount` mounted hidden workspace tabs, so Terminal and
  Browser Profiles could start native work before the user opened those tabs.
- The Terminal init effect depended on the whole `detail` object; unrelated
  runtime/detail refreshes re-ran cleanup and killed PowerShell sessions quickly
  with `terminal.exit` 143.
- Browser Profiles had a create/verify path, but launch/warm wording implied a
  started browser process. The real local behavior is filesystem registry,
  metadata preparation, and provider prerequisite checking.
- Web tests used seeded project data and file mentions; desktop-native terminal
  and browser profile tests must create/open a local project folder.
- Desktop eval tests that wait only for a `TabsContent forceMount` panel can
  match hidden DOM before the active tab toolbar has rendered.

**Fix:**

- Gate workspace tab children behind `visitedWorkspaceTabs`, and render Terminal
  / Browser Profiles only after the tab is visited while preserving mounted
  state afterward.
- Stabilize Terminal lifecycle dependencies to `projectId` and `projectRoot`,
  add native PowerShell start/input/stop/exit trace logs, and keep UI controls
  tied to real session state.
- Rename browser profile actions to `Prepare storage` and `Check launch`; write
  `profiles.json`, `profile.json`, and `warmup.json`; trace create, verify,
  prepare, and launch-check; never mark a profile `running` unless a real browser
  process is started.
- Make chat context mentions use live project folder / URL context instead of
  seeded file/git data, and convert visual-only model/settings controls into
  accurate status UI.
- In desktop Browser Profiles tests, wait for the active-tab action button
  `project-browser-profile-create`, not just the force-mounted panel shell.

**UI/UX:** The main project workspace now behaves as three honest native flows:
FPTClaw Agent shows real runtime status/responses, Terminal starts only when the
user opens it and exposes a real shell lifecycle, and Browser Profiles clearly
communicates registry/preparation/check states without pretending a browser was
launched.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`
- `bun run --cwd apps/shell cy:run:desktop`
- Inspect `apps/shell/logs/runtime-bridge.log` for `runtime.turn.exit`
  `exitCode:0`, `terminal.input accepted:true`, and
  `browser_profile.launch_check launched:false`.

**Remember:** Hidden desktop tabs must not start native processes. Browser
profile UI must describe the operation actually performed: storage create,
verify, prepare, or launch prerequisite check. Use desktop Cypress, not web-only
Cypress, to prove chat runtime, Terminal, and Browser Profiles. In desktop eval,
wait for active controls before clicking; a force-mounted hidden panel existing
in the DOM is not enough.

### 2026-04-26 - Services Shim Package Gates

**Signal:** Root `bun run check-types` and `bun run lint` failed in workspace
packages that were not part of the shell UI change.

**Cause:**

- `packages/services` is a shim package of one-line re-exports into
  `@repo/runtime/src/...`; running `tsc --noEmit` there pulls the whole restored
  runtime source tree into services and reports runtime restoration/type errors.
- `packages/services/eslint.config.mjs` imports `@repo/eslint-config/bun`, and
  `packages/runtime/eslint.config.mjs` imports `@repo/eslint-config/runtime`;
  both subpath exports must exist in `packages/eslint-config/package.json`.

**Fix:**

- Add `packages/services/scripts/check-service-shims.ts` and make services
  `check-types` validate that every local/runtime re-export target exists.
- Add shared ESLint configs `packages/eslint-config/bun.js` and
  `packages/eslint-config/runtime.js`, then export `./bun` and `./runtime`.

**Verify:**

- `bun run --cwd packages/services check-types`
- `bun run --cwd packages/services lint`
- `bun run check-types`
- `bun run lint`

**Remember:** For shim-only packages, validate the shim contract directly
instead of accidentally typechecking an upstream restored source tree through
the facade package. Keep eslint-config subpath exports synchronized with every
workspace `eslint.config.mjs` import.

### 2026-04-26 - Desktop Settings JSON Isolation

**Signal:** A desktop Settings spec could edit runtime JSON through Electrobun,
but full `cy:run:desktop` first failed in an older browser-profile spec because
the test expected exactly 3 rows while the live panel had 4.

**Cause:**

- Runtime settings writes are real filesystem writes in desktop mode, so tests
  must isolate `CLAUDE_CONFIG_DIR` and the settings workspace root.
- Desktop specs can share app state across route changes, and fixture counts for
  panels like Browser Profiles are allowed to grow as features evolve.

**Fix:**

- Set `CLAUDE_CONFIG_DIR` and `FPTCLAW_SETTINGS_WORKSPACE_ROOT` to temp
  directories in `apps/shell/scripts/cypress-desktop.ts`.
- In the Settings RPC, write project-local overrides to
  `.claude/settings.local.json` and ensure that exact path is added to
  `.gitignore`.
- In desktop Cypress, assert profile creation by `afterCount === beforeCount + 1`
  instead of pinning the starting fixture count.

**UI/UX:** Users get a real desktop Settings editor with JSON highlighting,
schema URL support, save/reload feedback, read-only policy state, and no test
pollution of the working repo.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd apps/shell cy:run:desktop`

**Remember:** Desktop Settings tests should write to temp runtime config roots.
When verifying mutable panels, assert stable behavior such as count deltas and
state transitions, not exact seed counts unless the seed count is the feature.

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

### 2026-04-26 - Electrobun Taskbar-Safe Startup Maximize

**Signal:** The shell app needed to always open in maximized mode. The native
window reported maximized, but DevTools still showed `html`/viewport dimensions
from the old 1440x960 startup frame. A later native maximize attempt also let
the window cover the Windows taskbar.

**Cause:**

- A post-show `setSize()` nudge is useful for a normal-size first paint, but it
  can restore or race a window that has already been maximized.
- Electrobun's `BrowserWindow` creates the default `BrowserView` during the
  constructor using the constructor `frame`. If that frame is 1440x960, the
  default WebView can keep that viewport even after native `maximize()` when the
  Windows WebView2 auto-resize event does not settle at startup.
- Desktop Cypress started as soon as the WebView DOM was ready, not when the
  native `BrowserWindow` had finished reaching the intended work-area frame.
- DOM-only `.click()` in desktop eval can miss Radix tab state changes that rely
  on pointer/mouse event sequences.
- On Windows, taskbar-safe maximized sizing should use the display work area,
  not full screen bounds. A `setFrame()` call from the window `resize` event can
  create a resize/setFrame loop and make the Electrobun process exit before the
  desktop test health endpoint is reachable.

**Fix:**

- In `apps/shell/src/electrobun/main.ts`, use
  `Screen.getPrimaryDisplay().workArea` for the initial BrowserWindow frame so
  Electrobun's default BrowserView is created with the maximized-sized viewport.
- Call `setFrame(workArea.x, workArea.y, workArea.width, workArea.height)` after
  `show()`, on WebView `dom-ready`, and shortly after first paint. This creates
  a taskbar-safe maximized-equivalent startup frame without entering a taskbar-
  covering fullscreen-sized state.
- Expose both display `workArea` and `window.frame` from the desktop test server
  health payload. Make `apps/shell/scripts/cypress-desktop.ts` wait for both
  `domReady` and a window frame that matches the work area.
- Assert `document.documentElement.clientWidth/clientHeight` and `innerWidth` /
  `innerHeight` in desktop Cypress so tests catch stale HTML viewport
  regressions.
- Make the desktop eval click helper dispatch pointer and mouse events before
  calling `.click()`.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell desktop:build`
- `bun run --cwd apps/shell cy:run:desktop`

**Remember:** For startup-maximized Electrobun windows on Windows, size the
constructor `frame` from the display work area before creating the window, then
fit the same work-area frame during startup. Do not rely on `maximize()` alone to
resize the default BrowserView viewport, do not use full screen bounds when the
taskbar must remain visible, and do not call `setFrame()` from the window
`resize` event.
