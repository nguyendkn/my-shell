# Shell App Product and Architecture

This document describes the current `apps/shell` desktop application in detail:
what the user can do, which components own each surface, how renderer state
connects to native Electrobun services, and which parts are real, mocked, or
desktop-only.

## Quick Summary

`apps/shell` is the FPTClaw desktop shell. It is a React 19 renderer packaged
with Electrobun. The renderer provides project navigation, an agent chat
workspace, project-side knowledge panels, native terminal panes, browser profile
management, and runtime settings editing. Electrobun owns OS-facing operations:
folder selection, child processes, runtime CLI orchestration, terminal stdin and
stdout, browser profile filesystem storage, browser harness process launch, and
settings file I/O.

The app can run in two modes:

- Desktop mode: `bun run --cwd apps/shell desktop:dev`
- Web/Vite mode: `bun run --cwd apps/shell web:dev`

Desktop mode is the product runtime. Web mode is only useful for renderer-only
DOM and layout checks because it cannot validate native RPC, filesystem access,
terminal processes, dialogs, or browser process behavior.

## Source Map

| Area              | Main files                                                                                                                                      | Responsibility                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| App bootstrap     | `apps/shell/src/main.tsx`, `apps/shell/src/App.tsx`                                                                                             | Mount React, set theme/sidebar providers, route between dashboard/projects/settings/detail pages.                         |
| Desktop bootstrap | `apps/shell/src/electrobun/main.ts`, `apps/shell/electrobun.config.ts`                                                                          | Create Electrobun window, register native RPC, size window to work area, start desktop test server when requested.        |
| RPC schema        | `apps/shell/src/electrobun/rpc.ts`, `apps/shell/src/lib/shell-rpc.ts`                                                                           | Shared renderer/native request and event contract.                                                                        |
| Projects          | `apps/shell/src/pages/projects-page.tsx`, `apps/shell/src/data/projects.ts`, `apps/shell/src/lib/native-projects.ts`                            | Project list, filtering, virtual scroll, local project creation, native folder dialog bridge.                             |
| Project detail    | `apps/shell/src/pages/project-detail-page.tsx`, `apps/shell/src/data/project-detail.ts`                                                         | Main project workspace tabs, side panel behavior, generated project detail model.                                         |
| Agent chat        | `apps/shell/src/components/project-detail/project-chat-*`                                                                                       | Agent task header, message log, composer, markdown rendering, runtime event projection.                                   |
| Runtime bridge    | `apps/shell/src/electrobun/project-runtime.ts`, `apps/shell/src/lib/native-runtime.ts`                                                          | Spawn runtime CLI, stream assistant/tool/permission events, cancel turns, respond to permission requests.                 |
| Terminal bridge   | `apps/shell/src/components/project-detail/project-terminal-panel.tsx`, `apps/shell/src/electrobun/project-terminal.ts`                          | Split terminal UI, native shell child processes, stdin/stdout streaming.                                                  |
| Browser profiles  | `apps/shell/src/components/project-detail/project-browser-profiles-panel.tsx`, `apps/shell/src/electrobun/browser-profiles.ts`                  | Project-local browser profile registry, create/verify/warm/launch-check operations.                                       |
| Browser harness   | `apps/shell/src/electrobun/browser-harness.ts`, `packages/browser/src/*`                                                                        | Parse browser harness prompts, create Hermes lead/worker plan, launch Chromium-family processes, validate process titles. |
| Side panels       | `apps/shell/src/components/project-detail/project-side-panel.tsx`, `project-wiki-panel.tsx`, `project-files-panel.tsx`, `project-git-panel.tsx` | Project wiki, files, context, timeline, and git inspector surfaces.                                                       |
| Runtime settings  | `apps/shell/src/pages/settings-page.tsx`, `apps/shell/src/electrobun/runtime-settings.ts`                                                       | Load/edit/save Claude-compatible runtime settings sources.                                                                |
| Dashboard         | `apps/shell/src/pages/dashboard-page.tsx`, `section-cards.tsx`, `chart-area-interactive.tsx`, `data-table.tsx`                                  | Analytics-style overview using static dashboard data.                                                                     |
| Desktop tests     | `apps/shell/scripts/cypress-desktop.ts`, `apps/shell/src/electrobun/desktop-test-server.ts`, `apps/shell/cypress/desktop/*.cy.ts`               | Run Electrobun app, expose desktop eval API, execute Cypress specs against actual desktop runtime.                        |

## Application Shell

`App.tsx` owns the top-level route state. It uses browser history directly
instead of a router package. `/` is normalized to `/projects`.

Routes:

| Path            | Page                |
| --------------- | ------------------- |
| `/dashboard`    | `DashboardPage`     |
| `/projects`     | `ProjectsPage`      |
| `/projects/:id` | `ProjectDetailPage` |
| `/settings`     | `SettingsPage`      |

The app always wraps content in:

- `ThemeProvider` from `next-themes`, defaulting to the dark operator theme with
  a sidebar toggle for dark/light mode.
- `TooltipProvider` from the shared UI package.
- `SidebarProvider` and `SidebarInset` from `@repo/ui/components/sidebar`.
- A lazily loaded `Toaster` for notifications.

Project detail routes intentionally hide the main app sidebar by default and
use a back button plus a side-panel toggle in `SiteHeader`. Wide screens open
the project side panel by default. Smaller screens use a right-side sheet.

Custom projects are stored in `window.localStorage` under
`fptclaw.custom-projects.v1`. They are merged before the 1000 generated sample
projects from `apps/shell/src/data/projects.ts`.

## Navigation and Layout Components

### `AppSidebar`

`AppSidebar` is the persistent product navigation for non-detail routes.

It includes:

- Product identity: `FPTClaw Agent`.
- Operator subtitle and theme toggle.
- Primary nav: Dashboard and Projects.
- Document shortcuts: Data Library, Reports, Word Assistant.
- Secondary nav: Settings, Get Help, Search.
- User footer menu with account/billing/notifications/logout placeholders.

Only Dashboard, Projects, and Settings are wired to internal navigation. The
other document/help/search/user menu entries are presentational placeholders.

### `SiteHeader`

`SiteHeader` provides the global header row:

- sidebar trigger,
- separator,
- optional leading action,
- current page title,
- optional route subtitle,
- optional right-side actions.

On project detail pages, `leading` is the back-to-projects button and `actions`
is the project side-panel toggle.

## Feature: Dashboard

The Dashboard is an overview and demo analytics surface. It is currently powered
by static data, not native services.

Files:

- `apps/shell/src/pages/dashboard-page.tsx`
- `apps/shell/src/components/section-cards.tsx`
- `apps/shell/src/components/chart-area-interactive.tsx`
- `apps/shell/src/components/data-table.tsx`
- `apps/shell/src/data/dashboard-data.ts`

User-visible areas:

- Four KPI cards: Active Sessions, Code Changes, Tasks Completed, Runtime
  Uptime.
- Interactive area chart with 90-day, 30-day, and 7-day ranges.
- Document outline table with row drag, selection, column visibility, paging,
  reviewer assignment controls, inline numeric fields, and row detail drawer.

Important behavior:

- Chart switches to 7-day view on mobile via `useIsMobile`.
- Data table uses `@tanstack/react-table` for sorting, filtering, visibility,
  pagination, and selection state.
- Row reorder uses `@dnd-kit`.
- Drawer direction changes by viewport: bottom on mobile, right on desktop.

Current limits:

- KPI values are hardcoded.
- Chart and table data are static.
- Table edit controls update local component state or show demo toasts only.

## Feature: Projects

The Projects page is the workspace selection and creation hub.

Files:

- `apps/shell/src/pages/projects-page.tsx`
- `apps/shell/src/data/projects.ts`
- `apps/shell/src/lib/native-projects.ts`
- `apps/shell/src/electrobun/main.ts` request: `selectProjectFolder`

User-visible capabilities:

- Search by project name, description, owner, folder path, status, or priority.
- Filter by status: All, Discovery, Active, Review, Paused.
- Filter by priority: All, High, Medium, Low.
- Sort by Updated, Progress, or Name.
- Open project detail by clicking a row, pressing Enter/Space on a focused row,
  or clicking the row action button.
- Create a new local project with a folder path and optional name.
- Browse for a folder through the native desktop folder dialog.
- Reuse recent folder paths from existing projects.

Performance behavior:

- The generated project dataset has 1000 Lovable-inspired operator workspaces
  with deterministic names, owners, local-style folder paths, statuses, and
  priorities.
- The list only loads 40 items at a time.
- Manual virtualization renders only visible rows plus overscan.
- Additional pages load when scroll position reaches 75 percent of list height.
- Row height changes by viewport width to keep mobile rows readable.

Persistence:

- Created projects live in renderer localStorage only.
- Project ID is computed as max existing ID plus one.
- Folder path is stored on the project record and later used by native runtime,
  terminal, browser profiles, and browser harness features.

Desktop-specific behavior:

- `selectProjectFolder` returns `null` in web mode.
- In desktop test mode, `FPTCLAW_TEST_PROJECT_FOLDER_PATH` overrides the native
  folder dialog so Cypress can create projects without OS interaction.

Current limits:

- Created project metadata is local to the browser profile.
- There is no project deletion, rename, import, or persistent database yet.

## Feature: Project Detail Workspace

`ProjectDetailPage` is the main work surface after a project is opened.

Files:

- `apps/shell/src/pages/project-detail-page.tsx`
- `apps/shell/src/data/project-detail.ts`
- `apps/shell/src/components/project-detail/*`

Main workspace tabs:

- FPTClaw Agent
- Terminal
- Browser Profiles

Right side panel tabs:

- Wiki
- Files
- Context
- Timeline
- Git

Responsive behavior:

- On screens `>= 1280px`, the side panel is a fixed right panel.
- On smaller screens, the side panel is a sheet.
- When the fixed side panel is closed on wide screens, a narrow rail remains.
  Each rail icon shows a hover/focus popover with feature metrics.
- Switching to Terminal or Browser Profiles closes the side panel to prioritize
  horizontal workspace area.

Data:

- `getProjectDetail(projectId, projects)` creates a generated detail model from
  a `Project`.
- The model includes chat messages, resources, wiki state, files state, git
  changes, timeline, browser providers, mode, model, context usage, branch, and
  active task.

Current limits:

- Most side panel data is generated sample state.
- Some side panel action buttons are presentational and do not call native APIs.

## Feature: Agent Chat and Runtime

The FPTClaw Agent tab is a project-scoped chat shell that can route prompts to
either the runtime CLI or the browser harness.

Files:

- `project-chat-shell.tsx`
- `project-chat-composer.tsx`
- `project-chat-message.tsx`
- `project-chat-markdown.tsx`
- `project-task-header.tsx`
- `apps/shell/src/lib/native-runtime.ts`
- `apps/shell/src/electrobun/project-runtime.ts`
- `apps/shell/src/electrobun/runtime-types.ts`

### Task Header

`ProjectTaskHeader` displays the current project context:

- project name,
- status,
- description,
- linked folder path,
- workspace linkage state,
- Plan/Act mode,
- updated date and owner,
- priority.

It is collapsible so the user can reclaim vertical space during long chats.

### Composer

`ProjectChatComposer` supports:

- multiline text prompt,
- Enter to send,
- Shift+Enter for newline,
- stop button while runtime or browser harness is running,
- Plan/Act mode toggle,
- visible model label,
- file picker attachments,
- drag-and-drop attachments,
- image previews through object URLs,
- maximum 8 attachments,
- `@` context insertion,
- slash command insertion.

Slash commands currently include:

- `vk:ask`
- `vk:plan`
- `vk:code`
- `vk:fix`
- `vk:fix:ui`
- `vk:review:codebase`
- `vk:scout`
- `newtask`
- `deep-planning`
- `smol`
- `newrule`
- `reportbug`

Context insertion currently supports the linked project folder and URL-style
mentions. The runtime receives extracted context refs from `@...` patterns.

### Message Rendering

`ProjectChatMessage` maps message role/kind/status to visual treatments:

- user messages align right and use primary color,
- assistant/system messages align left,
- failed messages use destructive tone,
- tool/checkpoint messages use dashed or muted cards,
- permission questions use amber emphasis,
- attachments render as compact file chips,
- action buttons are rendered for permission requests.

`ProjectChatMarkdown` provides a safe renderer for chat output:

- `marked` tokenization with GitHub-flavored markdown,
- no raw HTML injection for normal markdown text,
- safe URL handling for links,
- code blocks with lazy `highlight.js` loading,
- copy-to-clipboard button on code blocks,
- table, list, heading, blockquote, inline code rendering,
- token cache for non-streaming messages,
- separate streaming path that tries to render stable completed chunks.

### Runtime Flow

When a prompt is not detected as a browser harness prompt and the app is in
desktop mode:

1. Renderer appends the user message.
2. Renderer calls `startProjectRuntimeTurn`.
3. Native bridge resolves the runtime package root.
4. Native bridge validates the project folder.
5. Native bridge maps shell mode:
   - Plan -> runtime permission mode `plan`
   - Act -> runtime permission mode `default`
6. Native bridge maps project model labels:
   - `FPTClaw Agent / Planner` -> `sonnet`
   - `FPTClaw Agent / Builder` -> `sonnet`
   - `FPTClaw Agent / Reviewer` -> `opus`
7. Native bridge spawns:
   - `bun <runtimeEntry> --print --input-format stream-json --output-format stream-json --verbose --include-partial-messages --permission-prompt-tool stdio --permission-mode <mode>`
8. The renderer prompt is wrapped with project metadata:
   - project name and ID,
   - mode,
   - model,
   - context refs,
   - attachments.
9. Native bridge writes a JSON user message to runtime stdin.
10. Native bridge reads stream-json stdout and emits webview events.
11. Renderer converts events into chat messages.

Runtime event projection:

| Native event          | Chat rendering                                                             |
| --------------------- | -------------------------------------------------------------------------- |
| `session_state`       | Runtime session tool message with running/completed/failed status.         |
| `assistant_delta`     | Streaming assistant text appended to the active runtime assistant message. |
| `assistant_message`   | Final assistant text.                                                      |
| `reasoning`           | Streaming "Thinking" message.                                              |
| `tool_use`            | Running tool message.                                                      |
| `tool_result`         | Completed or failed tool message.                                          |
| `permission_request`  | Permission question with Allow once and Deny actions.                      |
| `permission_response` | Permission result appended to the permission message.                      |
| `system`              | Runtime system or runtime error message.                                   |
| `result`              | Runtime completion/failure message or final assistant text.                |

Permission flow:

- Runtime emits `control_request` with subtype `can_use_tool`.
- Native bridge stores pending permission by request ID.
- Renderer shows Allow once and Deny.
- User decision is sent through `respondProjectRuntimePermission`.
- Native bridge writes `control_response` back to runtime stdin.
- Permission state is updated in the chat.

Stop behavior:

- If browser harness is active, Stop cancels the active harness task.
- Otherwise Stop cancels the active runtime session.
- If Stop is clicked before native acceptance returns, a pending-stop flag is
  recorded and applied once a task/session ID is known.

Desktop-only requirements:

- Project must have a real folder path.
- Runtime entrypoint must resolve to `packages/runtime/src/bootstrap-entry.ts`.
- `bun` must be available to spawn the runtime package.

Trace logs:

- Default: `apps/shell/logs/runtime-bridge.log`
- Override: `FPTCLAW_RUNTIME_TRACE_FILE`

## Feature: Native Terminal

The Terminal tab opens project-scoped native shells.

Files:

- `project-terminal-panel.tsx`
- `apps/shell/src/lib/native-terminal.ts`
- `apps/shell/src/electrobun/project-terminal.ts`
- `apps/shell/src/electrobun/terminal-types.ts`

User-visible capabilities:

- Opens an initial terminal when the tab first mounts.
- Splits into additional terminal panes.
- Marks one active terminal pane.
- Shows process ID when available.
- Closes terminal panes, while preserving at least one open terminal.
- Fullscreen mode with Escape-to-exit.
- Command input field that appends CRLF and writes to native stdin.
- Terminal transcript is mirrored into a screen-reader-only `pre` region.

Native behavior:

- Windows shell: `powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass`
- Non-Windows shell: `$SHELL -l` or `bash -l`
- Each session starts in the project folder.
- Native bridge emits:
  - `state` for running/failed/exited state,
  - `data` for stdout/stderr chunks,
  - `exit` for process exit summary.

Current limits:

- Terminal is unavailable in web mode.
- There is no session persistence after leaving the project or closing the app.
- Native terminal requires a valid project folder path.

## Feature: Browser Profiles

The Browser Profiles tab manages project-local browser profile metadata and
filesystem-backed storage.

Files:

- `project-browser-profiles-panel.tsx`
- `apps/shell/src/lib/native-browser-profiles.ts`
- `apps/shell/src/electrobun/browser-profiles.ts`
- `apps/shell/src/electrobun/browser-profiles-types.ts`

Providers currently modeled:

| Provider   | Status                | Engine              | Transport                | Notes                                                                        |
| ---------- | --------------------- | ------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| Camoufox   | ready in data model   | Firefox anti-detect | Playwright / Juggler     | Setup command references `pip install -U camoufox[geoip] && camoufox fetch`. |
| Chrome CDP | planned in data model | Chrome              | Chrome DevTools Protocol | Used by Hermes harness auto-created lanes.                                   |

Profile registry:

- Stored under the selected project folder:
  - `.fptclaw/browser-profiles/profiles.json`
  - `.fptclaw/browser-profiles/<provider>/<profile-slug-id>/profile.json`
  - optional warmup metadata: `warmup.json`

User-visible capabilities:

- Load all project profiles.
- Create a new profile.
- Filter by provider.
- Filter by status.
- Search by profile name, provider, path, proxy lane, locale, timezone, OS,
  cookie jar, endpoint, target domains, and tags.
- Inspect profile health, cookies, last used, identity lane, harness attach
  mode, storage path, target domains, and notes.
- Verify setup.
- Prepare storage.
- Check launch prerequisites.

Profile lifecycle operations:

| Operation    | Native behavior                                                                         |
| ------------ | --------------------------------------------------------------------------------------- |
| Load         | Resolve project folder, ensure registry file, read profiles.                            |
| Create       | Create profile record, create profile directory, write `profile.json`, upsert registry. |
| Verify       | Ensure profile directory and metadata exist, recalculate health, update status.         |
| Warm         | Write `warmup.json`, mark profile ready, set health to at least 90, update last used.   |
| Launch check | Check provider prerequisites without starting a persistent browser process.             |

Launch check details:

- Camoufox checks `python -c "import camoufox; print('camoufox-ok')"`.
- Chrome CDP checks for Microsoft Edge on Windows.
- Successful launch check does not start a browser. It only verifies that a
  launch command can be constructed.

Current limits:

- Proxy, locale, timezone, target domains, and tags are metadata only.
- There is no UI for editing profile fields yet.
- Camoufox profile launch is a prerequisite check, not a full Playwright attach.

## Feature: Browser Harness

Browser harness prompts are detected in the agent chat and routed away from the
normal runtime flow.

Files:

- `apps/shell/src/electrobun/browser-harness.ts`
- `apps/shell/src/lib/native-browser-harness.ts`
- `apps/shell/src/electrobun/browser-harness-types.ts`
- `packages/browser/src/planner.ts`
- `packages/browser/src/team.ts`
- `packages/browser/src/process-title.ts`
- `packages/browser/src/types.ts`

Prompt trigger terms include:

- browser profile
- browser harness
- local agi
- hermes
- agent per browser
- headless
- headed
- chrome-cdp
- camoufox

Planner behavior:

- Parses requested profile count from numbers or words like "two", "couple",
  "pair", "hai", "multiple".
- Clamps profile count to 1 through 4.
- Detects mode: headed or headless.
- Detects start point from URL or text patterns.
- Detects endpoint from `endpoint`, `until`, `validate`, Vietnamese equivalent
  patterns, or a default validation endpoint.
- Detects explicit profile refs from `profile:<id>` or `lane:<id>`.

Harness flow:

1. Renderer detects browser-harness prompt.
2. Renderer calls `startProjectBrowserHarnessTask`.
3. Native bridge resolves project folder.
4. Native bridge loads existing browser profiles.
5. Native bridge creates additional Chrome CDP lanes when needed.
6. Native bridge warms selected profiles.
7. `packages/browser` creates a Hermes lead plan and worker plans.
8. For each worker, native bridge writes a local harness HTML page under the
   profile directory.
9. Native bridge starts a Chromium-family process with:
   - `--user-data-dir=<profilePath>`
   - `--app=<localHarnessPage>`
   - `--fptclaw-browser-title=<expectedTitle>`
10. Native bridge validates that the OS process command line contains the
    expected title and profile path.
11. Worker reports are emitted.
12. Hermes lead validation summarizes whether all workers passed.
13. Processes are stopped and profiles are updated.

Process discovery:

- Windows looks for Microsoft Edge and Google Chrome under Program Files.
- macOS looks for Google Chrome and Microsoft Edge app bundles.
- Linux uses `FPTCLAW_CHROMIUM_PATH` or `google-chrome`.

User-visible chat messages:

- Hermes session state.
- Hermes lead plan.
- Worker launch/running/report state.
- Browser process title validation result.
- Worker report.
- Lead validation.
- Final harness result.

Current limits:

- The harness validates browser process ownership/title and profile isolation.
- It does not yet drive arbitrary page actions beyond loading the generated
  harness page.
- Browser processes are closed after validation.

## Feature: Project Side Panel

The project side panel is an inspector for project knowledge, files, context,
timeline, and git state.

Files:

- `project-side-panel.tsx`
- `project-wiki-panel.tsx`
- `project-files-panel.tsx`
- `project-git-panel.tsx`
- `project-code-viewer.tsx`

### Wiki Tab

The Wiki tab models a source-backed project knowledge base.

It shows:

- source count,
- page count,
- citation coverage,
- review queue,
- review gate toggle,
- layers,
- operations,
- wiki pages,
- index/log/special files,
- health checks.

Modeled layers:

- Raw sources: immutable source of truth.
- Wiki: LLM-maintained markdown.
- Schema: project conventions and review rules, represented by `AGENTS.md`.

Modeled operations:

- Ingest
- Query
- Lint
- File answer

Current limits:

- Review gate toggle is local UI state.
- Operation buttons do not call native services yet.
- Data is generated by `getProjectDetail`.

### Files Tab

The Files tab models the agent-visible document library.

It shows:

- inbox count,
- review count,
- storage used,
- file search,
- filters by raw/wiki/schema/log/asset,
- file rows with sensitivity, status, visibility, type,
- selected file details,
- citation and linked page counts,
- LLM visibility toggle,
- Link/Open/Ingest actions.

Important state:

- Visibility changes are local component state layered over `file.llmVisible`.
- Sensitive/blocked files are visible in the UI but blocked from ingest by the
  button disabled state.

Current limits:

- Add source, Link, Open, and Ingest are not connected to native file services.
- Search and filtering are in-memory over generated project detail data.

### Context Tab

The Context tab shows:

- project resources,
- resource type and updated date,
- lead reviewer/collaborator card.

Current limits:

- Resource list is generated sample state.
- Collaborator list only includes the project owner.

### Timeline Tab

The Timeline tab shows project milestones:

- done,
- current,
- queued.

State is generated by `makeTimeline(project)`.

### Git Tab

The Git tab models a branch handoff and commit workflow.

It shows:

- current branch,
- base branch,
- ahead/behind counts,
- changed files,
- total additions and deletions,
- selected diff in CodeMirror,
- editable commit message,
- generate-message button,
- Amend and Commit buttons.

`ProjectCodeViewer` is read-only and lazy-loads CodeMirror language extensions
based on file extension.

Current limits:

- Git data is generated sample state.
- Stage all, Amend, and Commit do not call git.
- Generate commit message is deterministic local string generation, not AI.

## Feature: Settings

Settings provides a desktop-only JSON editor for Claude-compatible runtime
settings.

Files:

- `apps/shell/src/pages/settings-page.tsx`
- `apps/shell/src/lib/runtime-settings.ts`
- `apps/shell/src/electrobun/runtime-settings.ts`
- `apps/shell/src/electrobun/settings-types.ts`

Settings sources:

| Source ID         | Label          | Scope               | Editable |
| ----------------- | -------------- | ------------------- | -------- |
| `userSettings`    | User override  | Runtime user        | yes      |
| `projectSettings` | Project shared | Workspace           | yes      |
| `localSettings`   | Project local  | Gitignored override | yes      |
| `policySettings`  | Managed policy | Read-only           | no       |

Path resolution:

- Workspace root defaults to `process.cwd()/../..`.
- Workspace root override: `FPTCLAW_SETTINGS_WORKSPACE_ROOT`.
- User settings root defaults to `~/.claude`.
- User settings root override: `CLAUDE_CONFIG_DIR`.
- User settings filename switches to `cowork_settings.json` when
  `CLAUDE_CODE_USE_COWORK_PLUGINS` is truthy.
- Managed policy path depends on platform and enterprise environment variables.

Editor capabilities:

- CodeMirror JSON editor.
- JSON object validation.
- source picker,
- reload,
- schema insertion,
- save,
- dirty-state guard when switching sources,
- `Ctrl+S`/`Cmd+S` save handling,
- read-only mode for policy settings,
- toast feedback.

Save behavior:

- Content is parsed and normalized with two-space JSON formatting.
- Local settings save ensures `.claude/settings.local.json` is present in root
  `.gitignore`.
- Invalid JSON or non-object JSON is rejected.

Current limits:

- Settings are available only in desktop mode.
- The schema URL is currently Claude Code settings:
  `https://json.schemastore.org/claude-code-settings.json`.

## Native RPC Contract

Renderer code calls `getShellRPC()` from `apps/shell/src/lib/shell-rpc.ts`.
This returns `null` outside Electrobun. Native-capable feature modules expose
`canUseNative*` helpers so UI can fail gracefully in web mode.

Requests from renderer to native:

| Request                           | Purpose                                                  |
| --------------------------------- | -------------------------------------------------------- |
| `selectProjectFolder`             | Open native directory picker or return test folder path. |
| `startProjectRuntimeTurn`         | Start a runtime CLI turn.                                |
| `cancelProjectRuntimeTurn`        | Kill/cancel a runtime session.                           |
| `respondProjectRuntimePermission` | Answer runtime tool permission request.                  |
| `getProjectRuntimeStatus`         | Check runtime package availability and version.          |
| `startProjectTerminal`            | Spawn a native shell process for a project.              |
| `writeProjectTerminalInput`       | Write stdin to a terminal session.                       |
| `stopProjectTerminal`             | Stop one terminal session.                               |
| `loadProjectBrowserProfiles`      | Read project-local browser profile registry.             |
| `createProjectBrowserProfile`     | Create profile metadata and storage directory.           |
| `verifyProjectBrowserProfile`     | Verify profile filesystem state and health.              |
| `warmProjectBrowserProfile`       | Write warmup metadata and mark profile ready.            |
| `launchProjectBrowserProfile`     | Check browser provider launch prerequisites.             |
| `startProjectBrowserHarnessTask`  | Run Hermes browser harness validation.                   |
| `cancelProjectBrowserHarnessTask` | Cancel harness task and stop browser processes.          |
| `loadRuntimeSettings`             | Load runtime settings source content.                    |
| `saveRuntimeSettings`             | Save validated runtime settings source content.          |

Messages from native to renderer:

| Message                      | Payload                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `projectRuntimeEvent`        | Runtime session, assistant, reasoning, tool, permission, system, and result events.  |
| `projectTerminalEvent`       | Terminal state/data/exit events.                                                     |
| `projectBrowserHarnessEvent` | Harness session, plan, worker, process-title, report, validation, and result events. |

## Native Boot and Window Behavior

`apps/shell/src/electrobun/main.ts` creates the main `BrowserWindow`:

- title: `FPTClaw`
- URL: `views://shell/index.html`
- frame: primary display work area, with fallback `1440x960`
- minimum valid work area: `800x600`
- `exitOnLastWindowClosed: true`

The app fits the window to the primary display work area:

- immediately after show,
- on webview `dom-ready`,
- after 50 ms,
- after 250 ms.

This keeps the app maximized without covering the Windows taskbar.

## Persistence and Filesystem State

| State                       | Location                                                                |
| --------------------------- | ----------------------------------------------------------------------- |
| Custom projects             | Renderer localStorage key `fptclaw.custom-projects.v1`                  |
| Browser profile registry    | `<project>/.fptclaw/browser-profiles/profiles.json`                     |
| Browser profile metadata    | `<project>/.fptclaw/browser-profiles/<provider>/<slug-id>/profile.json` |
| Browser warmup metadata     | `<profile>/warmup.json`                                                 |
| Runtime bridge trace        | `apps/shell/logs/runtime-bridge.log` or `FPTCLAW_RUNTIME_TRACE_FILE`    |
| User runtime settings       | `CLAUDE_CONFIG_DIR` or `~/.claude`                                      |
| Project runtime settings    | `<workspace>/.claude/settings.json`                                     |
| Local runtime settings      | `<workspace>/.claude/settings.local.json`                               |
| Desktop test project folder | `FPTCLAW_TEST_PROJECT_FOLDER_PATH` or temp default                      |

## Testing and Verification

Primary verification command for shell app behavior:

```sh
bun run --cwd apps/shell cy:run:desktop
```

This command:

1. Creates temporary project, Claude config, and settings workspace folders.
2. Stops stale Windows desktop dev processes under `apps/shell/build/dev-win-x64`.
3. Starts `desktop:dev` with desktop test environment variables.
4. Waits for `GET /health` on the desktop test server.
5. Verifies the Electrobun window fits the primary display work area.
6. Runs Cypress specs from `apps/shell/cypress/desktop/**/*.cy.ts`.
7. Calls `/quit` and kills remaining desktop process tree if needed.

Desktop test environment variables:

| Variable                           | Purpose                                           |
| ---------------------------------- | ------------------------------------------------- |
| `FPTCLAW_DESKTOP_TEST_PORT`        | Port for desktop test server.                     |
| `FPTCLAW_TEST_PROJECT_FOLDER_PATH` | Folder returned by native folder picker in tests. |
| `CLAUDE_CONFIG_DIR`                | Isolated Claude config root for settings tests.   |
| `FPTCLAW_SETTINGS_WORKSPACE_ROOT`  | Isolated workspace root for settings tests.       |

Supplemental renderer-only command:

```sh
bun run --cwd apps/shell cy:run
```

Use web-mode Cypress only for narrow DOM/layout checks. It must not replace
desktop-mode verification for folder selection, filesystem access, clipboard,
dialogs, terminal/process behavior, runtime settings, Electrobun RPC, or browser
harness behavior.

Other useful checks:

```sh
bun run --cwd apps/shell check-types
bun run --cwd apps/shell lint
bun run --cwd apps/shell build
```

## UX and Accessibility Notes

Current strengths:

- Keyboard-openable project rows.
- Screen-reader labels on icon-only buttons.
- `aria-live` chat log and terminal transcript mirror.
- Native select controls for compact filters.
- Responsive side panel: fixed panel on wide screens, sheet on smaller screens.
- Route-level lazy loading with human-readable loading fallbacks.
- Empty states for projects, chat, files, and browser profiles.
- Error/status messages for settings, runtime, browser profile operations, and
  terminal bridge failures.
- Manual virtualization prevents the 1000-row project list from over-rendering.

Watch points for future UI work:

- Some dashboard and side-panel surfaces are still sample data, so user wording
  should avoid implying real backend state until those actions are wired.
- Browser Profiles has strong inspection UI but lacks edit forms for identity
  fields.
- Git tab reads like a real commit workflow but does not execute git yet.
- Settings uses Claude-compatible source naming; if the product is fully
  OpenCode-branded later, labels and schema should be revisited.
- Agent chat attachment paths come from the browser File API and may not be
  usable by native runtime unless backed by desktop file handles or explicit
  path selection in a future implementation.

## How to Extend

### Add a new page

1. Create the page under `apps/shell/src/pages`.
2. Add a lazy import in `App.tsx`.
3. Add route detection and header title logic.
4. Add sidebar navigation in `AppSidebar` if it is a primary route.
5. Add desktop-mode tests if the page calls native APIs.

### Add a project workspace tab

1. Extend `ProjectWorkspaceTab` in `project-detail-page.tsx`.
2. Add a `TabsTrigger` and `TabsContent`.
3. Lazy-load the panel if it is large or native-heavy.
4. Decide whether the right side panel should close when the tab opens.
5. Add data-testid hooks for desktop specs.

### Add a side panel tab

1. Extend `ProjectSidePanelTab`.
2. Add an item to `PROJECT_SIDE_PANEL_FEATURES`.
3. Add a preview branch in `getProjectSidePanelFeaturePreview`.
4. Add `TabsContent` in `ProjectSidePanel`.
5. Use generated detail data first only if the feature is presentational.
6. Add native RPC only when real filesystem/process behavior is required.

### Add a native RPC request

1. Add params/result types under `apps/shell/src/electrobun/*-types.ts`.
2. Add the request to `ShellRPCSchema` in `electrobun/rpc.ts`.
3. Add a renderer wrapper under `apps/shell/src/lib`.
4. Implement the native handler in `electrobun/main.ts` or a focused bridge
   module.
5. Make web mode fail gracefully.
6. Add desktop Cypress coverage for the real native path.

### Add an event stream

1. Add the event union type.
2. Add the message name to `ShellRPCSchema`.
3. Add `addMessageListener` and `removeMessageListener` overloads in
   `shell-rpc.ts`.
4. Emit from the native bridge through `shellRPC.send.<messageName>`.
5. Subscribe in renderer with cleanup on unmount.
6. Include IDs and timestamps so UI can upsert and deduplicate safely.

## Known Non-Production Areas

The following areas are implemented as UI or local scaffolding but are not yet
full production features:

- Dashboard KPI data.
- Dashboard chart/table backend data.
- AppSidebar document/help/search/user actions.
- Project persistence beyond localStorage.
- Project delete/rename/archive.
- Wiki operations.
- File ingest/link/open/add-source.
- Context collaborators beyond owner.
- Timeline backend.
- Git staging/amend/commit.
- Browser profile editing.
- Full Camoufox launch/attach workflow.
- Browser harness page automation beyond process/profile validation.
- Runtime attachment path fidelity from browser File API.

Keep these distinctions visible when adding docs, tests, or user-facing copy.
