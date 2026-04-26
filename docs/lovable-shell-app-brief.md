# Lovable Brief: FPTClaw Shell App

Use this file as the compact product brief for Lovable. The detailed source of
truth is [Shell App Product and Architecture](./shell-app.md). This brief
describes the app in product, UX, and component terms so Lovable can understand
what to build or redesign without confusing desktop-native behavior with
ordinary web behavior.

## Product Identity

The app is **FPTClaw Agent Shell**, a desktop-style workspace for managing local
projects and running an AI coding/research agent inside each project. It should
feel like a serious operator console: dense, fast, calm, and built for repeated
daily work.

The app combines:

- project/workspace management,
- AI agent chat,
- project context and knowledge panels,
- native terminal panes,
- browser profile management,
- browser harness validation,
- runtime settings editing,
- dashboard-style operational visibility.

The primary target user is a technical operator or developer who works across
multiple local project folders and needs one place to chat with the agent,
inspect project state, run terminals, manage browser profiles, and edit runtime
configuration.

## Platform Assumption

The real app is an Electrobun desktop app with a React renderer. Lovable should
treat native/OS behaviors as product requirements, even if a web prototype must
mock them.

Desktop-native behaviors include:

- folder picker,
- filesystem paths,
- terminal process spawning,
- runtime CLI spawning,
- browser process launch checks,
- browser profile storage,
- settings file reads/writes,
- desktop test server behavior.

In a Lovable/web prototype, these native actions can be represented with mocked
states, realistic progress messages, disabled web-mode warnings, or local demo
data. Do not remove them from the product model just because they are not normal
browser features.

## Information Architecture

Top-level routes:

- `/projects`: default landing screen and main workspace list.
- `/projects/:id`: project detail workspace.
- `/dashboard`: operational overview.
- `/settings`: runtime settings editor.

Global layout:

- Left app sidebar for Dashboard, Projects, document shortcuts, Settings, help,
  search, and user menu.
- Top site header with sidebar trigger, current route title, and contextual
  project actions.
- Project detail pages hide the main sidebar by default to maximize workspace
  space.

Project detail layout:

- Main center workspace with tabs:
  - FPTClaw Agent
  - Terminal
  - Browser Profiles
- Right inspector panel with tabs:
  - Wiki
  - Files
  - Context
  - Timeline
  - Git
- On wide screens, the inspector is a fixed right panel.
- On smaller screens, the inspector becomes a right-side sheet.
- When closed on wide screens, a thin rail remains with icons and preview
  popovers.

## Core User Workflows

### 1. Open or Create a Project

The user starts on Projects. They search/filter/sort existing workspaces or
create a new project by selecting a local folder. A project has a name,
description, owner, folder path, status, priority, progress, document count,
task count, and updated date.

Important UX behavior:

- Project list must scale to many rows.
- Search and filters should be obvious and always near the list.
- Empty state should guide users to adjust filters or create a project.
- Rows should be keyboard-openable.
- Creating a project should infer a name from the folder path if the user leaves
  name blank.

### 2. Work With the Agent

The FPTClaw Agent tab is the primary workspace. It has:

- collapsible task/project header,
- chat log,
- streaming assistant messages,
- tool/status/checkpoint messages,
- permission request messages,
- markdown/code rendering,
- file attachment chips,
- bottom composer.

Composer features:

- multiline prompt,
- Enter to send, Shift+Enter for newline,
- Stop button while running,
- Plan/Act toggle,
- visible model label,
- file attachment button,
- drag-and-drop attachments,
- `@` context insertion,
- slash-command insertion.

Slash commands include the ported vibe-cokit workflows:

- `/vk:ask`
- `/vk:plan`
- `/vk:code`
- `/vk:fix`
- `/vk:fix:ui`
- `/vk:review:codebase`
- `/vk:scout`

Also include Cline-style commands such as `/newtask`, `/deep-planning`,
`/smol`, `/newrule`, and `/reportbug`.

Permission requests must look important and actionable. Each request should
offer Allow once and Deny. The user should see whether the response is pending,
accepted, failed, or canceled.

### 3. Run Project Terminals

The Terminal tab is a native terminal workspace for the selected project folder.

Expected UX:

- Open one terminal automatically when the tab is first used.
- Support split terminal panes.
- Show active pane, shell name, PID, status, and close button.
- Keep at least one terminal open.
- Provide command input for each pane.
- Support fullscreen terminal mode with an obvious exit control.
- In web/mock mode, show an unavailable state that explains native terminal
  access requires desktop mode.

### 4. Manage Browser Profiles

The Browser Profiles tab manages project-local browser identity lanes.

Main concepts:

- Providers: Camoufox and Chrome CDP.
- Profiles: project-local browser storage records.
- Identity lane: proxy, locale, timezone, OS fingerprint.
- Harness attach: headed/headless, Playwright/CDP, endpoint, persistent
  context.
- Health score: indicates whether storage, metadata, warmup, and identity are
  ready.

Expected UX:

- Provider cards at top.
- Profile list with search, provider filter, and status filter.
- Selected profile detail panel.
- Operations: Create profile, Verify setup, Prepare storage, Check launch.
- Registry/storage status summary.
- Clear distinction between ready, running, warming, and needs setup.

In Lovable/web mode, these operations can update mock status and show realistic
operation messages. Preserve the product vocabulary.

### 5. Inspect Project Knowledge

The right side panel is an inspector, not the main work area.

Wiki tab:

- project wiki summary,
- citation coverage,
- review gate toggle,
- layers: Raw sources, Wiki, Schema,
- operations: Ingest, Query, Lint, File answer,
- wiki pages,
- index/log/special files,
- health checks.

Files tab:

- project file library,
- search and kind filters,
- raw/wiki/schema/log/asset categories,
- sensitive and blocked file indicators,
- LLM visibility toggle,
- selected file detail,
- citations, linked pages, size, updated date,
- Link/Open/Ingest actions.

Context tab:

- resources,
- collaborators,
- owner/lead reviewer.

Timeline tab:

- done/current/queued milestones.

Git tab:

- branch state,
- ahead/behind counts,
- changed files,
- additions/deletions,
- selected diff viewer,
- commit message editor,
- generated commit message action,
- Amend and Commit actions.

For now, many inspector actions are UI scaffolding. Lovable should preserve the
distinction between real connected actions and presentational actions.

### 6. Edit Runtime Settings

Settings is a JSON editor for runtime configuration sources.

Sources:

- User override
- Project shared
- Project local
- Managed policy

Expected UX:

- Source list on the left.
- JSON editor on the right.
- File path, read/write status, validity, save state, last updated time.
- Reload, Schema, and Save actions.
- Invalid JSON warning.
- Dirty-change guard when switching sources.
- Read-only policy source.

In a web prototype, file paths and save actions can be mocked, but the interface
should still feel like a precise configuration editor.

## Visual Design Direction

The app should feel like a polished desktop productivity tool, not a marketing
landing page.

Use:

- quiet neutral surfaces,
- compact spacing,
- strong information hierarchy,
- readable tables/lists,
- restrained badges,
- practical icons,
- predictable tabs and panels,
- clear active/selected states,
- stable fixed-height toolbars,
- responsive layouts that preserve task flow.

Avoid:

- oversized hero sections,
- decorative gradients as the main design language,
- vague marketing copy,
- floating card-heavy landing-page composition,
- hiding important operational state behind decorative UI.

Most surfaces should be dense but not cramped. The user should be able to scan
status, take action, and return to work quickly.

## Component Blueprint

Primary components:

- `AppShell`: global sidebar, header, route content.
- `AppSidebar`: product identity, navigation, document shortcuts, user menu.
- `ProjectsPage`: project filters, virtualized list, create-project dialog.
- `ProjectDetailPage`: workspace tabs and side-panel orchestration.
- `ProjectChatShell`: task header, message log, composer, runtime/harness
  state.
- `ProjectChatComposer`: prompt input, slash menu, context menu, attachments,
  mode toggle.
- `ProjectChatMessage`: role/kind/status-based message cards.
- `ProjectTerminalPanel`: split terminal panes and fullscreen mode.
- `ProjectBrowserProfilesPanel`: provider cards, profile list, profile detail,
  operations.
- `ProjectSidePanel`: right inspector with tabs and responsive sheet mode.
- `ProjectWikiPanel`: wiki summary, layers, operations, pages, health.
- `ProjectFilesPanel`: file library and selected file detail.
- `ProjectGitPanel`: branch summary, changes list, diff viewer, commit editor.
- `SettingsPage`: settings source picker and JSON editor.
- `DashboardPage`: KPI cards, chart, interactive table.

Shared UI primitives should be normal application controls: buttons, icon
buttons, badges, tabs, dialogs, sheets, popovers, inputs, textareas, switches,
native selects, progress bars, tables, drawers, tooltips, and cards for
individual items.

## Data Model Summary

Project:

- id
- name
- description
- owner
- folderPath
- status: Discovery, Active, Review, Paused
- priority: Low, Medium, High
- progress
- documents
- tasks
- updatedAt

Project detail:

- project
- activeTask
- branch
- contextUsed/contextLimit
- environment
- model
- mode: Plan or Act
- messages
- resources
- wiki
- files
- timeline
- git
- browser

Chat message:

- id
- role: user, assistant, system
- kind: text, reasoning, tool, checkpoint, question
- title
- body
- time
- status
- files
- actions
- runtime metadata
- browser harness metadata

Browser profile:

- id
- name
- providerId: camoufox or chrome-cdp
- status: ready, warming, running, needs-setup
- profilePath
- proxyLane
- locale
- timezone
- os
- headless mode
- persistentContext
- harnessMode
- endpoint
- lastUsed
- health
- cookieJar
- targetDomains
- tags
- notes

Runtime settings source:

- id
- label
- scope
- path
- editable
- exists
- schemaUrl

## Real vs Mock Status

Real or desktop-native in the current app:

- route shell,
- project localStorage creation,
- native folder picker in desktop mode,
- runtime CLI bridge,
- runtime permission flow,
- terminal child process bridge,
- browser profile registry files,
- browser profile create/verify/warm/launch-check,
- browser harness process-title validation,
- runtime settings file load/save,
- desktop Cypress test harness.

Generated or currently presentational:

- dashboard KPIs, chart data, and table data,
- sample project list,
- most project detail side-panel data,
- wiki operations,
- file ingest/link/open/add-source,
- git stage/amend/commit actions,
- collaborator/resource backend,
- browser profile field editing,
- arbitrary browser page automation after harness launch.

Lovable should not imply presentational actions are fully connected unless the
implementation explicitly wires them.

## Suggested Lovable Prompt

Build a desktop-style React application called FPTClaw Agent Shell. It is an
operator console for local AI-assisted projects. The default page is Projects,
where users search, filter, sort, and create workspaces from local folders. A
project opens into a detail workspace with tabs for FPTClaw Agent, Terminal, and
Browser Profiles. The Agent tab contains a streaming chat UI with a collapsible
task header, markdown/code messages, tool/checkpoint states, permission request
cards, file attachments, slash commands, context mentions, and Plan/Act mode.
The Terminal tab is a split-pane native terminal surface. The Browser Profiles
tab manages Camoufox and Chrome CDP profile lanes with provider cards, filters,
profile detail, health, identity lane, storage path, and verify/warm/launch
actions. A responsive right inspector panel contains Wiki, Files, Context,
Timeline, and Git tabs. Settings is a JSON editor for runtime settings sources.
The design should be compact, operational, accessible, and desktop-productivity
oriented. Mock native filesystem/process behaviors in web mode, but preserve
their product meaning and state transitions.
