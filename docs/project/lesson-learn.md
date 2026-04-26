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
- [2026-04-26 shell layout and build lessons](lesson-learn-archive/2026-04-26-shell-layout-build.md)

### 2026-04-26 - Browser Harness Cleanup Retry

**Keywords:** `browser-harness-chat-desktop.cy.ts`,
`count-harness-browser-processes.ps1`, `Get-CimInstance`,
`--fptclaw-browser-title`, `cy:run:desktop`.

**Signal:** `bun run --cwd apps/shell cy:run:desktop` repeatedly failed in the
browser harness spec `afterEach`: first by timing out on a broad
`Get-CimInstance Win32_Process` command, then by seeing 2 short-lived harness
browser processes immediately after a two-profile headed run.

**Cause:** Cypress cleanup was doing an unfiltered Win32 process enumeration and
asserting synchronously while the native browser harness was still closing
recently validated Chrome/Edge workers.

**Fix:** Move the process count into
`apps/shell/scripts/count-harness-browser-processes.ps1`, filter
`Win32_Process` server-side for Chrome/Edge/WebView process names, and make
`expectNoHarnessBrowserProcesses()` retry briefly before failing a real leak.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd apps/shell cy:run:desktop`

**Remember:** Desktop browser-harness cleanup is asynchronous. Count only
browser-like processes with `--fptclaw-browser-title`, and retry the cleanup
assertion for a few seconds instead of trusting an immediate single Win32
enumeration.

### 2026-04-26 - Hermes Browser Harness Chat Orchestration

**Keywords:** `packages/browser`, `projectBrowserHarnessEvent`,
`--fptclaw-browser-title`, `browser-harness-chat-desktop.cy.ts`,
`Browser Profiles`, `Hermes lead`, `agent per browser`, `headless=new`.

**Signal:** A chat prompt needed to open one or more Browser Profiles as a
coordinated local agent team, with one lead agent, one browser agent per profile,
headed/headless modes, worker reports, lead validation, and proof that the native
browser process matched the task.

**Cause:** The existing Browser Profiles flow intentionally stopped at storage,
prepare, and launch-check. Real harness behavior needed a separate reusable
package plus an Electrobun-native bridge so renderer chat did not import native
runtime code or pretend a browser was running without an actual process.

**Fix:** Add `packages/browser` for prompt parsing, goal normalization, team
planning, and deterministic process-title generation. Add the shell
`browser-harness` bridge to select/create project-local `chrome-cdp` profiles,
warm profile storage, launch Chromium/Edge with a distinct `--user-data-dir`,
mode flags, a task HTML page, and `--fptclaw-browser-title=<title>`. Emit
`projectBrowserHarnessEvent` messages so chat shows Hermes lead planning,
worker states, process title checks, worker reports, lead validation, and final
result. Stop browser processes by matching the unique profile path after
validation.

- Treat user wording like `headless=false`, `headless=off`, `headless=no`, and
  `headless=0` as headed mode; check this in chat Cypress because generic
  `/headless/` matching silently flips the requested UI mode.

**Verify:**

- `bun run --cwd packages/browser check-types`
- `bun run --cwd packages/browser lint`
- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`
- `bun run --cwd apps/shell cy:run:desktop`
- `bun run check-types`
- `bun run lint`
- `Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'chrome|edge|msedge' -and $_.CommandLine -like '*--fptclaw-browser-title=*' }`

**Remember:** Browser harness work belongs behind a native Electrobun bridge and
a reusable browser package. Each worker must use a unique profile directory, and
desktop Cypress should prove the chat flow plus native process marker/title
checks. Set Cypress request timeout longer than `/eval` timeout for long desktop
evals. Never leave browser processes alive after validation; kill by the unique
`--user-data-dir` marker.

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
